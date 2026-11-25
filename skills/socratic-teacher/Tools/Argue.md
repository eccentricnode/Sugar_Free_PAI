# Argue — Two-Perspective Debate on Topic Ideas

Uses PAI's Council skill to run a structured debate about contested ideas in the material. Two perspectives argue, a tribunal synthesizes, the Learning Plan gets updated if priorities shift.

## When To Use

- Two concepts in the material conflict and the student needs clarity on which matters more
- Student asks "what should I actually focus on here?"
- Learning Plan has a concept whose importance is genuinely debatable
- After Adversarial mode surfaces a recurring gap tied to a contested idea

## How To Run It

### Step 1: Frame the debate question
Must be contestable — not "what is X" but "which of X or Y matters more for someone trying to [student's goal from Learning Plan]?" or "is A worth learning deeply or is B more important first?"

### Step 2: Invoke Council
Run the Council skill with the Debate workflow, passing:
- The debate question
- The student's goal (from Learning_Plan)
- Relevant context from the source material

```
Council: [debate question]
Context: Student is learning [topic] to [goal from Learning Plan].
Relevant material: [paste key excerpts or concept descriptions]
```

Council runs 3 rounds of structured debate between domain-expert agents and produces a synthesis.

### Step 3: Update the Learning Plan
If the Council synthesis changes what should be prioritized, update `Learning_Plan_[TopicName].md` — reorder concepts, adjust exit criteria, or add a note flagging the tension.

## Anti-Patterns

- Don't debate definitions — "what is X" has an answer, not a debate
- Don't run Argue on every concept — only when genuine tension exists in the material
- Don't skip Step 3 — a debate that doesn't update the plan produced no value
