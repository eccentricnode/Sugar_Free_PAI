import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	blueprintRoots,
	discoverBlueprints,
	resolveUserspace,
} from "./blueprint-loader.ts";

const tmp: string[] = [];
afterEach(() => {
	for (const d of tmp.splice(0)) rmSync(d, { force: true, recursive: true });
});

function tempRoot(): string {
	const d = mkdtempSync(join(tmpdir(), "sugar-free-pai-bp-"));
	tmp.push(d);
	return d;
}

/** Write skills/<name>/blueprint.yaml under root, returning the root. */
function withSkill(root: string, name: string, body: string): string {
	const dir = join(root, "skills", name);
	mkdirSync(dir, { recursive: true });
	writeFileSync(join(dir, "blueprint.yaml"), body);
	return root;
}

describe("resolveUserspace", () => {
	test("returns undefined when unset or blank", () => {
		expect(resolveUserspace({})).toBeUndefined();
		expect(resolveUserspace({ SUGARFREEPAI_USERSPACE: "   " })).toBeUndefined();
	});
	test("resolves a registered path to absolute", () => {
		const r = resolveUserspace({ SUGARFREEPAI_USERSPACE: "/tmp/userspace" });
		expect(r).toBe("/tmp/userspace");
	});
	test("keeps legacy PAILITE_USERSPACE as a fallback", () => {
		const r = resolveUserspace({ PAILITE_USERSPACE: "/tmp/legacy-userspace" });
		expect(r).toBe("/tmp/legacy-userspace");
	});
});

describe("blueprintRoots precedence", () => {
	test("userspace > workspace > package, highest first", () => {
		const roots = blueprintRoots({
			cwd: "/work",
			userspace: "/user",
			packageRoot: "/pkg",
		});
		expect(roots.map((r) => r.label)).toEqual(["userspace", "workspace", "package (defaults)"]);
		expect(roots[0]?.dir).toBe("/user/skills");
	});

	test("omits userspace when not registered", () => {
		const roots = blueprintRoots({ cwd: "/work", packageRoot: "/pkg" });
		expect(roots.map((r) => r.label)).toEqual(["workspace", "package (defaults)"]);
	});

	test("collapses duplicate resolved paths (cwd === package)", () => {
		const roots = blueprintRoots({ cwd: "/same", packageRoot: "/same" });
		expect(roots).toHaveLength(1);
	});
});

describe("discoverBlueprints shadow-by-name", () => {
	test("userspace shadows the same-named package skill", () => {
		const userspace = withSkill(tempRoot(), "memory", "scene_goal: USER version");
		const pkg = withSkill(tempRoot(), "memory", "scene_goal: PACKAGE version");

		const found = discoverBlueprints(
			blueprintRoots({ cwd: tempRoot(), userspace, packageRoot: pkg }),
		);

		const memory = found.find((b) => b.skill === "memory");
		expect(memory?.source).toBe("userspace");
		expect(memory?.content).toContain("USER version");
		// Only one entry per skill name — no duplicate from the shadowed package.
		expect(found.filter((b) => b.skill === "memory")).toHaveLength(1);
	});

	test("non-overlapping skills from all roots are unioned", () => {
		const userspace = withSkill(tempRoot(), "research", "scene_goal: user-only");
		const pkg = withSkill(tempRoot(), "isa", "scene_goal: pkg-only");
		const cwd = withSkill(tempRoot(), "code-review", "scene_goal: workspace-only");

		const found = discoverBlueprints(
			blueprintRoots({ cwd, userspace, packageRoot: pkg }),
		);

		expect(found.map((b) => b.skill)).toEqual(["code-review", "isa", "research"]);
	});

	test("backward compatible: no userspace falls back to workspace + package", () => {
		const cwd = withSkill(tempRoot(), "memory", "scene_goal: workspace wins over package");
		const pkg = withSkill(tempRoot(), "memory", "scene_goal: package default");

		const found = discoverBlueprints(blueprintRoots({ cwd, packageRoot: pkg }));
		expect(found.find((b) => b.skill === "memory")?.source).toBe("workspace");
	});
});
