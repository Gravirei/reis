---
name: reis:cycle
description: Run one full automated REIS cycle for a phase or plan — PLAN → REVIEW → EXECUTE → VERIFY → GATE → DEBUG (+FIX) → re-VERIFY — tracked in a resumable state machine. Use when the user wants a hands-off end-to-end run instead of invoking each step manually.
argument-hint: "[phase-or-plan] [--resume] [--skip-research] [--skip-review] [--skip-gates]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---
<objective>
Run the complete automated REIS cycle for the given phase or plan file,
persisting every state transition to `.reis/cycle-state.json` so the cycle can
be interrupted and resumed at any point.
</objective>

<execution_context>
@~/.claude/reis/workflows/cycle.md
@~/.claude/reis/references/execution-state-format.md
</execution_context>

<process>
Read `$ARGUMENTS` and strip flags:
- `--resume` / `--resume-execution`: continue an interrupted cycle from
  `.reis/cycle-state.json` instead of starting fresh.
- `--skip-research`, `--skip-review`, `--skip-gates`: omit the corresponding stage.
- `--gate-only <category>`, `--auto-fix`, `--continue-on-fail`,
  `--max-attempts N`: pass through unchanged.

Routing: this command orchestrates the other reis:* commands as its inner steps —
PLANNING invokes `/reis:plan`, VERIFYING invokes `/reis:verify`, EXECUTING runs
`/reis:execute`; DEBUGGING/FIXING loop back to VERIFYING until COMPLETE.

Guardrails: if `.reis/cycle-state.json` exists with a non-terminal state, offer
to resume before starting fresh. If `.planning/` is missing, stop — this is not
a REIS project. On failure keep the state file and report recovery options.
</process>
