import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import {
	type MutationCtx,
	mutation,
	type QueryCtx,
	query,
} from "./_generated/server";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve the authenticated tenant id, or throw. */
async function requireOwnerId(ctx: QueryCtx | MutationCtx): Promise<string> {
	const identity = await ctx.auth.getUserIdentity();
	if (identity === null) {
		throw new Error("Not authenticated");
	}
	return identity.tokenIdentifier;
}

/** Load a Plant and assert it belongs to the given tenant. */
async function getOwnedPlant(
	ctx: QueryCtx | MutationCtx,
	plantId: Id<"plants">,
	ownerId: string,
): Promise<Doc<"plants">> {
	const plant = await ctx.db.get(plantId);
	if (plant === null || plant.ownerId !== ownerId) {
		throw new Error("Plant not found");
	}
	return plant;
}

/** A Plant's direct parent edges (at most two). */
async function parentEdgesOf(
	ctx: QueryCtx | MutationCtx,
	childId: Id<"plants">,
) {
	return ctx.db
		.query("parentEdges")
		.withIndex("by_child", (q) => q.eq("childId", childId))
		.take(2);
}

/**
 * Whether `ancestorId` is an ancestor of `descendantId` by walking up the
 * pedigree. Used to reject edges that would introduce a cycle (a Plant cannot
 * be its own ancestor).
 */
async function isAncestorOf(
	ctx: MutationCtx,
	ancestorId: Id<"plants">,
	descendantId: Id<"plants">,
): Promise<boolean> {
	const stack: Id<"plants">[] = [descendantId];
	const seen = new Set<string>();
	while (stack.length > 0) {
		const current = stack.pop();
		if (current === undefined || seen.has(current)) {
			continue;
		}
		seen.add(current);
		for (const edge of await parentEdgesOf(ctx, current)) {
			if (edge.parentId === ancestorId) {
				return true;
			}
			stack.push(edge.parentId);
		}
	}
	return false;
}

/**
 * Attach `parentId` as a parent of `childId`. Enforces ownership, the no-cycle
 * invariant, and rejects self-parenting. Used by every edge-creating mutation.
 */
async function linkParent(
	ctx: MutationCtx,
	ownerId: string,
	childId: Id<"plants">,
	parentId: Id<"plants">,
	role: "seed" | "pollen" | undefined,
): Promise<void> {
	if (childId === parentId) {
		throw new Error("A Plant cannot be its own parent");
	}
	await getOwnedPlant(ctx, parentId, ownerId);
	if (await isAncestorOf(ctx, childId, parentId)) {
		throw new Error(
			"That parent is already a descendant — it would form a cycle",
		);
	}
	await ctx.db.insert("parentEdges", { ownerId, childId, parentId, role });
}

/** Reject attaching an Origin to a Plant that already has one. */
async function assertNoOrigin(ctx: MutationCtx, childId: Id<"plants">) {
	const existing = await parentEdgesOf(ctx, childId);
	if (existing.length > 0) {
		throw new Error("This Plant already has an origin");
	}
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** One Origin edge of the Breeding graph: parent → child, seed/pollen for a Cross. */
export type BreedingGraphEdge = {
	childId: Id<"plants">;
	parentId: Id<"plants">;
	role?: "seed" | "pollen";
};

/** The whole account's Breeding graph: every Plant and every Origin edge. */
export type BreedingGraph = {
	plants: Doc<"plants">[];
	edges: BreedingGraphEdge[];
};

/** All of the signed-in account's Plants, newest first. */
export const listPlants = query({
	args: {},
	handler: async (ctx) => {
		const ownerId = await requireOwnerId(ctx);
		return ctx.db
			.query("plants")
			.withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
			.order("desc")
			.take(500);
	},
});

/**
 * The whole Breeding graph for the signed-in account: all Plants and all Origin
 * edges. Unrooted — the client lays this out as a DAG canvas. Both collections
 * load with a single indexed read each to avoid per-node read amplification.
 */
export const getBreedingGraph = query({
	args: {},
	handler: async (ctx): Promise<BreedingGraph> => {
		const ownerId = await requireOwnerId(ctx);
		const plants = await ctx.db
			.query("plants")
			.withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
			.order("desc")
			.take(500);
		const edgeRows = await ctx.db
			.query("parentEdges")
			.withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
			.take(2000);
		const edges: BreedingGraphEdge[] = edgeRows.map((edge) => ({
			childId: edge.childId,
			parentId: edge.parentId,
			role: edge.role,
		}));
		return { plants, edges };
	},
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

const newPlantFields = {
	name: v.string(),
	cultivar: v.optional(v.string()),
	inCollection: v.boolean(),
};

/** Create a bare Plant with no Origin yet. */
export const createPlant = mutation({
	args: newPlantFields,
	handler: async (ctx, args) => {
		const ownerId = await requireOwnerId(ctx);
		return ctx.db.insert("plants", {
			ownerId,
			name: args.name,
			cultivar: args.cultivar,
			inCollection: args.inCollection,
		});
	},
});

/** Child-first: record that an existing Plant is a Division of an existing parent. */
export const recordDivision = mutation({
	args: { childId: v.id("plants"), parentId: v.id("plants") },
	handler: async (ctx, args) => {
		const ownerId = await requireOwnerId(ctx);
		await getOwnedPlant(ctx, args.childId, ownerId);
		await assertNoOrigin(ctx, args.childId);
		await linkParent(ctx, ownerId, args.childId, args.parentId, undefined);
		await ctx.db.patch(args.childId, { originKind: "division" });
	},
});

/** Child-first: record that an existing Plant is a Cross of two existing parents. */
export const recordCross = mutation({
	args: {
		childId: v.id("plants"),
		seedParentId: v.id("plants"),
		pollenParentId: v.id("plants"),
	},
	handler: async (ctx, args) => {
		const ownerId = await requireOwnerId(ctx);
		if (args.seedParentId === args.pollenParentId) {
			throw new Error("A Cross needs two different parents");
		}
		await getOwnedPlant(ctx, args.childId, ownerId);
		await assertNoOrigin(ctx, args.childId);
		await linkParent(ctx, ownerId, args.childId, args.seedParentId, "seed");
		await linkParent(ctx, ownerId, args.childId, args.pollenParentId, "pollen");
		await ctx.db.patch(args.childId, { originKind: "cross" });
	},
});
