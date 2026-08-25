---
name: reis:review
description: Review a REIS plan file against the actual codebase before execution, detecting bad paths, missing dependencies, conflicts, and already-implemented work. Use when the user wants pre-execution validation of a PLAN.md.
argument-hint: "[phase] [--auto-fix] [--strict]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---
<objective>
Validate plan files against the real codebase before execution: check file
paths, detect already-implemented features and conflicts, verify declared
dependencies exist, optionally auto-fix simple issues, and produce a
task-by-task report (REVIEW_REPORT.md when requested).
</objective>

<execution_context>
@~/.claude/reis/workflows/review.md
@~/.claude/reis/contexts/planning.md
@~/.claude/reis/contexts/verification.md
@~/.claude/reis/references/artifact-paths.md
</execution_context>

<process>
Read `$ARGUMENTS` and strip flags:
- `--auto-fix`: correct simple issues (e.g., wrong paths) directly in the
  plan instead of only reporting them.
- `--strict`: treat warnings as failures.

Resolve `[phase]` to its plan(s); default to all `*.PLAN.md` under
`.planning/`. Then follow the referenced workflow end-to-end.
Guardrails: if `already_complete` dominates a plan, recommend regenerating it
rather than executing. If critical issues (`conflict`, `missing_dependency`)
remain unfixed after review, stop and recommend `/reis:plan` or manual fixes
before `/reis:execute`.
</process>
