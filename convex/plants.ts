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

/** All of a Plant's photos. */
async function photosOf(ctx: QueryCtx | MutationCtx, plantId: Id<"plants">) {
	return ctx.db
		.query("plantPhotos")
		.withIndex("by_plant", (q) => q.eq("plantId", plantId))
		.take(200);
}

/**
 * The storage blob that is a Plant's cover: the owner's pin if set, otherwise
 * the latest Photo by `takenAt`. `null` when the Plant has no photos and no pin.
 * See docs/adr/0006-photos-are-a-dated-timeline.md.
 */
function resolveCoverStorageId(
	plant: Doc<"plants">,
	photos: Doc<"plantPhotos">[],
): Id<"_storage"> | null {
	if (plant.coverPhotoId !== undefined) {
		return plant.coverPhotoId;
	}
	let latest: Doc<"plantPhotos"> | null = null;
	for (const photo of photos) {
		if (latest === null || photo.takenAt > latest.takenAt) {
			latest = photo;
		}
	}
	return latest ? latest.storageId : null;
}

/**
 * Whether `ancestorId` is an ancestor of `descendantId` by walking up the
 * Pedigree. Used to reject edges that would introduce a cycle (a Plant cannot
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

/** Remove every parent edge of `childId` and clear its `originKind`. */
async function clearOrigin(ctx: MutationCtx, childId: Id<"plants">) {
	const edges = await ctx.db
		.query("parentEdges")
		.withIndex("by_child", (q) => q.eq("childId", childId))
		.collect();
	for (const edge of edges) {
		await ctx.db.delete(edge._id);
	}
	await ctx.db.patch(childId, { originKind: undefined });
}

/** Display label for a Plant. */
function labelOf(plant: Doc<"plants">): string {
	return plant.name;
}

// ---------------------------------------------------------------------------
// Query result types
// ---------------------------------------------------------------------------

/** One Plant in the Inventory grid: the row plus its resolved cover. */
export type InventoryItem = {
	plant: Doc<"plants">;
	coverUrl: string | null;
	photoCount: number;
};

/** A Plant photo with a signed URL and its Timeline metadata. */
export type PlantPhoto = {
	_id: Id<"plantPhotos">;
	storageId: Id<"_storage">;
	url: string | null;
	takenAt: number;
	caption?: string;
	isCover: boolean;
};

/** A parent in a Plant's Origin, with a display label and (for a Cross) role. */
export type PlantParent = {
	id: Id<"plants">;
	label: string;
	role?: "seed" | "pollen";
};

/** A Plant plus its Timeline photos and Origin parents, for the detail page. */
export type PlantDetail = {
	plant: Doc<"plants">;
	photos: PlantPhoto[];
	parents: PlantParent[];
};

/** One node of a rooted Pedigree. */
export type PedigreeNode = {
	id: Id<"plants">;
	name: string;
	originKind?: "cross" | "division";
	coverUrl: string | null;
};

/** One ancestry edge of a rooted Pedigree: parent → child. */
export type PedigreeEdge = {
	childId: Id<"plants">;
	parentId: Id<"plants">;
	role?: "seed" | "pollen";
};

/** A Plant's rooted Pedigree: the subject plus every ancestor and the edges. */
export type Pedigree = {
	subjectId: Id<"plants">;
	nodes: PedigreeNode[];
	edges: PedigreeEdge[];
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** All of the signed-in account's Plants, newest first. Powers the origin picker. */
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
 * The Inventory: every Plant in the account, newest first, each with its
 * resolved cover URL (owner pin, else latest Photo) and photo count. All photos
 * load in a single indexed read and are grouped in memory to avoid per-plant
 * read amplification.
 */
export const listInventory = query({
	args: {},
	handler: async (ctx): Promise<InventoryItem[]> => {
		const ownerId = await requireOwnerId(ctx);
		const plants = await ctx.db
			.query("plants")
			.withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
			.order("desc")
			.take(500);
		const photoRows = await ctx.db
			.query("plantPhotos")
			.withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
			.take(5000);
		const byPlant = new Map<string, Doc<"plantPhotos">[]>();
		for (const photo of photoRows) {
			const arr = byPlant.get(photo.plantId) ?? [];
			arr.push(photo);
			byPlant.set(photo.plantId, arr);
		}
		return Promise.all(
			plants.map(async (plant) => {
				const photos = byPlant.get(plant._id) ?? [];
				const storageId = resolveCoverStorageId(plant, photos);
				const coverUrl = storageId ? await ctx.storage.getUrl(storageId) : null;
				return { plant, coverUrl, photoCount: photos.length };
			}),
		);
	},
});

/**
 * One Plant with its Timeline photos (newest first) and Origin parents. Returns
 * `null` when the Plant is missing (e.g. it was just deleted) so the client can
 * redirect rather than throw — see the detail page's delete flow.
 */
export const getPlantDetail = query({
	args: { plantId: v.id("plants") },
	handler: async (ctx, args): Promise<PlantDetail | null> => {
		const ownerId = await requireOwnerId(ctx);
		const plant = await ctx.db.get(args.plantId);
		if (plant === null || plant.ownerId !== ownerId) {
			return null;
		}
		const photoRows = await photosOf(ctx, args.plantId);
		const coverStorageId = resolveCoverStorageId(plant, photoRows);
		const photos: PlantPhoto[] = await Promise.all(
			photoRows.map(async (row) => ({
				_id: row._id,
				storageId: row.storageId,
				url: await ctx.storage.getUrl(row.storageId),
				takenAt: row.takenAt,
				caption: row.caption,
				isCover: row.storageId === coverStorageId,
			})),
		);
		// Newest first — the Timeline reads most-recent-at-top.
		photos.sort((a, b) => b.takenAt - a.takenAt);

		const edges = await parentEdgesOf(ctx, args.plantId);
		const parents: PlantParent[] = [];
		for (const edge of edges) {
			const parent = await ctx.db.get(edge.parentId);
			if (parent !== null) {
				parents.push({
					id: parent._id,
					label: labelOf(parent),
					role: edge.role,
				});
			}
		}
		// Seed before pollen, so a Cross reads in the conventional order.
		parents.sort((a, b) =>
			a.role === "seed" ? -1 : b.role === "seed" ? 1 : 0,
		);
		return { plant, photos, parents };
	},
});

/**
 * The rooted Pedigree of `plantId`: the subject Plant and every ancestor,
 * walking parent edges upward, plus the edges among them. The client draws it
 * as a nested layout. See docs/adr/0004-inventory-first-information-architecture.md.
 */
export const getPedigree = query({
	args: { plantId: v.id("plants") },
	handler: async (ctx, args): Promise<Pedigree | null> => {
		const ownerId = await requireOwnerId(ctx);
		const subject = await ctx.db.get(args.plantId);
		if (subject === null || subject.ownerId !== ownerId) {
			return null;
		}

		const nodesById = new Map<Id<"plants">, Doc<"plants">>();
		const edges: PedigreeEdge[] = [];
		const stack: Id<"plants">[] = [subject._id];
		nodesById.set(subject._id, subject);
		const walked = new Set<string>();
		while (stack.length > 0) {
			const current = stack.pop();
			if (current === undefined || walked.has(current)) {
				continue;
			}
			walked.add(current);
			for (const edge of await parentEdgesOf(ctx, current)) {
				edges.push({
					childId: edge.childId,
					parentId: edge.parentId,
					role: edge.role,
				});
				if (!nodesById.has(edge.parentId)) {
					const parent = await ctx.db.get(edge.parentId);
					if (parent !== null) {
						nodesById.set(edge.parentId, parent);
					}
				}
				stack.push(edge.parentId);
			}
		}

		const nodes: PedigreeNode[] = await Promise.all(
			[...nodesById.values()].map(async (plant) => {
				const storageId = plant.coverPhotoId
					? plant.coverPhotoId
					: resolveCoverStorageId(plant, await photosOf(ctx, plant._id));
				return {
					id: plant._id,
					name: plant.name,
					originKind: plant.originKind,
					coverUrl: storageId ? await ctx.storage.getUrl(storageId) : null,
				};
			}),
		);
		return { subjectId: subject._id, nodes, edges };
	},
});

// ---------------------------------------------------------------------------
// Mutations — Plants
// ---------------------------------------------------------------------------

/** Create a bare Plant with no Origin yet. Returns its id. */
export const createPlant = mutation({
	args: { name: v.string() },
	handler: async (ctx, args) => {
		const ownerId = await requireOwnerId(ctx);
		if (args.name.trim() === "") {
			throw new Error("A name is required");
		}
		return ctx.db.insert("plants", { ownerId, name: args.name.trim() });
	},
});

/** Edit a Plant's editable details. Origin is set separately. */
export const updatePlant = mutation({
	args: {
		plantId: v.id("plants"),
		name: v.string(),
		notes: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const ownerId = await requireOwnerId(ctx);
		await getOwnedPlant(ctx, args.plantId, ownerId);
		if (args.name.trim() === "") {
			throw new Error("A name is required");
		}
		await ctx.db.patch(args.plantId, {
			name: args.name.trim(),
			notes: args.notes?.trim() === "" ? undefined : args.notes?.trim(),
		});
	},
});

/** Delete a Plant, its photos (blobs included), and every edge referencing it. */
export const deletePlant = mutation({
	args: { plantId: v.id("plants") },
	handler: async (ctx, args) => {
		const ownerId = await requireOwnerId(ctx);
		await getOwnedPlant(ctx, args.plantId, ownerId);

		for (const photo of await photosOf(ctx, args.plantId)) {
			await ctx.storage.delete(photo.storageId);
			await ctx.db.delete(photo._id);
		}
		// Edges where this Plant is the child (its own Origin)…
		const asChild = await ctx.db
			.query("parentEdges")
			.withIndex("by_child", (q) => q.eq("childId", args.plantId))
			.collect();
		// …and edges where it is a parent of someone else.
		const asParent = await ctx.db
			.query("parentEdges")
			.withIndex("by_parent", (q) => q.eq("parentId", args.plantId))
			.collect();
		for (const edge of [...asChild, ...asParent]) {
			await ctx.db.delete(edge._id);
		}
		await ctx.db.delete(args.plantId);
	},
});

// ---------------------------------------------------------------------------
// Mutations — Origin
// ---------------------------------------------------------------------------

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

/** Remove a Plant's Origin so it can be set again. */
export const clearPlantOrigin = mutation({
	args: { plantId: v.id("plants") },
	handler: async (ctx, args) => {
		const ownerId = await requireOwnerId(ctx);
		await getOwnedPlant(ctx, args.plantId, ownerId);
		await clearOrigin(ctx, args.plantId);
	},
});

// ---------------------------------------------------------------------------
// Mutations — Photos & Timeline
// ---------------------------------------------------------------------------

/** A short-lived URL the client POSTs a photo file to before attaching it. */
export const generateUploadUrl = mutation({
	args: {},
	handler: async (ctx) => {
		await requireOwnerId(ctx);
		return ctx.storage.generateUploadUrl();
	},
});

/**
 * Attach an already-uploaded photo (by storage id) to a Plant's Timeline.
 * Does not touch the cover — the cover is resolved as the latest Photo unless
 * the owner has pinned one. See docs/adr/0006-photos-are-a-dated-timeline.md.
 */
export const addPhoto = mutation({
	args: {
		plantId: v.id("plants"),
		storageId: v.id("_storage"),
		takenAt: v.number(),
		caption: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const ownerId = await requireOwnerId(ctx);
		await getOwnedPlant(ctx, args.plantId, ownerId);
		const caption = args.caption?.trim();
		return ctx.db.insert("plantPhotos", {
			ownerId,
			plantId: args.plantId,
			storageId: args.storageId,
			takenAt: args.takenAt,
			caption: caption === "" ? undefined : caption,
		});
	},
});

/** Edit a Photo's Timeline date and/or caption. */
export const updatePhoto = mutation({
	args: {
		photoId: v.id("plantPhotos"),
		takenAt: v.optional(v.number()),
		caption: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const ownerId = await requireOwnerId(ctx);
		const photo = await ctx.db.get(args.photoId);
		if (photo === null || photo.ownerId !== ownerId) {
			throw new Error("Photo not found");
		}
		const patch: Partial<Doc<"plantPhotos">> = {};
		if (args.takenAt !== undefined) {
			patch.takenAt = args.takenAt;
		}
		if (args.caption !== undefined) {
			const caption = args.caption.trim();
			patch.caption = caption === "" ? undefined : caption;
		}
		await ctx.db.patch(args.photoId, patch);
	},
});

/** Pin a specific Photo as the Plant's cover. */
export const setCover = mutation({
	args: { photoId: v.id("plantPhotos") },
	handler: async (ctx, args) => {
		const ownerId = await requireOwnerId(ctx);
		const photo = await ctx.db.get(args.photoId);
		if (photo === null || photo.ownerId !== ownerId) {
			throw new Error("Photo not found");
		}
		await ctx.db.patch(photo.plantId, { coverPhotoId: photo.storageId });
	},
});

/** Unpin the Plant's cover, so it falls back to the latest Photo. */
export const clearCover = mutation({
	args: { plantId: v.id("plants") },
	handler: async (ctx, args) => {
		const ownerId = await requireOwnerId(ctx);
		await getOwnedPlant(ctx, args.plantId, ownerId);
		await ctx.db.patch(args.plantId, { coverPhotoId: undefined });
	},
});

/** Remove a Photo from a Plant and delete its underlying blob. */
export const removePhoto = mutation({
	args: { photoId: v.id("plantPhotos") },
	handler: async (ctx, args) => {
		const ownerId = await requireOwnerId(ctx);
		const photo = await ctx.db.get(args.photoId);
		if (photo === null || photo.ownerId !== ownerId) {
			throw new Error("Photo not found");
		}
		await ctx.storage.delete(photo.storageId);
		await ctx.db.delete(args.photoId);
		// If it was the pinned cover, unpin so the cover falls back to the latest.
		const plant = await ctx.db.get(photo.plantId);
		if (plant !== null && plant.coverPhotoId === photo.storageId) {
			await ctx.db.patch(photo.plantId, { coverPhotoId: undefined });
		}
	},
});
