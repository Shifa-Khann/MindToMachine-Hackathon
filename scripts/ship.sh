#!/usr/bin/env bash
# Usage: scripts/ship.sh "area: what changed"   -> test, commit, push (one functionality = one ship)
set -e
cd "$(dirname "$0")/.."
# Safety: runtime output and secrets must never be tracked.
bad=$(git ls-files out .env | head -5)
[ -z "$bad" ] || { echo "Refusing to ship: these are tracked by git (run: git rm --cached <file>):"; echo "$bad"; exit 1; }
python -m unittest -q || { echo "Tests failed - not pushing."; exit 1; }
git add -A
git diff --cached --quiet && { echo "Nothing to commit."; exit 0; }
git commit -m "$1"
git push -u origin "$(git branch --show-current)"
echo "Shipped: $(git log -1 --format='%h %s')"
