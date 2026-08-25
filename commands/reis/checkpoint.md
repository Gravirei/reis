---
name: reis:checkpoint
description: Manage REIS checkpoints — git-backed save points recorded in STATE.md that work can be restored from or compared against. Use when the user wants to create, list, restore, or compare save points in a REIS project.
argument-hint: "[list|create|restore|compare]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---
<objective>
Create, list, inspect, restore, and compare checkpoints — each pairing an
entry in `.planning/STATE.md` with a git commit so work can be resumed or
rolled back safely.
</objective>

<execution_context>
@~/.claude/reis/workflows/checkpoint.md
@~/.claude/reis/references/state-format.md
@~/.claude/reis/references/execution-state-format.md
</execution_context>

<process>
Read `$ARGUMENTS` and route to the subcommand mode (default `list`):
- `create [name] [--no-commit]`: validate unique name (generate
  `checkpoint-<date>-<time>` if omitted), commit pending changes unless
  suppressed, append entry to STATE.md.
- `list`: table of all checkpoint entries from STATE.md.
- `restore <name>`: confirm first; never destroy uncommitted work silently —
  offer stash/commit/discard/cancel.
- `compare <a> <b|HEAD>`: added/modified/deleted summary between commits.

Guardrails: if `.planning/` is missing, stop — this is not a REIS project.
Restore and compare require at least one existing checkpoint.
</process>
