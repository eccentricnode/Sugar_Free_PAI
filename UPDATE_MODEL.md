# Update Model — base vs. userspace

How SUGAR_FREE_PAI takes engine updates **without breaking your customizations**.
Modeled on the QMK userspace pattern: separate your stuff from the framework by
*interface*, so most updates need zero merge.

## The two spaces

- **Base / engine** — the extension (`blueprint-loader.ts`), reference tools,
  *example* skills, the SKILL.md convention, Ralph scaffolding. Owned upstream.
  Updated via `git pull` (fork + `upstream` remote).
- **Userspace** — your real skills/blueprints, routing, learning, identity, and
  your memory store. Owned by you. Never touched by an engine pull.

The base ships **examples**; userspace **overrides** them. Your customizations
never live in the engine repo, so pulling the engine can't clobber them.

## Mechanism 1 — externalize userspace (the 90% case: zero-merge)

Register a userspace root; the engine overlays it, highest precedence first, and
a same-named unit in a higher layer **shadows** the lower one — *layer, don't
merge*.

```sh
export PAILITE_USERSPACE=~/path/to/your/userspace   # your stuff lives here
```

Skill/blueprint precedence (implemented in `blueprint-loader.ts`):

1. `$PAILITE_USERSPACE/skills` — your skills (win)
2. `<cwd>/skills` — project-local
3. `<repo>/skills` — shipped defaults / examples

So `git pull` of the engine never overwrites a skill you customized: put it in
the userspace root under the same name and it shadows the shipped default. No
3-way merge, because base and userspace never edit the same file.

Status: **implemented for skills.** The same `PAILITE_USERSPACE` root is the
intended home for `memory/`, `routing/`, and `learning/` as each grows a loader;
memory is already external via the substrate's `PI_MEMORY_ROOT`.

## Mechanism 2 — versioned contract + migrator (the 10% case)

When the engine genuinely changes the *shape* of userspace content (frontmatter
schema, `blueprint.yaml` structure), shadowing isn't enough — the content must
be ported forward. Then:

1. The base declares a **schema version**.
2. It ships a migrator `old → new` that emits a **reviewable proposal** (never an
   in-place rewrite), exactly like the memory-substrate migrator.
3. A validator gates that the migrated userspace conforms to the new contract.
4. You review and apply.

Reserve this for real shape changes only. Everything else is Mechanism 1.

## Git topology (the piece PAI lacks)

PAI has no upstream-pull mechanism. SUGAR_FREE_PAI uses a normal fork model:

- `origin` — your deployed instance.
- `upstream` — the canonical engine; `git pull --rebase upstream main` on a
  cadence.
- Userspace is a separate dir (and can be its own repo), so engine pulls and
  your edits never collide.

## Why this is the product boundary

Engine ships and updates; **you own userspace data**. That is the ECL stack
restated — client owns the DB, the agent layer ships, context engineering is the
deliverable. Designed once here, reused everywhere.
