---
name: reis:execute
description: Execute a REIS phase plan wave-by-wave with atomic commits, task-level checkpoints, deviation handling, and crash-safe resume. Use when the user wants to implement a planned phase.
argument-hint: "<phase> [--resume] [--from-wave N] [--from-task N]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---
<objective>
Execute the approved PLAN.md for the given phase, wave by wave and task by task,
producing atomic commits, keeping `.planning/STATE.md` and
`.reis/execution-state.json` current, and finishing with a SUMMARY.md.
</objective>

<execution_context>
@~/.claude/reis/workflows/execute.md
@~/.claude/reis/contexts/execution.md
@~/.claude/reis/references/state-format.md
@~/.claude/reis/references/artifact-paths.md
@~/.claude/reis/references/commit-conventions.md
</execution_context>

<process>
Read `$ARGUMENTS` and strip flags:
- `--resume`: recover from `.reis/execution-state.json` instead of starting fresh.
- `--from-wave N` / `--from-task N`: jump to a specific wave/task (implies resume semantics).

Then follow the referenced workflow end-to-end. Do not skip validation gates.
If the plan is missing or stale (codebase already implements parts of it),
stop and recommend `/reis:verify` or `/reis:review` first.
</process>
