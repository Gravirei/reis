# Workflow: Verify Phase

Verify that a plan was actually implemented: FR4.1 feature completeness against
PLAN.md success criteria, test suite results, and code quality, producing
VERIFICATION_REPORT.md.

## Preconditions

- `.planning/` directory exists (if not, this is not a REIS project — run the
  new-project or map-codebase workflow first)
- A target was provided: phase number, phase name, or path to a PLAN.md file
- The resolved plan file exists (if not, stop and tell the user)

## Inputs

- Target (required): phase number (`2`), phase name (`core-implementation`),
  or explicit plan path (`.planning/phases/phase-2-core/2-1-command.PLAN.md`)
- Optional modes:
  - **verbose** — include detailed evidence in output
  - **strict** — fail on warnings, not just failures
  - **with-gates** — run quality gates after verification passes

## Steps

1. Resolve the target to a PLAN.md file: for a phase number or name, pick the
   first PLAN.md in `.planning/phases/<N>-*/`.
2. Parse the plan: extract the Objective, every `<task>` block with its
   `<name>` and `<files>`, and each Success Criteria bullet.
3. Run the test suite (`npm test`, or Jest/Vitest/Node test runner if
   configured) and record pass/fail counts, failures with file/line/error,
   and coverage if available.
4. Validate code quality: check for syntax errors and run the linter if one
   is configured.
5. **Feature completeness validation (FR4.1) — critical.** For EVERY task:
   - Verify each expected file exists (`test -f`, `git ls-files`)
   - Grep for expected functions/classes/endpoints mentioned in the action
   - Check for a corresponding test file
   - Record evidence for complete tasks (file, line number, match count) and
     missing deliverables with the search commands that returned nothing
   - Compute completion % = completed tasks / total tasks
6. Validate each Success Criterion individually with supporting evidence.
7. Check documentation: README/CHANGELOG updated, code comments adequate.
8. Write `.planning/phases/phase-N/VERIFICATION_REPORT.md` using
   `templates/VERIFICATION_REPORT.md`: Executive Summary, Feature Completeness
   (task-by-task table with Status/Evidence columns), Test Results, Success
   Criteria, Code Quality, Documentation, Issues Summary by severity,
   Recommendations, Next Steps.
9. Update `.planning/STATE.md` with the verification entry (date, status,
   test counts, completeness, report path).

## Completion criteria

- Overall status decided: **PASS** requires 100% task completion, passing
  tests, and acceptable quality (<100% is always FAIL); **PASSED WITH
  WARNINGS** when complete but minor issues exist (no tests, lint warnings)
- VERIFICATION_REPORT.md written with FR4.1 section showing evidence per task
- STATE.md records the result
- If FAILED: report lists which tasks are incomplete and why — hand off to
  the debug workflow before re-executing

## References

- @templates/VERIFICATION_REPORT.md (report format)
- @docs/VERIFICATION.md and @docs/verification-patterns.md (FR4.1 protocol,
  stub detection commands)
- @agents/reis_verifier (subagent for large plans)
