# Inventory-first: home is a photo grid, family history is a per-plant Pedigree

The home screen is an **Inventory** — a scrolling grid of large photo cards, one
per Plant — not a graph. Family history moves to each Plant's detail page as a
**rooted Pedigree** (the subject plus its ancestors). The whole-collection,
unrooted **Breeding graph** canvas is removed entirely, along with its
`@xyflow/react` and `@dagrejs/dagre` dependencies and the `getBreedingGraph`
query. This supersedes [ADR-0003](0003-breeding-graph-canvas.md). We chose this
because photos and browsing what you own are the point of the app; a
pannable/zoomable whole-collection DAG buried that and was hostile to phones,
whereas a scrolling photo grid plus a small per-plant ancestry view is exactly
what a mobile inventory app wants.

The rooted Pedigree is **hand-rendered** as a nested/stacked CSS layout (subject
at the bottom, parents stacked above with seed/pollen labels), not React Flow. A
rooted pedigree is small — 1–2 parents per node, a few levels — and CONTEXT.md's
Pedigree definition already accepts that a shared ancestor may appear on more
than one branch, so the duplication ADR-0003 feared is acceptable here.

The app is **mobile-first**: overlays become routes. What were modals/popovers/
canvas panels are now pages — `/home` (Inventory grid), `/plants/new`,
`/plants/[id]` (detail, with inline editing of name/notes), and focused
sub-routes for the distinct tasks (`/plants/[id]/origin`, a photo-add route).
Navigation is a **bottom tab bar** (Inventory · Add), replacing the desktop
sidebar shell.

## Considered Options

- **Keep the graph as home, add an inventory tab** — rejected: contradicts the
  goal (inventory matters more than the graph) and is the two-surface split
  ADR-0003 set out to avoid, just inverted.
- **Keep a secondary whole-collection Graph page** — rejected: cross-plant
  relationships are real but not worth the React Flow/Dagre weight and the extra
  surface once family history is served per-plant; can be revisited.
- **Keep React Flow for the rooted Pedigree only** — rejected: two heavyweight
  deps and an embedded pannable canvas for a small tree that scrolls fine as
  plain markup.
- **Top app bar + Add FAB** instead of a bottom tab bar — rejected: the bottom
  tab bar is the more familiar phone pattern for a browse-plus-add app.

## Consequences

- `getBreedingGraph` is deleted; a rooted-pedigree query (subject + ancestors)
  replaces it, and an Inventory-list query returns each Plant with its cover URL.
- `@xyflow/react` and `@dagrejs/dagre` are removed from the dependency tree.
- The origin-setting flow can no longer be "click a node on the canvas"; it
  becomes a form on `/plants/[id]/origin` using the searchable plant picker.
- `PlantEditDialog` (modal) is replaced by the detail page and its sub-routes.
- The existing shadcn `Sidebar` shell is retired from the app layout in favour
  of a bottom tab bar.
