# Workflow: Pause Work

Pause the current session by turning `.planning/STATE.md` into a complete
handoff document so any future agent or developer can resume without context
loss.

## Preconditions

- `.planning/` directory exists (if not, this is not a REIS project — run the
  new-project or map-codebase workflow first)

## Inputs

- None (optional free-text note about why work is pausing, recorded in the
  handoff under Recent Progress)

## Steps

1. Read `.planning/STATE.md` and assess actual progress (also check
   `.reis/execution-state.json` and `git status` if present).
2. Update `.planning/STATE.md` with a handoff covering:
   - Current progress — what is done and verified
   - Work in progress — exact task/wave mid-flight, and how far it got
   - Next steps — concrete, ordered actions to continue
   - Active decisions — choices made and their rationale
   - Blockers — anything preventing further progress
3. Ensure the level of detail allows another developer to resume from this
   point with no prior knowledge of the session.

## Completion criteria

- STATE.md reflects true current state including WIP position
- Next steps are actionable without additional context
- No work was started beyond the handoff update; uncommitted code is left
  untouched (note its existence in the WIP section if present)

## References

- @reis/references/state-format.md (STATE.md structure)
- @reis/workflows/resume.md (picking up after a pause)
