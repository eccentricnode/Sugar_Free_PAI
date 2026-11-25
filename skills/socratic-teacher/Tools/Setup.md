# Setup — Create Learning Plan + Progress

Instructions for setting up a new topic for Socratic teaching. Run this when a topic folder has no Learning Plan or Progress file yet.

## 1. Discover the learning journey

First check the user-provided or agreed learning workspace for an existing plan/progress pair. If found, resume it instead of creating a duplicate. Never treat unrelated plans elsewhere in the repository as the learner's plan.

For a new journey, determine which input path applies. In either path, establish
the learner's intended outcome, current baseline, and important constraints or
preferences when they are missing. Do not ask again for details already given.
If the goal, baseline, and source-material path are already clear enough to make
a useful draft, use sensible defaults for optional details such as weekly time
or preferred study format and state those assumptions. Do not substitute a
preliminary preferences question for the requested first draft.

**Path A: Source material exists** — Read the materials the learner supplied or explicitly pointed to. Extract concepts, prerequisites, and assumed knowledge. Shape the selection and depth around the learner's goal and baseline. Do not claim to have read material that was not accessible.

**Path B: Topic only** — Build a curriculum from general knowledge, scoped to the learner's goal. Ask only for missing essentials: intended outcome (e.g. project, interview, practical task), current baseline, and important constraints or preferences.

Both paths produce a Learning Plan and a Progress file in a learner-approved journey workspace.

## 2. Extract or build concepts

**Path A (from material):** Read all provided source files. Identify:
- Core concepts — the distinct ideas or skills being taught
- Dependencies — which concepts require understanding of others first
- Assumed knowledge — what the material assumes you already know

**Path B (from topic):** Use the learner's stated topic, goal, baseline, and constraints. Ask a concise follow-up only for missing information, then build a curriculum of core concepts with dependencies, scoped to their outcome.

## 3. Sequence

Build a goal-relevant curriculum and order concepts so that:
- Prerequisites come before things that depend on them
- Concrete/intuitive concepts come before abstract ones
- Each concept builds on the last

## 4. Present the Learning Plan for review

Prepare the plan content using the format below, then show the complete plan in the conversation and invite corrections. This is a draft for review, not a file write. Check that its concepts serve the stated goal, prerequisites are ordered, applications are practical, and every exit criterion is observable in the learner's answers or work (not just self-reported confidence). Each concept should retain explain, apply, tradeoff, and connect criteria. Revise it to learner feedback and present the revised plan for approval. In this same draft response, make the next action explicit: ask the learner to review and approve (or request changes to) the plan, and, if they have not supplied a destination, ask which exact workspace/folder should hold the plan and progress files. A single focused next-action question may combine plan approval/review and destination handoff. Do not write either file in this turn.

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

## 5. Get approval for the plan and exact destination, then create the journey files

Do not write either file until the learner has explicitly approved the displayed plan and agreed to the exact destination. If the learner has not named a destination, ask which workspace or folder to use; never assume a universal workspace path. State the resolved folder and both exact filenames and get agreement before writing. Use this naming convention in the agreed folder: `Learning_Plan_<topic-slug>.md` and `Progress_<topic-slug>.md` (lowercase topic slug, hyphen-separated). Keep both files together. If either filename already exists, stop and ask whether to resume/update that journey or choose another slug or folder; never overwrite it as a new plan. Initialize progress from the approved concept sequence and include a relative link to the learning plan, for example `[Learning Plan](Learning_Plan_<topic-slug>.md)`.

Use this format for the Progress file:

```markdown
# Progress: [Topic Name]

**Last session:** Not started
**Status:** Not started
**Learning plan:** [Learning_Plan_<topic-slug>.md](Learning_Plan_<topic-slug>.md)

## Concepts

| # | Concept | Status | Weak areas | Date |
|---|---------|--------|------------|------|
| 1 | [Name]  | Not started | — | — |
| ...

## Session Log

[Empty until first session.]
```

## 6. Confirm the learner's journey

After writing, report the exact folder and filenames and link the progress tracker to the plan (and the plan back to progress, where practical). Ask whether the learner wants to begin now or pause. On later sessions, resume only this agreed pair (or a pair the learner explicitly supplies), follow the plan's next incomplete concept, and update the same progress tracker with the date, concepts covered, which of the four exit criteria passed or remain weak, and the next concept. Keep progress linked to the plan with a relative link; when priorities or the sequence change, update the plan and tracker together. Do not mark a concept complete unless the learner demonstrates the criteria in `Tools/Method.md`.
