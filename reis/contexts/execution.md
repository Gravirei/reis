# Context: Execution Primer

Load this before executing a PLAN.md.

## Read first

- `.planning/STATE.md` — phase, prior progress, blockers
- The full PLAN.md — parse tasks into waves honoring dependencies; validate
  every task has files/action/verify/done. Malformed plan → stop and report,
  never improvise structure.
- `.reis/execution-state.json` if present — interrupted execution; without
  `--resume`, ask the user: resume or start over?

## Core discipline

1. **One wave at a time** (or one parallel batch with `--parallel`, max 4).
   Never start wave N+1 before wave N is complete and committed.
2. **Task-level checkpoints**: after EVERY task update
   `.reis/execution-state.json` (wave number, task id, status, timestamp).
   This file is the crash-recovery cursor — it must never lag behind actual
   work.
3. **Atomic commits**: one commit per task containing only that task's changes,
   message prefixed per config (e.g. `[REIS v2.0]`). Disabled only by
   `--no-commit`.
4. **Verify each task before moving on**: run the task's verify command; if it
   fails, fix it within the task's scope before proceeding.

## Deviation handling — log, don't improvise scope

If reality forces you off-plan (extra work needed, a task skipped, approach
changed):

- Do NOT silently drift or expand scope beyond the task's files/action
- Note in STATE.md under Recent Progress: what deviated, why, and what changed
- Adjust remaining tasks accordingly; keep completed work committed and intact

## Pause vs push through

Pause when:

- A blocker appears that you cannot resolve inside the current task's scope
  (missing dependency, failing verify after honest fixes)
- You would need to change another phase's deliverables to proceed
- Uncommitted changes are piling up outside the plan's file list

Push through when:

- Verify failures are fixable within the task's own files
- Ambiguity can be resolved with an obvious minimal choice — record it as a
  note, not a blocker

When pausing mid-failure: write the failing wave/task + error into
`.reis/execution-state.json`, leave completed commits intact, tell the user.

## After each wave

- Show a compact status table of waves (completed/in-progress/pending)
- Update wave status in STATE.md; create a checkpoint entry
- On completion of all waves: write SUMMARY.md, mark the phase executed in
  STATE.md, then DELETE `.reis/execution-state.json`

## Completion criteria

Every task implemented with passing verify, one atomic commit per task,
SUMMARY.md reflects reality, execution-state.json cleared. Suggest
verification next.
