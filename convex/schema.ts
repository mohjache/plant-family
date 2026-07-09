import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	// A node in a Pedigree and an item in the Inventory. Every Plant is owned and
	// managed within one account; a forebear the owner doesn't hold is just an
	// ordinary (often photo-less) Plant. `originKind` is unset until parents are
	// attached, so a leaf ancestor has no origin. See CONTEXT.md.
	plants: defineTable({
		// Tenant: the WorkOS identity (tokenIdentifier) whose account this Plant
		// belongs to.
		ownerId: v.string(),
		name: v.string(),
		originKind: v.optional(v.union(v.literal("cross"), v.literal("division"))),
		// Free-form notes the owner keeps on this Plant.
		notes: v.optional(v.string()),
		// The owner's pinned cover photo (the storage blob shown as the Plant's
		// Inventory card / detail hero). When unset the cover is resolved as the
		// latest Photo by `takenAt`. See docs/adr/0006-photos-are-a-dated-timeline.md.
		coverPhotoId: v.optional(v.id("_storage")),
	}).index("by_owner", ["ownerId"]),

	// One photo in a Plant's Timeline. Kept in its own table (rather than an array
	// on the Plant) so adding a photo doesn't rewrite the Plant doc and the list
	// can grow. `takenAt` is when the picture was taken — editable, defaulting to
	// upload time. See docs/adr/0006-photos-are-a-dated-timeline.md.
	plantPhotos: defineTable({
		ownerId: v.string(),
		plantId: v.id("plants"),
		storageId: v.id("_storage"),
		takenAt: v.number(),
		caption: v.optional(v.string()),
	})
		.index("by_plant", ["plantId"])
		.index("by_owner", ["ownerId"]),

	// One parent edge of the Pedigree DAG. A Division produces one edge (no role);
	// a Cross produces two edges tagged `seed` and `pollen`. Indexed both ways so
	// a Pedigree can be walked up (by_child) and down (by_parent), plus by_owner.
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
