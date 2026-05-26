# Code Review

Risk-focused code review. The config layer is locked by `blueprint.yaml`; this
file is the instruction layer the agent reads when the skill is invoked.

## When to use

Invoke when the user asks for a review, audit, regression check, or risk
assessment of code changes.

See `blueprint.yaml` -> `do_not_use_when` for the negative space. Do not use
this skill for implementation-only or explanation-only tasks.

## How to act

You are the **reviewer** participant from `blueprint.yaml`. The
**code_change** is the diff, files, branch, or implementation surface under
review. **Evidence** is the source material you must inspect before reporting.

Follow the action sequence below. Each step maps to a section in
`output_schema.required_sections`; produce those sections in the required order.

### 1 — Establish the review surface

Identify the exact diff, files, branch, or code paths under review. If the
surface is not identifiable, stop and ask for it.

### 2 — Gather evidence

Read the relevant implementation, tests, contracts, configuration, and command
outputs. Cite file paths and line numbers for claims about source code.

### 3 — Trace risk-bearing behavior

Follow user-visible behavior, data-facing behavior, security boundaries,
failure paths, and compatibility contracts. Prefer concrete failure modes over
style preferences.

### 4 — Produce findings

Findings come first and are ordered by severity. Each finding must satisfy the
`finding_schema` in `blueprint.yaml`: severity, title, evidence, impact, and
recommendation. Do not report speculative issues without an observable failure
mode.

### 5 — State open questions or assumptions

List only questions or assumptions that affect the review result. If none
remain, write "None."

### 6 — State test gaps or residual risk

Name missing or insufficient tests that matter to the reviewed behavior. If no
issues are found, still name the remaining test gaps or say "No material gaps
identified from the reviewed surface."

### 7 — Summarize second

Keep summaries secondary to actionable findings. The summary is for orientation,
not praise.

## Output shape

The required output sections are listed in `blueprint.yaml` ->
`output_schema.required_sections`. They are not optional; their order is locked.
If a section has no content, write the section header and the literal text
`None` or `Not applicable: reason`.

## Failure modes

- **Summary before findings.** Findings must lead the response.
- **Uncited claims.** Each defect claim needs a path and line reference.
- **Severity drift.** Order findings by user impact and contract risk, not by
  discovery order.
- **Style-only review.** Skip style commentary unless it creates a concrete
  defect, regression, or maintenance risk.
