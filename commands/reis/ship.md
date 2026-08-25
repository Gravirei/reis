---
name: reis:ship
description: Ship a completed REIS phase as a GitHub pull request — verify the phase's VERIFICATION_REPORT.md shows PASS, enforce branch hygiene, generate an evidence-backed PR body from SUMMARY.md and VERIFICATION_REPORT.md, and create the PR via gh (with exact manual fallback steps). Use when the user wants to open a PR for finished, verified work.
argument-hint: "[--draft] [--base <branch>]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---
<objective>
Open a pull request for a verified REIS phase: confirm the verification report
shows PASS, ensure the tree is clean and the branch is shippable, assemble the
PR body from recorded evidence, and create the PR (printing its URL) or exact
manual steps if tooling is unavailable.
</objective>

<execution_context>
@~/.claude/reis/workflows/ship.md
@~/.claude/reis/references/pr-template.md
@~/.claude/reis/references/artifact-paths.md
</execution_context>

<process>
Read `$ARGUMENTS` and strip flags:
- `--draft`: open the pull request as a draft.
- `--base <branch>`: set the PR base branch (defaults to the repo default).

If no phase was named, default to the most recently verified phase according
to `.planning/STATE.md`.

Then follow the referenced workflow end-to-end. Do not bypass preconditions:
a missing or failing VERIFICATION_REPORT.md means stop and recommend
`/reis:verify` (or `/reis:debug` on failures) before shipping. Never force-push,
rebase, or touch the mainline branch.
</process>
