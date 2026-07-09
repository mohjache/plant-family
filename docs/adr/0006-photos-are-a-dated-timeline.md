# A Plant's Photos form a dated, captioned Timeline

Each Photo carries a `takenAt` date (when the picture was taken, editable,
defaulting to upload time) and an optional `caption`. A Plant's Photos are
presented on its detail page as a **Timeline** ordered by `takenAt` — a growth
journal of how the specimen changed across its life — rather than an unordered
album keyed on upload time. We chose this because "photos throughout a plant's
lifetime" is the core of the pivot: the meaning is in *when* each photo was taken
and being able to read the plant's history in order, which upload time and an
unordered grid cannot express.

The Plant's **cover** (its Inventory-card and detail hero image) defaults to the
**most recent** Photo by `takenAt`, so a card shows the plant as it looks now
rather than freezing it at its first upload. The owner may **pin** a specific
Photo as the cover to override this.

## Considered Options

- **Keep photos undated, ordered by upload** — rejected: cannot backdate older
  photos, and "lifetime" ordering is exactly the point.
- **Auto-date from EXIF** — deferred: nice, but adds parsing and unreliable
  metadata; `takenAt` defaults to upload time and is hand-editable, and EXIF can
  fill it in later without a model change.
- **First-uploaded photo as cover** (the prior behaviour) — rejected: under a
  lifetime model it pins the plant to its youngest state forever.

## Consequences

- `plantPhotos` gains a required `takenAt: number` and
  `caption: v.optional(v.string())`. The existing data was reset during
  development, so no backfill migration was needed.
- `coverPhotoId` on the Plant now means an explicit owner **pin**; when unset the
  cover is computed as the latest Photo by `takenAt` (not the first uploaded).
  `addPhoto` no longer auto-sets the first photo as cover.
- Queries that return a cover URL must resolve pin-or-latest.
- The detail page renders a chronological Timeline; a photo-add route captures a
  photo plus its `takenAt` and optional caption.
