---
name: reis:roadmap-edit
description: Edit a REIS project's ROADMAP.md — append a new final phase, insert one at position N, or remove one — keeping numbering, dependencies, directories, and STATE.md consistent. Use when the user wants to add, insert, or remove roadmap phases outside a full cycle.
argument-hint: "add <feature> | insert <phase> <feature> | remove <phase>"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---
<objective>
Apply a single roadmap edit (add / insert / remove) so that `.planning/ROADMAP.md`
reflects exactly the request while phase numbering stays contiguous and no
existing plans, summaries, or archives are orphaned.
</objective>

<execution_context>
@~/.claude/reis/workflows/roadmap-edit.md
@~/.claude/reis/references/state-format.md
@~/.claude/reis/references/artifact-paths.md
</execution_context>

<process>
Read `$ARGUMENTS` and route:
- `add <feature>` → derive goals/deliverables/success criteria; append as the
  next sequential phase.
- `insert <phase> <feature>` → insert at position N; renumber old N..last (+1).
- `remove <phase>` → archive the phase directory, delete the section,
  renumber later phases (-1).

Then follow the referenced workflow end-to-end.

⚠ Renumbering warning: insert/remove shift subsequent phase numbers —
`.planning/phases/phase-N[-*]/` directories and plan/state references must be
renamed/updated too. Flag anything ambiguous instead of guessing; never
silently orphan existing plans.

Guardrails: stop if `.planning/ROADMAP.md` is missing, or if a cycle is
active for affected phases (recommend `/reis:pause` or finishing first).
End by reporting what changed and what needs manual attention.
</process>
