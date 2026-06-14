# Plant Family

Plant Family is an app for tracking the plants you own and the breeding lineage
(pedigree) that connects them.

## Language

**Plant**:
A single node in a pedigree. Usually a specimen you own, but it may also be an
ancestor you don't own — a species or wild-collected plant referenced only as a
forebear. Ownership is a property of a Plant, not part of its identity.
_Avoid_: specimen, plant family (see below)

**In collection**:
A property of a Plant meaning you physically hold the specimen, as opposed to a
referenced ancestor (a species or wild-collected plant) you've recorded but
never possessed. Distinct from tenant ownership — every Plant belongs to one
account regardless of whether it is in that account's collection.
_Avoid_: owned (ambiguous with account/tenant ownership), have

**Pedigree**:
The ancestry diagram showing a Plant and the parents/ancestors it descends from.
Structurally a directed acyclic graph (DAG), not a strict tree, because an
ancestor can appear on more than one branch.
_Avoid_: family tree, lineage

**Breeding graph**:
The entire directed acyclic graph of one account's Plants and the Origin edges
between them, shown together — potentially several disconnected clusters at
once. Unrooted, in contrast to a Pedigree, which is rooted at a single subject
Plant. The on-screen surface that renders it is the _canvas_.
_Avoid_: collection graph (clashes with In collection), family graph, lineage

**Origin**:
The event that produced a Plant. Every Plant has exactly one Origin, which is
either a Cross (two parents) or a Division (one parent).
_Avoid_: source, creation event

**Cross**:
The breeding event that produces a new Plant from two parents: a seed parent and
a pollen parent. One kind of Origin.
_Avoid_: hybridisation, breeding

**Division**:
The vegetative propagation event that produces a new Plant from a single parent,
clonally (the offspring is genetically identical to its one parent). One kind of
Origin. Contrast with a Cross, which has two parents and mixes their genetics.
_Avoid_: offset, cloning, splitting

**Seed parent**:
The parent Plant that bears the seed in a Cross (conventionally the maternal
parent).
_Avoid_: mother, female parent

**Pollen parent**:
The parent Plant that provides the pollen in a Cross (conventionally the paternal
parent).
_Avoid_: father, male parent

> Note: "Plant Family" is the app's name (branding) only. It is **not** a domain
> term. In particular, do not use "family" to mean a pedigree — in botany
> "family" is a taxonomic rank (e.g. _Rosaceae_) and would be ambiguous.
