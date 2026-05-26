# ISA

## When To Use

Use when audit-bearing work needs a stable artifact, frozen handoff, or explicit
evidence trail across agents or sessions. This can come from Algorithm work,
multi-session resumption, multi-agent handoff, or verification evidence that a
future agent must be able to audit.

Do not use for transient notes, ordinary implementation summaries, or status
that belongs in `IMPLEMENTATION_PLAN.md`.

## Operating Rules

- Make the artifact self-contained enough for a future agent to resume.
- Separate evidence, decisions, open risks, and verification results.
- Keep the record factual; avoid ceremony that does not improve resumption or
  audit.
- Store audit-bearing artifacts under `work/audit/` and handoffs under
  `work/handoffs/`.

## Workflow

1. Define the objective and scope.
2. Record the evidence inspected.
3. Record decisions and the reasons they were defensible.
4. List unresolved risks or follow-up work.
5. Record verification commands and outcomes.

## Output Expectations

The artifact should be concise, dated, and reusable without rereading the whole
conversation.
