# Workflow: Doctor

Diagnose REIS installation integrity and project state health; print a
repair plan. Read-only except when explicitly applying fixes with `--fix`.

## Preconditions

- None (works outside REIS projects too — reports install-level status only).

## Inputs

- `--fix`: apply safe repairs automatically (reinstall missing files,
  rewrite malformed runtime state from templates). Without it, only report.

## Steps

1. **Install integrity** — for each supported platform config dir that
   exists (`~/.rovodev`, `~/.gemini`, `~/.claude`, `~/.codex`, `~/.copilot`,
   honoring CLAUDE_CONFIG_DIR / CODEX_HOME / COPILOT_HOME style overrides):
   - agents present: expect ≥ 11 `reis_*` files in the agents dir
   - commands present: expect 30 dispatchers in the platform's expected
     format (markdown / TOML / prompts / skills)
   - methodology tree: `reis/workflows` ≥ 24 files, `reis/references`,
     `reis/contexts` non-empty
   - version marker `.reis-version` readable
   Report per platform: OK / MISSING:<what> / STALE (marker older than
   package.json version of globally installed package).
2. **Hook wiring** (claude only): settings.json parses; SessionStart and
   PreToolUse(Edit|Write) entries referencing `reis/hooks/` exist unless
   user opted out.
3. **Project health** (if `.planning/` exists in cwd):
   - required artifacts present per `@reis/references/artifact-paths.md`
     (PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md)
   - STATE.md parses per `@reis/references/state-format.md`
4. **Runtime state** (if `.reis/` exists):
   - cycle-state.json / execution-state.json parse as JSON
   - currentState ∈ known enum; history timestamps monotonic
   - flag orphaned artifacts per artifact-paths resolution rule
5. **Repair plan**: for every non-OK item print the exact fix:
   - missing/stale install → `npm install -g @gravirei/reis && reis update`
   - malformed runtime state → delete `.reis/cycle-state.json` (safe;
     cycles restart) or restore from backup
   - hook wiring broken → `reis update --claude --hooks`
   With `--fix`: perform the safe subset (reinstall via installer module is
   NOT done in-workflow; instead print the command). Rewriting malformed
   JSON to an empty-valid state IS done with a `.bak` copy.

## Completion criteria

- A status table (platform × check) printed, plus either "all healthy"
  or an actionable repair plan.

## References

- @~/.claude/reis/references/artifact-paths.md
- @~/.claude/reis/references/state-format.md
- @~/.claude/reis/references/execution-state-format.md
