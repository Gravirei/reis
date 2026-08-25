---
name: reis:roadmap
description: Decompose REIS requirements into a dependency-ordered phase breakdown in .planning/ROADMAP.md with traceability. Use after /reis:requirements or when adding, inserting, or removing phases.
argument-hint: "[add|insert|remove request]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---
<objective>
Turn `.planning/REQUIREMENTS.md` into an ordered `.planning/ROADMAP.md`
(2–4 deliverables per phase, milestones, parallelizable phases noted), keeping
the REQUIREMENTS.md traceability table in sync.
</objective>

<execution_context>
@~/.claude/reis/workflows/roadmap.md
@~/.claude/reis/references/artifact-paths.md
@~/.claude/reis/contexts/planning.md
</execution_context>

<process>
Read `$ARGUMENTS` as an optional incremental change (add / insert at position /
remove a phase). Empty means build the full roadmap.

Then follow the referenced workflow end-to-end.
- Requires numbered requirements — if `.planning/REQUIREMENTS.md` is missing or
  unnumbered, route to `/reis:requirements` first (this command follows it in
  the normal flow).
- If ROADMAP.md exists, preserve completed phases and statuses unless the user
  asked for a re-plan.
- Once the roadmap is set, point the user to `/reis:plan <phase>` per phase,
  optionally `/reis:research <phase>` first for complex ones.
</process>
