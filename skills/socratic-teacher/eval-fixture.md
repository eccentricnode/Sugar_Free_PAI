# Socratic Teacher — Eval Fixture

## Target behavior

The teacher uses a warm, curious, rigorous Socratic approach; follows the explicit preference and plan-routing of the learner; and can both create useful learning plans and teach from existing ones.

The `tone` and `prompting` YAML frontmatter are behavior requirements. Pi's discovery metadata uses `name` and `description`, so the SKILL.md body restates these instructions.

## Test protocol

Run each case in a fresh session. Record exact model/version, extensions and skills loaded, context-file settings, working directory, full output, and a case-by-case pass/fail rationale. For case 8, the real ASU learning workspace must be available. An empty directory is not a valid test of finding that existing plan. Static frontmatter checks are not behavioral tests.

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

**Pass if:** Presents a goal-specific draft with sensible prerequisite sequencing and observable explain/apply/tradeoff/connect criteria; treats the stated beginner baseline as known; doesn't claim to have analyzed absent sources; invites plan review and explicit approval; asks for an exact workspace/folder if none was given; and creates no files before both plan approval and destination agreement. Once approved in a follow-up, the exact same-folder filenames are `Learning_Plan_<topic-slug>.md` and `Progress_<topic-slug>.md`.

### 7. Respect a direct-answer request

**Prompt:** “I’m in a hurry—just tell me what a hash collision is, no lesson.”

**Pass if:** Gives a concise direct answer instead of forcing Socratic questioning. Optionally offers to resume guided learning afterward.

### 8. Use the learner's existing plan for a hard test

**Prompt:** “Use my ASU database learning plan and test me hard on its concepts. Start the interview now.”

**Context requirement:** The user's actual ASU database learning workspace must be available to the run.

**Pass if:** Uses concepts from that actual plan, follows `Tools/Adversarial.md`, and starts with a challenging reasoning/application question grounded in a plan concept. Does not require the user to paste a plan the assistant can access.

**Fail if:** It can't find/use the available plan, substitutes unrelated concepts, or fabricates plan content. This case must not be run from an empty workspace and then scored as plan retrieval.

### 9. Competing approaches

**Prompt:** “I’m deciding between REST and GraphQL. Can you help me figure out which matters more for my project?”

**Pass if:** Recognizes a real tradeoff, first asks a focused question about project constraints if needed, then uses the two-perspective workflow in `Tools/Argue.md` before drawing a recommendation. Does not present a universal winner.

### 10. Learning-plan quality from a topic and goal

**Prompt:** “Create a learning plan for networking. My goal is to troubleshoot my home network; I’m a beginner and have no source material.”

**Pass if:** Presents a goal-specific draft that progresses from prerequisites to applied troubleshooting, names concrete concepts and dependencies, and gives observable explain/apply/tradeoff/connect criteria. Treats the stated beginner baseline and no-source-material constraint as known, invites review and explicit plan approval, asks for an exact workspace/folder if none was given, and creates no files before both approval and destination agreement. On approval in a follow-up, it uses `Learning_Plan_<topic-slug>.md` and `Progress_<topic-slug>.md` together in that agreed folder.

**Fail if:** It is only a broad topic list, ignores the stated goal, implies it analyzed nonexistent materials, uses vague self-report as the sole mastery check, writes before explicit plan approval and destination agreement, or leaves the destination/filenames ambiguous.

## Scoring and acceptance

Score each case 1 (pass) or 0 (fail), and cite a short output excerpt. Accept only at 10/10. Any failure requires a skill revision and rerun; retain failed outputs. Do not score a case when its required context was not provided (especially case 8); mark it **invalid run**, not pass or fail.

## Run record

| Date | Model/version | Case | Pass/fail/invalid | Evidence / notes |
|---|---|---:|---|---|
