# Setup — Create Learning Plan + Progress

Instructions for setting up a new topic for Socratic teaching. Run this when a topic folder has no Learning Plan or Progress file yet.

## Determine Input Type

**Path A: Source material exists** — There are .md files (lessons, articles, transcripts) in the topic folder. Read them all, then extract concepts from that material.

**Path B: Topic only, no material** — The folder is empty or the learner just named a subject. Build a curriculum from your own knowledge. Ask the learner what their goal is (interview prep, general understanding, building something specific) so the plan can be shaped toward that outcome.

Both paths produce the same output: a Learning Plan and a Progress file.

## Step 1: Extract or Build Concepts

**Path A (from material):** Read all source files. Identify:
- Core concepts — the distinct ideas or skills being taught
- Dependencies — which concepts require understanding of others first
- Assumed knowledge — what the material assumes you already know

**Path B (from topic):** Ask the learner:
- What's the topic?
- What's the goal? (interview, project, general understanding)
- What do you already know? (so we skip basics or start from scratch)

Then build a curriculum of core concepts with dependencies, scoped to their goal.

## Step 2: Sequence

Order concepts so that:
- Prerequisites come before things that depend on them
- Concrete/intuitive concepts come before abstract ones
- Each concept builds on the last

## Step 3: Write Learning_Plan_[TopicName].md

Save in the topic folder. Use this format:

```markdown
# Learning Plan: [Topic Name]

**Source:** [material analyzed / AI-generated curriculum / both]
**Goal:** [what the learner is trying to achieve]
**Concepts:** [total count]
**Assumed knowledge:** [what this plan expects you already know]

## Concept Sequence

### 1. [Concept Name]
**Core idea:** [one sentence]
**Why it matters:** [how it connects to the bigger picture]
**Exit criteria:**
- Explain: [what they should be able to explain]
- Apply: [scenario they should be able to handle]
- Tradeoffs: [what tradeoff they should articulate]
- Connect: [link to another concept in this plan]

### 2. [Concept Name]
**Depends on:** [prior concept(s)]
**Core idea:** ...
**Exit criteria:** ...

[...continue for all concepts...]

## Gaps
- [Important related concepts not covered — potential extensions]
```

## Step 4: Write Progress_[TopicName].md

Create alongside the learning plan, in the same topic folder. Use this format:

```markdown
# Progress: [Topic Name]

**Last session:** [date]
**Status:** Not started

## Concepts

| # | Concept | Status | Weak areas | Date |
|---|---------|--------|------------|------|
| 1 | [Name]  | Not started | — | — |
| 2 | [Name]  | Not started | — | — |
| ...

## Session Log

[Empty until first session. After each session, add:]
### [Date]
- Covered: [concepts worked on]
- Completed: [concepts that met all 4 exit criteria]
- Weak: [concepts or specific criteria that need revisit]
- Next: [where to pick up]
```

## Step 5: Confirm With Learner

Present the learning plan. Ask:
1. Does the sequence make sense?
2. Anything to skip (already known)?
3. Anything to add?
4. Ready to start?

Adjust based on feedback before starting any teaching.
