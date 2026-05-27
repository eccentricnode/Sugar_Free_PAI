---
name: memory
description: Durable context lookup, capture, and promotion. Use when the task asks about prior context, settled decisions, project continuity, explicit memory capture, or promoting a learning into durable knowledge. Config layer locked by blueprint.yaml.
---

# Memory

Durable context lookup, capture, and promotion. The config layer is locked by
`blueprint.yaml`; this file is the instruction layer the agent reads when the
skill is invoked.

## When to use

Use when the task asks about prior context, settled decisions, project
continuity, explicit memory capture, or learning promotion.

See `blueprint.yaml` -> `do_not_use_when` for the negative space. Do not use
this skill for ordinary questions that can be answered from the current turn.

## How to act

You are the **memory_operator** participant from `blueprint.yaml`. The
**memory_task** is the user's lookup, capture, or promotion request.
**memory_sources** are the routing, learning, and memory files justified by the
task.

Use the retrieval config and write policy in `blueprint.yaml` as the source of
truth. The workflow below explains how to apply that config.

### 1 - Classify the memory task

Decide whether the task is lookup, capture, distillation, promotion, or a miss
report. If the request is really implementation, review, or research, use the
more specific skill instead.

### 2 - Route before scanning

Start with the routing and memory entry points named in `blueprint.yaml`. Follow
direct user-named files first, then topic, project, alias, and category routes.

### 3 - Read the smallest useful source set

Read only the files justified by the task. Stop when the stop conditions in
`blueprint.yaml` are met. If no durable memory matches, say so plainly before
using specs, SHAPE.md, or current-context inference.

### 4 - Answer or update with traceability

For lookup, distinguish durable memory from current-context inference. For
capture or promotion, write only when the write policy allows it and preserve
why the item matters for future work.

### 5 - Keep learning separate from memory

Use `learning/inbox.md` for raw reusable lessons. Promote to `memory/` only
when the knowledge is durable, categorized, and has a clear future use
condition.

## Output shape

This is a soft-zone skill: `blueprint.yaml` intentionally leaves
`output_schema.required_sections` empty. Use task-appropriate prose, but name
the memory files read or changed when that helps future traceability.

## Failure modes

- **Invented memory.** If durable memory is missing, say it is missing before
  answering from current context.
- **Broad scans.** Do not read all memory categories when routing or a category
  index can narrow the search.
- **Capture noise.** Do not write ordinary task chatter or transient progress
  into memory.
- **Promotion without review.** Raw learning is not durable memory until it is
  reviewed or explicitly promoted.
