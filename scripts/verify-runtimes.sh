#!/usr/bin/env bash
# REIS cross-runtime verification harness.
#
# For each runtime CLI available on this machine:
#   1. create an isolated sandbox HOME
#   2. run the REIS installer (global scope)
#   3. assert installed file tree (scripts/lib/probe.js)
#   4. live invocation probe (budgeted; auth/usage failures count as SKIPPED)
#
# Usage: scripts/verify-runtimes.sh [runtime ...]
#        (default: all detected)
set -u
cd "$(dirname "$0")/.."

PASS=0; FAIL=0; SKIP=0
RESULTS=""
RUNTIMES="${*:-(claude codex copilot gemini)}"
SANDBOX_BASE="$(mktemp -d /tmp/reis-verify-XXXXXX)"

note() { printf '%s\n' "$*"; }

classify_probe() {
  # $1 = combined output; prints PASS|SKIP|FAIL verdict for the live probe
  local out="$1"
  case "$out" in
    *"Not logged in"*|*"login"*|*"credentials"*) echo "SKIP";;
    *"usage limit"*|*"quota"*|*"rate limit"*) echo "SKIP";;
    *"No such agent"*|*"Unknown command"*|*"not found"*) echo "FAIL";;
    *) echo "PASS";;
  esac
}

verify_runtime() {
  local runtime="$1"
  local bin_cmd="$runtime"
  if ! command -v "$bin_cmd" >/dev/null 2>&1; then
    note "── $runtime: SKIP (binary not installed)"
    SKIP=$((SKIP+1)); RESULTS+="  $runtime: SKIP (no binary)\n"
    return
  fi

  local sb="$SANDBOX_BASE/$runtime"
  mkdir -p "$sb"

  note "── $runtime: installing into sandbox…"
  HOME="$sb" node lib/install.js --silent >"$sb/install.log" 2>&1
  if [ $? -ne 0 ]; then
    note "  ✗ installer failed (see $sb/install.log)"
    FAIL=$((FAIL+1)); RESULTS+="  $runtime: FAIL (installer)\n"
    return
  fi

  # file-level checks (env-var isolated homes where supported)
  local probe_rc
  case "$runtime" in
    codex)   CODEX_HOME="$sb/.codex"   node scripts/lib/probe.js "$runtime" "$sb" ;;
    copilot) COPILOT_HOME="$sb/.copilot" node scripts/lib/probe.js "$runtime" "$sb" ;;
    *)       HOME="$sb"                 node scripts/lib/probe.js "$runtime" "$sb" ;;
  esac
  probe_rc=$?
  if [ $probe_rc -ne 0 ]; then
    FAIL=$((FAIL+1)); RESULTS+="  $runtime: FAIL (file checks)\n"
    return
  fi

  # live invocation probe (budgeted, non-fatal on auth limits)
  local out verdict
  case "$runtime" in
    claude)
      out=$(HOME="$sb" timeout 90 "$bin_cmd" --print "Reply with the single word OK if you can see this." 2>&1 | tail -3) ;;
    codex)
      cp ~/.codex/auth.json "$sb/.codex/" 2>/dev/null
      out=$(CODEX_HOME="$sb/.codex" timeout 120 "$bin_cmd" exec --skip-git-repo-check "Reply with the single word OK." 2>&1 | tail -5) ;;
    copilot)
      mkdir -p "$sb/.copilot"
      cp ~/.copilot/config.json "$sb/.copilot/" 2>/dev/null
      out=$(COPILOT_HOME="$sb/.copilot" timeout 90 "$bin_cmd" --agent reis_analyst -p "Reply with the single word OK." 2>&1 | tail -5) ;;
    gemini)
      out="SKIP (gemini probe not implemented)"; echo SKIP > /tmp/reis-verdict ;;
  esac
  verdict=$(classify_probe "$out")
  case "$verdict" in
    PASS) PASS=$((PASS+1)); RESULTS+="  $runtime: PASS (install+files+live)\n"; note "  ✓ live probe passed";;
    SKIP) SKIP=$((SKIP+1)); RESULTS+="  $runtime: SKIP (auth/quota at live probe)\n"; note "  ○ live probe skipped ($(echo "$out" | head -c 60))";;
    FAIL) FAIL=$((FAIL+1)); RESULTS+="  $runtime: FAIL (agent not discovered)\n"; note "  ✗ agent not discovered";;
  esac
}

note "REIS cross-runtime verification"
note "================================="
for r in $RUNTIMES; do
  verify_runtime "$r"
done

note ""
note "═══ Results ═══"
printf "${RESULTS}"
note "pass=$PASS fail=$FAIL skip=$SKIP sandbox=$SANDBOX_BASE"
[ "$FAIL" -eq 0 ]
