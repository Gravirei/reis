---
name: reis:quick
description: Execute a single small task in a REIS project with minimal ceremony — no research, plan file, or waves; just implement, sanity-check, and commit. Use when the user wants a one-off fix or tweak that does not warrant a full REIS phase.
argument-hint: "<task>"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---
<objective>
Execute one small task directly — targeted changes, a sanity check (or real
verification), and a single descriptive commit — leaving no execution
artifacts beyond the commit.
</objective>

<execution_context>
@~/.claude/reis/workflows/quick.md
@~/.claude/reis/references/commit-conventions.md
</execution_context>

<process>
Read `$ARGUMENTS` as the task description (ask for it if absent); strip flags:
- `--no-commit`: skip the final git commit.
- `--verify`: run applicable tests instead of a quick sanity check.
- `--verbose`: report files modified, lines changed, issues hit.

Identify only the relevant files, follow existing code patterns, and avoid
scope creep. Commit with a conventional-commit message
(`<type>(<scope>): <description>`) unless suppressed.

Guardrails: if `.planning/` is missing, stop — this is not a REIS project.
If the task turns out larger than a quick fix, stop and recommend `/reis:plan`
for the full ceremony instead of expanding scope silently.
</process>
