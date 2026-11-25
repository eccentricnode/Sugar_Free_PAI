#!/usr/bin/env bash
# Keep the installable skill snapshot synchronized with its canonical submodule.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE="$ROOT/vendor/socratic-teacher"
TARGET="$ROOT/skills/socratic-teacher"
MODE="${1:-sync}"

if [[ ! -f "$SOURCE/SKILL.md" ]]; then
  echo "Socratic Teacher submodule is missing; run: git submodule update --init vendor/socratic-teacher" >&2
  exit 1
fi

check_sync() {
  local failed=0
  diff -q "$SOURCE/SKILL.md" "$TARGET/SKILL.md" >/dev/null || {
    echo "Out of sync: SKILL.md" >&2; failed=1;
  }
  diff -qr "$SOURCE/Tools" "$TARGET/Tools" >/dev/null || {
    echo "Out of sync: Tools/" >&2; failed=1;
  }
  diff -qr "$SOURCE/Fixtures" "$TARGET/Fixtures" >/dev/null || {
    echo "Out of sync: Fixtures/" >&2; failed=1;
  }
  diff -q "$SOURCE/eval-fixture.md" "$TARGET/eval-fixture.md" >/dev/null || {
    echo "Out of sync: eval-fixture.md" >&2; failed=1;
  }
  return "$failed"
}

case "$MODE" in
  --check)
    check_sync || exit 1
    echo "Socratic Teacher package snapshot matches submodule."
    ;;
  sync)
    mkdir -p "$TARGET/Tools"
    mkdir -p "$TARGET/Fixtures"
    cp "$SOURCE/SKILL.md" "$TARGET/SKILL.md"
    find "$TARGET/Tools" -maxdepth 1 -type f -name '*.md' -delete
    find "$TARGET/Fixtures" -maxdepth 1 -type f -name '*.md' -delete
    cp "$SOURCE"/Tools/*.md "$TARGET/Tools/"
    cp "$SOURCE"/Fixtures/*.md "$TARGET/Fixtures/"
    cp "$SOURCE/eval-fixture.md" "$TARGET/eval-fixture.md"
    check_sync || exit 1
    echo "Socratic Teacher package snapshot synchronized."
    ;;
  *)
    echo "Usage: $0 [--check]" >&2
    exit 2
    ;;
esac
