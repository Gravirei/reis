---
name: reis:tree
description: Walk a REIS decision tree with the user to choose between alternatives (auth strategy, database, state management, etc.), or list/lint tree files. Use when the user faces an architecture choice or wants to inspect decision trees.
argument-hint: "[list|select|show|lint] [name]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---
<objective>
Walk a structured decision tree interactively (or display it statically) to
reach a leaf choice; optionally record the result via `/reis:decisions`.
Also supports linting tree files for structural/semantic issues.
</objective>

<execution_context>
@~/.claude/reis/workflows/tree.md
</execution_context>

<process>
Read `$ARGUMENTS` and route:
- no args or `list` → enumerate the seven built-in templates under
  `templates/decision-trees/` with their titles.
- `show <file> [--interactive]` / `select <name>` → parse every
  `## Decision Tree:` section; interactive walks branch-by-branch to a leaf,
  static renders an indented outline.
- `lint <file> [--strict]` → report errors/warnings per tree with fix
  suggestions; warnings pass unless strict.
Other modes (`new`, `diff`, `export`) exist in the workflow if requested.

Then follow the referenced workflow end-to-end.

Guardrails: no planning directory required — trees work in any repo. If a
file has no `## Decision Tree:` headings, explain the expected format and
stop. After an interactive selection, ask before recording a decision — never
record one unbidden.
</process>
