---
name: reis:audit
description: Run a cross-phase integration audit for a REIS milestone — deliverable existence, stub implementation detection, and API contract validation between phases, writing a report under .planning/audits/. Use when the user wants milestone-level integration checking beyond per-phase verification.
argument-hint: "[milestone]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---
<objective>
Audit the given milestone (or all completed phases): confirm deliverables
exist, scan for stub/placeholder implementations, validate import/export
contracts across phase boundaries, and write a dated audit report under
`.planning/audits/`.
</objective>

<execution_context>
@~/.claude/reis/workflows/audit.md
@~/.claude/reis/contexts/verification.md
@~/.claude/reis/references/artifact-paths.md
</execution_context>

<process>
Read `$ARGUMENTS`: optional scope — a milestone name, `--phase N`, or default
to all completed phases. Optional flags: `--strict`, `--verbose`,
`--output <path>`.

Enumerate phases in scope from `.planning/ROADMAP.md` and `.planning/STATE.md`
before auditing. Then follow the referenced workflow end-to-end.

Guardrails: require at least one completed phase (SUMMARY.md or passing
verification); otherwise stop and recommend `/reis:execute` + `/reis:verify`
first. This audit is NOT part of the default cycle — invoke explicitly. On
FAIL/PARTIAL outcomes, list blocking issues with exact locations and route
them to `/reis:debug`.
</process>
