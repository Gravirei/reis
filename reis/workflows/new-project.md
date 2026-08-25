# Workflow: New Project Initialization

Initialize a REIS project by creating the `.planning/` directory structure with
PROJECT.md, REQUIREMENTS.md, ROADMAP.md, and STATE.md.

## Preconditions

- Current directory is intended as the project root
- No existing `.planning/` directory (if one exists, ask whether to preserve or start over)

## Inputs

- Project idea (may be provided as an argument; if absent, ask the user to
  describe the project idea before proceeding)

## Steps

1. Ask for / confirm the project idea if not provided.
2. Create `.planning/` directory.
3. Create `.planning/PROJECT.md` using `templates/PROJECT.md`:
   - Capture the idea, goals, constraints, and target users
   - Keep it concise — this is context, not a spec
4. Create `.planning/REQUIREMENTS.md` using `templates/REQUIREMENTS.md`:
   - Derive concrete, testable requirements from the project idea
   - Number them (FR1, FR2, …) so plans and verification can reference them
5. Create `.planning/ROADMAP.md` using `templates/ROADMAP.md`:
   - Decompose requirements into phases (2–4 deliverables each)
   - Order phases by dependency; note which phases can run in parallel
6. Create `.planning/STATE.md` using `templates/STATE.md`:
   - Set current phase to null / not started
   - Leave metrics zeroed

## Completion criteria

- All four files exist under `.planning/`
- REQUIREMENTS are numbered and traceable to ROADMAP phases
- STATE reflects "no work started"

## References

- @reis/references/state-format.md (STATE.md structure)
- @agents/reis_analyst (deeper analysis when the idea is ambiguous)
