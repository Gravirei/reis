---
name: reis:doctor
description: Diagnose REIS installation integrity and project state health across all platforms — missing files, stale versions, malformed state, broken hook wiring — and print a repair plan. Use when REIS behaves oddly or after upgrading.
argument-hint: "[--fix]"
allowed-tools:
  - Read
  - Bash
  - Grep
  - Glob
---
<objective>
Verify that the REIS install is intact on every detected platform and that
the current project's `.planning/` / `.reis/` state is healthy; report a
status matrix and an actionable repair plan.
</objective>

<execution_context>
@~/.claude/reis/workflows/doctor.md
@~/.claude/reis/references/artifact-paths.md
@~/.claude/reis/references/state-format.md
@~/.claude/reis/references/execution-state-format.md
</execution_context>

<process>
Read `$ARGUMENTS`; `--fix` enables safe auto-repairs (see workflow step 5).

Follow the referenced workflow end-to-end. This command is read-only unless
`--fix` was given, and even then only rewrites malformed runtime JSON with a
backup — never reinstalls or deletes without printing the exact command.
</process>
