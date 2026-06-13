# Sugar Free PAI — Memory Convergence (Ralph task)

## The point (plain)

Sugar Free PAI must **not own a memory system**. Memory lives in **memory-substrate** — the
external store (`PI_MEMORY_ROOT`) plus its background **worker**, which *is* the
subagent that runs against memory instead of the core AI loop. Sugar Free PAI **consumes**
the substrate's pi-dev adapter. This deletes the duplicate in-repo memory and ends
the "two memory systems" split.

## Why

- memory-substrate is the substrate-neutral primitive; Sugar Free PAI is one consumer.
  June-2 convergence decision: **subtraction, not glue.**
- The userspace model (just shipped) says memory is userspace data living
  *externally*, never in the engine repo. Sugar Free PAI's in-repo `memory/` violates it.
- The substrate worker already IS the subagent-against-memory. Sugar Free PAI doesn't
  reimplement memory in the core loop — it just loads the adapter.

## Out of scope — DO NOT TOUCH

- The external store `~/.memory` and ANY data migration / re-port (separate
  careful step; HARD RULES apply — never write to canonical `~/.memory`).
- memory-substrate internals — the worker/adapter already exist; only consume them.
- The MCP / remote access mode (deferred — later).
- `skills/algorithm/` — canonical, QA-swept; never edit.

## Target state

1. No `memory/` tree in Sugar Free PAI — deleted.
2. `package.json` `pi.extensions` loads the memory-substrate pi-dev adapter, so
   capture + injection come from its worker (subagent), not from the core loop.
   Wire it the simplest way that actually loads (local path ref or `pi install`);
   record which in AGENTS.md.
3. No `skills/memory/` tree: explicit lookup/capture is handled by the memory-substrate adapter and `memory_research`, not a duplicate skill or blueprint.
4. `routing/` no longer encodes the in-repo 6-category memory; points at the
   substrate model where relevant.
5. `SHAPE.md` + `README.md`: memory is **consumed from memory-substrate, not owned.**
6. Userspace overlay (`blueprint-loader`), other skills, learning, evals untouched.

## Open decision — SURFACE, don't guess

If the substrate worker already fully covers explicit capture/lookup, increment 3's
`skills/memory` was redundant with the substrate worker and was removed by Austin direction.

## Backpressure (green every increment)

- `bun test` stays green (the `blueprint-loader` tests).
- Structural checks after convergence:
  - `[ ! -d memory ]` — no in-repo memory tree
  - `rg -q 'memory-substrate' package.json` — adapter wired
  - no 6-category memory schema (`decisions/facts/patterns/people/sessions`) left in
    `routing/`, `SHAPE.md`, `README.md`
- `bunx tsc --noEmit` if a tsconfig applies to touched code.

## Increments (one per loop — ship completely, test green, commit, tag, push)

1. Wire the memory-substrate pi-dev adapter into `package.json` `pi.extensions`;
   confirm it loads cleanly (status line / no error). Record the wiring in AGENTS.md.
2. Remove `skills/memory` (SKILL.md + blueprint.yaml + fixture); defer lookup/capture to memory-substrate.
3. Delete the in-repo `memory/` tree; update `routing/` references.
4. Update `SHAPE.md` + `README.md` (memory consumed, not owned); reconcile drift.
5. Final structural checks + `bun test` green; record outcome here. Commit, tag, push.
