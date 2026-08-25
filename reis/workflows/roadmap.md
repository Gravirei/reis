# Workflow: Roadmap

Turn requirements into an ordered phase breakdown in
`.planning/ROADMAP.md`, where each phase delivers a coherent slice of
requirements.

## Preconditions

- `.planning/` directory exists (if not, this is not a REIS project — run the
  new-project or map-codebase workflow first)
- `.planning/REQUIREMENTS.md` exists and contains numbered requirements
  (run the requirements workflow first if not)

## Inputs

- None required; the user may request specific features be added, inserted
  at a position, or removed

## Steps

1. Read `.planning/PROJECT.md` and `.planning/REQUIREMENTS.md` in full.
2. If `.planning/ROADMAP.md` already exists, read it — preserve completed
   phases and their statuses unless the user asked for a re-plan.
3. Decompose requirements into phases:
   - Each phase has a one-line Goal and Delivers 2–4 requirements
   - Order phases by dependency (foundations before features)
   - Note which phases could run in parallel
   - Group phases under milestones (v1.0, v2.0, …)
4. For incremental changes (add/insert/remove), edit only the affected
   phases and renumber consistently.
5. Write/update `.planning/ROADMAP.md` following `templates/ROADMAP.md`
   (Phase N: name, Goal, Delivers, Status per phase).
6. Update the Traceability table in `.planning/REQUIREMENTS.md` so every
   requirement maps to a phase.
7. Update `.planning/STATE.md`: record the roadmap change under Recent
   Progress and set Next Session focus to the first pending phase.

## Completion criteria

- Every Must Have requirement is delivered by exactly one v1 phase
- Phases are dependency-ordered with clear goals and deliverables
- REQUIREMENTS.md traceability matches ROADMAP.md phases
- STATE.md points at the next actionable phase

## References

- @templates/ROADMAP.md (roadmap format)
- @agents/reis_architect (subagent for complex dependency analysis)
