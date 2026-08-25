# Workflow: Workflow Forensics

Post-mortem for a REIS workflow failure — not a code bug. When a cycle dies
unexpectedly, leaves stale cursors behind, or produces artifacts that don't
add up, audit the REIS process's own state files and artifact chain, identify
the root cause, and produce a recovery plan.

**Boundary**: failures *in the built product* belong to the debug workflow;
failures *of the workflow machinery itself* (corrupt state, broken artifact
chains, gate bypasses) belong here.

## Preconditions

- `.planning/` directory exists (if not, there is nothing to autopsy — this
  is not a REIS project)
- A suspected workflow failure: crashed/interrupted cycle, resume that
  behaves oddly, verification claims that lack evidence, or state files that
  look inconsistent

## Inputs

- Optional flag: `--phase N` — scope the audit to one phase's artifacts
  (default: all phases referenced by STATE.md / ROADMAP.md)
- State files audited (read-only during analysis):
  `.reis/cycle-state.json`, `.reis/execution-state.json`,
  `.reis/parallel-state.json` (see @reis/references/execution-state-format.md)
- Artifact chain expectations from @reis/references/artifact-paths.md
- Output written: `.planning/FORENSICS.md`

## Steps

1. **Parse validity** — attempt JSON.parse on every `.reis/*.json` file.
   Record parse errors, truncation, empty files, or invalid enum values
   (e.g. `currentState` outside the known set) as findings.
2. **Cycle-state history integrity** — check `history[]` for monotonic
   timestamps (each entry ≥ previous), sane durations (non-negative ms),
   legal transitions between states, and `lastUpdated` consistency with the
   last history entry. Backwards clocks, negative durations, and impossible
   jumps (e.g. IDLE→GATING) are findings.
3. **Artifact chain presence** — per phase in scope, verify the
   PLAN → SUMMARY → VERIFICATION_REPORT chain per artifact-paths.md
   (canonical paths first, legacy fallbacks noted). Missing links, SUMMARY
   without PLAN, or VERIFICATION referencing nonexistent paths are findings.
4. **Orphaned waves** — compare waves recorded in STATE.md Completed Waves /
   execution-state history against sections in each phase's SUMMARY.md. A
   wave marked executed with no SUMMARY section is orphaned.
5. **Checkpoint drift** — compare `.reis/execution-state.json`
   (`currentWave`, `lastCompletedWave`) against STATE.md Active Wave /
   Completed Waves. Presence of a stale execution-state.json after normal
   completion (it should be deleted) is itself a finding.
6. **Gate bypass detection** — read gates config (see
   @reis/references/config-format.md). If `gates.enabled` and a phase shows
   VERIFY passed (VERIFICATION_REPORT.md success) but no gate evidence exists
   (gate report/output, `gateResult` in cycle-state), flag a bypass finding.
7. Write `.planning/FORENSICS.md`: a findings table (check → result ✓/✗ →
   evidence file:line), the deduced **root cause**, and a **recovery plan**
   with concrete steps (delete stale cursors, re-run specific waves, restore
   from checkpoint via `/reis:checkpoint restore`).
8. Route the recovery:
   - Recoverable cursor/state corruption → `/reis:resume` (with the exact
     flags the plan recommends)
   - Incomplete/broken deliverables discovered along the way → `/reis:debug`
     on the affected phase
   - Both → forensics recovery first (fix the machinery), then debug
9. Summarize findings and the chosen route to the user.

## Completion criteria

- All six audit checks ran, each with pass/fail recorded and evidence cited
- FORENSICS.md exists with findings table, root cause, and executable
  recovery plan
- Code-level product failures were routed to debug, workflow corruption
  handled here — the boundary was applied and stated
- Recommended next command (`resume` / `debug` / both, in order) is explicit

## References

- @reis/references/execution-state-format.md (.reis/*.json schemas)
- @reis/references/artifact-paths.md (artifact chain expectations)
- @reis/references/state-format.md (STATE.md ground truth)
- @reis/workflows/resume.md and @reis/workflows/debug.md (recovery routes)
