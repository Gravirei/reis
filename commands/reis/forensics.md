---
name: reis:forensics
description: Post-mortem audit when the REIS workflow machinery itself failed — validates .reis/*.json state files, cycle-state history integrity, PLAN→SUMMARY→VERIFICATION artifact chains, orphaned waves, checkpoint drift, and gate bypasses; produces .planning/FORENSICS.md with a recovery plan. Use when a cycle crashed, resume behaves oddly, or verification evidence doesn't add up (code bugs belong in reis:debug instead).
argument-hint: "[--phase N]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---
<objective>
Audit REIS's own runtime state and artifact chain after an unexpected workflow
failure, identify the root cause, and produce an executable recovery plan.
</objective>

<execution_context>
@~/.claude/reis/workflows/forensics.md
@~/.claude/reis/references/execution-state-format.md
@~/.claude/reis/references/artifact-paths.md
@~/.claude/reis/references/state-format.md
</execution_context>

<process>
Read `$ARGUMENTS` and strip flags:
- `--phase N`: scope the audit to one phase's artifacts (default: all phases
  referenced by STATE.md / ROADMAP.md).

Then follow the referenced workflow end-to-end.

Guardrails: this diagnoses workflow/process corruption, not product bugs — if
the evidence points at failing deliverables rather than broken machinery, route
to `/reis:debug` and say why. Cite file:line evidence for every finding; never
delete or repair state files as a side effect of analysis. End by routing to
`/reis:resume`, `/reis:debug`, or both — in the order the recovery plan
specifies.
</process>
