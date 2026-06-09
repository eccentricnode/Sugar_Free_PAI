import { spawn } from "node:child_process";

export type InferenceTier = "fast" | "standard" | "smart";
export type RunnerCallKind = "preflight" | "prompt";
export type FailureStage = "validation" | "preflight" | "execution";

export interface TierModelConfig {
  model: string;
  rank: number;
  purpose: string;
}

export type TierConfig = Record<InferenceTier, TierModelConfig>;

export interface InferenceRequest {
  tier?: string;
  prompt: string;
  scopeInstruction?: string;
}

export interface InferenceSuccess {
  ok: true;
  tier: InferenceTier;
  model: string;
  text: string;
}

export interface InferenceFailure {
  ok: false;
  stage: FailureStage;
  tier?: InferenceTier;
  model?: string;
  error: string;
  diagnostic?: string;
  exitCode?: number;
  timedOut?: boolean;
}

export type InferenceResult = InferenceSuccess | InferenceFailure;

export interface InferenceRunnerRequest {
  kind: RunnerCallKind;
  model: string;
  prompt: string;
  timeoutMs: number;
}

export interface InferenceRunnerResult {
  code: number;
  stdout: string;
  stderr: string;
  timedOut?: boolean;
}

export interface InferenceRunner {
  run(request: InferenceRunnerRequest): Promise<InferenceRunnerResult>;
}

export interface LivePiProcessOptions {
  cwd: string;
  env: Record<string, string>;
  timeoutMs: number;
}

export interface LivePiProcessResult {
  code: number;
  stdout: string;
  stderr: string;
  killed: boolean;
}

export type LivePiProcessExecutor = (
  command: string,
  args: string[],
  options: LivePiProcessOptions,
) => Promise<LivePiProcessResult>;

export interface LiveCodexRunnerOptions {
  command?: string;
  cwd?: string;
  env?: Record<string, string | undefined>;
  timeoutMs?: number;
  process?: LivePiProcessExecutor;
}

export interface RunInferenceOptions extends LiveCodexRunnerOptions {
  runner?: InferenceRunner;
  tierConfig?: TierConfig;
}

export const LIVE_INFERENCE_ENV = "PI_INFERENCE_LIVE";
export const DEFAULT_TIMEOUT_MS = 120_000;
export const REACHABILITY_PROMPT =
  "Inference model reachability check. Reply exactly: OK";

export const DEFAULT_TIER_CONFIG: TierConfig = {
  fast: {
    model: "openai-codex/gpt-5.3-codex-spark",
    rank: 1,
    purpose: "cheapest intended tier",
  },
  standard: {
    model: "openai-codex/gpt-5.3-codex",
    rank: 2,
    purpose: "balanced default tier",
  },
  smart: {
    model: "openai-codex/gpt-5.5",
    rank: 3,
    purpose: "highest effort tier",
  },
};

const VALID_TIERS = new Set<InferenceTier>(["fast", "standard", "smart"]);
const ANTHROPIC_PATH_PATTERN = /(anthropic|claude)/i;

function isInferenceTier(value: string): value is InferenceTier {
  return VALID_TIERS.has(value as InferenceTier);
}

function outputTail(stdout = "", stderr = "", maxChars = 800): string {
  const combined = [stdout.trim(), stderr.trim()].filter(Boolean).join("\n");
  if (combined.length <= maxChars) return combined;
  return combined.slice(combined.length - maxChars);
}

function childEnv(
  requestEnv: Record<string, string | undefined> = process.env,
): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) env[key] = value;
  }
  for (const [key, value] of Object.entries(requestEnv)) {
    if (value !== undefined) env[key] = value;
  }
  return env;
}

function defaultLivePiProcessExecutor(
  command: string,
  args: string[],
  options: LivePiProcessOptions,
): Promise<LivePiProcessResult> {
  return new Promise((resolveProcess) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let settled = false;
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, options.timeoutMs);

    const finish = (result: LivePiProcessResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolveProcess(result);
    };

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", (error) => {
      finish({ code: 2, stdout, stderr: error.message, killed: timedOut });
    });
    child.on("close", (code, signal) => {
      const timeoutMessage = timedOut
        ? `inference timed out after ${options.timeoutMs}ms`
        : "";
      finish({
        code: code ?? 1,
        stdout,
        stderr: [stderr.trim(), timeoutMessage].filter(Boolean).join("\n"),
        killed: timedOut || signal !== null,
      });
    });
  });
}

export function validateCodexModel(model: string): string | undefined {
  const trimmed = model.trim();
  const slashIndex = trimmed.indexOf("/");
  const provider = slashIndex === -1 ? "" : trimmed.slice(0, slashIndex);
  const modelId = slashIndex === -1 ? trimmed : trimmed.slice(slashIndex + 1);

  if (!provider || !modelId || modelId.includes("/")) {
    return `inference model must be provider-qualified as <provider>/<model-id>: ${trimmed}`;
  }
  if (provider !== "openai-codex") {
    return `inference model provider must be openai-codex: ${trimmed}`;
  }
  if (ANTHROPIC_PATH_PATTERN.test(trimmed)) {
    return `inference model must use a Codex path, not Anthropic or Claude: ${trimmed}`;
  }
  return undefined;
}

export function liveCodexProcessArgs(model: string, prompt: string): string[] {
  return [
    "--print",
    "--no-extensions",
    "--no-context-files",
    "--no-skills",
    "--no-prompt-templates",
    "--no-session",
    "--no-tools",
    "--model",
    model,
    prompt,
  ];
}

export function createLiveCodexRunner(
  options: LiveCodexRunnerOptions = {},
): InferenceRunner {
  const command = options.command ?? "pi";
  const cwd = options.cwd ?? process.cwd();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const execProcess = options.process ?? defaultLivePiProcessExecutor;
  const env = childEnv(options.env);

  return {
    async run(request) {
      const result = await execProcess(
        command,
        liveCodexProcessArgs(request.model, request.prompt),
        {
          cwd,
          env,
          timeoutMs: request.timeoutMs,
        },
      );
      return {
        code: result.code,
        stdout: result.stdout,
        stderr: result.stderr,
        timedOut: result.killed && result.stderr.includes("timed out"),
      };
    },
  };
}

export function createDefaultInferenceRunner(
  options: LiveCodexRunnerOptions = {},
): InferenceRunner {
  const env = options.env ?? process.env;
  if (env[LIVE_INFERENCE_ENV] === "1") return createLiveCodexRunner(options);
  return {
    async run() {
      return {
        code: 1,
        stdout: "",
        stderr: `live Codex inference disabled; inject a deterministic runner or set ${LIVE_INFERENCE_ENV}=1`,
      };
    },
  };
}

function resolveTier(
  tier: string | undefined,
): { ok: true; tier: InferenceTier } | InferenceFailure {
  const selected = tier ?? "standard";
  if (isInferenceTier(selected)) return { ok: true, tier: selected };
  return {
    ok: false,
    stage: "validation",
    error: `invalid inference tier: ${selected}; expected fast, standard, or smart`,
  };
}

function renderPrompt(request: InferenceRequest): string {
  const prompt = request.prompt.trim();
  const scopeInstruction = request.scopeInstruction?.trim();
  if (!scopeInstruction) return prompt;
  return `Scope instruction:\n${scopeInstruction}\n\nPrompt:\n${prompt}`;
}

function runnerFailure(
  stage: "preflight" | "execution",
  tier: InferenceTier,
  model: string,
  result: InferenceRunnerResult,
  timeoutMs: number,
): InferenceFailure {
  const diagnostic = outputTail(result.stdout, result.stderr);
  if (result.timedOut) {
    return {
      ok: false,
      stage,
      tier,
      model,
      error: `inference ${stage} timed out after ${timeoutMs}ms`,
      diagnostic,
      exitCode: result.code,
      timedOut: true,
    };
  }
  return {
    ok: false,
    stage,
    tier,
    model,
    error:
      result.stderr.trim() ||
      (stage === "preflight"
        ? `inference model reachability preflight failed: ${model}`
        : "inference model process failed"),
    diagnostic: diagnostic || undefined,
    exitCode: result.code,
  };
}

async function runRunner(
  runner: InferenceRunner,
  request: InferenceRunnerRequest,
): Promise<InferenceRunnerResult> {
  try {
    return await runner.run(request);
  } catch (error) {
    return {
      code: 2,
      stdout: "",
      stderr: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function runInference(
  request: InferenceRequest,
  options: RunInferenceOptions = {},
): Promise<InferenceResult> {
  const tierResult = resolveTier(request.tier);
  if (!tierResult.ok) return tierResult;

  const prompt = renderPrompt(request);
  if (!prompt) {
    return {
      ok: false,
      stage: "validation",
      tier: tierResult.tier,
      error: "inference prompt must not be empty",
    };
  }

  const config = options.tierConfig ?? DEFAULT_TIER_CONFIG;
  const model = config[tierResult.tier]?.model;
  if (!model) {
    return {
      ok: false,
      stage: "validation",
      tier: tierResult.tier,
      error: `missing inference model for tier: ${tierResult.tier}`,
    };
  }

  const modelError = validateCodexModel(model);
  if (modelError) {
    return {
      ok: false,
      stage: "validation",
      tier: tierResult.tier,
      model,
      error: modelError,
    };
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const runner = options.runner ?? createDefaultInferenceRunner(options);
  const preflight = await runRunner(runner, {
    kind: "preflight",
    model,
    prompt: REACHABILITY_PROMPT,
    timeoutMs,
  });
  if (preflight.code !== 0) {
    return runnerFailure("preflight", tierResult.tier, model, preflight, timeoutMs);
  }

  const response = await runRunner(runner, {
    kind: "prompt",
    model,
    prompt,
    timeoutMs,
  });
  if (response.code !== 0) {
    return runnerFailure("execution", tierResult.tier, model, response, timeoutMs);
  }

  return {
    ok: true,
    tier: tierResult.tier,
    model,
    text: response.stdout.trim(),
  };
}
