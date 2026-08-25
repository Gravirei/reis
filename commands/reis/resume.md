---
name: reis:resume
description: Detect what REIS work was interrupted (cycle, execution, wave, or checkpoint) and continue from exactly where it stopped without redoing completed work. Use when returning to a REIS project after a session ended mid-work.
argument-hint: "[--list] [--continue] [--checkpoint <name>] [--auto] [--force]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---
<objective>
Detect interrupted REIS work from real state files, reconcile it with git, and
resume the cycle, execution, or checkpoint — completing only what remains.
</objective>

<execution_context>
@~/.claude/reis/workflows/resume.md
@~/.claude/reis/references/state-format.md
@~/.claude/reis/references/execution-state-format.md
</execution_context>

<process>
Read `$ARGUMENTS` and strip flags (`--list`, `--continue`, `--checkpoint`,
`--auto`, `--force`).

Detect state via `.reis/cycle-state.json` first: if present with `currentState`
not COMPLETE/FAILED, resume the interrupted cycle. Otherwise check
`.reis/execution-state.json` for an in-progress wave/task, then active waves
and checkpoints in `.planning/STATE.md`. With `--list`, show all resume points
and stop.

Before continuing, re-read STATE.md, the active PLAN.md, both state files, and
`git status` — stash or commit dirty-tree changes before resuming.

Guardrails: if `.planning/` is missing, stop — this is not a REIS project.
If nothing is resumable, say so plainly and suggest next steps rather than
restarting completed work.
</process>
