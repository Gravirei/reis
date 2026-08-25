# REIS Hooks

Optional lifecycle hooks that enforce REIS methodology mechanically.
Installed to `~/<tool-config>/reis/hooks/` by the installer.

| Script | Purpose | Wiring |
|---|---|---|
| session-start.sh | Print current phase/state into session context | Claude Code SessionStart (auto-injected) |
| workflow-guard.js | Warn on .planning edits outside an active cycle | Claude Code PreToolUse Edit|Write (auto-injected) |
| validate-commit.sh | Enforce commit message conventions | Manual: git commit-msg hook |

All scripts are defensive: they exit 0 on any internal error and never
brick a session. Injection is opt-in (--no-hooks to skip) and fully
reversed by `reis uninstall`.
