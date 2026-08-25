# Workflow: Debug Failure

Analyze a verification failure to its root cause, detect incomplete
implementations, and generate an executable FIX_PLAN.md for the
fix-and-reverify loop.

## Preconditions

- `.planning/` directory exists (if not, this is not a REIS project — run the
  new-project or map-codebase workflow first)
- A debug input exists: path to a verification report or DEBUG_INPUT file
  (default `.planning/DEBUG_INPUT.md`; run the verify workflow first if absent)

## Inputs

- Target (optional): report/plan file path or `--input <file>`
- Optional focus area to narrow the analysis

## Steps

1. Read the debug input and classify the issue type from its content:
   `incomplete-implementation` (missing deliverables / N/M complete markers),
   `test-failure`, `quality-issue`, `integration-issue`, or unknown.
2. Load project context: project name from `.planning/PROJECT.md`, current
   phase and last execution date from `.planning/STATE.md`.
3. Follow the 6-step root-cause protocol:
   - **Classify** — type (one of test-failure, quality-issue, docs-problem,
     regression, integration, dependency, incomplete-implementation),
     severity (CRITICAL/MAJOR/MINOR), scope (isolated/widespread)
   - **Symptom analysis** — what failed, where (file:line), when, how often,
     with error output quoted verbatim
   - **Root cause** — WHY it failed. For incomplete implementations, weigh
     executor skip (~70%), plan ambiguity (~20%), dependency blocker (~10%)
     using git history and evidence; for bugs, analyze logic and recent changes
   - **Impact assessment** — does it block the phase? Downstream impact?
     Priority (IMMEDIATE/HIGH/MEDIUM/LOW)
   - **Solution design** — generate 2–3 options with pros/cons/time/risk;
     for incomplete implementations recommend targeted re-execution of ONLY
     the missing features
   - **Fix planning** — write FIX_PLAN.md in PLAN.md format
4. Write `.planning/phases/phase-N/DEBUG_REPORT.md` using
   `templates/DEBUG_REPORT.md`.
5. Write `.planning/phases/phase-N/FIX_PLAN.md` using `templates/FIX_PLAN.md`:
   Objective, Context, Dependencies, fix tasks (`<task>` blocks with name,
   files, action, verify, done), Success Criteria, Verification. For
   incomplete implementations: scope only missing deliverables and state
   explicitly that completed tasks must NOT be re-implemented.
6. Hand off: execute FIX_PLAN.md (execute-plan workflow), then re-run the
   verify workflow on the original plan; loop until verification passes.

## Completion criteria

- DEBUG_REPORT.md exists with classification, evidence-backed root cause,
  impact assessment, and solution options
- FIX_PLAN.md exists, is executable (every task has files/action/verify/done),
  and its success criteria include "original plan now verifies at 100%"
- For incomplete implementations, the fix touches only missing features
- Next steps stated: review report → execute fix plan → re-verify

## References

- @templates/DEBUG_REPORT.md and @templates/FIX_PLAN.md (output formats)
- @docs/verification-patterns.md (stub/incomplete detection commands)
- @agents/reis_debugger (subagent for deep analysis)
