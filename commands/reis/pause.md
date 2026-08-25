---
name: reis:pause
description: Pause a REIS session by turning STATE.md into a complete handoff document — progress, WIP position, next steps, decisions, blockers — so any future agent can resume without context loss. Use when stopping work on a REIS project mid-stream.
argument-hint: "[note]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---
<objective>
Pause the current session by writing a complete handoff into
`.planning/STATE.md` so any future agent or developer can resume without
context loss.
</objective>

<execution_context>
@~/.claude/reis/workflows/pause.md
@~/.claude/reis/references/state-format.md
</execution_context>

<process>
Read `$ARGUMENTS` as an optional free-text note about why work is pausing;
record it in the handoff under Recent Progress.

Assess actual progress from STATE.md, `.reis/execution-state.json` (if
present), and `git status`, then update STATE.md with: verified progress,
exact WIP task/wave position, ordered next steps, active decisions with
rationale, and blockers.

Guardrails: if `.planning/` is missing, stop — this is not a REIS project.
Do not start new work; leave uncommitted code untouched and note its existence
in the WIP section.
</process>
