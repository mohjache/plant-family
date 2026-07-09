# PRD: Inventory-first redesign — photo timeline, owned plants, mobile pages

Status: ready-for-agent

## Problem Statement

I use Plant Family to keep track of the plants I own, but the app opens onto a
whole-collection breeding-graph canvas. That graph is the first and main thing I
see, even though what I actually care about day to day is *browsing what I own*
and *seeing good, large photos of each plant*. The graph is also hostile to my
phone — it pans and zooms and buries the plants — and almost everything I do
(adding a plant, editing it, wiring up its parents) happens in a modal or a
canvas panel that is cramped on a small screen.

I also can't tell the story of a single plant over time. I take photos of a plant
as it grows, gets repotted, blooms, or gets divided — but the app just stores
them as an undated pile and freezes my oldest upload as the thumbnail forever. I
want to document a plant across its whole life and look back through that history.

Finally, the app draws a hard line between plants I "have in my collection" and
plants I only reference as ancestors. In practice I just want every plant I
create to be mine, owned and managed, without that second-class distinction
getting in the way.

## Solution

Reorient the app around **Inventory** and **photos**, and make it mobile-first.

- The home screen becomes the **Inventory**: a scrolling grid of large photo
  cards, one per Plant.
- Each Plant gets a **detail page** with a big hero image, a chronological
  **Timeline** of its dated photos (a growth journal), its notes, its Origin,
  and its rooted **Pedigree** (its ancestors).
- Every Plant is simply **owned** — the in-collection / referenced-ancestor
  distinction is removed.
- The whole-collection **Breeding graph** canvas is retired; family history is
  shown per-plant as a rooted Pedigree, hand-rendered so it scrolls naturally on
  a phone.
- Overlays become **routes** (no modals): add-plant, detail, origin-setting, and
  photo-add are all their own pages, navigated via a **bottom tab bar**.

This is captured in ADR-0004 (inventory-first IA, supersedes ADR-0003), ADR-0005
(every Plant is owned), and ADR-0006 (photos are a dated Timeline). CONTEXT.md is
updated: `Inventory`, `Photo`, and `Timeline` are defined; `In collection` and
`Breeding graph` are deprecated.

## User Stories

### Inventory (home)

1. As a plant owner, I want the app to open onto a grid of my plants shown as
   large photo cards, so that I can see what I own at a glance.
2. As a plant owner, I want each Inventory card to show the plant's current cover
   photo and name, so that I can recognise it quickly.
3. As a plant owner, I want a plant with no photos yet to still appear in the
   Inventory with a clear placeholder, so that nothing I create is hidden.
4. As a plant owner, I want to tap a card to open that plant's detail page, so
   that I can dig into one plant.
5. As a plant owner, I want to search my Inventory by name, so that I can find a
   specific plant in a large collection.
6. As a plant owner, I want the Inventory to be comfortable to scroll on my
   phone, so that browsing feels native.
7. As a new user with no plants, I want an empty Inventory to invite me to add my
   first plant, so that I know how to start.

### Adding & editing plants

8. As a plant owner, I want an "Add" action always reachable from the bottom tab
   bar, so that I can add a plant from anywhere.
9. As a plant owner, I want adding a plant to be its own full page, so that the
   form is comfortable on mobile.
10. As a plant owner, I want to give a new plant a name and optionally a first
    photo, so that I can identify it and start its timeline right away.
11. As a plant owner, I want to edit a plant's name and notes directly on its
    detail page, so that I don't have to open a separate editor.
12. As a plant owner, I want my edits to save clearly (with feedback), so that I
    know they took effect.
13. As a plant owner, I want to delete a plant I no longer want to track, so that
    my Inventory stays accurate. (See Out of Scope for cascade caveats.)

### Ownership model

14. As a plant owner, I want every plant I create to simply be mine, so that I
    don't have to reason about "in collection" versus not.
15. As a plant owner, I want to record an ancestor I don't physically own (e.g. a
    wild species or another grower's parent) as an ordinary plant, so that I can
    still build a Pedigree.
16. As a plant owner, I want those thin ancestor records to appear in my
    Inventory like any other plant, so that the model stays simple and
    consistent.

### Photos & Timeline

17. As a plant owner, I want to add photos to a plant, so that I can document how
    it looks.
18. As a plant owner, I want to take a photo with my phone camera directly, so
    that I can capture the plant in the moment.
19. As a plant owner, I want to upload existing photos from my gallery, so that I
    can add pictures I already have.
20. As a plant owner, I want each photo to have a date it was taken, so that the
    Timeline reflects when growth actually happened.
21. As a plant owner, I want the photo date to default to today (upload time) but
    be editable, so that I can backdate older photos.
22. As a plant owner, I want to add an optional caption to a photo (e.g.
    "repotted", "first bloom", "split into 3"), so that the Timeline reads like a
    journal.
23. As a plant owner, I want a plant's photos shown as a chronological Timeline on
    its detail page, so that I can follow its life in order.
24. As a plant owner, I want the most recent photo to be the cover by default, so
    that the card shows the plant as it looks now rather than as a baby.
25. As a plant owner, I want to pin a specific photo as the cover, so that I can
    choose the best representative image.
26. As a plant owner, I want a big hero image on the detail page, so that I can
    appreciate the plant at a good size.
27. As a plant owner, I want to edit a photo's date or caption after adding it, so
    that I can fix mistakes.
28. As a plant owner, I want to remove a photo, so that I can delete bad shots.
29. As a plant owner, I want removing the current cover to promote a sensible
    replacement, so that a plant never loses its card image unexpectedly.
30. As a plant owner, I want photo-adding to be its own focused page, so that
    capturing photo + date + caption is comfortable on mobile.

### Family history (Pedigree)

31. As a plant owner, I want to see a plant's ancestors on its detail page, so
    that I can understand where it came from.
32. As a plant owner, I want the Pedigree to show whether the plant is a Cross
    (seed + pollen parents) or a Division (single parent), so that its origin is
    clear.
33. As a plant owner, I want the Pedigree to scroll naturally on my phone, so
    that I don't have to pan and zoom a canvas.
34. As a plant owner, I want to tap an ancestor in the Pedigree to open that
    plant's detail page, so that I can navigate lineage.
35. As a plant owner, I want a plant with no recorded origin to clearly show that,
    so that I know I can set one.

### Origin setting

36. As a plant owner, I want to set a plant's Origin from a dedicated page, so
    that the task is focused and mobile-friendly.
37. As a plant owner, I want to choose whether the origin is a Cross or a
    Division, so that I record the right kind of event.
38. As a plant owner, I want to pick parents from a searchable list of my plants,
    so that I don't need a canvas to click on.
39. As a plant owner, I want a Cross to require two different parents (seed and
    pollen), so that the record is valid.
40. As a plant owner, I want a Division to require exactly one parent, so that the
    record is valid.
41. As a plant owner, I want the app to prevent me from creating a cycle (a plant
    being its own ancestor), so that the Pedigree stays coherent.
42. As a plant owner, I want to be stopped from giving a plant a second origin, so
    that its lineage is unambiguous.

### Navigation & shell

43. As a mobile user, I want a bottom tab bar with Inventory and Add, so that the
    main actions are always in reach.
44. As a mobile user, I want a clear back affordance from detail and sub-pages, so
    that I can return to the Inventory.
45. As a user, I want to reach my account/sign-out from the new shell, so that I
    can manage my session now that the sidebar is gone.

## Implementation Decisions

### Information architecture (ADR-0004)

- Home is the **Inventory** grid. The whole-collection Breeding graph canvas is
  removed, along with the `@xyflow/react` and `@dagrejs/dagre` dependencies and
  the `getBreedingGraph` query.
- Family history is a **rooted Pedigree** on each Plant's detail page,
  **hand-rendered** as a nested/stacked layout (subject at the bottom, parents
  stacked above with seed/pollen labels). A shared ancestor appearing more than
  once in the rooted view is acceptable per CONTEXT.md.
- The app is **mobile-first**; overlays become routes:
  - `/home` — Inventory grid
  - `/plants/new` — add-plant page (name plus an optional first photo)
  - `/plants/[id]` — detail page: hero image, Timeline, inline editing of
    name/notes, Origin summary, rooted Pedigree
  - `/plants/[id]/origin` — set/edit Origin
  - a focused photo-add route (e.g. `/plants/[id]/photos/new`)
- Navigation is a **bottom tab bar** (Inventory · Add). The shadcn `Sidebar`
  shell (`AppSidebar`) is retired; the account/sign-out menu moves into the new
  shell.
- `PlantEditDialog` and the canvas home page are deleted.

### Ownership model (ADR-0005)

- The `inCollection` boolean is removed from the `plants` schema. A migration
  clears it from existing rows.
- Every Plant is owned. Un-owned forebears are ordinary Plant records that may
  carry only a name. The "Reference" badge and all `inCollection` UI/query
  branches are removed.
- `createPlant` no longer takes `inCollection`.

### Photos & Timeline (ADR-0006)

- `plantPhotos` gains `takenAt: number` and `caption: v.optional(v.string())`. A
  migration backfills `takenAt` from each row's `_creationTime`.
- `takenAt` is stored in milliseconds and edited at **day** granularity via a
  date picker; it defaults to upload time. EXIF auto-dating is out of scope.
- The Timeline is ordered by `takenAt`, shown newest-first on the detail page.
- `coverPhotoId` on the Plant is re-meaned as an explicit owner **pin**. When
  unset, the cover is resolved as the **latest** Photo by `takenAt`. `addPhoto`
  no longer auto-sets the first photo as the cover.
- Photo capture uses a file input with `accept="image/*"` and
  `capture="environment"` so mobile can open the camera, with gallery upload as
  the fallback. Upload continues to go through `generateUploadUrl` →
  `ctx.storage` as today.

### Convex API (`convex/plants.ts`)

- **Remove**: `getBreedingGraph`.
- **Keep**: `createPlant` (minus `inCollection`), `recordDivision`, `recordCross`
  (with their existing cycle / distinct-parent / single-origin invariants),
  `updatePlant` (minus `inCollection`), `generateUploadUrl`, `removePhoto` (cover
  re-promotion preserved).
- **Add / change**:
  - `listInventory` — all of the account's Plants, each with a resolved cover URL
    (pin-or-latest). Replaces `listPlants`/`getBreedingGraph` for the home grid.
  - `getPedigree` — a rooted query returning the subject Plant plus its ancestors
    and the edges among them (walking `parentEdges` `by_child`). Reintroduces the
    rooted concept retired in the ADR-0003 era.
  - `getPlantDetail` — extended so photos carry `takenAt` and `caption` and are
    returned in Timeline order.
  - `addPhoto` — accepts `takenAt` and optional `caption`; does not set the cover.
  - `updatePhoto` — edits a photo's `takenAt` / `caption`.
  - `setCover` — pins a specific Photo as the Plant's cover.
- Cover resolution (pin-or-latest) is a single shared helper so the Inventory and
  detail queries agree.

### Schema summary

- `plants`: drop `inCollection`; `coverPhotoId` retained but now means "pinned
  cover" (optional).
- `plantPhotos`: add `takenAt: number`, `caption: v.optional(v.string())`. The
  existing `by_plant` index remains; Timeline ordering is applied after read (or
  via a `by_plant_takenAt` compound index if profiling warrants it).

### Migration

- Not needed. The development data was reset before shipping, so `inCollection`
  is dropped from the schema outright and `takenAt` is added as a required field
  with no backfill.

## Testing Decisions

Automated tests are **deferred** for this PRD (owner's call) — the redesign ships
with **manual verification**. A good test here would exercise observable behavior
through the Convex function layer, not internal structure: e.g. "after adding a
newer photo, the resolved cover is that photo" or "recording a Cross with two
identical parents is rejected" — asserted through the public queries/mutations,
never by peeking at rows or mocking internal helpers (per the project's
good/bad-tests guidance).

If/when tests are added, the intended seam is the **Convex function layer**
(`convex/plants.ts`) via `convex-test` + Vitest — the highest seam that captures
the domain rules (origin/cycle invariants, cover pin-or-latest resolution,
Timeline ordering, Pedigree assembly). Pure helpers (cover resolution, rooted
Pedigree assembly) are directly testable and are the first candidates. There is
no prior art in the repo — this would be the first test setup.

Manual verification checklist to run before merge:

- Add a plant → it appears in the Inventory with a placeholder.
- Add photos with different `takenAt` dates → Timeline orders them; cover follows
  the latest; pinning overrides.
- Remove the cover photo → a sensible replacement is promoted.
- Set a Cross (two distinct parents) and a Division (one parent) → Pedigree
  renders and reflects arity; cycles and second-origins are rejected.
- Exercise every flow on a narrow (mobile) viewport.

## Out of Scope

- Automated tests (deferred, as above).
- **Lifecycle status** (active / died / gave away / sold). Considered as the
  successor to `inCollection` but explicitly deferred (ADR-0005) — an independent
  future decision, not part of this redesign.
- The **whole-collection Breeding graph** view. Removed, not merely hidden; no
  secondary Graph page.
- **EXIF-based auto-dating** of photos.
- **Cascade/delete semantics** for a Plant that is an ancestor of others (what
  happens to edges and to children's Origins) — deletion is offered but the
  cascade rules are not specified here.
- Reordering/curating the Timeline beyond `takenAt` ordering; albums, tags, or
  multiple timelines per plant.
- Sharing, multi-user collections, or any change to tenancy.
- Advanced Inventory filtering/sorting beyond name search and newest-first.
- Offline capture / PWA installability.

## Further Notes

- This redesign inverts ADR-0003's central bet. ADR-0003 is marked **superseded**
  by ADR-0004; ADR-0001 (Origin is a Cross or Division) and ADR-0002 (parent
  edges as rows) remain valid and unchanged.
- `date-fns` is already a dependency and `react-day-picker` (shadcn `Calendar`)
  is available for the `takenAt` date picker — no new date libraries needed.
- Removing `@xyflow/react` and `@dagrejs/dagre` should be done only after the
  canvas home page and any imports are gone, to keep `typecheck` green.
- The bottom tab bar can reuse existing shadcn primitives; a dedicated
  mobile-nav component replaces `AppSidebar` in the app layout.
