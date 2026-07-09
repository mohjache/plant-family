# Every Plant is owned — drop the in-collection distinction

We remove the `inCollection` boolean and the "referenced ancestor" second class
it created. Every Plant is now simply an owned, managed specimen. A forebear you
don't physically hold (a wild species, another grower's parent plant) is still an
ordinary Plant record — it just may carry little more than a name and no photos.
We chose this because the physical-holding vs referenced-ancestor split added an
axis of complexity that did not earn its keep: in practice a hobbyist's Pedigree
parents are mostly plants they hold, the rare un-owned forebear reads fine as a
thin Plant, and an inventory app wants "a Plant is a Plant," not two kinds.

## Considered Options

- **Keep `inCollection`** — rejected: it forced every screen and query to reason
  about two classes of Plant and put a "Reference" badge on the canvas that no
  longer has a home once the graph is gone.
- **Replace `inCollection` with a lifecycle status** (active / died / gave away /
  sold) — deferred, not rejected: a status is a genuinely useful inventory
  concept and the honest successor to "in collection," but it is new scope. If
  added later it is an independent decision, not a revival of the ownership
  split.
- **Keep a lightweight flag to hide thin ancestor records from the Inventory
  grid** — rejected: reintroduces the distinction under another name.

## Consequences

- The `inCollection` field is dropped from the `plants` schema. The existing
  data was reset during development, so no migration was needed to clear it.
- The Inventory grid shows all of an account's Plants; thin ancestor records
  (often photo-less) appear alongside held specimens.
- The "Reference" badge and all `inCollection` UI/query branches are removed.
- CONTEXT.md's "In collection" term is deprecated; "Plant" no longer treats
  ownership as an identity axis.
