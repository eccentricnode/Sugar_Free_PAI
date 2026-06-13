# JTBD — pi-native Inference primitive (port of PAI `TOOLS/Inference.ts`)

For Ralph `specs` mode: read this + the referenced source, then emit `specs/NN-*.md`.

## Why this one first

Usage evidence (observability `tool-activity.jsonl`): `Inference.ts` is the
**most-invoked PAI tool — 89 runs**, ahead of everything else. It's also the
*dependency* under the next ports (research sub-agent, context search, harvest,
learning distillation all make scoped model calls). Port it first; the rest lean
on it.

## What PAI's tool does (reference — read it)

- Source: `~/.claude/PAI/TOOLS/Inference.ts`. CLI contract: `bun TOOLS/Inference.ts fast|standard|smart`.
- It's the sanctioned model-call primitive: PAI rule is "use `Inference.ts`, never
  import `@anthropic-ai/sdk` directly." Three effort/cost tiers (fast / standard / smart).

## The port (target)

A pi-native inference primitive that makes a **scoped, one-shot model call** at a
chosen tier and returns text — the building block skills/tools/sub-agents call
instead of wiring their own model plumbing.

- **Substrate:** codex / pi models (NOT Anthropic — account policy; same HARD RULE
  as the memory worker). Provider-qualified model ids.
- **Reference implementation to mirror:** `../memory-substrate/adapters/pi-dev/extension/worker.ts`
  already spawns a scoped codex sub-process (provider-qualified model, preflight,
  `node:child_process` because `pi.exec` can't set child env). The inference
  primitive is that spawn logic, generalized and tier-parameterized.
- **Tiers → models:** fast / standard / smart map to three codex model/effort
  settings (the spec decides exact ids; e.g. a cheap spark model for `fast`,
  higher reasoning effort for `smart`).
- **Home:** a Sugar Free PAI tool (`tools/inference/`). It is a *parallel* use of the
  codex-spawn pattern, not a dependency on memory-substrate — so no cross-repo
  coupling. (If the spec finds the spawn logic is worth sharing, flag it; don't
  force it.)

## Jobs to be done

- A skill/tool/sub-agent can run `inference(tier, prompt)` and get text back,
  without importing a model SDK or re-implementing spawn/auth/preflight.
- Tier selection trades cost vs quality (fast for cheap classification, smart for
  hard reasoning) — same ergonomics as PAI's three tiers.
- It fails closed and clearly on bad/unreachable model (mirror the worker's
  provider-qualified validation + reachability preflight).

## Backpressure (so Ralph build has a gate)

- Mockable model call (inject a fake runner, as the worker tests do) → deterministic
  `bun test`: tier→model resolution, provider-qualified validation, error paths.
- Opt-in live test (real codex call) behind an env flag, skipped by default.
- `bunx tsc --noEmit && bun test` green.

## Out of scope

- Anthropic models. Streaming/multi-turn (one-shot only for v1). Embeddings/ranking
  (that's the MemoryRetriever/BM25 line). The other ports (context-search, learning,
  content) — separate specs after this.
