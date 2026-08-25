# Workflow: Run Quality Gates

Run automated quality gate checks across four categories (security, quality,
performance, accessibility) and decide pass/warning/fail per the project's
gate configuration in `reis.config.js`.

## Preconditions

- `.planning/` directory exists
- Gate configuration known: read `gates` from `reis.config.js`, falling back
  to defaults (security and quality enabled; performance and accessibility
  opt-in; `blockOnFail: true`; timeout 30s)
- If gates are disabled in config, skip and report "gates disabled" as passed

## Inputs

- Category (optional): run all gates by default, or a single category —
  security | quality | performance | accessibility
- Optional modes:
  - **verbose** — show each check as it runs
  - **report** — write a markdown GATE_REPORT.md
  - **block-on-warning** — treat warnings as failures

## Steps

1. Run each enabled check. Concrete checks per category:
   - **Security**:
     * Vulnerabilities — run `npm audit`, count critical/high/moderate/low;
       fail if any at or above `failOn` (default high), else warn
     * Secrets detection — scan code files for hardcoded API keys, passwords,
       access tokens, private keys, AWS keys (`AKIA…`), GitHub tokens
       (`ghp_…`), JWTs, and DB connection strings with credentials; ignore
       allowed files (.env.example), tests, placeholders, env references;
       any real finding fails
     * License compliance — check node_modules licenses against allowed list
       (MIT, Apache-2.0, BSD-*, ISC, 0BSD, Unlicense) / forbidden list (GPL,
       AGPL); forbidden fails, unknown warns
   - **Quality**:
     * Code coverage — read coverage/ report; fail below `failOn` (60%),
       warn below `minimum` (80%), skip if no coverage data
     * Lint errors — run ESLint if configured; fail on errors when
       `failOnError`, fail on warnings only when `failOnWarning`
     * Code complexity — flag functions exceeding nesting depth
       (`maxCyclomaticComplexity` 10) or >50 lines; >10 offenders fails
     * Documentation — JSDoc coverage of exported functions vs
       `minimumCoverage` (50%); warn if below
   - **Performance** (opt-in):
     * Bundle size — total size of dist/build output vs warn/max thresholds
     * Build time — duration of build command vs max time
     * Dependencies — count and flag heavy packages (e.g., moment → date-fns,
       lodash → lodash-es)
   - **Accessibility** (opt-in):
     * Image alt text — img/Image tags without alt attributes
     * Form labels — inputs without associated labels
     * Heading structure — h1–h6 hierarchy violations
     * ARIA usage — invalid or suspicious ARIA attributes
     * Color contrast — potential low-contrast patterns
2. Record per-check status: passed, warning, failed, skipped (disabled or
   prerequisites missing, e.g., no ESLint config, no package.json).
3. Aggregate per category: failed check ⇒ category failed; else warning ⇒
   category warning; else passed.
4. Produce a report table with columns Category / Check / Status / Message /
   Details, plus an overall line: counts of passed/warning/failed/skipped and
   total duration. Write to GATE_REPORT.md if the report option is set.
5. Apply blocking rules:
   - Any failure with `blockOnFail: true` (default) ⇒ BLOCK: verification/
     cycle fails; issues are prefixed `[GATE:<category>]` and handed to the
     debug workflow
   - Warnings block only when block-on-warning is set
   - Otherwise warnings pass with notice

## Completion criteria

- Every enabled check has an explicit status (none left unreported)
- Overall result stated: PASSED, PASSED WITH WARNINGS, or FAILED, with counts
- Blocking decision matches config (`blockOnFail`, blockOnWarning)
- On failure: `[GATE:<category>]` issue list produced for the debug workflow

## References

- @docs/QUALITY_GATES.md (check catalog, configuration, thresholds)
- @templates/reis.config.template.js (gates config keys)
- @reis/workflows/debug.md (handling gate failures)
