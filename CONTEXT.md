# Plant Family

Plant Family is an app for tracking the plants you own and the breeding lineage
(pedigree) that connects them.

## Language

**Plant**:
An individual plant specimen that you own. A single node in a pedigree.
_Avoid_: specimen, plant family (see below)

**Pedigree**:
The ancestry diagram showing a Plant and the parents/ancestors it descends from.
Structurally a directed acyclic graph (DAG), not a strict tree, because an
ancestor can appear on more than one branch.
_Avoid_: family tree, lineage

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
