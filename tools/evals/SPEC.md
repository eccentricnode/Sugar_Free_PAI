# Eval Harness — SPEC (v0.1-draft)

**Scope:** E1 from `BACKLOG.md` — the blueprint A/B eval. Build this; defer E2 (memory-substrate) and E3 (autonomous loops).

**One sentence:** Measure whether a skill's semantic blueprint beats its plain-markdown baseline on **soft-zone** (open-ended) tasks, scored on diversity *and* quality.

---

## Problem

Sugar Free PAI v0.1 claimed semantic blueprints "work," but every QA fixture had a single right answer, so the load-bearing hypothesis — *config-only blueprinting preserves output diversity while lifting quality* — has zero data. The hard zone (locked output schema) is already covered by `_qa-sweep.sh`. The soft zone is unmeasured. This harness measures it.

## What it is

A dev-time, TypeScript eval tool under `tools/evals/`. NOT a runtime extension, NOT shipped in the pi package, NOT invoked per turn.

## Behavioral contract

### Inputs
- A **skill under test** with two variants:
  - `blueprint` — the skill run with its `blueprint.yaml` active (current Sugar Free PAI behavior).
  - `baseline` — the same skill run from plain-markdown instructions only, blueprint suppressed.
- A **soft-zone fixture set**: open-ended prompts with *many* acceptable outputs (not one right answer). Each fixture states why it is soft-zone.
- `N` runs per variant (default 5) to expose variance.

### Run
- For each (variant × fixture × run): produce one output via the substrate (codex/pi), recording raw output + metadata.
- The substrate call layer MUST be behind an interface that can be **mocked** for the offline gate.

### Score
- **Diversity:** distinctness across the N runs of a variant (e.g. pairwise dissimilarity). Higher = more diverse.
- **Quality:** an LLM-judge scores each output against a per-skill rubric (on-topic, complete, useful). Judge is a substrate call behind the same mockable interface.
- **Headline metric (per skill):** the blueprint−baseline delta on *both* axes. The hypothesis holds only if blueprint keeps diversity ≈ baseline (or higher) **while** lifting quality.

### Output
- A `report` (markdown + machine-readable JSON) per skill: per-variant diversity, mean quality, and the blueprint−baseline deltas, with the verdict (hypothesis supported / refuted / inconclusive) and the run count.
- Reports write to an ignored output dir (e.g. `tools/evals/results/`), never committed by default.

## Backpressure (the green gate — build this FIRST)

- `bunx tsc --noEmit` clean (introduce `tools/evals/tsconfig.json`; this is Sugar Free PAI's first TS test surface).
- `bun test` green on the **deterministic** harness logic with the substrate + judge **mocked**: fixture loading, variant assembly, diversity computation, score aggregation, verdict logic, report rendering.
- Live runs (real substrate + judge calls) are **opt-in** behind `SUGARFREEPAI_EVAL_LIVE=1` and excluded from the default `bun test` gate — mirror memory-substrate's `tests/pi-dev-live-integration.test.ts` pattern exactly.

## Done (v0.1)
- Green gate passes (`bunx tsc --noEmit && bun test`).
- A live run (`SUGARFREEPAI_EVAL_LIVE=1`) produces a blueprint-vs-baseline report for **`skills/research/`** — the canonical soft-zone case — with diversity + quality deltas and a verdict.

## Out of scope
- Per-turn / runtime evals (BACKLOG non-goal — BPE trap).
- Re-judging hard-zone single-answer skills (covered by `_qa-sweep.sh`).
- E2 / E3.

## Hard constraints
- **Do NOT modify `skills/algorithm/`** — canonical reference, concurrently QA-swept; any edit corrupts it.
- bun, never npm/npx. TypeScript only inside `tools/evals/`; the rest of Sugar Free PAI stays markdown-first.
- No live API calls in the offline green gate. No daemons.
