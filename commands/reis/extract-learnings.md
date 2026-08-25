---
name: reis:extract-learnings
description: Mine completed REIS phases and milestones for durable lessons — decisions from .reis/decisions.json, deviations from SUMMARY.md files, root causes from DEBUG_REPORT.md files — and consolidate them into .planning/LEARNINGS.md. Use when a milestone or phase just finished and the user wants its lessons captured for future phases.
argument-hint: "[--milestone <name>]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---
<objective>
Consolidate evidenced lessons from finished work into `.planning/LEARNINGS.md`
(Confirmed Decisions / Patterns Discovered / Surprises / Recommendations).
</objective>

<execution_context>
@~/.claude/reis/workflows/extract-learnings.md
@~/.claude/reis/references/artifact-paths.md
</execution_context>

<process>
Read `$ARGUMENTS` and strip flags:
- `--milestone <name>`: restrict mining to that milestone's phases
  (default: all completed phases).

Then follow the referenced workflow end-to-end.

Guardrails: if no completed phase (SUMMARY.md) and no decisions exist, say so
and stop — do not invent lessons. Every retained lesson must cite its source
file. Never edit AGENTS.md-style instruction files without asking first;
propose condensed additions and wait for an explicit yes/no.
</process>
