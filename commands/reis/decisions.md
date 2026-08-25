---
name: reis:decisions
description: Track architectural decisions in a REIS project's `.reis/decisions.json` — add records with full context, list/filter them, view details, or export to JSON/CSV. Use when the user wants to record why a technical choice was made or review past decisions.
argument-hint: "add | list | view <id> | export"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---
<objective>
Persist architectural/technical decisions as schema-valid records in
`.reis/decisions.json`, and report or export exactly what is stored.
</objective>

<execution_context>
@~/.claude/reis/workflows/decisions.md
@~/.claude/reis/references/artifact-paths.md
</execution_context>

<process>
Read `$ARGUMENTS` and route:
- `add` → gather treeId, selected path, metadata, context; append a UUID-keyed
  record (create `.reis/decisions.json` as `[]` if missing).
- `list [filters]` → table of short id, tree, path, date, status; filters via
  `--tree`, `--phase`, `--reverted`, `--limit`.
- `view <id>` → full detail (prefix-matched id ok).
- `export [--format json|csv] [--output <path>]` → filtered file write.
`revert <id> [--reason]` is also supported for undoing a decision.

Then follow the referenced workflow end-to-end.

Guardrails: if `.planning/` is missing, stop — this is not a REIS project.
Only record decisions actually made (e.g. via `/reis:tree` selection) — never
invent one. Export must report the written path and exact record count.
</process>
