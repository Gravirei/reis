# Workflow: Autonomous Run

Run every remaining ROADMAP phase end-to-end without further interaction: for
each phase RESEARCH (if missing) → PLAN → REVIEW → EXECUTE → VERIFY, plus GATE
and DEBUG only when configured — with one upfront confirmation, a per-phase
progress report, and automatic termination on completion or hard failure.

## Preconditions

- `.planning/` directory exists with ROADMAP.md and STATE.md (if not, this is
  not a REIS project — run the new-project or map-codebase workflow first)
- No other cycle is currently active (`.reis/cycle-state.json` must be absent
  or terminal; otherwise offer resume first)

## Inputs

- Optional flags:
  - `--from-phase N` — start at phase N instead of the first incomplete phase
  - `--dry-run` — print the ordered phase list and exit; no confirmation, no work
- Failure policy comes from `reis.config.js`: `waves.continueOnError` (default
  false = any phase failure stops the run) and `gates.enabled` (default true =
  run quality gates and debugging inside each phase cycle)

## Steps

1. Read `.planning/ROADMAP.md` and STATE.md; determine every phase not yet
   COMPLETE (ROADMAP checkboxes plus absence of `SUMMARY.md`). Order them by
   phase number; drop any before `--from-phase N` when given.
2. If `--dry-run`: display the ordered phase list (number, name, delivers) and
   the effective failure/gate policy, then stop.
3. **Pre-flight confirmation (exactly once):** display the phases about to run
   with their goals, the failure policy (`waves.continueOnError`), whether
   gates will run, and the consecutive-failure cap. Require explicit user
   confirmation. After confirmation the run proceeds fully unattended — do not
   prompt again except to stop.
4. Initialize `.reis/cycle-state.json` following the cycle conventions: fields
   `mode: "autonomous"`, `phaseQueue[]`, `currentPhase`, `currentState`,
   `startTime`, `attempts`, `maxAttempts`, `options`, `history[]`; states are
   exactly IDLE, PLANNING, REVIEWING, EXECUTING, VERIFYING, GATING, DEBUGGING,
   FIXING, COMPLETE, FAILED. Append to `history` on EVERY transition.
5. For each phase in order, run the single-cycle stages:
   - **Research**: skip when `.planning/research/phase-N-research.md` already
     exists; otherwise run the research workflow for the phase
   - **PLANNING** → **REVIEWING** → **EXECUTING** → **VERIFYING** exactly as
     the cycle workflow defines (plan validation, review fixes, wave-by-wave
     execution, FR4.1 verification producing VERIFICATION_REPORT.md)
   - **GATING/DEBUGGING/FIXING**: only when `gates.enabled` is true; otherwise
     a passing verification goes straight to phase COMPLETE
6. After each phase completes (or fails), display a per-phase progress report:
   phase number/name, outcome, verification completeness %, test pass/fail
   counts, duration, phases remaining — and persist the result in
   cycle-state.json before starting the next phase.
7. Failure policy per failed phase:
   - `waves.continueOnError: false` (default) → hard failure: record the phase
     as FAILED in cycle-state.json and stop the whole run immediately
   - `waves.continueOnError: true` → record the failure, keep going
   In BOTH cases stop autonomously after **3 consecutive** phase failures —
   continuing past that almost always compounds the root cause.
8. On stop (hard failure or cap): keep `.reis/cycle-state.json` resumable and
   report the failing phase(s), last error, attempts used, and recovery
   options (fix manually, rerun with `--from-phase N`, raise maxAttempts).
9. On success (all queued phases COMPLETE): clear cycle-state.json, update
   `.planning/STATE.md` with a final autonomous-run entry, and display a
   compact summary table (phase, result, completeness %, duration) plus next
   steps (milestone completion, shipping).

## Completion criteria

- Every queued phase ran its full stage sequence and ended COMPLETE, or the
  run stopped per the failure policy / consecutive-failure cap
- Exactly one user confirmation occurred, before any work started
- A progress report was displayed after every phase and persisted to history
- On success: cycle-state.json cleared, STATE.md updated; on stop: state kept
  with actionable recovery guidance shown

## References

- @reis/workflows/cycle.md (per-phase state machine this loop reuses)
- @reis/workflows/research.md, @reis/workflows/plan.md,
  @reis/workflows/review.md, @reis/workflows/execute.md,
  @reis/workflows/verify.md, @reis/workflows/gate.md, @reis/workflows/debug.md
- @reis/references/artifact-paths.md (research/report locations)
- @reis/references/config-format.md (waves.continueOnError, gates.enabled)

<!-- Migration note: extends lib/utils/cycle-orchestrator.ts multi-phase mode.
Kanban banners dropped; agents show compact tables instead. -->
