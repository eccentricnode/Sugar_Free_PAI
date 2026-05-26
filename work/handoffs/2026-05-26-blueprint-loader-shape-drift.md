<!-- markdownlint-disable MD013 -->

# Frozen handoff: blueprint-loader / Phase 1 shape drift

## artifact_type

Frozen handoff.

## objective

Enable a future agent to reconcile source-of-truth drift between the file-first, extension-free Phase 1 architecture in `SHAPE.md` and the implemented/documented runtime semantic blueprint loader.

## scope

In scope:

- Decide whether Phase 1 now includes the semantic blueprint loader extension or whether the extension should be deferred/removed from Phase 1.
- Reconcile `SHAPE.md`, `README.md`, `IMPLEMENTATION_PLAN.md`, and `extensions/blueprint-loader.ts` so they state one coherent architecture.
- Preserve the distinction between markdown-first skill instructions and runtime-injected blueprint configuration.

Out of scope:

- Expanding blueprint-loader behavior before the architectural decision is settled.
- Editing `skills/algorithm/`, which the active plan marks as a protected canonical reference.

## evidence_inspected

- `SHAPE.md:5` states the shape rejects runtime machinery and says `04-phase0-decisions.md` makes Phase 1 extension-free.
- `README.md:17-19` says `extensions/blueprint-loader.ts` auto-loads, scans `skills/<name>/blueprint.yaml` on every turn, and injects deterministic config into the system prompt.
- `README.md:37-40` says Phase 1 includes the blueprint loader extension wiring Rothman semantic blueprints into pi's system prompt on every agent turn.
- `extensions/blueprint-loader.ts:4-7` documents that the extension scans `skills/` for `blueprint.yaml` sibling files on every agent turn and injects discovered blueprints into the system prompt.
- `extensions/blueprint-loader.ts:76-83` implements per-turn refresh from `process.cwd()/skills` and caches rendered blueprints by `path:content.length`.
- `extensions/blueprint-loader.ts:86-99` hooks `session_start`, `before_agent_start`, and `session_shutdown`, including status display and system prompt injection.
- `IMPLEMENTATION_PLAN.md:10` identifies `extensions/blueprint-loader.ts` as the extension that consumes blueprints and scans `skills/<name>/blueprint.yaml` on every turn.
- `IMPLEMENTATION_PLAN.md:15` explicitly records the unresolved drift: `SHAPE.md` still describes Phase 1 as extension-free while `README.md` and the implementation show the loader already exists.
- Command output: `bunx markdownlint-cli2 '**/*.md'` reported `Summary: 0 error(s)`.

## decisions

- Treat this handoff as frozen rather than a transient status note because the next agent must resolve an architectural source-of-truth conflict without rereading the conversation.
- Do not decide the architecture in this artifact. The evidence supports two viable paths: update `SHAPE.md` to bless the loader as the first optional/Phase 1 extension, or restore Phase 1 to extension-free by demoting/removing runtime loader claims and implementation packaging.
- Keep unresolved risks separate from next actions so the next agent can choose a reconciliation path deliberately.

## implementation_state

- The semantic blueprint loader exists at `extensions/blueprint-loader.ts` and injects discovered YAML blueprints at runtime.
- README install/status prose currently presents the loader as active Phase 1 behavior.
- `SHAPE.md` remains the architectural source of truth per `IMPLEMENTATION_PLAN.md:8`, but still says Phase 1 is extension-free.
- The active plan marks this drift unresolved and warns not to expand extension work before reconciliation.

## verification_results

- Status: passed.
- Check: `bunx markdownlint-cli2 '**/*.md'`.
- Observed signal: `Summary: 0 error(s)`.
- Scope note: markdownlint excludes local/operator files and ignored QA artifacts according to the command output's configured ignore set.

## unresolved_risks

- If `SHAPE.md` is updated to allow the loader, the project thesis may need sharper language distinguishing forbidden heavy runtime machinery from one accepted lightweight extension.
- If the loader is deferred or removed, `README.md` install/status claims and package behavior may mislead users until corrected.
- `extensions/blueprint-loader.ts:79` caches by `path + content.length`; same-length blueprint edits may not refresh, which is already noted in `IMPLEMENTATION_PLAN.md:14`.
- Further extension work could compound the drift if performed before the architecture decision.

## next_actions

1. Read the cited lines, then choose one reconciliation path:
   - Path A: bless the semantic blueprint loader as an intentional Phase 1 exception/first extension.
   - Path B: restore Phase 1 as extension-free by removing or deferring loader claims and package wiring.
2. Update `SHAPE.md` first because the plan names it as architectural source of truth.
3. Update `README.md` and `IMPLEMENTATION_PLAN.md` to match the chosen source-of-truth language.
4. If Path A is chosen, consider fixing the loader cache key from `content.length` to content hash or mtime before expanding extension work.
5. Run `bunx markdownlint-cli2 '**/*.md'` after edits and record the result.

## destination

`work/handoffs/2026-05-26-blueprint-loader-shape-drift.md`

## reuse_conditions

Reuse this handoff when a future agent is asked to reconcile Phase 1 scope, semantic blueprint loading, package install behavior, or extension-vs-markdown architecture. Do not reuse it as proof that either architectural path has been chosen; it records drift and evidence, not resolution.

## durable_lessons

- Keep the architectural source of truth synchronized before documenting runtime behavior as install/status facts.
- A lightweight extension can still violate an "extension-free" phase boundary unless the boundary is explicitly revised.
- Runtime config loaders need cache invalidation keyed by content identity, not only content length.

## isa_artifact_schema

- date: 2026-05-26
- artifact_type: frozen handoff
- objective: reconcile blueprint-loader runtime implementation with extension-free Phase 1 shape language
- scope: `SHAPE.md`, `README.md`, `IMPLEMENTATION_PLAN.md`, `extensions/blueprint-loader.ts`, and follow-on verification
- evidence: cited file lines and markdownlint command output above
- decisions: preserve both architectural paths; do not resolve inside the handoff
- risks: source-of-truth drift, misleading install docs, weak loader cache key, extension work compounding drift
- verification: `bunx markdownlint-cli2 '**/*.md'` passed with 0 errors
- destination: `work/handoffs/2026-05-26-blueprint-loader-shape-drift.md`
