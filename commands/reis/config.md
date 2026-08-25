---
name: reis:config
description: Manage REIS configuration for a project — show effective settings, initialize reis.config.js, validate one, or explain config options. Use when configuring or troubleshooting REIS behavior.
argument-hint: "[show|init|validate|docs]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---
<objective>
Manage the project's `reis.config.js`: report effective settings (`show`),
create one from the template (`init`), check it for unknown sections/keys and
invalid values (`validate`), or explain the available options (`docs`).
Defaults to `show`.
</objective>

<execution_context>
@~/.claude/reis/workflows/config.md
@~/.claude/reis/references/artifact-paths.md
</execution_context>

<process>
Read `$ARGUMENTS` as the subcommand: `show`, `init`, `validate`, or `docs`
(default `show`). An explicit config path may accompany any subcommand.

Then follow the referenced workflow end-to-end.
- `init` must never silently overwrite an existing `reis.config.js` unless
  force was explicitly requested by the user.
- `validate` ends with either "valid" or an itemized list of problems — no
  partial passes.
- If validation fails in ways that affect running workflows, mention that
  affected commands should be re-run after fixing the config.
</process>
