# Workflow: Extract Learnings

Mine completed work for durable lessons — recorded decisions, execution
deviations, and debug root causes — and consolidate them into
`.planning/LEARNINGS.md` so later phases inherit hard-won knowledge instead of
repeating mistakes.

## Preconditions

- `.planning/` directory exists (if not, this is not a REIS project — run the
  new-project or map-codebase workflow first)
- At least one completed phase or milestone exists (SUMMARY.md present), or
  `.reis/decisions.json` contains records — otherwise there is nothing to mine;
  say so and stop

## Inputs

- Optional scope:
  - `--milestone <name>` — restrict mining to the phases of one milestone
    (default: all completed phases)
- Sources read (never modified):
  - `.reis/decisions.json` — decision records (see decisions.json schema)
  - `.planning/phases/phase-N-*/SUMMARY.md` — deviations sections
  - `.planning/phases/phase-N-*/DEBUG_REPORT.md` — root causes
- Output written: `.planning/LEARNINGS.md` (create or update)
- With explicit user approval only: an instruction file such as AGENTS.md

## Steps

1. Determine scope: list target phases from ROADMAP.md (all completed ones, or
   those belonging to `--milestone <name>`).
2. **Decisions**: parse `.reis/decisions.json`; select records relevant to the
   scoped phases. Condense each into one line: decision, why, status
   (reverted records are kept but marked).
3. **Deviations**: read each scoped SUMMARY.md; collect its deviations /
   what-changed-and-why notes into candidate patterns (same deviation shape
   appearing across phases = a pattern, not noise).
4. **Root causes**: read each scoped DEBUG_REPORT.md; extract root cause +
   fix class per entry; flag recurring causes explicitly.
5. Deduplicate and condense: merge near-identical lessons; drop anything not
   evidenced by a source file. Every retained lesson cites its source
   (file path).
6. Write or update `.planning/LEARNINGS.md` with exactly these sections:
   - **Confirmed Decisions** — decisions worth keeping, one line each
   - **Patterns Discovered** — recurring deviation/debug shapes
   - **Surprises** — outcomes that contradicted plan expectations
   - **Recommendations** — concrete advice for upcoming phases
   When updating, preserve pre-existing sections' content unless superseded
   by fresher evidence; state what changed.
7. **Ask before touching instruction files**: if any Recommendation looks like
   a standing rule (e.g. "always X before Y"), propose appending a condensed
   version to AGENTS.md (or equivalent) and wait for explicit yes/no. Never
   edit such files unprompted.
8. Summarize: lessons added per section, sources mined, whether LEARNINGS.md
   was created or updated, and any pending AGENTS.md proposal.

## Completion criteria

- LEARNINGS.md exists with the four required sections, every lesson traceable
  to a cited source file
- Existing LEARNINGS.md content was preserved or explicitly superseded, with
  changes stated
- No AGENTS.md-style file was modified without explicit user approval
- Summary reports counts and sources honestly (including "nothing new found")

## References

- @reis/references/artifact-paths.md (SUMMARY.md / DEBUG_REPORT.md locations)
- @reis/workflows/milestone.md (milestone scoping)
- @reis/workflows/debug.md (what DEBUG_REPORT.md contains)
