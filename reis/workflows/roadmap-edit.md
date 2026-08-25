# Workflow: Roadmap Editing

Add, insert, or remove phases in `.planning/ROADMAP.md`, keeping phase
numbering, dependencies, and downstream references (plans, directories,
STATE.md) consistent.

## Preconditions

- `.planning/ROADMAP.md` exists (if not, this is not a REIS project — run the
  new-project or map-codebase workflow first)
- For add/insert: a non-empty feature description is provided
- For insert/remove: a valid phase number is provided
- No execution cycle is currently active for affected phases (pause or finish
  it before editing the roadmap)

## Inputs

- Mode (required):
  - `add <feature>` — append a new final phase
  - `insert <phase> <feature>` — place a new phase at position N
  - `remove <phase>` — delete phase N and renumber
- Current roadmap content (read before any edit)

## Steps

1. Read `.planning/ROADMAP.md` fully. Note its phase format (numbering style,
   checkbox syntax, how goals/deliverables/success criteria are written) and
   mimic it exactly.
2. Check `.planning/STATE.md` and `.planning/phases/` to know which phases
   already have plans/summaries — never silently orphan them.

### add

3. Derive the new phase from the feature description: goals, 2–4 deliverables,
   success criteria, and dependency notes on earlier phases.
4. Append it as the next sequential phase number.

### insert

5. Derive the new phase content as in step 3, scoped so it fits at position N.
6. Renumber the old phase N and all later phases (+1), including their
   dependency mentions inside ROADMAP.md.
7. Rename matching `.planning/phases/phase-N[-*]/` directories and update
   plan/state references to the shifted numbers; flag anything ambiguous
   instead of guessing.
8. Insert the new phase text at position N.

### remove

9. Archive the phase's directory (move to `.planning/archive/`) rather than
   deleting plans and summaries; if none exist, just proceed.
10. Delete the phase's section from ROADMAP.md and renumber later phases (-1),
    applying the same directory/reference updates as insert mode.
11. Update STATE.md's current-phase pointer if it referenced the removed or
    shifted numbers.

### finish (all modes)

12. Sanity-check the edited roadmap: numbering is contiguous, dependencies
    still point at existing phases, no duplicate deliverables.
13. Report the change: which phases were added/moved/renumbered, and any
    references that needed manual attention.

## Completion criteria

- ROADMAP.md reflects exactly the requested change in its original format
- Phase numbering is contiguous and dependency references are correct
- Existing plans/summaries/archives were preserved and re-pointed, not lost
- STATE.md agrees with the new roadmap ordering

## References

- @reis/workflows/new-project.md (how phases are originally structured)
- @reis/workflows/plan.md (planning a newly added phase)

<!-- Migration note: from lib/commands/add.ts + insert.ts + remove.ts. All
three printed one-line prompts; expanded into concrete read/renumber/archive
steps. Directory renaming rules added because renumbering has filesystem
consequences the prompts ignored. -->
