# sugarfreepai

> **PAI with the sugar removed** (formerly `pai-lite`). The sugar was the hook
> pipeline, the classifier daemon, the mode ceremony, the voice, the Pulse
> daemon — empty calories from a weaker-model era. Same brain (memory, skills,
> routing, learning), file-first and daemon-free. Tastes the same. No crash.

A lighter personal AI infrastructure that runs on **pi.dev** as the substrate.

Memory that compounds across sessions, skills as reusable workflow patterns,
context routing, and periodic learning distillation — without hook pipelines,
classifier daemons, mode ceremony, or background services.

## Install on pi.dev

```sh
pi install git:github.com/eccentricnode/pai-lite
```

This installs pai-lite as a [pi package](https://pi.dev/packages):

- The `extensions/blueprint-loader.ts` extension auto-loads, scanning
  `skills/<name>/blueprint.yaml` files on every turn and injecting the
  deterministic config layer into the system prompt.
- All `skills/` are registered as pi skills, using pi.dev's native `SKILL.md`
  convention plus the optional sibling `blueprint.yaml`.

For project-local install (writes to `.pi/settings.json`):

```sh
pi install -l git:github.com/eccentricnode/pai-lite
```

For ephemeral one-off:

```sh
pi -e git:github.com/eccentricnode/pai-lite
```

## Status

**Phase 1** — file-first substrate scaffolded. Memory starts empty by design;
routing and skills provide explicit context for future turns. Blueprint loader
extension wires the Rothman semantic-blueprint pattern into pi's system prompt
on every agent turn.

## Background

This project sits between two parents:

- **PAI (Personal AI Infrastructure)** by
  [Daniel Miessler](https://danielmiessler.com/) — the original
  [PAI project](https://github.com/danielmiessler/PAI). Skills, memory, hooks,
  Algorithm, voice, and the scaffolded Digital Assistant thesis on top of
  [Claude Code](https://www.anthropic.com/claude-code). pai-lite keeps the
  ideas (memory, skills, routing, learning loops) and drops most of the runtime
  machinery.
- **[pi.dev](https://pi.dev/)** — the coding-agent substrate this runs on.
  Cleaner extension surface than Claude Code, no Pulse daemon, no hook pipeline
  required to do useful work.

Other influences worth naming:

- **[Geoffrey Huntley's Ralph loop](https://ghuntley.com/ralph/)** — the
  autonomous build pattern (one task, fresh context, commit, repeat) that
  scaffolded this repo's tree.
- **[Andrej Karpathy's LLM Wiki / two-vault model](https://karpathy.ai/)** —
  separation of read-only personal vault from the agent-writable workspace.
- **[Anthropic's Agent Skills convention](https://docs.claude.com/en/docs/claude-code/skills.md)**
  — the `skills/<name>/SKILL.md` shape used here directly.

## Thesis

PAI's ideas are right; the implementation is heavy. Frontier models calibrate
effort natively; scaffolding designed for capability gap N degrades when the
model closes gap N. This project ports the ideas — memory, skills, routing,
learning — to pi.dev in a file-first, daemon-free shape. The Algorithm becomes a
skill used by explicit request or accepted recommendation when audit-bearing
discipline is required, not a mode that auto-triggers.

## Shape

```text
pai-lite/
├── README.md
├── memory/      # durable knowledge store
├── skills/      # pi.dev-native SKILL.md workflows
├── routing/     # explicit intent maps
├── learning/    # inbox, distillations, reviews
├── work/        # task-bound artifacts
└── tools/       # optional local utilities
```

## The four pillars

- **Memory** — markdown-first and queryable by direct read.
- **Skills** — pi.dev-native `skills/<name>/SKILL.md` workflows.
- **Routing** — small maps from intent to relevant memory and skills.
- **Learning** — raw notes go to `inbox.md`; reviews promote durable items.

## Userspace & updates

Your customizations live in a **userspace** that engine updates never touch — the
QMK pattern: separate your stuff from the framework by interface, so `git pull`
of the engine needs no merge. Register it:

```sh
export PAILITE_USERSPACE=~/path/to/your/userspace
```

Skills/blueprints resolve **userspace → workspace (`cwd`) → shipped defaults**,
highest precedence first; a same-named skill in a higher layer *shadows* the
lower one. The repo ships examples; your userspace overrides them. Full design —
including the versioned migrator for schema changes — in
[`UPDATE_MODEL.md`](UPDATE_MODEL.md).

## Runtime contract

Start with this `README.md` for the tracked project contract. In a local pi.dev
workspace, `AGENTS.md` may add operator instructions, but it is a local overlay
and not a required product dependency. For non-trivial work, read
`routing/index.md`, then load only the memory or skill files that the routing
maps justify.

Write durable lessons to `learning/inbox.md` only when a reusable signal is
clear: a new decision, a repeated workflow, a correction, or a pattern worth
distilling.
