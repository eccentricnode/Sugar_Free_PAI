# Test Fixture - Memory skill

A reusable invocation task for testing the semantic blueprint version of the
Memory skill against the plain-markdown baseline. Soft-zone target: outputs
across 5 runs should stay **on topic and evidence-bound** while allowing natural
variation in prose shape.

## Fixture invocation

```text
Use the Memory skill on this task:

What do we already know about pai-lite's memory policy, and should we add
automatic capture now? Use routing before scanning memory broadly. If durable
memory is missing, say that plainly before using specs or current context.
Only write a learning note if this request reveals a reusable signal.
```

<!--
This fixture is chosen because it exercises the hardest edge of the memory
skill: a lookup that may miss durable memory, a policy question that has nearby
answers in specs and SHAPE.md, and a tempting but usually unjustified capture
write. It tests whether the skill separates retrieved memory from current
context instead of inventing remembered state.
-->

The test is not whether the agent writes the exact same prose each time. It is
whether each run chooses a justifiable source set, reports memory misses
honestly, and avoids unnecessary durable writes.

## Test protocol (run on pi.dev)

1. Check out the semantic-blueprint branch in pi.dev.
2. Load this skill (`skills/memory/SKILL.md` plus
   `skills/memory/blueprint.yaml`).
3. Invoke the fixture exactly as written above. Do not paraphrase.
4. Capture the full output to `skills/memory/test-results/run-<NN>.md` with a
   timestamp.
5. Repeat 5 times in independent sessions (fresh context each time).
6. Optionally repeat 5 times with the baseline (plain `SKILL.md`, no
   `blueprint.yaml`) for comparison. Capture to
   `test-results/baseline-<NN>.md`.

## Success criteria

The blueprint version is judged successful if, across 5 runs:

- **On-topic rate:** the answer addresses memory policy and automatic capture
  rather than drifting into unrelated project planning.
- **Routing discipline:** routing or memory entry points are consulted before
  broad memory scanning in all 5 runs.
- **Miss handling:** absent durable memory is reported plainly when relevant.
- **Source separation:** retrieved memory, specs/shape evidence, and inference
  are distinguishable.
- **Write restraint:** no learning or memory write occurs unless the run names
  a valid trigger from the write policy.
- **Useful diversity:** prose shape can vary, but every run preserves the same
  operational boundaries.

If the baseline runs are also collected, compare:

- How many baseline runs satisfy the six criteria above?
- Where does the baseline drift? (Invented memory, broad scans, unnecessary
  capture, or mixing current-context inference with durable memory.)

## Long-term tracking

Append a row to `skills/memory/test-results/log.csv` after each set of runs
with:

- date
- branch (semantic-blueprint / baseline)
- model (pi.dev's underlying model and version)
- runs_count
- on_topic_rate
- routing_discipline_rate
- miss_handling_rate
- source_separation_rate
- write_restraint_rate
- diversity_notes

This lets the experiment hold up as models change underneath it. The blueprint
may earn its keep on today's model and become unnecessary tomorrow; the log will
show that.
