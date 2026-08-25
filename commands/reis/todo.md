---
name: reis:todo
description: Add TODO items to or list TODO items from a REIS project's `.planning/STATE.md` so small follow-up work is never lost between phases. Use when the user wants to record or review small tasks without creating a phase.
argument-hint: "<description> | --list"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---
<objective>
Manage the TODOs section of `.planning/STATE.md`: append new entries with
date/context metadata, or list existing ones grouped or filtered by area.
</objective>

<execution_context>
@~/.claude/reis/workflows/todo.md
@~/.claude/reis/references/state-format.md
</execution_context>

<process>
Read `$ARGUMENTS` and route:
- Text description → add mode: append one `- [ ] ...` entry (with added date,
  phase, priority) to STATE.md's TODOs section; touch nothing else.
- `--list` (or no arguments) → list mode: show TODOs grouped by area, or
  filtered when an area name follows `--list`.

Then follow the referenced workflow end-to-end.

Guardrails: if `.planning/` is missing, stop — this is not a REIS project;
recommend `/reis:new-project` or `/reis:map`. Never create empty TODO entries.
If a TODO looks too large to remain a TODO, offer to promote it into a real
roadmap phase via `/reis:roadmap-edit add <feature>`.
</process>
