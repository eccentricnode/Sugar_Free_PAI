/**
 * blueprint-loader — sugarfreepai (pai-lite) extension for pi.
 *
 * On every agent turn, scans layered `skills/` roots for `blueprint.yaml`
 * sibling files (Rothman semantic blueprint pattern: Level 5 deterministic
 * config) and injects them into the system prompt under a stable header, so the
 * agent has the config layer alongside the SKILL.md instruction layer.
 *
 * USERSPACE MODEL (QMK-style — see UPDATE_MODEL.md).
 * Blueprints are discovered from layered roots, highest precedence first; a
 * skill found in a higher root SHADOWS the same-named skill in a lower root:
 *
 *   1. userspace  — $PAILITE_USERSPACE/skills  (your customizations; never in this repo)
 *   2. workspace  — <cwd>/skills               (project-local)
 *   3. package    — this repo's skills/        (shipped defaults / examples)
 *
 * So updating the engine (`git pull`) never clobbers your skills: keep them in
 * the userspace root and they win. The base ships examples; userspace overrides.
 *
 * Convention: a blueprint lives at `skills/<name>/blueprint.yaml`, read as-is —
 * no parsing, no validation. The model consumes it directly as structured config.
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

export interface BlueprintRoot {
	label: string;
	dir: string;
}

export interface DiscoveredBlueprint {
	skill: string;
	source: string;
	path: string;
	content: string;
}

interface RenderedBlueprints {
	text: string;
	count: number;
}

/** Resolve the explicit userspace root from the environment, if registered. */
export function resolveUserspace(
	env: Record<string, string | undefined> = process.env,
): string | undefined {
	const raw = env.PAILITE_USERSPACE?.trim();
	return raw ? resolve(raw) : undefined;
}

/**
 * Ordered blueprint roots, HIGHEST precedence first. A skill discovered in an
 * earlier root shadows the same-named skill in any later root. Duplicate
 * resolved paths are collapsed so the same directory is never scanned twice.
 */
export function blueprintRoots(opts: {
	cwd: string;
	userspace?: string;
	packageRoot?: string;
}): BlueprintRoot[] {
	const packageRoot = opts.packageRoot ?? PACKAGE_ROOT;
	const candidates: BlueprintRoot[] = [];
	if (opts.userspace) {
		candidates.push({ label: "userspace", dir: join(opts.userspace, "skills") });
	}
	candidates.push({ label: "workspace", dir: join(opts.cwd, "skills") });
	candidates.push({ label: "package (defaults)", dir: join(packageRoot, "skills") });

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
	let entries: string[];
	try {
		entries = readdirSync(root.dir).sort((a, b) => a.localeCompare(b));
	} catch {
		return [];
	}

	const found: DiscoveredBlueprint[] = [];
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
			// Silent: the extension must not crash the session over one bad file.
		}
	}
	return found;
}

/**
 * Discover blueprints across the given ordered roots, applying shadow-by-name:
 * the FIRST root (highest precedence) to define a skill wins. Result is sorted
 * by skill name for stable rendering.
 */
export function discoverBlueprints(roots: BlueprintRoot[]): DiscoveredBlueprint[] {
	const bySkill = new Map<string, DiscoveredBlueprint>();
	for (const blueprint of roots.flatMap(discoverBlueprintsInRoot)) {
		if (!bySkill.has(blueprint.skill)) bySkill.set(blueprint.skill, blueprint);
	}
	return Array.from(bySkill.values()).sort((a, b) => a.skill.localeCompare(b.skill));
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

export function renderBlueprints(blueprints: DiscoveredBlueprint[]): string {
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
		const roots = blueprintRoots({ cwd, userspace: resolveUserspace() });
		const blueprints = discoverBlueprints(roots);
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
			ctx.ui.setStatus("blueprints", `sugarfreepai: ${rendered.count} blueprints loaded`);
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
