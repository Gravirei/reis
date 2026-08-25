---
name: reis:verify
description: Verify a REIS phase against its PLAN.md — FR4.1 feature completeness, test suite, and code quality, producing VERIFICATION_REPORT.md. Use when the user wants to check whether an executed phase is actually done.
argument-hint: "<phase> [--strict]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---
<objective>
Verify that the target phase was actually implemented: every task's files and
features exist, tests pass, success criteria hold, and quality checks pass,
writing `.planning/phases/phase-N/VERIFICATION_REPORT.md` and updating STATE.md.
</objective>

<execution_context>
@~/.claude/reis/workflows/verify.md
@~/.claude/reis/contexts/verification.md
@~/.claude/reis/references/artifact-paths.md
</execution_context>

<process>
Read `$ARGUMENTS` and strip flags:
- `--strict`: fail on warnings, not just failures.
- `--verbose` / `--with-gates`: detailed evidence; run quality gates on PASS.

Then follow the referenced workflow end-to-end. Resolve `<phase>` to a
PLAN.md under `.planning/phases/<N>-*/` (or accept a plan path); stop if it
does not exist. Run FR4.1 completeness validation for EVERY task.
If verification FAILS, route to `/reis:debug <phase>` before any re-execution.
</process>
