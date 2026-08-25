# Workflow: Research Phase

Research implementation approaches for a roadmap phase — libraries, patterns,
and best practices — so that planning is informed rather than guessed.

## Preconditions

- `.planning/` directory exists (if not, this is not a REIS project — run the
  new-project or map-codebase workflow first)
- A phase number was provided and is a valid positive integer
- The phase exists in `.planning/ROADMAP.md`

## Inputs

- Phase number (required)
- Optional: specific questions from the user to prioritize

## Steps

1. Read `.planning/ROADMAP.md` and extract the phase's Goal and Delivers —
   these define the research scope.
2. Read `.planning/PROJECT.md` and `.planning/REQUIREMENTS.md` for the
   requirements this phase must satisfy and any stated constraints.
3. Check whether research already exists at
   `.planning/phases/phase-<N>/RESEARCH.md`; if so, confirm with the user
   whether to extend or redo it.
4. Search the existing codebase first: identify files/modules that could be
   extended or reused instead of writing new code.
5. Investigate the landscape for this phase:
   - 2–3 viable library/tool options (not an exhaustive list)
   - Architecture patterns that fit the phase's problem
   - External dependencies and their risk levels
   - Best practices and known pitfalls
   - Use web search when current information is needed
6. Record explicit risks, unknowns, and open questions.
7. Produce a primary recommendation with rationale and a fallback option.
8. Write findings to `.planning/phases/phase-<N>/RESEARCH.md` following
   `templates/research.md` (Summary, Scope, Findings, Risks & Unknowns,
   Recommendations, Open Questions).
9. Update `.planning/STATE.md`: note research completed under Recent Progress
   and add unresolved open questions to Open Questions.

## Completion criteria

- RESEARCH.md exists for the phase and follows the template structure
- At least one clear recommendation with justification is present
- Existing code that can be leveraged has been identified
- STATE.md records the research result and any open questions

## References

- @templates/research.md (research output format)
- @reis/references/state-format.md (STATE.md structure)
- @agents/reis_scout (dedicated research subagent; use reis_synthesizer when
  running multiple scouts in parallel)
