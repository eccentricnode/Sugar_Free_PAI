---
name: algorithm
description: Audit-bearing reasoning discipline with ISC and frozen handoffs. Use when a task is audit-bearing, requires stable handoff across agents or sessions, or when the user explicitly asks for Algorithm, ISC, or audit discipline. Config layer locked by blueprint.yaml.
---

# Algorithm

Audit-bearing reasoning discipline. The config layer is locked by `blueprint.yaml`; this file is the instruction layer the agent reads when the skill is invoked.

## When to use

Invoke when one of the following is true:
- The user explicitly asks for Algorithm, ISC, audit discipline, or a frozen handoff.
- The task is audit-bearing — a third party will review the reasoning record.
- Multiple agents need a stable handoff and the cross-session continuity matters.

See `blueprint.yaml` → `do_not_use_when` for the negative space. Do not silently activate from task complexity.

## How to act

You are the **reasoner** participant from `blueprint.yaml`. The **task** is what the user gave you. **Evidence** is the source material you must gather before planning.

Follow the action sequence below. Each step maps to a section in `output_schema.required_sections` — produce the section at the moment the step concludes, not later.

### 1 — Objective and audit boundary

State the objective in one sentence. State the audit boundary explicitly: what is in scope for ISC, what is out of scope. If the audit boundary cannot be drawn cleanly, stop and ask the user.

### 2 — Evidence required

List the concrete artifacts you will read or commands you will run before planning. Format: file path with line number, or exact command. No prose substitutes for evidence.

### 3 — Plan

Plan the smallest defensible sequence that produces the postcondition (`action_to_complete.postconditions`). Each plan step must be checkable against evidence — no plan step that says "review carefully."

### 4 — Execution

Execute or direct execution. Capture each step's actual output, not your expectation of it.

### 5 — Verification

Verify against the evidence stated in step 2. Each criterion must be observable. If a criterion cannot be verified, mark it `[DEFERRED-VERIFY]` and explain why — do not silently skip.

### 6 — ISC record

Produce the ISC record only if it will be reused, audited, or handed off. The record must satisfy `output_schema.acceptance_criteria`:
- Every claim has a citation or evidence reference.
- The audit boundary is stated explicitly.
- Verification is observable, not a vibe assessment.

### 7 — Durable lessons

Distill durable lessons into `learning/inbox.md` if the work produced a reusable pattern. Use the named-trigger threshold (new decision, repeated workflow, correction received) — do not auto-write generic notes.

## Output shape

The required output sections are listed in `blueprint.yaml` → `output_schema.required_sections`. They are not optional; their order is not negotiable. If a section has no content because the step legitimately produced nothing, write the section header and the literal text "Not applicable: <reason>."

## Failure modes

- **Skipping evidence in step 2.** If you cannot list concrete artifacts before planning, you are not ready to plan. Stop and gather evidence first.
- **Vibe verification in step 5.** "Looks right" is not verification. Cite the command output or file contents.
- **Recording an ISC for a task that will not be reused.** ISC is for audit-bearing work. Skip step 6 when the task is one-off and the audit boundary is empty.
- **Writing durable lessons from generic observations.** The named-trigger threshold exists to keep `learning/inbox.md` signal-dense.
