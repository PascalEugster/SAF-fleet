#!/usr/bin/env bash
#
# Pre-publish safety check for SAF-fleet.
#
# Verifies that ONLY intended files are about to be published and that no
# secrets, credentials, keys or local data would leak to the public repo.
# It inspects the git index (staged + committed files), so stage first:
#
#     git add -A
#     pnpm check:publish      # or: bash scripts/check-publish.sh
#
# Exit code 0 = safe to publish, 1 = problems found (do not push).

set -uo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || { echo "✗ Not a git repository."; exit 1; }
cd "$ROOT"

FAIL=0
section() { printf '\n▶ %s\n' "$1"; }
ok()   { printf '  ✓ %s\n' "$1"; }
bad()  { printf '  ✗ %s\n' "$1"; FAIL=1; }
warn() { printf '  ! %s\n' "$1"; }

TRACKED="$(git ls-files)"
if [ -z "$TRACKED" ]; then
  echo "✗ Nothing is staged or committed yet. Run 'git add -A' first."
  exit 1
fi
FILE_COUNT="$(printf '%s\n' "$TRACKED" | wc -l | tr -d ' ')"

# 1) No sensitive files in the index ------------------------------------------
section "Sensitive files must NOT be tracked"
check_pattern() {
  local regex="$1" desc="$2" hits
  hits="$(printf '%s\n' "$TRACKED" | grep -nE "$regex" || true)"
  if [ -n "$hits" ]; then
    bad "$desc is tracked:"
    printf '%s\n' "$hits" | sed 's/^/        /'
  fi
}
BEFORE=$FAIL
check_pattern '(^|/)\.env$'                          "a real .env file"
check_pattern '(^|/)\.env\..*local$'                 "a local env file"
check_pattern '\.(db|sqlite|sqlite3)(-shm|-wal)?$'   "a database file"
check_pattern '(^|/)node_modules/'                   "node_modules"
check_pattern '(^|/)\.next/'                          ".next build output"
check_pattern '\.tsbuildinfo$'                        "TypeScript build info"
check_pattern '\.(pem|key|p12|pfx|keystore|jks|crt)$' "a key / certificate file"
check_pattern '(^|/)media/'                          "uploaded media files"
check_pattern '(^|/)\.DS_Store$'                     "a macOS .DS_Store file"
[ "$FAIL" -eq "$BEFORE" ] && ok "no sensitive files in the index"

# 2) Local sensitive files that exist on disk must be git-ignored -------------
section "Local sensitive files must be git-ignored"
for f in .env saf-fleet.db saf-fleet.db-shm saf-fleet.db-wal media; do
  if [ -e "$f" ]; then
    if git check-ignore -q "$f"; then ok "$f is ignored"; else bad "$f exists but is NOT git-ignored"; fi
  fi
done

# 3) Secret-pattern content scan ----------------------------------------------
section "No secrets in tracked file contents"
SECRET_HITS="$(
  printf '%s\n' "$TRACKED" \
  | grep -vE '(^|/)(pnpm-lock\.yaml|package-lock\.json)$' \
  | while IFS= read -r f; do
      [ -f "$f" ] || continue
      grep -nEHI \
        -e '-----BEGIN [A-Z ]*PRIVATE KEY-----' \
        -e 'AKIA[0-9A-Z]{16}' \
        -e '(sk|rk)_(live|test)_[0-9A-Za-z]{16,}' \
        -e 'gh[a-z]_[0-9A-Za-z]{30,}' \
        -e 'github_pat_[0-9A-Za-z_]{30,}' \
        -e 'xox[baprs]-[0-9A-Za-z-]{10,}' \
        -e '://[A-Za-z0-9_.-]+:[^@/[:space:]]+@' \
        -e '(api[_-]?key|secret|token|passwd|password)["'"'"' ]*[:=]["'"'"' ]*[0-9A-Za-z/+_-]{16,}' \
        "$f" 2>/dev/null
    done \
  | grep -viE 'replace-with-a-long-random-string|armee2026|YOUR_SECRET_HERE|process\.env|placeholder|change-me|example\.com|your-account' \
  || true
)"
if [ -n "$SECRET_HITS" ]; then
  bad "possible secrets found — review each line below:"
  printf '%s\n' "$SECRET_HITS" | sed 's/^/        /'
else
  ok "no secret-like strings detected"
fi

# 4) .gitignore covers the essentials -----------------------------------------
section ".gitignore covers the essentials"
for pat in '\.env' 'node_modules' '\.next'; do
  grep -qE "$pat" .gitignore 2>/dev/null && ok ".gitignore mentions ${pat//\\/}" || warn ".gitignore may be missing ${pat//\\/}"
done
grep -qE '\*\.db|saf-fleet\.db' .gitignore 2>/dev/null && ok ".gitignore covers the database" || bad ".gitignore does not cover the database"

# 5) Required project files present -------------------------------------------
section "Required project files present"
for f in README.md LICENSE.md package.json; do
  printf '%s\n' "$TRACKED" | grep -qxF "$f" && ok "$f" || bad "$f missing from the index"
done

# Summary ---------------------------------------------------------------------
printf '\n────────────────────────────────────────\n'
printf 'Files staged/committed for publish: %s\n' "$FILE_COUNT"
if [ "$FAIL" -eq 0 ]; then
  printf '✅ SAFE TO PUBLISH\n'
  exit 0
else
  printf '❌ NOT SAFE — fix the ✗ items above before pushing.\n'
  exit 1
fi
