---
name: reis:gate
description: Run REIS quality gates across security, quality, performance, and accessibility categories per the project's reis.config.js thresholds, blocking on failures by default. Use when the user wants to run gate checks or enforce gate blocking after verification.
argument-hint: "[security|quality|performance|accessibility|all]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---
<objective>
Run automated quality gate checks for the given category (default: all),
aggregate each category to passed/warning/failed, and apply the project's
blocking rules from `reis.config.js` (`blockOnFail`, block-on-warning).
</objective>

<execution_context>
@~/.claude/reis/workflows/gate.md
@~/.claude/reis/contexts/verification.md
@~/.claude/reis/references/artifact-paths.md
</execution_context>

<process>
Read `$ARGUMENTS`: optional single category — security | quality |
performance | accessibility — defaulting to `all`.

Read gate configuration from `reis.config.js` first; if gates are disabled,
report "gates disabled" as passed. Then follow the referenced workflow
end-to-end.

Blocking semantics: with `blockOnFail: true` (the default), any failed gate
BLOCKS verification/cycle — emit issues prefixed `[GATE:<category>]` and
route them to `/reis:debug --input <gate-report>` for handling. Warnings pass
with notice unless block-on-warning is configured.
</process>
