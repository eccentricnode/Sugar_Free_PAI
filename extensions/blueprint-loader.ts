/**
 * blueprint-loader — pai-lite extension for pi.
 *
 * On every agent turn, scans package-local and workspace `skills/` directories
 * for `blueprint.yaml` sibling files (Rothman semantic blueprint pattern:
 * Level 5 deterministic config). Injects the discovered blueprints into the
 * system prompt under a stable header so the agent has the config layer
 * alongside the SKILL.md instruction layer.
 *
 * Convention: a blueprint lives at `skills/<name>/blueprint.yaml`. The file is
 * read as-is — no parsing, no validation. The model consumes it directly as
 * structured config.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const EXTENSION_DIR = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = dirname(EXTENSION_DIR);

const BLUEPRINT_HEADER = `# Skill Blueprints (deterministic config layer)

The following YAML blueprints accompany the SKILL.md instruction files already
loaded. Each blueprint locks the deterministic surface of its skill: scene_goal,
participants (Agent/Patient/Source per Semantic Role Labeling), action_to_complete
with pre/postconditions, output_schema, and runtime config. When you invoke a
skill, honor its blueprint's output_schema.required_sections and
acceptance_criteria. Do not paraphrase the schema; produce sections in the exact
order specified.`;

interface BlueprintRoot {
	label: string;
	dir: string;
}

interface DiscoveredBlueprint {
	skill: string;
	source: string;
	path: string;
	content: string;
}

interface RenderedBlueprints {
	text: string;
	count: number;
}

function blueprintRoots(cwd: string): BlueprintRoot[] {
	const candidates: BlueprintRoot[] = [
		{ label: "workspace", dir: join(cwd, "skills") },
		{ label: "pai-lite package", dir: join(PACKAGE_ROOT, "skills") },
	];

	const seen = new Set<string>();
	const roots: BlueprintRoot[] = [];
	for (const root of candidates) {
		const dir = resolve(root.dir);
		if (seen.has(dir)) continue;
		seen.add(dir);
		roots.push({ ...root, dir });
	}
	return roots;
}

function discoverBlueprintsInRoot(root: BlueprintRoot): DiscoveredBlueprint[] {
	if (!existsSync(root.dir)) return [];
	const found: DiscoveredBlueprint[] = [];
	let entries: string[];
	try {
		entries = readdirSync(root.dir).sort((a, b) => a.localeCompare(b));
	} catch {
		return [];
	}

	for (const entry of entries) {
		const skillPath = join(root.dir, entry);
		let s;
		try {
			s = statSync(skillPath);
		} catch {
			continue;
		}
		if (!s.isDirectory()) continue;

		const bpPath = join(skillPath, "blueprint.yaml");
		if (!existsSync(bpPath)) continue;
		try {
			const content = readFileSync(bpPath, "utf-8");
			found.push({ skill: entry, source: root.label, path: bpPath, content });
		} catch {
			// Silent: extension must not crash the session over a single bad file.
		}
	}
	return found;
}

function discoverBlueprints(cwd: string): DiscoveredBlueprint[] {
	const bySkill = new Map<string, DiscoveredBlueprint>();
	for (const blueprint of blueprintRoots(cwd).flatMap(discoverBlueprintsInRoot)) {
		if (!bySkill.has(blueprint.skill)) bySkill.set(blueprint.skill, blueprint);
	}
	return Array.from(bySkill.values()).sort(
		(a, b) =>
			a.skill.localeCompare(b.skill) ||
			a.source.localeCompare(b.source) ||
			a.path.localeCompare(b.path),
	);
}

function cacheKeyFor(blueprints: DiscoveredBlueprint[]): string {
	const hash = createHash("sha256");
	for (const b of blueprints) {
		hash.update(b.source).update("\0");
		hash.update(b.path).update("\0");
		hash.update(b.content).update("\0");
	}
	return hash.digest("hex");
}

function renderBlueprints(blueprints: DiscoveredBlueprint[]): string {
	if (blueprints.length === 0) return "";
	const sections = blueprints.map(
		(b) =>
			`## skill: ${b.skill}\nsource: ${b.source}\n\n\`\`\`yaml\n${b.content.trim()}\n\`\`\``,
	);
	return `${BLUEPRINT_HEADER}\n\n${sections.join("\n\n")}`;
}

function appendToSystemPrompt(systemPrompt: string, addition: string): string {
	if (!addition) return systemPrompt;
	const base = systemPrompt.trimEnd();
	return base ? `${base}\n\n${addition}` : addition;
}

export default function (pi: ExtensionAPI) {
	let cached: RenderedBlueprints | undefined;
	let cacheKey: string | undefined;

	function refresh(cwd: string): RenderedBlueprints {
		const blueprints = discoverBlueprints(cwd);
		const key = cacheKeyFor(blueprints);
		if (key === cacheKey && cached !== undefined) return cached;

		cacheKey = key;
		cached = {
			text: renderBlueprints(blueprints),
			count: blueprints.length,
		};
		return cached;
	}

	pi.on("session_start", (_event, ctx) => {
		const rendered = refresh(ctx.cwd);
		if (rendered.text) {
			ctx.ui.setStatus("blueprints", `pai-lite: ${rendered.count} blueprints loaded`);
		} else {
			ctx.ui.setStatus("blueprints", undefined);
		}
	});

	pi.on("before_agent_start", (event, ctx) => {
		const rendered = refresh(ctx.cwd);
		if (!rendered.text) return;
		return { systemPrompt: appendToSystemPrompt(event.systemPrompt, rendered.text) };
	});

	pi.on("session_shutdown", (_event, ctx) => {
		ctx.ui.setStatus("blueprints", undefined);
	});
}
