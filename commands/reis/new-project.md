---
name: reis:new-project
description: Initialize a new REIS project by creating the .planning/ structure (PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md) from a project idea. Use when starting a REIS project from scratch.
argument-hint: "[idea]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---
<objective>
Initialize a REIS project: create `.planning/` with PROJECT.md, REQUIREMENTS.md,
ROADMAP.md, and STATE.md derived from the user's project idea.
</objective>

<execution_context>
@~/.claude/reis/workflows/new-project.md
@~/.claude/reis/references/state-format.md
@~/.claude/reis/references/artifact-paths.md
</execution_context>

<process>
Read `$ARGUMENTS` as the project idea. If absent, ask the user to describe it
before proceeding.

Then follow the referenced workflow end-to-end.
- If `.planning/` already exists, ask whether to preserve or start over — never
  silently overwrite.
- For an existing codebase instead of a greenfield idea, recommend `/reis:map`.
- Do not write code or plans here; this only seeds the planning artifacts.
</process>
