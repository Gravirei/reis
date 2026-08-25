---
name: reis:autonomous
description: Run ALL remaining REIS roadmap phases hands-off — per phase RESEARCH → PLAN → REVIEW → EXECUTE → VERIFY (+GATE/DEBUG only when gates are enabled) — with one pre-flight confirmation, a per-phase progress report, and automatic stop on hard failure or three consecutive failures. Use when the user wants the rest of the roadmap finished unattended.
argument-hint: "[--from-phase N] [--dry-run]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---
<objective>
Execute every incomplete phase in `.planning/ROADMAP.md` end-to-end, one full
REIS cycle per phase, requiring exactly one upfront confirmation of the phase
list before proceeding unattended until the roadmap is complete or the failure
policy halts the run.
</objective>

<execution_context>
@~/.claude/reis/workflows/autonomous.md
@~/.claude/reis/references/artifact-paths.md
@~/.claude/reis/references/config-format.md
</execution_context>

<process>
Read `$ARGUMENTS` and strip flags:
- `--from-phase N`: begin the run at phase N instead of the first incomplete phase.
- `--dry-run`: print the ordered list of phases that would run (plus the
  effective failure/gate policy) and exit — no confirmation, no work.

Routing: this command loops `/reis:cycle` semantics across phases — research,
plan, review, execute, and verify run per phase; gates and debugging run only
when `gates.enabled` is true in reis.config.js.

Guardrails: show the phase list and require ONE explicit confirmation before
any work; after that never prompt except to stop. Honor `waves.continueOnError`
for the failure policy and stop after 3 consecutive phase failures. Track all
state per-phase in `.reis/cycle-state.json` so an interrupted run can resume
with `--from-phase N`.
</process>
