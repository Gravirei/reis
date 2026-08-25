---
name: reis:ingest-docs
description: Bootstrap REIS .planning/ drafts (PROJECT.md, REQUIREMENTS.md) from existing repo documents — ADRs, PRD/spec files, README architecture sections — extracting only what is evidenced, with confidence notes and an Open Questions list. Use when onboarding REIS onto a project whose requirements live in documents rather than code.
argument-hint: "[--docs-dir <path>]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---
<objective>
Extract evidenced project facts from existing documentation into
`.planning/PROJECT.md` and `.planning/REQUIREMENTS.md` drafts, coordinating
with any prior code mapping.
</objective>

<execution_context>
@~/.claude/reis/workflows/ingest-docs.md
@~/.claude/reis/references/artifact-paths.md
</execution_context>

<process>
Read `$ARGUMENTS` and strip flags:
- `--docs-dir <path>`: directory to scan (default: repo root, probing
  `docs/`, `adr/`, `doc/`, and top-level markdown).

Then follow the referenced workflow end-to-end.

Guardrails: never invent requirements — only extract what documents actually
state, each item tagged High/Medium/Low confidence with its source. Always end
with an explicit Open Questions list. If `.planning/PROJECT.md` or
REQUIREMENTS.md already exist, ask merge vs side-by-side draft — never
overwrite without approval. If the codebase was already mapped via
`/reis:map`, reconcile document findings against code observations instead of
duplicating them.
</process>
