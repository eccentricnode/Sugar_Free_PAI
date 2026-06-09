# Inference Build Plan

## Status

- Created: 2026-06-09.
- Contract: `specs/09-inference.md`.
- Current loop state: live runner failure semantics complete; tool-local gate is green.

## Increments

1. [x] Establish the TypeScript test harness and mockable runner seam.
   - Add `tools/inference/tsconfig.json` confined to this tool.
   - Add the primitive entry point and local tier configuration.
   - Add a deterministic fake runner path so `bun test` performs no network work.
   - Prove default `standard` tier resolution.
   - Prove invalid tier rejection.
   - Prove non-provider-qualified model rejection before runner work.
   - Prove codex-only behavior by rejecting any Anthropic provider path.
   - Added preflight-before-prompt execution in the runner seam.
   - Added timeout and model process failure shapes in deterministic tests.
   - Added `PI_INFERENCE_LIVE=1` opt-in live harness skipped by default.
   - Gate: `bunx tsc --noEmit && bun test`.

2. [x] Add reachability preflight before real prompt execution.
   - Mirror the `memory-substrate` worker spawn shape without importing it.
   - Use `node:child_process` spawn because child env must be set directly.
   - Validate the selected provider-qualified codex model before preflight.
   - Run model reachability preflight before sending the caller prompt.
   - Prove failed preflight prevents prompt execution.
   - Gate: `bunx tsc --noEmit && bun test`.

3. [x] Complete live runner failure semantics.
   - Return trimmed plain model text on success.
   - Fail closed on timeout with no partial success.
   - Fail closed on model process failure with captured diagnostic text.
   - Keep diagnostics clear enough for live process debugging.
   - Gate: `bunx tsc --noEmit && bun test`.

4. [ ] Add opt-in live Codex verification.
   - Add a live harness skipped by default.
   - Require an explicit environment flag before any real Codex call.
   - Keep the default verification network-free and deterministic.
   - Gate: `bunx tsc --noEmit && bun test`.

5. [ ] Lock tier ordering and caller-facing contract.
   - Prove `fast`, `standard`, and `smart` select progressively higher intended cost or quality.
   - Prove `fast` is the cheapest intended tier.
   - Prove `standard` is the balanced default.
   - Prove `smart` is the highest effort tier.
   - Verify scoped prompt handling and one-shot output shape.
   - Gate: `bunx tsc --noEmit && bun test`.

## Findings

- `tools/inference/PLAN.md` was missing at loop start, so this iteration created the plan and stopped before implementation.
- Acceptance criteria prioritize backpressure: tier validation, provider-qualified codex-only model validation, preflight, timeout, and process diagnostics.
- The primitive must not depend on `memory-substrate`; only the spawn pattern should be mirrored.
- 2026-06-09: `runInference` now defaults missing tier to `standard`, validates tier/model before runner work, rejects non-`openai-codex/<model-id>` identifiers, preflights reachability before the caller prompt, trims successful output, and returns structured validation/preflight/execution failures.
- 2026-06-09: deterministic tests inject fake runners and fake live process executors; default `bun test` performs no live model call and skips the opt-in live Codex verification unless `PI_INFERENCE_LIVE=1` is set.
- 2026-06-09: tool-local gate passed from `tools/inference/`: `bunx tsc --noEmit && bun test` reported 11 pass, 1 skip, 0 fail.
- 2026-06-09: later increments mention preflight, timeout/process failure, and live opt-in work that partially landed here because the runner seam contract required complete backpressure behavior; review those increments before assigning the next worker.
- 2026-06-09: increment 2 verified the live runner mirrors the memory worker spawn pattern with injectable `node:child_process` execution, provider-qualified Codex validation happens before preflight, and a failed reachability preflight prevents the real prompt process.
- 2026-06-09: increment 3 fixed timeout handling so `timedOut: true` fails closed even when a runner or live executor reports exit code 0.
- 2026-06-09: increment 3 carries an explicit timeout bit from the live process executor, preserves captured stdout/stderr diagnostics with labels, trims successful stdout text, and keeps deterministic Codex-only/no-Anthropic coverage network-free.
- 2026-06-09: tool-local gate passed from `tools/inference/`: `bunx tsc --noEmit && bun test` reported 16 pass, 1 skip, 0 fail.
