# Parent edges are stored as rows, not embedded on the Plant

A Plant's parent links are stored as separate `parentEdges` rows
(`{ childId, parentId, role? }`) rather than embedded on the Plant document.
A Division produces one edge; a Cross produces two edges tagged `seed` and
`pollen`. The Plant keeps a small `originKind` enum (`cross` | `division`) for
clarity and validation. We chose this because the pedigree is traversed in both
directions — up to a Plant's parents and down to its children — and Convex
needs an index for whichever direction is read. Edge rows give symmetric,
single-index reads each way (index on `childId` to look up, on `parentId` to
look down) and naturally model the DAG, where a node has many children but only
1–2 parents.

## Considered Options

- **Embed Origin on the Plant doc** (`{ kind, parentId | seedParentId,
  pollenParentId }`) — rejected: reading parents is free, but finding a Plant's
  children means unioning three separate indexed-field lookups, and the
  variable shape is awkward to index.

## Consequences

- Assembling a full node requires a join from Plant to its edges.
- The 1-or-2 arity and the seed+pollen invariants are enforced in the mutation,
  not by the type system.
