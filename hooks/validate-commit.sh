#!/bin/sh
# REIS commit-message validator. Usage: validate-commit.sh COMMIT_MSG_FILE
# Enforces references/commit-conventions.md basics: non-empty subject <= 72 chars,
# no WIP placeholder. Wire manually as a git commit-msg hook or via agent tooling.
MSG_FILE="$1"
[ -f "$MSG_FILE" ] || exit 1
subject=$(head -n1 "$MSG_FILE")
case "$subject" in
  "") echo "[REIS] Commit rejected: empty message"; exit 1 ;;
  "WIP"|"wip"|"."|"tmp") echo "[REIS] Commit rejected: placeholder message"; exit 1 ;;
esac
len=$(printf '%s' "$subject" | wc -c)
if [ "$len" -gt 72 ]; then
  echo "[REIS] Commit rejected: subject exceeds 72 characters"
  exit 1
fi
exit 0
