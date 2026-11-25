# Setup — Create Learning Plan + Progress

Instructions for setting up a new topic for Socratic teaching. Run this when a topic folder has no Learning Plan or Progress file yet.

## 1. Discover the learning journey

First check the user-provided or agreed learning workspace for an existing plan/progress pair. If found, resume it instead of creating a duplicate. Never treat unrelated plans elsewhere in the repository as the learner's plan.

For a new journey, determine which input path applies:

**Path A: Source material exists** — Read the materials the learner supplied or explicitly pointed to. Extract concepts, prerequisites, and assumed knowledge. Do not claim to have read material that was not accessible.

**Path B: Topic only** — Build a curriculum from general knowledge, scoped to the learner's goal. Ask only for missing essentials: intended outcome (e.g. project, interview, practical task), current baseline, and important constraints or preferences. If these are already stated, don't ask them again.

Both paths produce a Learning Plan and a Progress file in a learner-approved journey workspace.

## 2. Extract or build concepts

**Path A (from material):** Read all provided source files. Identify:
- Core concepts — the distinct ideas or skills being taught
- Dependencies — which concepts require understanding of others first
- Assumed knowledge — what the material assumes you already know

**Path B (from topic):** Use the learner's stated topic, goal, baseline, and constraints. Ask a concise follow-up only for missing information, then build a curriculum of core concepts with dependencies, scoped to their outcome.

## 3. Sequence

Order concepts so that:
- Prerequisites come before things that depend on them
- Concrete/intuitive concepts come before abstract ones
- Each concept builds on the last

## 4. Draft the Learning Plan for review

Draft `Learning_Plan_[TopicName].md` content using the format below. Before creating or overwriting files, show the plan to the learner and invite corrections. Check that it has concrete concepts, prerequisite ordering, practical application, and observable exit criteria. Adjust it to learner feedback.

Use this format for the draft; do not save it yet:

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

## 5. Confirm destination, then create the journey files

After the learner approves the plan, confirm the journey folder/workspace and filenames. Never choose an ambiguous save location or overwrite an existing plan without explicit agreement. Create `Learning_Plan_[TopicName].md` and `Progress_[TopicName].md` together in that folder. The progress file is initialized from the approved concept sequence.

Use this format for the Progress file:

```markdown
# Progress: [Topic Name]

**Last session:** Not started
**Status:** Not started

## Concepts

| # | Concept | Status | Weak areas | Date |
|---|---------|--------|------------|------|
| 1 | [Name]  | Not started | — | — |
| ...

## Session Log

[Empty until first session.]
```

## 6. Confirm the learner's journey

Present the approved plan and progress file summary. Confirm that the folder and filenames are correct and ask whether the learner wants to begin now or pause. On later sessions, update the same progress tracker with the date, concepts covered, which of the four exit criteria passed or remain weak, and the next concept. Do not mark a concept complete unless the learner demonstrates the criteria in `Tools/Method.md`.
