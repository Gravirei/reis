---
name: reis:map
description: Map an existing codebase and create the initial REIS .planning/ structure (PROJECT.md, STATE.md) without inventing requirements. Use when onboarding REIS onto an existing project.
argument-hint: ""
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---
<objective>
Survey an existing codebase (tech stack, architecture, conventions, tooling)
and record findings in `.planning/PROJECT.md` and `.planning/STATE.md` so REIS
workflows can run on the project.
</objective>

<execution_context>
@~/.claude/reis/workflows/map-codebase.md
@~/.claude/reis/references/state-format.md
@~/.claude/reis/references/artifact-paths.md
</execution_context>

<process>
No arguments required; the user may note areas of special interest or known
pain points.

Then follow the referenced workflow end-to-end.
- If `.planning/` already exists, ask whether to preserve, merge, or start over.
- Record only what is actually observed — no fabricated features, requirements,
  or roadmap entries.
- After mapping, point the user to `/reis:requirements` then `/reis:roadmap`
  to plan work on this codebase.
</process>
