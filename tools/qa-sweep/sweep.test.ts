import { afterEach, describe, expect, test } from "bun:test";
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "fs";
import { tmpdir } from "os";
import { basename, join, resolve } from "path";
import { spawnSync } from "child_process";

const repoRoot = resolve(import.meta.dir, "../..");
const createdSkillDirs: string[] = [];
const createdTempDirs: string[] = [];
const createdRepoFiles: string[] = [];

afterEach(() => {
  for (const repoFile of createdRepoFiles.splice(0)) {
    rmSync(repoFile, { force: true });
  }
  for (const skillDir of createdSkillDirs.splice(0)) {
    rmSync(skillDir, { force: true, recursive: true });
  }
  for (const tempDir of createdTempDirs.splice(0)) {
    rmSync(tempDir, { force: true, recursive: true });
  }
});

function createDisposableSkill(name: string): string {
  const skillDir = join(repoRoot, "skills", name);
  createdSkillDirs.push(skillDir);
  rmSync(skillDir, { force: true, recursive: true });
  mkdirSync(skillDir, { recursive: true });
  writeFileSync(join(skillDir, ".keep"), "", { flag: "w" });
  writeFileSync(join(skillDir, "blueprint.yaml"), "name: qa-sweep-test\n");
  writeFileSync(
    join(skillDir, "test-fixture.md"),
    [
      "# Test Fixture - QA sweep disposable skill",
      "",
      "## Fixture invocation",
      "",
      "```text",
      "Use this fixture exactly.",
      "```",
      "",
      "## Long-term tracking",
      "",
      "Append a row to `skills/" + name + "/test-results/log.csv` after each set of runs with:",
      "",
      "- date",
      "- branch (semantic-blueprint / baseline)",
      "- model (pi.dev's underlying model and version)",
      "- runs_count",
      "- section_presence_rate",
      "- shape_variance_notes",
      "",
    ].join("\n"),
  );
  mkdirSync(join(skillDir, "test-results"), { recursive: true });
  writeFileSync(
    join(skillDir, "test-results", "log.csv"),
    "date,branch,model,runs_count,section_presence_rate,shape_variance_notes\n",
  );
  return skillDir;
}

function createFakePi(
  options: {
    artifactContent?: string;
    artifactPath?: string;
    failOnInvocation?: number;
    printedArtifactPath?: string;
  } = {},
): string {
  const tempDir = mkdtempSync(join(tmpdir(), "pai-lite-qa-sweep-"));
  createdTempDirs.push(tempDir);
  const fakePi = join(tempDir, "pi");
  const countFile = join(tempDir, "count");
  const failOnInvocation = options.failOnInvocation ?? 0;
  const artifactPath = options.artifactPath ?? "";
  const artifactContent = options.artifactContent ?? "";
  const printedArtifactPath = options.printedArtifactPath ?? "";
  writeFileSync(
    fakePi,
    [
      "#!/usr/bin/env bash",
      `COUNT_FILE=${JSON.stringify(countFile)}`,
      `FAIL_ON_INVOCATION=${failOnInvocation}`,
      `ARTIFACT_PATH=${JSON.stringify(artifactPath)}`,
      `ARTIFACT_CONTENT=${JSON.stringify(artifactContent)}`,
      `PRINTED_ARTIFACT_PATH=${JSON.stringify(printedArtifactPath)}`,
      "COUNT=0",
      "[ -f \"$COUNT_FILE\" ] && COUNT=$(cat \"$COUNT_FILE\")",
      "COUNT=$((COUNT + 1))",
      "printf '%s\\n' \"$COUNT\" > \"$COUNT_FILE\"",
      "printf 'fake pi args: %s\\n' \"$*\"",
      "printf 'fake pi invocation: %s\\n' \"$COUNT\"",
      "printf 'fake pi prompt: %s\\n' \"${@: -1}\"",
      "if [ -n \"$ARTIFACT_PATH\" ]; then",
      "  mkdir -p \"$(dirname \"$ARTIFACT_PATH\")\"",
      "  printf '%s\\n' \"$ARTIFACT_CONTENT\" > \"$ARTIFACT_PATH\"",
      "  printf 'Created artifact: %s\\n' \"$ARTIFACT_PATH\"",
      "fi",
      "if [ -n \"$PRINTED_ARTIFACT_PATH\" ]; then",
      "  printf 'Created artifact: %s\\n' \"$PRINTED_ARTIFACT_PATH\"",
      "fi",
      "if [ \"$COUNT\" -eq \"$FAIL_ON_INVOCATION\" ]; then",
      "  printf 'fake pi failure on invocation %s\\n' \"$COUNT\" >&2",
      "  exit 17",
      "fi",
    ].join("\n"),
    { mode: 0o755 },
  );
  return tempDir;
}

describe("QA sweep run-set capture", () => {
  test("default sweep writes one five-run run set with manifest and metadata", () => {
    const skillName = `qa-sweep-test-${process.pid}`;
    const skillDir = createDisposableSkill(skillName);
    const legacyRunFile = join(skillDir, "test-results", "run-01.md");
    mkdirSync(join(skillDir, "test-results"), { recursive: true });
    writeFileSync(legacyRunFile, "old flat run output\n");
    const fakePiDir = createFakePi();

    const result = spawnSync("bash", ["_qa-sweep.sh", skillName], {
      cwd: repoRoot,
      env: {
        ...process.env,
        PATH: `${fakePiDir}:${process.env.PATH ?? ""}`,
      },
      encoding: "utf8",
    });

    expect(result.status).toBe(0);

    const runsRoot = join(repoRoot, "skills", skillName, "test-results", "runs");
    const runSets = readdirSorted(runsRoot);
    expect(runSets).toHaveLength(1);

    const runSetId = runSets[0];
    expect(runSetId).toBeDefined();
    const runSetDir = join(runsRoot, runSetId);
    const runFiles = readdirSorted(runSetDir).filter((name) =>
      /^run-\d\d\.md$/.test(name),
    );

    expect(runFiles).toEqual([
      "run-01.md",
      "run-02.md",
      "run-03.md",
      "run-04.md",
      "run-05.md",
    ]);
    expect(readFileSync(legacyRunFile, "utf8")).toBe("old flat run output\n");

    const manifest = readFileSync(join(runSetDir, "manifest.csv"), "utf8");
    expect(manifest.split("\n")[0]).toContain(
      "run_set_id,skill,fixture_path,run_number,requested_count",
    );
    const manifestRows = manifest.trimEnd().split("\n").slice(1);
    expect(manifestRows).toHaveLength(5);
    expect(manifestRows.every((row) => row.startsWith(`"${runSetId}",`))).toBe(true);
    const firstManifestRow = parseCsvRow(manifestRows[0]);

    const runBody = readFileSync(join(runSetDir, "run-01.md"), "utf8");
    expect(runBody).toContain("run_set_id: " + runSetId);
    expect(runBody).toContain("skill: " + skillName);
    expect(runBody).toContain("fixture_path: skills/" + skillName + "/test-fixture.md");
    expect(runBody).toContain("run_number: 1");
    expect(runBody).toContain("requested_count: 5");
    expect(runBody).toContain("provider: openai-codex");
    expect(runBody).toContain("model: gpt-5.5");
    expect(runBody).toContain("invocation_mode: pi -p --no-session --no-context-files");
    expect(runBody).toContain("exit_status: 0");
    expect(runBody).toContain("## Raw model output");
    expect(runBody).toContain("fake pi prompt: Use this fixture exactly.");

    const log = readFileSync(join(skillDir, "test-results", "log.csv"), "utf8");
    const logLines = log.trimEnd().split("\n");
    expect(logLines).toHaveLength(2);
    expect(logLines[0]).toBe(
      "date,branch,model,runs_count,section_presence_rate,shape_variance_notes",
    );
    const logRow = parseCsvRow(logLines[1]);
    expect(logRow[1]).toBe(firstManifestRow[8]);
    expect(logRow[2]).toBe(firstManifestRow[7]);
    expect(logRow[3]).toBe("5");
    expect(logRow[4]).toBe("unscored");
    expect(logRow[5]).toContain(`run_set_id=${runSetId}`);
    expect(logRow[5]).toContain(`head=${firstManifestRow[9]}`);
  });

  test("failed invocation is captured but does not stop later runs", () => {
    const skillName = `qa-sweep-failure-test-${process.pid}`;
    createDisposableSkill(skillName);
    const fakePiDir = createFakePi({ failOnInvocation: 2 });

    const result = spawnSync("bash", ["_qa-sweep.sh", skillName, "3"], {
      cwd: repoRoot,
      env: {
        ...process.env,
        PATH: `${fakePiDir}:${process.env.PATH ?? ""}`,
      },
      encoding: "utf8",
    });

    expect(result.status).toBe(1);

    const runsRoot = join(repoRoot, "skills", skillName, "test-results", "runs");
    const runSets = readdirSorted(runsRoot);
    expect(runSets).toHaveLength(1);

    const runSetDir = join(runsRoot, runSets[0]);
    const runFiles = readdirSorted(runSetDir).filter((name) =>
      /^run-\d\d\.md$/.test(name),
    );
    expect(runFiles).toEqual(["run-01.md", "run-02.md", "run-03.md"]);

    const manifest = readFileSync(join(runSetDir, "manifest.csv"), "utf8");
    const manifestRows = manifest.trimEnd().split("\n").slice(1);
    expect(manifestRows).toHaveLength(3);
    expect(manifestRows[0].endsWith(',"0"')).toBe(true);
    expect(manifestRows[1].endsWith(',"17"')).toBe(true);
    expect(manifestRows[2].endsWith(',"0"')).toBe(true);

    const failedRun = readFileSync(join(runSetDir, "run-02.md"), "utf8");
    expect(failedRun).toContain("exit_status: 17");
    expect(failedRun).toContain("fake pi invocation: 2");
    expect(failedRun).toContain("fake pi failure on invocation 2");

    const laterRun = readFileSync(join(runSetDir, "run-03.md"), "utf8");
    expect(laterRun).toContain("exit_status: 0");
    expect(laterRun).toContain("fake pi invocation: 3");

    const log = readFileSync(
      join(repoRoot, "skills", skillName, "test-results", "log.csv"),
      "utf8",
    );
    const logLines = log.trimEnd().split("\n");
    expect(logLines).toHaveLength(2);
    expect(parseCsvRow(logLines[1])[5]).toContain(`run_set_id=${runSets[0]}`);
  });

  test("tracking row append is idempotent for a rechecked run set", () => {
    const skillName = `qa-sweep-log-idempotent-test-${process.pid}`;
    const skillDir = createDisposableSkill(skillName);
    const fakePiDir = createFakePi();
    const fixedRunSetId = `fixed-run-set-${process.pid}`;
    const logFile = join(skillDir, "test-results", "log.csv");
    writeFileSync(
      logFile,
      [
        "date,branch,model,runs_count,section_presence_rate,shape_variance_notes",
        `"2026-06-11","main","gpt-5.5","1","unscored","unscored; run_set_id=${fixedRunSetId}; head=existing"`,
        "",
      ].join("\n"),
    );

    const result = spawnSync("bash", ["_qa-sweep.sh", skillName, "1"], {
      cwd: repoRoot,
      env: {
        ...process.env,
        PAILITE_QA_SWEEP_RUN_SET_ID: fixedRunSetId,
        PATH: `${fakePiDir}:${process.env.PATH ?? ""}`,
      },
      encoding: "utf8",
    });

    expect(result.status).toBe(0);
    const logLines = readFileSync(logFile, "utf8").trimEnd().split("\n");
    expect(logLines).toHaveLength(2);
    expect(
      logLines.filter((line) => line.includes(`run_set_id=${fixedRunSetId}`)),
    ).toHaveLength(1);
  });

  test("present named artifact is captured as run-set evidence", () => {
    const skillName = `qa-sweep-artifact-test-${process.pid}`;
    createDisposableSkill(skillName);
    const artifactPath = `work/handoffs/qa-sweep-artifact-${process.pid}.md`;
    createdRepoFiles.push(join(repoRoot, artifactPath));
    const fakePiDir = createFakePi({
      artifactPath,
      artifactContent: [
        "artifact_type: frozen_handoff",
        "objective: prove artifact body is captured",
        "destination: " + artifactPath,
      ].join("\n"),
    });

    const result = spawnSync("bash", ["_qa-sweep.sh", skillName, "1"], {
      cwd: repoRoot,
      env: {
        ...process.env,
        PATH: `${fakePiDir}:${process.env.PATH ?? ""}`,
      },
      encoding: "utf8",
    });

    expect(result.status).toBe(0);

    const runSetDir = onlyRunSetDir(skillName);
    const artifactManifest = readFileSync(
      join(runSetDir, "artifact-manifest.csv"),
      "utf8",
    );
    expect(artifactManifest).toContain(artifactPath);
    expect(artifactManifest).toContain(',"present",');

    const artifactReport = readFileSync(join(runSetDir, "artifact-report.md"), "utf8");
    expect(artifactReport).toContain("- " + artifactPath);
    expect(artifactReport).toContain("No missing artifact paths detected.");

    const evidenceDir = join(runSetDir, "artifacts", "run-01");
    const evidenceFiles = readdirSorted(evidenceDir);
    expect(evidenceFiles).toHaveLength(1);
    const evidence = readFileSync(join(evidenceDir, evidenceFiles[0]), "utf8");
    expect(evidence).toContain("status: present");
    expect(evidence).toContain("artifact_type: frozen_handoff");
    expect(evidence).toContain("objective: prove artifact body is captured");

    const runOutput = readFileSync(join(runSetDir, "run-01.md"), "utf8");
    expect(runOutput).toContain("Created artifact: " + artifactPath);
    expect(runOutput).not.toContain("artifact_type: frozen_handoff");
  });

  test("missing named artifact is recorded and fails the sweep", () => {
    const skillName = `qa-sweep-missing-artifact-test-${process.pid}`;
    createDisposableSkill(skillName);
    const artifactPath = `work/handoffs/qa-sweep-missing-${process.pid}.md`;
    const fakePiDir = createFakePi({ printedArtifactPath: artifactPath });

    const result = spawnSync("bash", ["_qa-sweep.sh", skillName, "1"], {
      cwd: repoRoot,
      env: {
        ...process.env,
        PATH: `${fakePiDir}:${process.env.PATH ?? ""}`,
      },
      encoding: "utf8",
    });

    expect(result.status).toBe(1);

    const runSetDir = onlyRunSetDir(skillName);
    const artifactManifest = readFileSync(
      join(runSetDir, "artifact-manifest.csv"),
      "utf8",
    );
    expect(artifactManifest).toContain(artifactPath);
    expect(artifactManifest).toContain(',"missing",');

    const artifactReport = readFileSync(join(runSetDir, "artifact-report.md"), "utf8");
    expect(artifactReport).toContain("## Expected artifact paths");
    expect(artifactReport).toContain("- " + artifactPath);
    expect(artifactReport).toContain("## Missing artifact paths");
    expect(artifactReport).toContain("- " + artifactPath);

    const evidenceDir = join(runSetDir, "artifacts", "run-01");
    const evidenceFiles = readdirSorted(evidenceDir);
    expect(evidenceFiles).toHaveLength(1);
    const evidence = readFileSync(join(evidenceDir, evidenceFiles[0]), "utf8");
    expect(evidence).toContain("# Missing Artifact");
    expect(evidence).toContain("status: missing");
  });
});

function readdirSorted(path: string): string[] {
  return readdirSync(path).sort((a, b) => basename(a).localeCompare(basename(b)));
}

function onlyRunSetDir(skillName: string): string {
  const runsRoot = join(repoRoot, "skills", skillName, "test-results", "runs");
  const runSets = readdirSorted(runsRoot);
  expect(runSets).toHaveLength(1);
  return join(runsRoot, runSets[0]);
}

function parseCsvRow(row: string): string[] {
  expect(row.startsWith('"')).toBe(true);
  expect(row.endsWith('"')).toBe(true);
  return row
    .slice(1, -1)
    .split('","')
    .map((value) => value.replaceAll('""', '"'));
}
