# Evals Backlog — Sugar Free PAI + memory-substrate

**Date:** 2026-06-08
**Origin:** "is there a use-case for evals in the running of PAI/Sugar Free PAI?" — answer: yes at the *edges*, no in the hot path.
**Spans:** Sugar Free PAI (semantic blueprints) + memory-substrate (write/inject/compact quality).

---

## The rule (decides what belongs here and what doesn't)

**Evals are a measurement tool at the edges — dev-time and high-stakes autonomy — never per-turn runtime ceremony.**

| Category | Where | Verdict |
|---|---|---|
| 1. Dev-time component evals | off the hot path (blueprints, memory quality) | **YES — build these** |
| 2. Runtime backpressure in *autonomous* loops | Ralph build loops, UHC verifier-first | **YES — narrow, high-stakes only** |
| 3. Per-turn interactive runtime evals | every PAI/Sugar Free PAI turn | **NO — explicit non-goal** |

Category 3 is the heavy-PAI trap reincarnated: a judge on every turn fights native model judgment, adds latency/cost, and degrades as models improve (BPE). Do not wire it.

---

## Priority items

### E1 — Blueprint A/B eval  *(HIGHEST)*  · repo: Sugar Free PAI
- **What:** Measure whether semantic blueprints beat the plain-markdown baseline for skill output, focused on the **soft zone** (open-ended prompts with multiple acceptable outputs), not single-right-answer fixtures.
- **Why:** Sugar Free PAI v0.1 convergence numbers were "misleadingly strong" — every fixture had a single right answer, so the config-only-blueprinting-preserves-diversity hypothesis has **zero data**. "It's working" is currently a vibes judgment. This eval directly de-risks the Sugar Free PAI-daily bet.
- **How:**
  - Build a soft-zone fixture set (open-ended tasks; varied valid outputs). Use BeCreative `SyntheticDataExpansion` to grow fixtures.
  - For each skill, run blueprint vs plain-markdown variant; judge with an LLM-judge + rubric on **two axes: output diversity and quality**.
  - Headline metric: does config-only blueprinting *preserve diversity while lifting quality*? (the untested claim).
- **Done:** a reproducible eval emitting a blueprint-vs-baseline score on soft-zone tasks. Operationalizes the queued `project_Sugar Free PAI-semantic-blueprint-experiment.md`.
- **Tools:** Evals skill, BeCreative.

### E2 — Memory-substrate "valid vs good" evals  · repo: memory-substrate
- **What:** Measure the quality the green gate cannot:
  - (a) worker writes the **right** memories (durable signal, not noise);
  - (b) injection picks **relevant** index slices (relevance@k);
  - (c) compaction preserves **load-bearing** facts (retention check);
  - (d) migrator's **inferred** descriptions/frontmatter aren't semantically lossy.
- **Why:** the green gate proves *correct* (schema, confinement, two-step saves); nothing proves *useful*. The gap between valid and good is eval-shaped.
- **How:** labeled turn set → expected write / no-write; judge worker drafts; relevance@k on injection; fact-retention diff on compaction.
- **Done:** an opt-in dev-time eval suite, **off the offline green gate's hot path** (same pattern as the existing live integration harness).
- **Note:** distinct from HANDOFF rigor backlog #1 (parser consistency) — that's a correctness *bug* (deterministic test), not an eval.

### E3 — Autonomous-loop backpressure eval  *(design-later)*  · Ralph / UHC
- **What:** An eval/judge gate *inside* autonomous runs (Ralph build loops, UHC verifier-first) — never interactive turns.
- **Why:** no human in the loop; cost of silent drift is high. Huntley: capture the backpressure → grant more autonomy.
- **Done:** a judge gate that can block / retry / escalate an autonomous iteration against a quality threshold.
- **Depends on:** patterns proven in E1/E2 first.

---

## Explicit non-goals
- Per-turn interactive runtime evals (category 3). BPE-fragile; degrades as models improve; latency + token tax; fights native judgment.

## Sources
- `Evals` skill, `BeCreative` (synthetic-data expansion), `backpressure-dev.md` (backpressure = autonomy), `project_Sugar Free PAI-semantic-blueprint-experiment.md` (the queued A/B), Sugar Free PAI v0.1 "misleadingly strong" finding.
