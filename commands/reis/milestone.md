---
name: reis:milestone
description: Check REIS milestone status or complete/archive a finished milestone after verifying all its phases — audit, archive artifacts, update ROADMAP/STATE, and tag. Use when the user asks about milestone readiness or wants to close out a milestone.
argument-hint: "[status | complete <milestone>]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---
<objective>
Report per-milestone phase completeness (`status`) or run the full completion
sequence for a milestone: integration audit, phase verification, archiving,
ROADMAP/STATE updates, and annotated git tag.
</objective>

<execution_context>
@~/.claude/reis/workflows/milestone.md
@~/.claude/reis/references/state-format.md
@~/.claude/reis/references/artifact-paths.md
</execution_context>

<process>
Read `$ARGUMENTS` and route:
- `status` (default) → read ROADMAP.md and STATE.md; report each milestone's
  phases, completed count/percent, blockers, and readiness verdict.
- `complete <milestone>` → audit first, then verify every phase in the
  milestone shows complete, then archive + update ROADMAP/STATE + tag.

Then follow the referenced workflow end-to-end. Respect flags:
`--no-tag`, `--no-archive`, `--force`, `--skip-audit`.

Guardrails: if any phase is incomplete or the audit fails, stop and offer
`/reis:debug`, `--force`, or (with a loud warning) `--skip-audit`. Never push
the tag unless explicitly asked.
</process>
