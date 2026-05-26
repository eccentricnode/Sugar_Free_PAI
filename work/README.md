# Work Artifacts

Updated: 2026-05-26

Use when: A task creates temporary plans, audit records, or frozen handoffs
that should stay outside durable memory.

Work artifacts are task-bound. Keep ordinary status in
`IMPLEMENTATION_PLAN.md`; promote durable lessons through `learning/` or
`memory/` only when they will matter later.

## Areas

- `active/` stores short-lived working notes for current tasks.
- `audit/` stores evidence-bearing records for audit-grade work.
- `handoffs/` stores frozen summaries for another agent or future session.

## Rules

Create artifacts only when they improve resumption, auditability, or handoff
quality. Prefer concise records that separate objective, evidence, decisions,
risks, and verification outcomes.
