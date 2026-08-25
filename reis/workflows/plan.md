# Workflow: Plan Phase

Break a roadmap phase down into 2–3 executable task plans with clear
dependencies, success criteria, and verification steps, saved under
`.planning/phases/<N>-<name>/`.

## Preconditions

- `.planning/` directory exists (if not, this is not a REIS project — run the
  new-project or map-codebase workflow first)
- A phase number was provided and is a valid positive integer
- The phase exists in `.planning/ROADMAP.md` (if not, stop and tell the user)

## Inputs

- Phase number (required)
- Optional mode flags:
  - **discuss** — gather context, clarifying questions, challenges, and key
    decisions before planning
  - **assumptions** — enumerate dependencies, technical assumptions, and risks

## Steps

1. Read `.planning/ROADMAP.md` and locate the phase's Goal and Delivers.
2. Read `.planning/STATE.md` for prior progress, decisions, and blockers.
3. If `.planning/phases/phase-<N>/RESEARCH.md` (or similar) exists, read it —
   plans should be research-informed.
4. **Discuss mode** (optional): ask the user clarifying questions about scope
   and approach, identify potential challenges, and record agreed decisions in
   `.planning/STATE.md` under Recent Progress before continuing.
5. **Assumptions mode** (optional): review the phase requirements, list all
   assumptions, external dependencies, technical constraints, and risks, and
   record them in `.planning/STATE.md`.
6. Decompose the phase into 2–3 task plans:
   - Group tasks into waves by dependency (independent tasks share a wave)
   - Each task needs specific target files, concrete actions, a verify
     command, and observable done criteria
7. Write each plan to `.planning/phases/<N>-<name>/PLAN.md` using
   `templates/PLAN.md` as the format (Objective, Context, Dependencies,
   Tasks, Success Criteria, Verification).
8. Consider including decision trees in plans where implementation choices
   are non-obvious.
9. Update `.planning/STATE.md`: set the active phase, note what was planned,
   and list any open questions from discuss/assumptions output.

## Completion criteria

- One or more PLAN.md files exist under `.planning/phases/<N>-*/`
- Every task has files, action, verify, and done defined
- Dependencies between plans are explicit
- STATE.md reflects the planning outcome

## References

- @templates/PLAN.md (plan file format)
- @reis/references/state-format.md (STATE.md structure)
- @agents/reis_planner (subagent for large or ambiguous phases)
