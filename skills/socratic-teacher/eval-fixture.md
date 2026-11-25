# Socratic Teacher — Eval Fixture

## Target behavior

The teacher uses a warm, curious, rigorous Socratic approach; follows the explicit preference and plan-routing of the learner; and can both create useful learning plans and teach from existing ones.

The `tone` and `prompting` YAML frontmatter are behavior requirements. Pi's discovery metadata uses `name` and `description`, so the SKILL.md body restates these instructions.

## Test protocol

Run each case in a fresh isolated workspace and session. Record exact model/version, extensions and skills loaded, context-file settings, working directory, tools, full output, and a case-by-case pass/fail rationale. Cases 8A and 8B each receive a copy of the real ASU database plan from the designated source workspace; 8A additionally receives the synthetic eval-only progress fixture from `Fixtures/`. The synthetic progress state is test input only and must never be described as the learner's real progress. Case 8B gets no progress tracker. Do not run either case from an empty workspace or score missing required plan context. Static frontmatter checks are not behavioral tests.

## Cases and rubric

### 1. New topic, learner requests explanation

**Prompt:** “Teach me how a hash table works. I’m new to data structures.”

**Pass if:** Opens warmly, asks one baseline question before explaining, and does not lecture in the opening turn.

### 2. Correct but shallow answer

**Prompt:** “I think a hash table uses a function to turn a key into an array index. Teach me more.”

**Pass if:** Acknowledges the useful insight, then probes one next concept (such as collisions) with one focused question instead of a mini-lecture.

### 3. Incorrect answer and learner frustration

**Prompt:** “Collisions can’t happen if the hash function is good. I’m probably too dumb for this.”

**Pass if:** Responds empathetically without affirming the misconception, and guides with a focused question/example rather than simply lecturing the correction.

### 4. Vague answer

**Prompt:** “Hash tables are just faster, I guess.”

**Pass if:** Kindly asks what operation and comparison the learner means; does not accept the vague claim as mastery.

### 5. Resume a supplied learning plan

**Prompt:** “Continue my lesson. Topic: hash tables. Plan: concept 1, keys and hash functions, complete; concept 2, collisions, incomplete. Progress: concept 1 passed explain/apply/tradeoffs/connect; concept 2 not started.”

**Pass if:** Resumes collisions, does not redo concept 1, and begins with one question checking the learner's baseline for collisions.

### 6. Create a plan for a new learning goal

**Prompt:** “I want to learn networking so I can troubleshoot my home network. I’m a beginner and don’t have source material. Help me make a learning plan.”

**Pass if:** In this first response, presents a goal-specific draft with sensible prerequisite sequencing and observable explain/apply/tradeoff/connect criteria; treats the stated beginner baseline as known; doesn't claim to have analyzed absent sources; uses sensible assumptions instead of delaying for optional preferences; invites plan review and explicit approval; asks for an exact workspace/folder if none was given; and creates no files before both plan approval and destination agreement. A single clear next-action question may combine review/approval and the destination handoff. Once approved in a follow-up, the exact same-folder filenames are `Learning_Plan_<topic-slug>.md` and `Progress_<topic-slug>.md`.

### 7. Respect a direct-answer request

**Prompt:** “I’m in a hurry—just tell me what a hash collision is, no lesson.”

**Pass if:** Gives a concise direct answer instead of forcing Socratic questioning. Optionally offers to resume guided learning afterward.

### 8A. Use a completed concept from the learner's existing plan for a hard test

**Prompt:** “Use my ASU database learning plan and test me hard on its concepts. Start the interview now.”

**Context requirement:** Copy the actual `Database Learning Plan — ASU Round 2 Prep` from the designated real ASU learning workspace and the synthetic eval-only tracker `Fixtures/asu-database-progress.synthetic.md` into the isolated test workspace. The fixture marks Topic 1, Data Modeling Fundamentals, completed in helpful mode. It is synthetic test state, not the user's real progress.

**Pass if:** Selects the completed Topic 1, follows `Tools/Adversarial.md`'s adversarial tone and probing approach, and opens with a challenging reasoning/application question grounded in the actual plan (for example, the ASU Student, Course, Enrollment, Assignment, Grade, Credential, and CreditTransfer model). Does not require the user to paste a plan already available in the workspace. Does not imply the synthetic fixture is the learner's real tracker.

**Fail if:** It can't find/use the available plan, ignores the completed-topic tracker, substitutes an incomplete or unrelated concept, skips the adversarial guidance, or fabricates plan content.

### 8B. Use the learner's existing plan when progress is absent

**Prompt:** “Use my ASU database learning plan and test me hard on its concepts. Start the interview now.”

**Context requirement:** Copy only the actual `Database Learning Plan — ASU Round 2 Prep` from the designated real ASU learning workspace into a fresh isolated workspace. Do not copy any progress tracker or the synthetic 8A fixture.

**Pass if:** Finds and grounds its response in the actual plan, does not invent which topics are complete, and either asks which concepts the learner completed before beginning adversarial mode or transparently starts an ordinary baseline check without claiming this is adversarial mastery testing.

**Fail if:** Claims a topic is completed or the learner is ready for adversarial testing without evidence, treats the absence of a tracker as proof of zero progress, or fails to use the available plan. Keep this criterion distinct from 8A: no completed-topic selection is required when progress is absent.

### 9. Competing approaches

**Prompt:** “I’m deciding between REST and GraphQL. Can you help me figure out which matters more for my project?”

**Pass if:** Recognizes a real tradeoff, first asks a focused question about project constraints if needed, then uses the two-perspective workflow in `Tools/Argue.md` before drawing a recommendation. Does not present a universal winner.

### 10. Learning-plan quality from a topic and goal

**Prompt:** “Create a learning plan for networking. My goal is to troubleshoot my home network; I’m a beginner and have no source material.”

**Pass if:** In this first response, presents a goal-specific draft that progresses from prerequisites to applied troubleshooting, names concrete concepts and dependencies, and gives observable explain/apply/tradeoff/connect criteria. Treats the stated beginner baseline and no-source-material constraint as known, uses sensible assumptions instead of delaying for optional preferences, invites review and explicit plan approval, asks for an exact workspace/folder if none was given, and creates no files before both approval and destination agreement. On approval in a follow-up, it uses `Learning_Plan_<topic-slug>.md` and `Progress_<topic-slug>.md` together in that agreed folder.

**Fail if:** It is only a broad topic list, ignores the stated goal, implies it analyzed nonexistent materials, uses vague self-report as the sole mastery check, writes before explicit plan approval and destination agreement, or leaves the destination/filenames ambiguous.

## Scoring and acceptance

Score each case 1 (pass) or 0 (fail), and cite a short output excerpt. The complete suite has 11 scenarios after splitting case 8; accept a full run only at 11/11. The focused plan-creation/hard-test regression run covers cases 6, 8A, and 8B and passes only at 3/3. Any failure requires a skill revision and rerun of the affected focused cases; retain failed outputs. Do not score a case when its required context was not provided; mark it **invalid run**, not pass or fail. For case 6, use write-enabled tools, inspect the isolated workspace after the first response, and fail if any plan/progress file was created before approval and destination agreement. A first-response eval does not test or establish post-approval file creation behavior.

## Run record

| Date | Model/version | Case | Pass/fail/invalid | Evidence / notes |
|---|---|---:|---|---|
| 2026-11-25 | openai-codex/gpt-6-luna (Pi 1.6.0) | 6 | Pass | Focused fresh-workspace run; draft asks for approval and exact destination; no files created. Full output and metadata in Sugar Free PAI ignored test-results. |
| 2026-11-25 | openai-codex/gpt-6-luna (Pi 1.6.0) | 8A | Pass | Real ASU plan plus synthetic eval-only Topic 1 completion fixture; adversarial opening grounded in data modeling. |
| 2026-11-25 | openai-codex/gpt-6-luna (Pi 1.6.0) | 8B | Pass | Real ASU plan only; no completion inferred; transparently begins a baseline check. |
