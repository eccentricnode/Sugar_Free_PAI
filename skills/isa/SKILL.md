---
name: isa
description: Stable audit and handoff artifacts. Use when audit-bearing work needs a durable artifact, a frozen handoff between agents or sessions, or an explicit evidence trail. Produces ISA documents that survive context loss. Config layer locked by blueprint.yaml.
---

# ISA

Stable audit and handoff artifacts. The config layer is locked by
`blueprint.yaml`; this file is the instruction layer the agent reads when the
skill is invoked.

## When to use

Use when audit-bearing work needs a stable artifact, frozen handoff, or explicit
evidence trail across agents or sessions. This can come from Algorithm work,
multi-session resumption, multi-agent handoff, or verification evidence that a
future agent must be able to audit.

See `blueprint.yaml` -> `do_not_use_when` for the negative space. Do not use
this skill for transient notes, ordinary implementation summaries, or status
that belongs in `IMPLEMENTATION_PLAN.md`.

## How to act

You are the **recorder** participant from `blueprint.yaml`. The
**audit_work** is the task, handoff, verification result, or resumption surface
that needs a stable record. **Evidence** is the source material you must
preserve before writing the artifact.

Follow the action sequence below. Each step maps to a section in
`output_schema.required_sections`; produce those sections in the required
order.

### 1 - Classify the artifact type

State whether the artifact is an audit record or frozen handoff. If neither
type has future resumption, audit, or handoff value, stop and do not create an
ISA artifact.

### 2 - Define objective and scope

State the objective in one sentence. Define what is in scope and out of scope
so a future agent knows where to resume without rereading the conversation.

### 3 - Gather evidence inspected

Record concrete evidence before conclusions. Use file paths with line numbers
or command output for implementation, verification, and source claims.

### 4 - Record decisions

List each decision with the rationale that made it defensible. Keep decisions
separate from evidence and unresolved risks.

### 5 - State implementation state

Describe what changed, what remains untouched, and what is intentionally
deferred. If the artifact is review-only, say so.

### 6 - Record verification results

Record each command or check, observed signal, and status. If verification was
not run, state why and do not imply coverage.

### 7 - List unresolved risks

Separate risks from next actions. Risks are unknowns or unverified behavior;
next actions are the concrete follow-up steps.

### 8 - Choose destination and reuse conditions

Store audit-bearing artifacts under `work/audit/` and handoffs under
`work/handoffs/`. State when the artifact should be reused.

### 9 - Check durable lessons

Distill durable lessons into `learning/inbox.md` only when the work meets the
named-trigger threshold: new decision, repeated workflow, correction received,
or plainly reusable signal.

## Output shape

The required output sections are listed in `blueprint.yaml` ->
`output_schema.required_sections`. They are not optional; their order is
locked. If a section has no content, write the section header and the literal
text `None` or `Not applicable: reason`.

## Failure modes

- **Ceremony without reuse value.** Do not create an ISA artifact for ordinary
  progress notes or one-off summaries.
- **Mixed evidence and decisions.** Keep source observations, decisions,
  risks, and next actions in separate sections.
- **Unverifiable handoff.** A future agent needs file paths, commands, and
  observed results, not vague statements like "mostly done."
- **Wrong destination.** Use `work/audit/` for audit records and
  `work/handoffs/` for frozen handoffs.
