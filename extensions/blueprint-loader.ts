/**
 * blueprint-loader — pai-lite extension for pi.
 *
 * On every agent turn, scans the project's `skills/` directory for `blueprint.yaml`
 * sibling files (Rothman semantic blueprint pattern: Level 5 deterministic config).
 * Injects the discovered blueprints into the system prompt under a stable header
 * so the agent has the config layer alongside the SKILL.md instruction layer.
 *
 * Convention: a blueprint lives at `skills/<name>/blueprint.yaml`. The file is
 * read as-is — no parsing, no validation. The model consumes it directly as
 * structured config. See SHAPE.md for the full philosophy.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const BLUEPRINT_HEADER = `# Skill Blueprints (deterministic config layer)

The following YAML blueprints accompany the SKILL.md instruction files already
loaded. Each blueprint locks the deterministic surface of its skill: scene_goal,
participants (Agent/Patient/Source per Semantic Role Labeling), action_to_complete
with pre/postconditions, output_schema, and runtime config. When you invoke a
skill, honor its blueprint's output_schema.required_sections and
acceptance_criteria. Do not paraphrase the schema; produce sections in the exact
order specified.`;

interface DiscoveredBlueprint {
	skill: string;
	path: string;
	content: string;
}

function discoverBlueprints(skillsDir: string): DiscoveredBlueprint[] {
	if (!existsSync(skillsDir)) return [];
	const found: DiscoveredBlueprint[] = [];
	let entries: string[];
	try {
		entries = readdirSync(skillsDir);
	} catch {
		return [];
	}
	for (const entry of entries) {
		const skillPath = join(skillsDir, entry);
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
			found.push({ skill: entry, path: bpPath, content });
		} catch {
			// silent — extension must not crash the session over a single bad file
		}
	}
	return found;
}

function renderBlueprints(blueprints: DiscoveredBlueprint[]): string {
	if (blueprints.length === 0) return "";
	const sections = blueprints.map(
		(b) => `## skill: ${b.skill}\n\n\`\`\`yaml\n${b.content.trim()}\n\`\`\``,
	);
	return `${BLUEPRINT_HEADER}\n\n${sections.join("\n\n")}`;
}

export default function (pi: ExtensionAPI) {
	let cachedRender: string | undefined;
	let cacheKey: string | undefined;

	function refresh(): string {
		const skillsDir = join(process.cwd(), "skills");
		const blueprints = discoverBlueprints(skillsDir);
		const key = blueprints.map((b) => `${b.path}:${b.content.length}`).join("|");
		if (key === cacheKey && cachedRender !== undefined) return cachedRender;
		cacheKey = key;
		cachedRender = renderBlueprints(blueprints);
		return cachedRender;
	}

	pi.on("session_start", (_event, ctx) => {
		const rendered = refresh();
		if (rendered) {
			ctx.ui.setStatus("blueprints", `pai-lite: blueprints loaded`);
		}
	});

	pi.on("before_agent_start", (_event, _ctx) => {
		const rendered = refresh();
		if (!rendered) return;
		return { systemPrompt: rendered };
	});

	pi.on("session_shutdown", (_event, ctx) => {
		ctx.ui.setStatus("blueprints", undefined);
	});
}
