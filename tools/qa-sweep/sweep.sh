#!/usr/bin/env bash
# Generic QA sweep for any skill in pai-lite.
# Reads skills/<name>/test-fixture.md, runs pi in fresh context for each run,
# and writes a unique run set under skills/<name>/test-results/runs/.
#
# Usage: ./_qa-sweep.sh <skill-name> [count]
#   skill-name: directory under skills/ (e.g. code-review, verifier-first)
#   count: how many runs (default 5)
set -uo pipefail

SKILL="${1:-}"
COUNT="${2:-5}"
PROVIDER="openai-codex"
MODEL="gpt-5.5"
INVOCATION_MODE="pi -p --no-session --no-context-files"

[ -z "$SKILL" ] && { echo "usage: $0 <skill-name> [count]" >&2; exit 2; }

case "$COUNT" in
  ''|*[!0-9]*)
    echo "count must be a positive integer: $COUNT" >&2
    exit 2
    ;;
  0)
    echo "count must be a positive integer: $COUNT" >&2
    exit 2
    ;;
esac

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

SKILL_DIR="skills/$SKILL"
FIXTURE_FILE="$SKILL_DIR/test-fixture.md"
RESULTS_DIR="$SKILL_DIR/test-results"
RUNS_DIR="$RESULTS_DIR/runs"
LOG_FILE="$RESULTS_DIR/log.csv"

[ ! -d "$SKILL_DIR" ] && { echo "skill not found: $SKILL_DIR" >&2; exit 1; }
[ ! -f "$SKILL_DIR/blueprint.yaml" ] && { echo "no blueprint.yaml - skipping" >&2; exit 1; }
[ ! -f "$FIXTURE_FILE" ] && { echo "no test-fixture.md - skipping" >&2; exit 1; }

mkdir -p "$RUNS_DIR"

# Extract the fixture invocation from test-fixture.md. Pull the first fenced
# code block under a heading containing "fixture" (case-insensitive).
FIXTURE=$(awk '
  /^```/ && capturing { exit }
  capturing { print }
  /^##.*[Ff]ixture/ { in_section = 1 }
  in_section && /^```/ { capturing = 1 }
' "$FIXTURE_FILE")

if [ -z "$FIXTURE" ]; then
  echo "could not extract fixture from $FIXTURE_FILE - looking for fenced block after '## Fixture' or similar" >&2
  exit 1
fi

if [ -n "${PAILITE_QA_SWEEP_RUN_SET_ID:-}" ]; then
  RUN_SET_ID="$PAILITE_QA_SWEEP_RUN_SET_ID"
  case "$RUN_SET_ID" in
    *[!A-Za-z0-9._-]*)
      echo "PAILITE_QA_SWEEP_RUN_SET_ID contains unsupported characters: $RUN_SET_ID" >&2
      exit 2
      ;;
  esac
  if [ -e "$RUNS_DIR/$RUN_SET_ID" ]; then
    echo "run set already exists: $RUNS_DIR/$RUN_SET_ID" >&2
    exit 1
  fi
else
  RUN_SET_ID_BASE="$(date -u +%Y%m%dT%H%M%SZ)"
  RUN_SET_ID="$RUN_SET_ID_BASE"
  SUFFIX=1
  while [ -e "$RUNS_DIR/$RUN_SET_ID" ]; do
    SUFFIX=$((SUFFIX + 1))
    RUN_SET_ID="$RUN_SET_ID_BASE-$SUFFIX"
  done
fi
RUN_SET_DIR="$RUNS_DIR/$RUN_SET_ID"
mkdir -p "$RUN_SET_DIR"

MANIFEST="$RUN_SET_DIR/manifest.csv"
BRANCH="$(git branch --show-current 2>/dev/null || true)"
[ -z "$BRANCH" ] && BRANCH="detached"
HEAD_REV="$(git rev-parse --short HEAD 2>/dev/null || echo unknown)"

csv_row() {
  local first=1
  local value escaped
  for value in "$@"; do
    escaped="${value//\"/\"\"}"
    if [ "$first" -eq 0 ]; then
      printf ','
    fi
    printf '"%s"' "$escaped"
    first=0
  done
  printf '\n'
}

extract_tracking_fields() {
  awk '
    /^## Long-term tracking/ { in_section = 1; next }
    in_section && /^## / { exit }
    in_section && /^- / {
      field = $0
      sub(/^- /, "", field)
      sub(/[[:space:]]*\(.*/, "", field)
      sub(/[[:space:]]*:.*/, "", field)
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", field)
      if (field != "") print field
    }
  ' "$FIXTURE_FILE"
}

join_by_comma() {
  local first=1
  local value
  for value in "$@"; do
    if [ "$first" -eq 0 ]; then
      printf ','
    fi
    printf '%s' "$value"
    first=0
  done
}

tracking_value_for_field() {
  local field="$1"
  case "$field" in
    date)
      date -u +%Y-%m-%d
      ;;
    branch)
      printf '%s\n' "$BRANCH"
      ;;
    head|revision|head_rev)
      printf '%s\n' "$HEAD_REV"
      ;;
    run_set_id)
      printf '%s\n' "$RUN_SET_ID"
      ;;
    model)
      printf '%s\n' "$MODEL"
      ;;
    runs_count)
      printf '%s\n' "$COUNT"
      ;;
    *notes)
      printf 'unscored; run_set_id=%s; head=%s\n' "$RUN_SET_ID" "$HEAD_REV"
      ;;
    *_rate)
      printf 'unscored\n'
      ;;
    *)
      printf 'unscored\n'
      ;;
  esac
}

append_tracking_row() {
  local fields=("$@")
  local expected_header existing_header values=()
  local field value

  if [ "${#fields[@]}" -eq 0 ]; then
    echo "could not extract long-term tracking fields from $FIXTURE_FILE" >&2
    return 1
  fi

  expected_header="$(join_by_comma "${fields[@]}")"

  if [ -f "$LOG_FILE" ] && [ -s "$LOG_FILE" ]; then
    existing_header="$(head -n 1 "$LOG_FILE")"
    if [ "$existing_header" != "$expected_header" ]; then
      echo "log header mismatch for $LOG_FILE" >&2
      echo "expected: $expected_header" >&2
      echo "actual:   $existing_header" >&2
      return 1
    fi
  else
    mkdir -p "$RESULTS_DIR"
    printf '%s\n' "$expected_header" > "$LOG_FILE"
  fi

  if grep -Fq "$RUN_SET_ID" "$LOG_FILE"; then
    echo "[$(date +%H:%M:%S)] tracking row already present for run_set=$RUN_SET_ID"
    return 0
  fi

  for field in "${fields[@]}"; do
    value="$(tracking_value_for_field "$field")"
    values+=("$value")
  done

  csv_row "${values[@]}" >> "$LOG_FILE"
  echo "[$(date +%H:%M:%S)] tracking row appended: $LOG_FILE"
}

{
  printf 'run_set_id,skill,fixture_path,run_number,requested_count,timestamp_utc,provider,model,branch,head,invocation_mode,run_file,exit_status\n'
} > "$MANIFEST"

echo "[$(date +%H:%M:%S)] sweep starting: skill=$SKILL count=$COUNT run_set=$RUN_SET_ID"
echo "[fixture preview] $(echo "$FIXTURE" | head -1 | cut -c1-100)..."

SWEEP_FAILED=0
LOG_FAILED=0

for N in $(seq 1 "$COUNT"); do
  NN=$(printf "%02d" "$N")
  OUT="$RUN_SET_DIR/run-${NN}.md"
  TIMESTAMP_UTC="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

  {
    printf -- '---\n'
    printf 'harness_metadata:\n'
    printf '  timestamp_utc: %s\n' "$TIMESTAMP_UTC"
    printf '  run_set_id: %s\n' "$RUN_SET_ID"
    printf '  skill: %s\n' "$SKILL"
    printf '  fixture_path: %s\n' "$FIXTURE_FILE"
    printf '  run_number: %s\n' "$N"
    printf '  requested_count: %s\n' "$COUNT"
    printf '  provider: %s\n' "$PROVIDER"
    printf '  model: %s\n' "$MODEL"
    printf '  branch: %s\n' "$BRANCH"
    printf '  head: %s\n' "$HEAD_REV"
    printf '  invocation_mode: %s\n' "$INVOCATION_MODE"
    printf '  exit_status: pending\n'
    printf -- '---\n\n'
    printf '## Raw model output\n\n'
  } > "$OUT"

  echo "[$(date +%H:%M:%S)] run-${NN} -> $OUT"
  pi -p \
    --provider "$PROVIDER" \
    --model "$MODEL" \
    --skill "$SKILL_DIR" \
    --append-system-prompt "$SKILL_DIR/blueprint.yaml" \
    --thinking medium \
    --no-session \
    --no-context-files \
    "$FIXTURE" \
    >> "$OUT" 2>&1
  RC=$?
  if [ "$RC" -ne 0 ]; then
    SWEEP_FAILED=1
  fi

  perl -0pi -e "s/exit_status: pending/exit_status: $RC/" "$OUT"
  csv_row \
    "$RUN_SET_ID" \
    "$SKILL" \
    "$FIXTURE_FILE" \
    "$N" \
    "$COUNT" \
    "$TIMESTAMP_UTC" \
    "$PROVIDER" \
    "$MODEL" \
    "$BRANCH" \
    "$HEAD_REV" \
    "$INVOCATION_MODE" \
    "$OUT" \
    "$RC" >> "$MANIFEST"

  LINES=$(wc -l < "$OUT")
  echo "[$(date +%H:%M:%S)] run-${NN} exit=$RC lines=$LINES"
done

mapfile -t TRACKING_FIELDS < <(extract_tracking_fields)
append_tracking_row "${TRACKING_FIELDS[@]}" || LOG_FAILED=1

if [ "$SWEEP_FAILED" -ne 0 ]; then
  echo "[$(date +%H:%M:%S)] sweep failed: one or more invocations exited nonzero (skill=$SKILL run_set=$RUN_SET_ID)" >&2
  exit "$SWEEP_FAILED"
fi

if [ "$LOG_FAILED" -ne 0 ]; then
  echo "[$(date +%H:%M:%S)] sweep failed: tracking row could not be recorded (skill=$SKILL run_set=$RUN_SET_ID)" >&2
  exit "$LOG_FAILED"
fi

echo "[$(date +%H:%M:%S)] sweep complete: skill=$SKILL run_set=$RUN_SET_ID"
