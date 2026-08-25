# Context: Verification, Gates & Debug Primer

Load this before verifying a phase, running quality gates, or debugging
failures.

## Verify against success criteria, not vibes

- Resolve the target to its PLAN.md; extract the Objective, every `<task>`
  block, and each Success Criteria bullet
- FR4.1 feature completeness: for EVERY task — check each expected file
  exists (`test -f`, `git ls-files`), grep for expected
  functions/classes/endpoints, look for a corresponding test. Record evidence
  (file:line, match count) for passes and the search that found nothing for
  misses. Completion % = completed tasks / total tasks.
- Run the actual test suite (`npm test`, Jest/Vitest/Node runner) and linter;
  quote failures with file/line/error
- PASS requires 100% task completion + passing tests + acceptable quality.
  <100% is ALWAYS FAIL. "PASSED WITH WARNINGS" only when complete but minor
  issues exist (no tests, lint warnings).
- Output: VERIFICATION_REPORT.md with per-task Status/Evidence table; record
  the result in STATE.md

## All four gate categories exist

Quality gates run after verification (cycle step GATING):

1. **security**
2. **quality**
3. **performance**
4. **accessibility**

Config: `gates.enabled`, `blockOnFail: true`, `blockOnWarning: false`,
timeout 30000ms. `--gate-only <category>` restricts to one category; gate
issues entering debug are prefixed `[GATE:<category>]`.

## The failure loop

```
VERIFYING (fail) → DEBUGGING → FIX_PLAN.md → FIXING → VERIFYING → ...
```

- DEBUGGING: classify (`test-failure`, `quality-issue`, `docs-problem`,
  `regression`, `integration`, `dependency`, `incomplete-implementation`),
  severity (CRITICAL/MAJOR/MINOR), then root cause. For incomplete
  implementations weigh: executor skip ~70%, plan ambiguity ~20%,
  dependency blocker ~10%. Write DEBUG_REPORT.md + FIX_PLAN.md (PLAN.md
  format; every fix task needs files/action/verify/done).
- FIXING scope rule: for incomplete implementations touch ONLY missing
  deliverables — completed tasks must NOT be re-implemented. FIX_PLAN success
  criteria must include "original plan now verifies at 100%".
- After a fix is applied and committed → back to VERIFYING.

## Max attempts semantics

- Cycle state tracks `attempts` vs `maxAttempts` (default 3,
  `--max-attempts <n>`)
- Each debug→fix round increments `attempts`
- When `attempts >= maxAttempts`: transition to FAILED instead of generating
  another fix plan; keep `.reis/cycle-state.json` (resumable) and report
  lastError, attempts used, completeness, and recovery options
  (manual fix, `--resume`, raise `--max-attempts`, or `--continue-on-fail`)
- COMPLETE only on 100% completeness + gates passed (or skipped)
