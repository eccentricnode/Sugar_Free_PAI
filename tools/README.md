# Tools

Updated: 2026-06-11

Use when: Small local utilities become necessary for search, linting, summaries,
or validation.

Phase 1 does not require tools. Prefer bun and TypeScript only when a utility
earns its maintenance cost.

## QA sweep

Use `./_qa-sweep.sh <skill-name> [count]` from the repository root to run an
optional local skill QA sweep. The default count is 5. The root script remains
the operational entry point and delegates to `tools/qa-sweep/sweep.sh`.

Each sweep writes an ignored run set under
`skills/<skill-name>/test-results/runs/<run-set-id>/`:

- `run-NN.md` - per-run metadata plus raw model output.
- `manifest.csv` - one row per run with invocation metadata and exit status.
- `sweep-summary.md` - run-set links and pass/fail gate status.
- `artifact-report.md` and `artifact-manifest.csv` - named artifact checks.
- `repository-mutation-report.md` - expected and unexpected Git status changes.
- `repository-status-*.txt` - raw mutation evidence used by the report.

The harness appends one row to `skills/<skill-name>/test-results/log.csv` after
each completed run set. Criterion rates are recorded as `unscored` until a
separate evaluator exists.
