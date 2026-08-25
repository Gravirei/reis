# Workflow: Checkpoint Management

Create, list, inspect, restore, and compare checkpoints — save points that pair
an entry in `.planning/STATE.md` with a git commit so work can be resumed or
rolled back safely.

## Preconditions

- `.planning/` directory exists (if not, this is not a REIS project — run the
  new-project or map-codebase workflow first)
- For restore/compare: at least one checkpoint already exists in STATE.md

## Inputs

- Subcommand mode (required, default `list`): `create`, `list`, `show`,
  `restore`, `compare`
- Name or message argument where applicable; names may only contain letters,
  digits, dashes, and underscores. If omitted on create, generate one as
  `checkpoint-<YYYY-MM-DD>-<HHMMSS>`

## Steps

### create

1. Check the name is valid and not already used by an existing checkpoint in
   STATE.md; reject duplicates.
2. If in a git repo and there are uncommitted changes: commit them unless
   `--no-commit` was given (respect config `git.autoCommit` when no flag is
   present). Use message `Checkpoint: <name>` or the user-provided message,
   prefixed per config (`git.commitMessagePrefix`). Record the commit hash;
   if the commit fails, continue without it and warn.
3. Append a checkpoint entry to the Checkpoints section of
   `.planning/STATE.md` with: name, timestamp (ISO), optional wave reference,
   and commit hash.

### list

4. Read all checkpoint entries from `.planning/STATE.md`. If none exist, say so
   and suggest creating one. Otherwise display a compact table: name,
   relative timestamp, short commit hash, wave (if any).

### show

5. Find the named checkpoint in STATE.md (error with a hint to list if missing).
6. Show its timestamp, wave, commit hash, commit message, and file-change stats
   from git (`git show --stat`).

### restore

7. Find the named checkpoint; confirm with the user before restoring (skip
   confirmation only if explicitly told to proceed).
8. Warn about any uncommitted changes in the working tree and offer:
   stash, commit first, discard, or cancel — never destroy work silently.
9. Restore state as of the checkpoint (e.g. via the recorded commit) and note
   the restore in STATE.md under Recent Progress.

### compare

10. For two named checkpoints (or one checkpoint vs HEAD), show files added /
    modified / deleted and line-count deltas between their commits using git
    diff, grouped by change type.

## Completion criteria

- create: STATE.md contains the new checkpoint entry with timestamp and commit
- list/show: every existing checkpoint reported accurately
- restore: working tree/state matches the checkpoint; deviation noted in STATE.md
- compare: a clear added/modified/deleted summary was produced

## References

- @docs/CHECKPOINTS.md (checkpoint semantics, recovery patterns, git refs)
- @reis/workflows/resume.md (resuming from checkpoints)
- @reis/references/state-format.md (where checkpoints live in STATE.md)

<!-- Migration note: from lib/commands/checkpoint.ts + docs/CHECKPOINTS.md.
Relative-time formatting tables replaced by "relative timestamps in a compact
table". -->
