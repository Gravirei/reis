# Workflow: Run Cycle

Run the full automated loop for one phase: PLAN → REVIEW → EXECUTE → VERIFY →
GATE → DEBUG (+FIX) → re-VERIFY, tracking every transition in a state machine
so the cycle can be interrupted and resumed at any point.

## Preconditions

- `.planning/` directory exists (if not, this is not a REIS project — run the
  new-project or map-codebase workflow first)
- A phase number or plan path is given
- No other cycle is currently active (if `.reis/cycle-state.json` exists with a
  non-terminal state, offer to resume before starting fresh)

## Inputs

- Phase number or plan path (required)
- Optional flags:
  - `--skip-research` — skip the research step before planning
  - `--skip-review` — skip plan review before execution
  - `--skip-gates` — skip quality gates after verification
  - `--gate-only <category>` — run only one gate category (security, quality,
    performance, accessibility)
  - `--auto-fix` — apply generated fix plans without asking
  - `--continue-on-fail` — treat verification failure as warning, not blocker
  - `--max-attempts <n>` — max debug/fix attempts (default 3)
  - `--resume`, `--resume-execution` — resume an interrupted cycle and its
    inner execution state; combines with `--from-wave` / `--from-task` /
    `--auto-stash`

## Steps

1. Initialize `.reis/cycle-state.json` with fields: `phase`, `planPath`,
   `currentState`, `startTime`, `attempts` (0), `maxAttempts`, `options`,
   `history[]`. State machine states are exactly: IDLE, PLANNING, REVIEWING,
   EXECUTING, VERIFYING, GATING, DEBUGGING, FIXING, COMPLETE, FAILED. Update
   `currentState` and append to `history` on EVERY transition.
2. **PLANNING**: if no plan exists for the phase, run the plan workflow;
   validate the resulting plan structure. Invalid/unusable plan → FAILED.
3. **REVIEWING** (unless `--skip-review`): run the plan review workflow against
   the codebase; apply or report suggested fixes before executing.
4. **EXECUTING**: run the execute workflow for the plan (wave-by-wave,
   task-level checkpoints in `.reis/execution-state.json`, atomic commits).
   Execution error → FAILED.
5. **VERIFYING**: run the verify workflow — execute the plan's verification
   commands, check all success criteria and features exist, and compute a
   completeness percentage. Pass (100%) → GATING; fail (<100%) → DEBUGGING.
6. **GATING** (unless `--skip-gates`): run quality gates — security, quality,
   performance, accessibility per config (`--gate-only` restricts categories).
   All pass → COMPLETE. Any fail (with blocking enabled) → DEBUGGING, prefixing
   each issue with `[GATE:<category>]`.
7. **DEBUGGING**: run the debug workflow on the collected verification/gate
   failures to produce `.planning/phases/<N>-<name>/FIX_PLAN.md`. If attempts
   ≥ maxAttempts, transition to FAILED instead of generating another fix.
8. **FIXING**: show the fix plan to the user and ask to apply (apply without
   asking when `--auto-fix`). User declines or fix fails → FAILED. Fix applied
   and committed → back to VERIFYING (increment `attempts`).
9. Loop VERIFYING → GATING → DEBUGGING → FIXING until COMPLETE, attempts are
   exhausted, or the user stops.
10. **COMPLETE**: update `.planning/STATE.md` with the outcome, display a
    compact summary table of cycle steps (state, duration, result), suggest the
    next phase, then clear `.reis/cycle-state.json`.
11. **FAILED**: keep `.reis/cycle-state.json` (it is resumable), report the
    last error, current state, attempts used, completeness, and recovery
    options: fix manually, resume via `--resume`, raise `--max-attempts`, or
    rerun with `--continue-on-fail`.

## Completion criteria

- Verification passed at 100% completeness and gates passed (or were skipped)
- STATE.md reflects completion; cycle-state.json is cleared on success
- Every state transition was persisted to cycle-state.json history
- On failure: state file preserved with actionable recovery guidance shown

## References

- @docs/CYCLE_WORKFLOW.md (full state machine spec and transitions)
- @reis/workflows/plan.md, @reis/workflows/execute.md,
  @reis/workflows/resume.md (sub-workflows invoked by each state)
- @docs/QUALITY_GATES.md (gate categories and thresholds)

<!-- Migration note: from lib/commands/cycle.ts + lib/utils/cycle-orchestrator.
Banners/ASCII diagrams replaced by "display a compact summary table". -->
