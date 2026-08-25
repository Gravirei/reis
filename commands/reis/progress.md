---
name: reis:progress
description: Report REIS project status from planning files — current phase, completed phases, active tasks, blockers, and next actions, with optional metrics, timeline, or dependency detail. Use when the user asks about progress or wants to visualize roadmap state.
argument-hint: "[--metrics] [--timeline] [--dependencies]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---
<objective>
Report current project status by reading `.planning/STATE.md` and
`.planning/ROADMAP.md`, ending with at least one concrete suggested next
action.
</objective>

<execution_context>
@~/.claude/reis/workflows/progress.md
@~/.claude/reis/references/state-format.md
</execution_context>

<process>
Read `$ARGUMENTS` and strip flags (all optional):
- `--metrics`: append execution metrics (waves, success rate, wave duration).
- `--timeline`: estimate execution timeline for the active plan's waves.
- `--dependencies`: render the wave dependency graph of the current plan.
This command replaces the old separate progress + visualize commands; all
visualization detail is folded into these optional flags.

Then follow the referenced workflow end-to-end. Display the kanban board
unless suppressed. Derive every number from real planning files — never guess.

Guardrails: if `.planning/` lacks STATE.md and ROADMAP.md, stop — this is not
a REIS project; recommend `/reis:new-project` or `/reis:map` instead. If the
files exist but are empty of meaningful content, say so honestly. Always end
the report with a suggested next action (e.g. `/reis:cycle <phase>`).
</process>
