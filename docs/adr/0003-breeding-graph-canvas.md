# The home screen is one whole-collection breeding-graph canvas

> **Superseded by [ADR-0004](0004-inventory-first-information-architecture.md).**
> The home screen is now an Inventory photo grid, and family history is a
> per-plant rooted Pedigree; the whole-collection canvas and its React
> Flow/Dagre dependencies have been removed.


The home screen renders the entire Breeding graph — every Plant and every Origin
edge for the account at once — on a single pannable/zoomable canvas, replacing
the previous two-pane layout of a Collection list beside a rooted Pedigree tree.
There is no selected subject: you add a Plant as a floating node and define its
Origin with a guided per-node control (click-to-pick parents on the canvas, with
a searchable dropdown fallback). We render with React Flow (`@xyflow/react`) and
lay out top-down with Dagre (`@dagrejs/dagre`), reusing the existing shadcn
`PlantCard` as the custom node. We chose this because the list duplicated
information already visible in the graph, and a single surface matches how the
data is actually shaped — a DAG with multiple roots, disconnected clusters, and
shared ancestors that a rooted nested-list tree cannot honestly draw.

## Considered Options

- **Keep the rooted Pedigree as the primary view** (current `getPedigree`) —
  rejected: it is rooted at one subject and duplicates shared ancestors as
  separate list items, so it cannot show the whole collection or draw a shared
  ancestor as a single node.
- **Hand-roll the layered DAG layout + SVG edges + pan/zoom** (Dagre or d3-dag
  only) — rejected: re-implements viewport, edge routing, and custom-node
  plumbing that React Flow already provides.
- **elkjs for layout** — rejected for now: more capable layered layout but a
  large, async, web-worker dependency that the current graph sizes don't
  justify. Dagre is synchronous and purpose-built for top-down DAGs.

## Consequences

- Two new dependencies (`@xyflow/react`, `@dagrejs/dagre`) and lock-in to React
  Flow's `nodes`/`edges` data shape; a thin adapter maps query output into it.
- `getPedigree` (rooted) is replaced by a whole-graph query
  (`getBreedingGraph`). `listPlants` stays — it powers the search fallback.
- The parent-first mutations (`addDivisionChild`, `addCrossChild`) are removed:
  the flow is always add-the-node-then-wire-its-Origin, so only the child-first
  `recordDivision` / `recordCross` remain.
- Layout is ephemeral and recomputed each render — node positions are not
  persisted, so "moving around the canvas" means panning/zooming the viewport,
  not dragging nodes to saved positions. No new schema.
- The rooted Pedigree survives only as a client-side *focus lens*: clicking a
  node highlights that Plant's ancestry within the same canvas (planned as a
  second step, computed from the same whole-graph data).
