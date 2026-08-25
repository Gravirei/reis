---
name: reis:plan
description: Break a REIS roadmap phase into wave-based task plans (PLAN.md) with dependencies, verify commands, and done criteria. Use when a phase needs planning before /reis:execute.
argument-hint: "<phase> [--discuss] [--assumptions]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---
<objective>
Decompose the given roadmap phase into 2–3 executable task plans under
`.planning/phases/<N>-<name>/`, with dependency waves, target files, verify
commands, and observable success criteria.
</objective>

<execution_context>
@~/.claude/reis/workflows/plan.md
@~/.claude/reis/contexts/planning.md
@~/.claude/reis/references/artifact-paths.md
</execution_context>

<process>
Read `$ARGUMENTS` and strip flags:
- `--discuss`: gather clarifying questions, challenges, and key decisions
  before decomposing; record agreed decisions in STATE.md.
- `--assumptions`: enumerate dependencies, technical assumptions, and risks;
  record them in STATE.md.

Then follow the referenced workflow end-to-end.
- If no `RESEARCH.md` exists for the phase, route to `/reis:research <phase>`
  first — plans must be research-informed, not guessed.
- The phase must exist in `.planning/ROADMAP.md`; if not, stop and point the
  user to `/reis:roadmap`.
- After planning, hand off to `/reis:execute <phase>`.
</process>
