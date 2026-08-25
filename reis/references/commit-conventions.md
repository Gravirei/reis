# Reference: Commit Conventions

Source of truth: `lib/utils/git-integration.ts` + `git.*` config defaults in
`lib/utils/config.ts`.

## Config defaults

```js
git: {
  autoCommit: true,               // auto-commit after wave completion
  commitMessagePrefix: '[REIS v2.0]',
  requireCleanTree: true,         // refuse to start on a dirty tree
  createBranch: false,
  branchPrefix: 'reis/'
}
```

## Structured commit format

`createStructuredCommit(phase, waveName, summary, options)` builds:

```text
<prefix> <summary>

Phase: <phase>
Wave: <wave name>

Changes:
- <detail line>
- <detail line>

Tests: <testStatus>
```

- `Phase:`/`Wave:` lines only when non-null; `Changes:` block only when
  `details[]` non-empty; `Tests:` line whenever testStatus is truthy (default `pending`)
- Stages everything with `git add -A`; skips silently if tree is clean
- Returns `{hash, shortHash, message}` (short = 7 chars)

## Wave completion commits

`commitWaveCompletion(waveName, phase)` → summary `Complete <waveName>`, so:

```text
[REIS v2.0] Complete Wave 1: Data Layer

Phase: Phase 2: Core Implementation
Wave: Wave 1: Data Layer

Tests: pending
```

## Checkpoint commits

`commitCheckpoint(name, phase)` uses prefix `[REIS Checkpoint]`, no wave line:

```text
[REIS Checkpoint] Checkpoint: <checkpoint-name>
```

The hash is recorded in STATE.md under Checkpoints; if the commit fails,
continue without it and warn.

## Atomic-commit-per-task rule

During execution each task gets exactly one atomic commit containing only that
task's changes, message prefixed per `git.commitMessagePrefix` — unless
`--no-commit` was given. One commit exists per task when execution completes.

## requireCleanTree behavior

When `requireCleanTree: true` (default), execution refuses to start until
`git status --porcelain` is empty. On resume with a dirty tree, apply
`--auto-stash` (stash push, e.g. `REIS auto-stash`) or an explicit
`--rollback soft|mixed|hard` before continuing; restore stashed work after.

## Milestone tags

`createMilestoneTag(milestone, message)` creates an annotated tag named
`<milestone>` lowercased with whitespace → dashes (e.g. `milestone-one`).
