# Workflow: Audit Milestone

Cross-phase integration audit for a milestone (or all completed phases):
verify deliverables exist, detect stub implementations, and validate API
contracts between phases. Not part of the default cycle — invoked explicitly.

## Preconditions

- `.planning/` directory exists with ROADMAP.md and STATE.md
- At least one phase is complete (has SUMMARY.md / passing verification)
- Scope given: a milestone identifier, a single `--phase N`, or default to
  all completed phases

## Inputs

- Scope (optional): milestone name or phase number
- Optional modes:
  - **strict** — fail on ANY missing deliverable, failing test, stub
    implementation, or integration issue
  - **verbose** — report every file checked, test result, and integration
    point with timing
  - **output** — custom report location

## Steps

1. Read `.planning/ROADMAP.md` and `.planning/STATE.md` to enumerate the
   phases in scope and their expected deliverables.
2. Per phase, verify completion: all planned deliverables exist, tests pass,
   documentation is present, code follows project patterns.
3. **Stub detection** — scan the codebase for placeholders using the patterns
   in docs/verification-patterns.md:
   - TODO/FIXME/XXX comments; "not implemented" throws; empty function bodies;
     placeholder returns; mock data in production paths; commented-out service
     calls; 501 Not Implemented responses; suspiciously small files; test
     files without assertions
4. **API contract validation between phases** — where one phase exports and a
   later phase imports:
   - List exports from each upstream phase (`grep -rn "^export" ...`)
   - List imports in downstream phases
   - Verify every import resolves to a real export (flag missing exports),
     no unresolved symbols, signatures match call sites, and shared types are
     consistent across phase boundaries
5. Classify findings: Critical (blockers), Warnings, Tech Debt.
6. Create `.planning/audits/` if missing and write the report there as
   `audit-<scope>-<YYYY-MM-DD.md>` including:
   - Summary table: Status (PASS/PARTIAL/FAIL), Completion %, Integration
     Health (HEALTHY/WARNINGS/ISSUES)
   - Phases Audited table with columns Phase / Status / Deliverables (X/Y) /
     Tests / Integration
   - Issues Found grouped by severity, Recommendations, Next Steps
7. Decide outcome: PASS when all deliverables exist and integration is clean;
   PARTIAL when warnings only; FAIL on any blocker. In strict mode any single
   issue fails the audit.

## Completion criteria

- Report written under `.planning/audits/` covering every phase in scope
- Every cross-phase import/export boundary checked with specific evidence
  (file:line references, not vague reports)
- Stub implementations listed with exact locations
- Outcome (PASS/PARTIAL/FAIL) stated with blocking issues called out

## References

- @docs/verification-patterns.md (stub detection and wiring commands)
- @agents/reis_integrator (subagent for large milestones)
