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

afterEach(() => {
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
    ].join("\n"),
  );
  return skillDir;
}

function createFakePi(options: { failOnInvocation?: number } = {}): string {
  const tempDir = mkdtempSync(join(tmpdir(), "pai-lite-qa-sweep-"));
  createdTempDirs.push(tempDir);
  const fakePi = join(tempDir, "pi");
  const countFile = join(tempDir, "count");
  const failOnInvocation = options.failOnInvocation ?? 0;
  writeFileSync(
    fakePi,
    [
      "#!/usr/bin/env bash",
      `COUNT_FILE=${JSON.stringify(countFile)}`,
      `FAIL_ON_INVOCATION=${failOnInvocation}`,
      "COUNT=0",
      "[ -f \"$COUNT_FILE\" ] && COUNT=$(cat \"$COUNT_FILE\")",
      "COUNT=$((COUNT + 1))",
      "printf '%s\\n' \"$COUNT\" > \"$COUNT_FILE\"",
      "printf 'fake pi args: %s\\n' \"$*\"",
      "printf 'fake pi invocation: %s\\n' \"$COUNT\"",
      "printf 'fake pi prompt: %s\\n' \"${@: -1}\"",
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
  });
});

function readdirSorted(path: string): string[] {
  return readdirSync(path).sort((a, b) => basename(a).localeCompare(basename(b)));
}
