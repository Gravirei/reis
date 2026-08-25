---
name: reis:debug
description: Debug a REIS verification failure to its root cause using the 6-step protocol, detecting incomplete implementations and generating an executable FIX_PLAN.md for the fix-and-reverify loop. Use when verification or quality gates fail and the user wants targeted fixes.
argument-hint: "[phase] [--input <report>]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---
<objective>
Analyze the failure to root cause via the 6-step protocol (classify, symptom
analysis, root cause, impact assessment, solution design, fix planning), then
write DEBUG_REPORT.md and an executable FIX_PLAN.md scoped to only what is
missing or broken.
</objective>

<execution_context>
@~/.claude/reis/workflows/debug.md
@~/.claude/reis/contexts/verification.md
@~/.claude/reis/references/artifact-paths.md
</execution_context>

<process>
Read `$ARGUMENTS` and strip flags:
- `--input <file>`: debug this report instead of the default
  `.planning/DEBUG_INPUT.md`.

Resolve `[phase]` to `.planning/phases/<N>-*/` if given. Then follow the
referenced workflow end-to-end. Guardrail: if no debug input exists, stop and
recommend `/reis:verify` first.

Fix-and-reverify loop: execute FIX_PLAN.md (via `/reis:execute-plan`), then
re-run `/reis:verify` on the original plan. Repeat until verification passes,
to a maximum of 3 debug attempts — after that, stop and surface remaining
issues to the user instead of looping further.
</process>
