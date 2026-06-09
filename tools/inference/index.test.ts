import { describe, expect, test } from "bun:test";
import {
  DEFAULT_TIER_CONFIG,
  LIVE_INFERENCE_ENV,
  REACHABILITY_PROMPT,
  createLiveCodexRunner,
  liveCodexProcessArgs,
  runInference,
  validateCodexModel,
  type InferenceRunner,
  type InferenceRunnerRequest,
  type InferenceRunnerResult,
  type LivePiProcessExecutor,
  type TierConfig,
} from "./index.ts";

function tierConfigWith(model: string): TierConfig {
  return {
    ...DEFAULT_TIER_CONFIG,
    standard: {
      ...DEFAULT_TIER_CONFIG.standard,
      model,
    },
  };
}

function recordingRunner(
  decide: (request: InferenceRunnerRequest) => InferenceRunnerResult,
): InferenceRunner & { calls: InferenceRunnerRequest[] } {
  const calls: InferenceRunnerRequest[] = [];
  return {
    calls,
    async run(request) {
      calls.push(request);
      return decide(request);
    },
  };
}

describe("tier resolution and Codex model validation", () => {
  test("uses standard when the caller omits a tier", async () => {
    const runner = recordingRunner((request) => ({
      code: 0,
      stdout: request.kind === "prompt" ? "  standard text  \n" : "OK",
      stderr: "",
    }));

    const result = await runInference({ prompt: "answer this" }, { runner });

    expect(result).toEqual({
      ok: true,
      tier: "standard",
      model: DEFAULT_TIER_CONFIG.standard.model,
      text: "standard text",
    });
    expect(runner.calls.map((call) => call.kind)).toEqual(["preflight", "prompt"]);
    expect(runner.calls[0]?.model).toBe(DEFAULT_TIER_CONFIG.standard.model);
  });

  test("rejects an invalid tier before runner work", async () => {
    const runner = recordingRunner(() => ({
      code: 0,
      stdout: "should not run",
      stderr: "",
    }));

    const result = await runInference(
      { tier: "premium", prompt: "answer this" },
      { runner },
    );

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({
      stage: "validation",
      error: "invalid inference tier: premium; expected fast, standard, or smart",
    });
    expect(runner.calls).toHaveLength(0);
  });

  test("rejects non-provider-qualified models before runner work", async () => {
    const runner = recordingRunner(() => ({
      code: 0,
      stdout: "should not run",
      stderr: "",
    }));

    const result = await runInference(
      { prompt: "answer this" },
      {
        runner,
        tierConfig: tierConfigWith("gpt-5.3-codex-spark"),
      },
    );

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({
      stage: "validation",
      error:
        "inference model must be provider-qualified as <provider>/<model-id>: gpt-5.3-codex-spark",
    });
    expect(runner.calls).toHaveLength(0);
  });

  test("is codex-only and rejects Anthropic or Claude paths", async () => {
    for (const tier of ["fast", "standard", "smart"] as const) {
      const model = DEFAULT_TIER_CONFIG[tier].model;
      expect(model.startsWith("openai-codex/")).toBe(true);
      expect(model).not.toMatch(/anthropic|claude/i);
      expect(validateCodexModel(model)).toBeUndefined();
    }

    expect(validateCodexModel("anthropic/claude-haiku-4-5")).toContain(
      "openai-codex",
    );
    expect(validateCodexModel("openai-codex/claude-haiku-4-5")).toContain(
      "not Anthropic or Claude",
    );

    const runner = recordingRunner(() => ({
      code: 0,
      stdout: "should not run",
      stderr: "",
    }));
    const result = await runInference(
      { prompt: "answer this" },
      {
        runner,
        tierConfig: tierConfigWith("anthropic/claude-haiku-4-5"),
      },
    );

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ stage: "validation" });
    expect(runner.calls).toHaveLength(0);
  });
});

describe("backpressure-first runner behavior", () => {
  test("preflights reachability before the real prompt", async () => {
    const runner = recordingRunner((request) => ({
      code: 0,
      stdout: request.kind === "preflight" ? "OK" : "answer",
      stderr: "",
    }));

    const result = await runInference(
      { tier: "fast", prompt: "real prompt" },
      { runner, timeoutMs: 50 },
    );

    expect(result.ok).toBe(true);
    expect(runner.calls).toHaveLength(2);
    expect(runner.calls[0]).toMatchObject({
      kind: "preflight",
      model: DEFAULT_TIER_CONFIG.fast.model,
      prompt: REACHABILITY_PROMPT,
    });
    expect(runner.calls[1]).toMatchObject({
      kind: "prompt",
      model: DEFAULT_TIER_CONFIG.fast.model,
      prompt: "real prompt",
    });
  });

  test("failed preflight prevents the real prompt from running", async () => {
    const runner = recordingRunner(() => ({
      code: 7,
      stdout: "",
      stderr: "model unreachable",
    }));

    const result = await runInference({ prompt: "real prompt" }, { runner });

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({
      stage: "preflight",
      exitCode: 7,
      error: "model unreachable",
    });
    expect(runner.calls).toHaveLength(1);
    expect(runner.calls[0]?.prompt).toBe(REACHABILITY_PROMPT);
  });

  test("timeout returns failure with no partial success", async () => {
    const runner = recordingRunner((request) => ({
      code: request.kind === "preflight" ? 0 : 1,
      stdout: request.kind === "preflight" ? "OK" : "partial text",
      stderr: request.kind === "preflight" ? "" : "timed out",
      timedOut: request.kind === "prompt",
    }));

    const result = await runInference(
      { prompt: "real prompt" },
      { runner, timeoutMs: 25 },
    );

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({
      stage: "execution",
      timedOut: true,
      error: "inference execution timed out after 25ms",
    });
    expect("text" in result).toBe(false);
    if (result.ok) throw new Error("expected timeout failure");
    expect(result.diagnostic).toContain("partial text");
  });

  test("model process failure returns captured diagnostic text", async () => {
    const runner = recordingRunner((request) => ({
      code: request.kind === "preflight" ? 0 : 9,
      stdout: request.kind === "preflight" ? "OK" : "partial output",
      stderr: request.kind === "preflight" ? "" : "model crashed",
    }));

    const result = await runInference({ prompt: "real prompt" }, { runner });

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({
      stage: "execution",
      exitCode: 9,
      error: "model crashed",
    });
    if (result.ok) throw new Error("expected process failure");
    expect(result.diagnostic).toContain("partial output");
    expect(result.diagnostic).toContain("model crashed");
  });

  test("scope instruction is included in the one-shot prompt", async () => {
    const runner = recordingRunner((request) => ({
      code: 0,
      stdout: request.kind === "preflight" ? "OK" : "scoped answer",
      stderr: "",
    }));

    const result = await runInference(
      {
        prompt: "Summarize it.",
        scopeInstruction: "Only use project files.",
      },
      { runner },
    );

    expect(result.ok).toBe(true);
    expect(runner.calls[1]?.prompt).toBe(
      "Scope instruction:\nOnly use project files.\n\nPrompt:\nSummarize it.",
    );
  });
});

describe("live Codex runner seam", () => {
  test("default runner is disabled unless live inference is explicitly enabled", async () => {
    const result = await runInference(
      { prompt: "This should not reach a live model." },
      { env: { [LIVE_INFERENCE_ENV]: "0" } },
    );

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({
      stage: "preflight",
      error: `live Codex inference disabled; inject a deterministic runner or set ${LIVE_INFERENCE_ENV}=1`,
    });
  });

  test("live runner uses pi no-tools Codex process args through an injectable executor", async () => {
    const calls: Array<{
      command: string;
      args: string[];
      timeoutMs: number;
      env: Record<string, string>;
    }> = [];
    const process: LivePiProcessExecutor = async (command, args, options) => {
      calls.push({
        command,
        args,
        timeoutMs: options.timeoutMs,
        env: options.env,
      });
      return { code: 0, stdout: "OK", stderr: "", killed: false };
    };
    const runner = createLiveCodexRunner({
      command: "pi",
      cwd: "/tmp",
      env: { [LIVE_INFERENCE_ENV]: "1", CUSTOM_ENV: "yes" },
      process,
      timeoutMs: 50,
    });

    const result = await runInference(
      { tier: "fast", prompt: "real prompt" },
      { runner, timeoutMs: 50 },
    );

    expect(result.ok).toBe(true);
    expect(calls).toHaveLength(2);
    expect(calls[0]?.command).toBe("pi");
    expect(calls[0]?.args).toEqual(
      liveCodexProcessArgs(DEFAULT_TIER_CONFIG.fast.model, REACHABILITY_PROMPT),
    );
    expect(calls[1]?.args).toEqual(
      liveCodexProcessArgs(DEFAULT_TIER_CONFIG.fast.model, "real prompt"),
    );
    expect(calls[0]?.args.join("\n")).not.toMatch(/anthropic|claude/i);
    expect(calls[0]?.env.CUSTOM_ENV).toBe("yes");
    expect(calls[0]?.timeoutMs).toBe(50);
  });

  test("live runner preflight failure prevents the prompt process", async () => {
    const calls: Array<{
      command: string;
      args: string[];
    }> = [];
    const process: LivePiProcessExecutor = async (command, args) => {
      calls.push({ command, args });
      return {
        code: 4,
        stdout: "",
        stderr: "codex model is unreachable",
        killed: false,
      };
    };
    const runner = createLiveCodexRunner({
      command: "pi",
      cwd: "/tmp",
      env: { [LIVE_INFERENCE_ENV]: "1" },
      process,
      timeoutMs: 50,
    });

    const result = await runInference(
      { tier: "smart", prompt: "real prompt" },
      { runner, timeoutMs: 50 },
    );

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({
      stage: "preflight",
      exitCode: 4,
      error: "codex model is unreachable",
    });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.args).toEqual(
      liveCodexProcessArgs(DEFAULT_TIER_CONFIG.smart.model, REACHABILITY_PROMPT),
    );
    expect(calls[0]?.args.join("\n")).not.toMatch(/anthropic|claude/i);
  });
});

const liveTest = process.env[LIVE_INFERENCE_ENV] === "1" ? test : test.skip;

liveTest("opt-in live Codex verification", async () => {
  const result = await runInference({
    tier: "fast",
    prompt: "Reply exactly: OK",
  });

  expect(result.ok).toBe(true);
  if (result.ok) expect(result.text).toContain("OK");
});
