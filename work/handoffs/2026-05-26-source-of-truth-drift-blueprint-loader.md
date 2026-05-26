# Frozen Handoff: Source-of-Truth Drift for Blueprint Loader

## artifact_type

Frozen handoff.

## objective

Enable a future agent to reconcile the architectural source-of-truth drift
between the Markdown-first, extension-free Phase 1 shape and the implemented
runtime documentation for the semantic blueprint loader extension.

## scope

In scope:

- Decide whether Phase 1 now includes the blueprint loader extension, or whether
  the loader should be deferred or removed from the Phase 1 contract.
- Align `SHAPE.md`, `README.md`, `IMPLEMENTATION_PLAN.md`, and
  `extensions/blueprint-loader.ts` after that decision.
- Preserve the Markdown-first/prompt-first substrate thesis unless explicitly
  changed.

Out of scope:

- Expanding blueprint-loader behavior beyond drift reconciliation.
- Editing `skills/algorithm/`, which the active plan marks as a canonical and
  concurrent-test area.
- Reworking memory layout or Phase 2 search behavior.

## evidence_inspected

- `SHAPE.md:5` says the core shape rejects runtime machinery and that
  `04-phase0-decisions.md` makes Phase 1 extension-free.
- `SHAPE.md:227` says pi.dev extensions are optional and future-facing, not
  substrate architecture, because Phase 1 ships with no extensions.
- `README.md:17` says `extensions/blueprint-loader.ts` auto-loads, scans
  `skills/<name>/blueprint.yaml` on every turn, and injects deterministic config
  into the system prompt.
- `README.md:38` says Phase 1 is scaffolded and the blueprint loader extension
  wires semantic blueprints into pi's system prompt on every agent turn.
- `IMPLEMENTATION_PLAN.md:10` says `extensions/blueprint-loader.ts` consumes
  blueprints by scanning `skills/<name>/blueprint.yaml` on every turn and
  injecting them into the system prompt.
- `IMPLEMENTATION_PLAN.md:15` explicitly records the drift: `SHAPE.md` still
  describes Phase 1 as extension-free, while `README.md` and
  `extensions/blueprint-loader.ts` show the loader is already implemented.
- `extensions/blueprint-loader.ts:4` states the extension scans the project's
  `skills/` directory for `blueprint.yaml` on every agent turn.
- `extensions/blueprint-loader.ts:55` reads blueprint files as UTF-8 content.
- `extensions/blueprint-loader.ts:79` caches by `path + content.length`, which
  the plan flags as a same-length edit refresh risk.
- `extensions/blueprint-loader.ts:93` injects rendered blueprint content during
  `before_agent_start`.
- Command output: `bunx markdownlint-cli2 '**/*.md'` reported
  `Summary: 0 error(s)` before this handoff was created.

## decisions

- Treat this artifact as a frozen handoff, not a general audit note, because the
  next agent needs enough context to resume reconciliation without rereading the
  conversation.
- Keep evidence, decisions, risks, and next actions separate so the future agent
  can choose a resolution path rather than inherit an implied answer.
- Do not decide the architectural question here. The unresolved decision is
  whether the loader is an accepted Phase 1 exception or an implementation that
  must be backed out or deferred.

## implementation_state

- `extensions/blueprint-loader.ts` exists and is active extension source-like
  code.
- `README.md` currently documents the loader as part of installation and status
  behavior.
- `SHAPE.md` still presents Phase 1 as extension-free and extensions as future
  or optional.
- `IMPLEMENTATION_PLAN.md` marks this mismatch as unresolved and warns not to
  expand extension work before reconciliation.
- Markdown lint passed before handoff creation.

## verification_results

- Check: `bunx markdownlint-cli2 '**/*.md'`.
  Observed signal: `Summary: 0 error(s)` before handoff creation.
  Status: passed.
- Check: `bunx markdownlint-cli2 '**/*.md'` after initial handoff write.
  Observed signal: MD013 line-length errors in this new handoff.
  Status: failed; corrected by wrapping this file.

## unresolved_risks

- Architectural risk: accepting the loader as Phase 1 runtime machinery may
  weaken the stated Markdown-first/no-hidden-harness thesis unless `SHAPE.md`
  explains why semantic blueprint injection is a narrow exception.
- Product contract risk: removing or deferring the loader would make `README.md`
  install and status claims inaccurate until rewritten.
- Runtime correctness risk: `extensions/blueprint-loader.ts:79` uses
  `path + content.length` as its cache key, so same-length blueprint edits may
  not refresh.
- Scope risk: continuing to add blueprint-related extension behavior before
  source-of-truth reconciliation will compound the drift.

## next_actions

1. Read `SHAPE.md` sections around the thesis, learning, Algorithm-as-skill, and
   extension API claims before editing.
2. Choose one resolution:
   - Update `SHAPE.md` to say Phase 1 remains Markdown-first but includes the
     blueprint loader as a narrow deterministic-config extension; or
   - Revert or defer the extension contract by updating/removing `README.md`
     claims and deciding what to do with `extensions/blueprint-loader.ts`.
3. Update `IMPLEMENTATION_PLAN.md` to remove or replace the drift warning once
   the source of truth is aligned.
4. If keeping the loader, consider fixing the cache key to use content hash or
   mtime before further extension work.
5. Re-run `bunx markdownlint-cli2 '**/*.md'` after documentation or code
   changes.

## destination

`work/handoffs/2026-05-26-source-of-truth-drift-blueprint-loader.md`

## reuse_conditions

Use this handoff when resuming work on Phase 1 architecture, blueprint-loader
documentation, semantic blueprint runtime behavior, or the active implementation
plan's drift warning. Do not use it as evidence that the loader should
definitely stay or definitely be removed; it preserves the unresolved fork.

## durable_lessons

- Markdown-first architecture documents must be updated immediately when runtime
  extensions become part of the product contract.
- A small extension can still create source-of-truth drift if the shape document
  frames extensions as future or non-architectural.
- Implementation plans should block further extension expansion until
  architecture and README claims agree.
