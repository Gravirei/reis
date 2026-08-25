# Workflow: Requirements

Define or refine detailed, testable project requirements in
`.planning/REQUIREMENTS.md`, numbered so plans and verification can trace
back to them.

## Preconditions

- `.planning/` directory exists (if not, this is not a REIS project — run the
  new-project or map-codebase workflow first)
- `.planning/PROJECT.md` exists (if missing, gather the project idea from the
  user before proceeding)

## Inputs

- None required; the user may supply new feature requests or scope changes
  as arguments

## Steps

1. Read `.planning/PROJECT.md` for goals, constraints, and target users.
2. Read the existing `.planning/REQUIREMENTS.md` if present — preserve
   existing REQ IDs and only add/change what the user asked for.
3. Ask clarifying questions when requirements are ambiguous or untestable;
   do not invent scope silently.
4. Write/update `.planning/REQUIREMENTS.md` following `templates/REQUIREMENTS.md`:
   - Group by milestone, then Must Have / Should Have / Won't Have
   - Give every requirement a stable ID (`REQ-001`, `REQ-101`, …)
   - Phrase each requirement so it is checkable and verifiable
5. If a `.planning/ROADMAP.md` exists, update the Traceability table mapping
   each requirement to its delivering phase and status.
6. If a requirement changes scope of an existing phase, note this for the
   roadmap (the roadmap workflow can be run afterwards).
7. Update `.planning/STATE.md`: record the requirements change under Recent
   Progress with rationale for notable decisions.

## Completion criteria

- REQUIREMENTS.md uses numbered IDs grouped by priority and milestone
- Every requirement is verifiable (a tester could pass/fail it)
- Traceability table matches current phases (when ROADMAP.md exists)
- STATE.md reflects the change

## References

- @templates/REQUIREMENTS.md (requirements format)
- @reis/references/state-format.md (STATE.md structure)
