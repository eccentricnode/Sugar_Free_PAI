# Verifier First

Evidence-first implementation and review. The config layer is locked by
`blueprint.yaml`; this file is the instruction layer the agent reads when the
skill is invoked.

## When to use

Invoke when a task requires evidence before implementation, when tests define
the behavior, when the cost of a wrong change is high, or when the user asks for
verification before accepting a result.

See `blueprint.yaml` -> `do_not_use_when` for the negative space. Do not use
this skill for explanation-only tasks or work with no observable evidence
surface.

## How to act

You are the **verifier** participant from `blueprint.yaml`. The
**target_behavior** is the behavior, defect, contract, or risky change under
inspection. **Evidence** is the source material you must gather before editing
or accepting the result.

Follow the action sequence below. Each step maps to a section in
`output_schema.required_sections`; produce those sections in the required order.

### 1 - Name the target behavior

State the behavior to prove or disprove. If the behavior cannot be observed,
stop and ask for a narrower target.

### 2 - Gather the evidence surface

Read relevant specs, source contracts, tests, fixtures, configuration, and
command outputs before editing. Prefer existing verification over assumptions.
Cite file paths with line numbers for source claims.

### 3 - Plan verification first

Define the focused checks that can prove the intended behavior. Use existing
tests when they cover the behavior; add or update focused verification when the
behavior changes and no check exists.

### 4 - State falsification criteria

Name what would disprove success before acting. A criterion can be a failing
test, mismatched command output, broken source contract, missing fixture
coverage, or an unresolved contradiction in the evidence.

### 5 - Implement or review the smallest complete change

Act only after the evidence surface and falsification criteria are clear. Keep
the change scoped to the target behavior. If the task is review-only, evaluate
against the same criteria instead of editing.

### 6 - Run focused verification

Run the smallest commands or checks that exercise the changed or accepted
behavior. Report each result using the `verification_result_schema` in
`blueprint.yaml`: command_or_check, expected_signal, observed_signal, and
status.

### 7 - Record residual risk and lessons

Treat unrelated failures as real findings unless clearly outside the change.
Name unverified behavior plainly. Record durable lessons only when the workflow
creates a reusable signal under the learning threshold.

## Output shape

The required output sections are listed in `blueprint.yaml` ->
`output_schema.required_sections`. They are not optional; their order is locked.
If a section has no content, write the section header and the literal text
`None` or `Not applicable: reason`.

## Failure modes

- **Editing before evidence.** Gather the evidence surface before changing or
  accepting behavior.
- **Untestable success criteria.** "Works" is not a criterion. State what would
  falsify the result.
- **Verification by summary.** Cite the command output, test result, fixture, or
  source contract that proves the behavior.
- **Overclaiming coverage.** If focused checks do not cover adjacent behavior,
  report that as residual risk.
