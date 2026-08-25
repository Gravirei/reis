---
name: reis:research
description: Research implementation approaches (libraries, patterns, risks) for a REIS roadmap phase and write RESEARCH.md so planning is informed. Use before /reis:plan on complex or unfamiliar phases.
argument-hint: "<phase>"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---
<objective>
Investigate implementation options for the given roadmap phase — viable
libraries, architecture patterns, codebase reuse opportunities, risks — and
write `.planning/phases/phase-<N>/RESEARCH.md` with a clear recommendation.
</objective>

<execution_context>
@~/.claude/reis/workflows/research.md
@~/.claude/reis/contexts/planning.md
@~/.claude/reis/references/artifact-paths.md
</execution_context>

<process>
Read `$ARGUMENTS` as the phase number; any extra text is prioritized research
questions from the user.

Then follow the referenced workflow end-to-end.
- The phase must exist in `.planning/ROADMAP.md`; if it doesn't, stop and point
  the user to `/reis:roadmap`.
- If `RESEARCH.md` already exists for the phase, confirm whether to extend or
  redo it before proceeding.
- After research completes, suggest `/reis:plan <phase>` to consume the
  findings.
</process>
