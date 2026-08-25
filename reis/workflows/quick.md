# Workflow: Quick Task

Execute a single small task with minimal ceremony — no research, no plan file,
no waves. For one-off fixes and tweaks inside an existing REIS project.

## Preconditions

- `.planning/` directory exists (if not, this is not a REIS project — run the
  new-project or map-codebase workflow first)
- A task description is provided (if absent, ask for it before proceeding)

## Inputs

- Task description (required, quoted if it contains spaces)
- Optional flags:
  - `--no-commit` — skip the git commit after completing the task
  - `--verify` — run real verification (tests) instead of a sanity check
  - `--verbose` — report files modified, lines changed, issues encountered

## Steps

1. Identify only the file(s) relevant to the described task.
2. Make targeted changes — implement directly, skip research and planning,
   avoid scope creep and unrelated modifications.
3. Follow existing code patterns in the touched files.
4. If `--verify`: run applicable tests and confirm functionality works.
   Otherwise do a quick sanity check (syntax, obvious breakage).
5. Unless `--no-commit`: commit with a descriptive conventional-commit message
   (`<type>(<scope>): <description>`, e.g. `fix(auth): add error handling to
   login endpoint`).
6. If `--verbose`: summarize files modified, lines changed, time taken, and
   any issues hit.

Quality checklist before finishing: changes are minimal and focused; nothing
unrelated was modified; existing conventions followed; tests pass when run;
commit made unless suppressed.

## Completion criteria

- The described task is done and sanity-checked (or verified with `--verify`)
- One descriptive commit exists unless `--no-commit`
- No plan, SUMMARY, or state-file updates were created (quick tasks leave no
  execution artifacts beyond the commit)

## References

- @reis/workflows/execute.md (full ceremony for anything larger than a quick fix)
