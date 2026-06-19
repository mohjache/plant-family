import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	// A node in a pedigree. Usually a specimen the owner holds (`inCollection`),
	// but may also be a referenced ancestor (a species or wild-collected plant)
	// recorded but never possessed. `originKind` is unset until parents are
	// attached, so leaf ancestors have no origin.
	plants: defineTable({
		// Tenant: the WorkOS identity (tokenIdentifier) whose collection this
		// belongs to. Distinct from `inCollection`. See CONTEXT.md.
		ownerId: v.string(),
		name: v.string(),
		cultivar: v.optional(v.string()),
		inCollection: v.boolean(),
		originKind: v.optional(v.union(v.literal("cross"), v.literal("division"))),
		// Free-form notes the owner keeps on this Plant.
		notes: v.optional(v.string()),
		// Denormalized pointer to the photo shown as this Plant's thumbnail on the
		// canvas. Kept in sync by addPhoto/removePhoto so the Breeding graph query
		// doesn't have to read the photos table for every node.
		coverPhotoId: v.optional(v.id("_storage")),
	}).index("by_owner", ["ownerId"]),

	// Photos attached to a Plant. Kept in their own table (rather than an array
	// on the Plant) so adding a photo doesn't rewrite the Plant doc and the list
	// can grow without approaching the 1MB document limit. `storageId` points at
	// the uploaded blob in Convex file storage.
	plantPhotos: defineTable({
		ownerId: v.string(),
		plantId: v.id("plants"),
		storageId: v.id("_storage"),
	})
		.index("by_plant", ["plantId"])
		.index("by_owner", ["ownerId"]),

	// One parent edge of the pedigree DAG. A Division produces one edge (no
	// role); a Cross produces two edges tagged `seed` and `pollen`. Indexed both
	// ways so the pedigree can be walked up (by_child) and down (by_parent), plus
	// by_owner so the whole Breeding graph's edges load in one read.
	// See docs/adr/0002-parent-edges-as-rows.md.
	parentEdges: defineTable({
		ownerId: v.string(),
		childId: v.id("plants"),
		parentId: v.id("plants"),
		role: v.optional(v.union(v.literal("seed"), v.literal("pollen"))),
	})
		.index("by_child", ["childId"])
		.index("by_parent", ["parentId"])
		.index("by_owner", ["ownerId"]),
});
