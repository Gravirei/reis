---
name: reis:stats
description: Read-only aggregate statistics for a REIS project — requirements coverage, phase completion %, wave success rate, commits per phase, and estimated-vs-actual timeline, as compact markdown tables. Use when the user wants project metrics or health numbers without changing anything.
argument-hint: ""
allowed-tools:
  - Read
  - Bash
  - Grep
  - Glob
---
<objective>
Compute and display aggregate project statistics from `.planning/` files and
git history — strictly read-only.
</objective>

<execution_context>
@~/.claude/reis/workflows/stats.md
@~/.claude/reis/references/state-format.md
@~/.claude/reis/references/artifact-paths.md
</execution_context>

<process>
No arguments.

Then follow the referenced workflow end-to-end.

Guardrails: if `.planning/` lacks REQUIREMENTS.md, ROADMAP.md, or STATE.md,
stop — this is not a REIS project; recommend `/reis:new-project` or
`/reis:map` instead. This command writes nothing: no file may be created or
modified anywhere. Every number comes from real planning files or `git log`;
missing evidence is shown as `_n/a_`, never estimated. Label the per-phase
commit counts as grep heuristics, not proof of attribution.
</process>
