# Test Fixture - ISA skill

A reusable invocation task for testing the semantic blueprint version of the
ISA skill against the plain-markdown baseline. Hard-zone target: outputs across
5 runs should have **low shape variance** (same sections, same artifact fields,
same destination choice, similar evidence format).

## Fixture invocation

```text
Use the ISA skill to produce a frozen handoff for this work:

We are changing a Markdown-first personal AI substrate. The current increment
added a semantic blueprint loader extension, but SHAPE.md still says Phase 1 is
extension-free. The active implementation plan says this drift is unresolved.

Evidence:

SHAPE.md:5 says the shape rejects runtime machinery and Phase 1 is
extension-free.

README.md:73 says semantic blueprints are loaded by an extension at runtime.

extensions/blueprint-loader.ts was added and scans skills/<name>/blueprint.yaml
on each turn.

IMPLEMENTATION_PLAN.md records that SHAPE.md and the extension implementation
are out of sync.

Verification:

bunx markdownlint-cli2 '**/*.md' passed after the latest documentation edits.

Produce a handoff that a future agent can use to reconcile the source-of-truth
drift without rereading the whole conversation.
```

<!--
This fixture is chosen because it exercises the hardest edge of ISA work: the
record must be useful for future resumption, must separate evidence from the
decision that still needs to be made, and must choose work/handoffs/ rather
than work/audit/ because the immediate need is cross-session continuation.
-->

The test is not whether the agent writes identical prose each time. It is
whether the **shape and rigor** of the ISA artifact are consistent across runs.

## Test protocol (run on pi.dev)

1. Check out the semantic-blueprint branch in pi.dev.
2. Load this skill (`skills/isa/SKILL.md` plus
   `skills/isa/blueprint.yaml`).
3. Invoke the fixture exactly as written above. Do not paraphrase.
4. Capture the full output to `skills/isa/test-results/run-<NN>.md` with a
   timestamp.
5. Repeat 5 times in independent sessions (fresh context each time).
6. Optionally repeat 5 times with the baseline (plain `SKILL.md`, no
   `blueprint.yaml`) for comparison. Capture to `test-results/baseline-<NN>.md`.

## Success criteria

The blueprint version is judged successful if, across 5 runs:

- **Section presence:** all 12 required sections (`artifact_type` through
  `durable_lessons`) appear in all 5 runs.
- **Artifact schema:** each artifact includes date, artifact_type, objective,
  scope, evidence, decisions, risks, verification, and destination.
- **Evidence format:** claims cite file paths with line numbers or command
  output.
- **Destination choice:** frozen handoff outputs choose `work/handoffs/` in all
  5 runs.
- **Shape variance:** the structural shape is identical across all 5 runs.

If the baseline runs are also collected, compare:

- How many baseline runs satisfy the five criteria above?
- Where does the baseline drift? (Missing sections, mixed evidence and
  decisions, wrong destination, or unverifiable handoff language.)

## Long-term tracking

Append a row to `skills/isa/test-results/log.csv` after each set of runs with:

- date
- branch (semantic-blueprint / baseline)
- model (pi.dev's underlying model and version)
- runs_count
- section_presence_rate
- artifact_schema_rate
- evidence_format_rate
- destination_choice_rate
- shape_variance_notes

This lets the experiment hold up as models change underneath it. The blueprint
may earn its keep on today's model and become unnecessary tomorrow; the log
will show that.
