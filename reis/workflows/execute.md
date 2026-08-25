# Workflow: Execute Phase Plan

Implement a phase by executing its PLAN.md wave-by-wave: complete each task,
verify it, commit atomically, checkpoint progress, and finish with a SUMMARY.md
and STATE.md update. This workflow also covers executing an arbitrary plan file
by path (the old `execute-plan` behavior).

## Preconditions

- `.planning/` directory exists (if not, this is not a REIS project — run the
  new-project or map-codebase workflow first)
- A target is given: either a phase number or a direct path to a PLAN.md file
- For a phase number: locate its plan at
  `.planning/phases/<N>-<name>/PLAN.md` (also accept legacy locations like
  `.planning/phase-N.PLAN.md` or `priority-*/` folders); if none exists, stop
  and tell the user to run the plan workflow first

## Inputs

- Phase number **or** plan file path (required)
- Optional flags:
  - `--parallel` — run independent waves concurrently (max 4 by default)
  - `--dry-run` — show waves/tasks and batches without changing anything
  - `--resume` — resume an interrupted execution (see Crash recovery)
  - `--from-wave <n>` / `--from-task "<id>"` — resume starting at a specific
    wave or task instead of the last checkpoint
  - `--auto-stash` — stash uncommitted changes automatically before resuming
  - `--rollback soft|mixed|hard` — roll back git state before resuming
  - `--no-commit` — disable atomic per-task commits

## Steps

1. Read `.planning/STATE.md` for current phase, prior progress, and blockers.
2. Read the PLAN.md fully. Parse tasks into waves honoring dependencies;
   validate there are no circular dependencies and every task has files,
   action, verify, and done defined. If the plan is malformed, stop and report.
3. If `.reis/execution-state.json` exists and no `--resume` flag was given,
   tell the user an interrupted execution was found and ask whether to resume
   or start over.
4. If using `--resume`: read `.reis/execution-state.json` to find the last
   completed wave/task, re-read the PLAN.md, and continue from the recorded
   position (or from `--from-wave`/`--from-task` if provided). With dirty git
   state, apply `--auto-stash` or the requested rollback mode first.
5. Execute waves strictly in dependency order, one at a time (or concurrently
   within a parallel batch when `--parallel`). For each task:
   - Make only the changes listed in the task's files/action
   - Run the task's verify command; if it fails, fix before moving on
   - Commit the task's changes atomically with a descriptive message prefixed
     per config (`git.commitMessagePrefix`, e.g. `[REIS v2.0]`)
   - Update `.reis/execution-state.json` after EVERY task: record wave number,
     task id/name, status, and timestamp — this file is the crash-recovery
     cursor, so it must never lag behind actual work
6. After each wave completes: display a compact status table of waves
   (completed/in-progress/pending), update wave status in
   `.planning/STATE.md`, and create a checkpoint entry (see the checkpoint
   workflow).
7. Handle deviations explicitly. If reality forces you off-plan (extra work
   needed, a task must be skipped, approach changed): do not silently drift —
   note the deviation, why it happened, and what changed in STATE.md under
   Recent Progress, and adjust remaining tasks accordingly.
8. When all waves are done:
   - Write `.planning/phases/<N>-<name>/SUMMARY.md`: what was built per task,
     deviations, files touched, verification results
   - Update `.planning/STATE.md`: mark the phase executed, log recent progress
     and any follow-ups
   - Delete/reset `.reis/execution-state.json` so a stale cursor cannot
     mislead a later resume
9. On unrecoverable task failure: save the failing wave/task and error into
   `.reis/execution-state.json`, leave completed commits intact, and tell the
   user to resume later or run the debug workflow.

## Completion criteria

- Every task in the plan is implemented and its verify command passed
- One atomic commit exists per task (unless `--no-commit`)
- `.planning/phases/<N>-<name>/SUMMARY.md` exists and reflects reality
- STATE.md records the execution outcome; execution-state.json is cleared
- Suggest verification as the next step

## References

- @templates/PLAN.md (wave/task format)
- @docs/WAVE_EXECUTION.md (wave lifecycle, sizes, dependencies)
- @docs/CHECKPOINTS.md (automatic checkpoint behavior)
- @agents/reis_executor (subagent for large plans)

<!-- Migration note: merges lib/commands/execute.ts + execute-plan.ts. Kanban
rendering, dependency-graph ASCII art, and batch time estimates were CLI-only
presentation and are dropped; agents show a compact table instead. -->
