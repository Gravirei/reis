# Reference: Artifact Paths

Canonical locations for every REIS-produced file. All planning artifacts live
under `.planning/`; all runtime state under `.reis/`.

## Phase artifacts — `.planning/phases/phase-N-<name>/`

One directory per phase. Both `phase-N-<name>` and plain `phase-N` directory
names are accepted when resolving.

| File | Produced by | Notes |
|---|---|---|
| `PLAN.md` | plan workflow | Format: templates/PLAN.md |
| `RESEARCH.md` | research workflow | Read before planning; extend or redo if it exists |
| `SUMMARY.md` | execute workflow (on completion) | What was built, deviations, verification |
| `VERIFICATION_REPORT.md` | verify workflow | FR4.1 completeness evidence |
| `DEBUG_REPORT.md` | debug workflow | Root-cause analysis |
| `FIX_PLAN.md` | debug workflow | PLAN.md-format fix tasks |
| `REVIEW_REPORT.md` | review workflow (report mode) | Task status table |

Multiple plans per phase may use `<N>-<plan>.PLAN.md` naming
(e.g. `.planning/phases/phase-2-core/2-1-command.PLAN.md`).

## Other `.planning/` locations

```
.planning/
  PROJECT.md              # project description
  REQUIREMENTS.md         # requirements
  ROADMAP.md              # phase breakdown
  STATE.md                # persistent state (see state-format.md)
  context.md              # analyst output (project analysis)
  phases/phase-N-<name>/  # per-phase artifacts (table above)
  research/               # scout/synthesizer output:
                          #   phase-{N}-research.md, context.md,
                          #   tech-recommendations.md, synthesis-{milestone}.md
  audits/
    audit-<scope>-<YYYY-MM-DD>.md   # integrator audit reports
  DEBUG_INPUT.md          # optional debug input (default target)
```

## Runtime state — `.reis/`

```
.reis/
  cycle-state.json        # cycle state machine cursor (resumable)
  execution-state.json    # task-level execution cursor (crash recovery)
  parallel-state.json     # parallel wave/batch tracker
```

`cycle-state.json` is deleted on cycle COMPLETE and kept on FAILED.
`execution-state.json` is deleted/reset when execution finishes so a stale
cursor cannot mislead resume.

## Legacy path resolution

Older REIS versions wrote reports elsewhere. When reading, accept legacy
locations; when writing, ALWAYS use the canonical locations above:

| Legacy location | Canonical replacement |
|---|---|
| `.planning/verification/<phase>/VERIFICATION_REPORT.md` | `.planning/phases/phase-N-<name>/VERIFICATION_REPORT.md` |
| `.planning/debug/[<phase>/]DEBUG_REPORT.md` | `.planning/phases/phase-N-<name>/DEBUG_REPORT.md` |
| `.planning/debug/[<phase>/]FIX_PLAN.md` or `fix-<slug>.PLAN.md` | `.planning/phases/phase-N-<name>/FIX_PLAN.md` |
| `.planning/phase-N.PLAN.md`, `priority-*/` folders | `.planning/phases/phase-N-<name>/PLAN.md` |

Resolution rule: search the canonical path first; if absent, fall back to the
legacy path (e.g. `reis debug .planning/verification/phase-1/VERIFICATION_REPORT.md`
is valid input). Never write new reports into legacy directories.

## Top-level project docs

`PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, and `AGENTS.md` live at the
repo root or under `.planning/`; workflows always read them from `.planning/`.
