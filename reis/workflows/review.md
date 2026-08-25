# Workflow: Review Plan

Validate plan files against the actual codebase before execution, catching
bad paths, missing dependencies, and already-implemented work early.

## Preconditions

- `.planning/` directory exists (if not, this is not a REIS project — run the
  new-project or map-codebase workflow first)
- A target was provided: a PLAN.md file or a directory of plans (defaults to
  the whole `.planning/` directory)

## Inputs

- Target (optional): plan file path or directory; default `.planning/`
- Optional modes:
  - **auto-fix** — correct simple issues directly in the plan (e.g., wrong
    paths) instead of only reporting them
  - **strict** — treat warnings as failures
  - **report** — save the full report to REVIEW_REPORT.md

## Steps

1. Collect plans to review: single file if given a file path, otherwise every
   `*.PLAN.md` under the target directory.
2. For each task in each plan, run these checks:
   - **File existence** — does each `<files>` target exist in the codebase?
     Flag `path_error` for invalid paths.
   - **Already-implemented detection** — grep for functions/classes/exports
     the task says it will create. If they already exist, flag
     `already_complete` (the plan may be stale).
   - **Conflict detection** — would the task overwrite an existing function
     or export? Flag `conflict`.
   - **Dependency analysis** — is every npm package the task relies on present
     in `package.json` / `node_modules`? Flag `missing_dependency` otherwise.
3. Apply auto-fixes when enabled: correct common path errors (e.g.,
   `lib/util` → `lib/utils`) by editing the plan file, and record each change.
4. Classify each task with a status: `ok`, `already_complete`, `path_error`,
   `missing_dependency`, or `conflict`.
5. Produce a report table per plan with columns Task / Status / Issue / Fix,
   plus a summary: plans reviewed, plans OK, plans with issues,
   auto-fixed count, manual-review count.
6. Write the report to `.planning/phases/phase-N/REVIEW_REPORT.md` when the
   report option is set, using `templates/REVIEW_REPORT.md`.
7. Update `.planning/STATE.md` under Recent Progress noting review outcome.

## Completion criteria

- Every task in every reviewed plan has an explicit status
- Critical issues (`conflict`, `missing_dependency`) are listed with concrete
  fixes before execution proceeds
- Auto-fixed changes are recorded as a Changes Made list per plan
- In strict mode, stop with failure if any critical issue or warning remains;
  otherwise report counts and let execution decide
- If `already_complete` dominates a plan, recommend regenerating it rather
  than executing

## References

- @templates/REVIEW_REPORT.md (report format)
- @docs/PLAN_REVIEW.md (check catalog and status codes)
- @agents/reis_plan_reviewer (subagent for large or ambiguous plans)
