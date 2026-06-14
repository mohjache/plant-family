# A Plant's Origin is either a Cross or a Division

A Plant's Origin can be a **Cross** (two parents: a seed parent and a pollen
parent) or a **Division** (a single parent, producing a genetically identical
clone such as an Alocasia cormlet). We model these as two kinds of Origin rather
than forcing everything through a two-parent Cross, because vegetative
propagation genuinely has one parent and no seed/pollen distinction. This means
the pedigree is a DAG where a node has either one or two upward edges, and any
code that walks or renders a pedigree must handle both arities.

## Considered Options

- **Stretch Cross to allow one parent** — rejected: it muddies a clean,
  two-parent definition and erases the seed/pollen semantics that only make
  sense for sexual reproduction.
