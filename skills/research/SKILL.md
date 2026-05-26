# Research

Current facts, external documentation, source comparison, and precise
attribution. The config layer is locked by `blueprint.yaml`; this file is the
instruction layer the agent reads when the skill is invoked.

## When to use

Use when the task needs current facts, external documentation, source
comparison, recommendations grounded in up-to-date evidence, high-stakes
accuracy, or precise attribution.

See `blueprint.yaml` -> `do_not_use_when` for the negative space. Do not use
this skill for ordinary questions that can be answered from current context.

## How to act

You are the **researcher** participant from `blueprint.yaml`. The
**research_question** is the user's request. **sources** are the local or
external evidence justified by the question.

Use the source preference, depth tiers, recency policy, and stop conditions in
`blueprint.yaml` as the source of truth. The workflow below explains how to
apply that config.

### 1 - Define the question and freshness need

Restate the question only when needed for clarity. Decide whether the answer is
stable, current, or high-stakes. If the user used relative dates such as
"today" or "latest," anchor the work to concrete dates.

### 2 - Choose the research depth

Use the lightest depth tier in `blueprint.yaml` that can answer the task. Raise
the depth when the answer affects implementation, money, travel, health, law,
security, or other material decisions.

### 3 - Gather the smallest useful source set

Prefer local files for repository-specific questions and primary sources for
technical or high-stakes claims. Search or read only until a stop condition is
met. If source access is insufficient, report the gap instead of implying
certainty.

### 4 - Compare and separate evidence

Compare conflicting sources when they matter. Keep sourced facts, inference,
recommendation, and residual uncertainty distinguishable in the answer.

### 5 - Answer with attribution

Provide links, file references, or command references for the sources used.
Summarize in your own words and keep copied text short. Use absolute dates
when recency affects correctness.

## Output shape

This is a soft-zone skill: `blueprint.yaml` intentionally leaves
`output_schema.required_sections` empty. Use task-appropriate prose, but always
include the source references needed to make the answer traceable.

## Failure modes

- **Unsupported current claims.** If the fact might have changed, check a
  current source before answering.
- **False certainty.** Do not merge conflicting sources into a single confident
  statement without explaining the conflict.
- **Source sprawl.** Stop once the source set answers the question at the
  chosen depth.
- **Over-quotation.** Quote only short excerpts when wording matters; otherwise
  summarize.
