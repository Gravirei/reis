# Workflow: Resume Interrupted Work

Detect what was in progress when a session ended, re-read the relevant state
files, and continue from exactly where things stopped — cycle, execution, or
checkpoint — without redoing completed work.

## Preconditions

- `.planning/` directory exists (if not, this is not a REIS project — run the
  new-project or map-codebase workflow first)
- At least one resumable artifact exists (see step 1); otherwise fall back to
  reading STATE.md and recommending next steps

## Inputs

- Optional modes:
  - *(none)* — smart resume: detect and recommend
  - `--list` — show all available resume points only
  - `--continue` — continue the active wave directly
  - `--checkpoint <name>` — restore from a named checkpoint
  - `--auto` — proceed automatically without recommendations pause
  - `--force` — continue even when blockers are recorded

## Steps

1. Detect resumable states by checking, in order:
   - `.reis/cycle-state.json` with `currentState` not COMPLETE/FAILED → an
     interrupted cycle (record its phase, state, attempts)
   - `.reis/execution-state.json` with an in-progress wave/task → interrupted
     execution (record last completed wave/task)
   - Active wave entry in `.planning/STATE.md` → incomplete wave
   - Checkpoint entries in STATE.md → restorable save points
2. **List mode**: display all resume points found above as a compact table
   (type, name/position, progress, suggested command), then stop.
3. Otherwise present the detected resume point(s) and recommendation:
   - Blockers present? Resolve them first (`--force` overrides)
   - Active wave? Continue it (`--continue`)
   - Else follow STATE.md next steps or restore the latest checkpoint
4. Before continuing, re-read everything needed for safe continuation:
   - `.planning/STATE.md` — phase, recent progress, blockers, next steps
   - The active plan at `.planning/phases/<N>-<name>/PLAN.md`
   - `.reis/cycle-state.json` / `.reis/execution-state.json` — exact cursor
   - `git status` and recent log — uncommitted changes since the crash; if the
     tree is dirty, stash or commit before resuming (offer `--auto-stash`
     semantics)
5. Continue work: resume the cycle workflow (with `--resume-execution` if both
   state files exist) or the execute workflow from the recorded wave/task;
   verify already-committed tasks are genuinely done before skipping them.
6. As work proceeds, keep `.reis/execution-state.json` and STATE.md updated so
   another interruption resumes cleanly.

## Completion criteria

- The correct resume point was identified from real state files, not guessed
- Completed tasks were not repeated; partial work reconciled with git state
- State files updated as execution continues
- If nothing to resume: user received a clear statement plus next-step advice

## References

- @docs/REIS_RESUME_CHEATSHEET.md (resume command selection guide)
- @reis/workflows/execute.md (--from-wave/--from-task semantics)
- @reis/workflows/cycle.md (cycle resume states)

<!-- Migration note: from lib/commands/resume.ts + cheatsheet doc. Context
banners replaced by "compact table of resume points". -->
