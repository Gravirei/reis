#!/bin/sh
# REIS session-start hook: print project context into the session.
# Defensive by design: never fail the session (exit 0 always).
STATE_FILE=".planning/STATE.md"
[ -f "$STATE_FILE" ] || exit 0

phase=$(grep -m1 '^## Current Phase' -A1 "$STATE_FILE" 2>/dev/null | grep -m1 '^\*\*' | sed 's/\*\*//g')
waves=$(grep -m1 'Waves completed' "$STATE_FILE" 2>/dev/null | grep -o '[0-9]\+' || echo 0)

echo "[REIS] ${phase:-no active phase} | completed waves: ${waves:-0}"
echo "[REIS] Commands available: /reis:progress for status, /reis:cycle N to run a phase."
exit 0
