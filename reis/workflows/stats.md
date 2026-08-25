# Workflow: Project Statistics

Produce a read-only aggregate report of project health by cross-referencing
REQUIREMENTS.md, ROADMAP.md, STATE.md, phase plans/summaries, and git history.
Every metric is derived from real planning files — nothing is guessed and
nothing is written to disk.

## Preconditions

- `.planning/` directory exists with at least REQUIREMENTS.md, ROADMAP.md, and
  STATE.md (if not, this is not a REIS project — run the new-project or
  map-codebase workflow first)
- Files that are missing or empty of meaningful content are reported as such,
  never filled in with invented data

## Inputs

- No arguments; the command takes no flags
- This workflow is strictly **read-only**: it must not create, modify, or
  delete any file under `.planning/`, `.reis/`, or elsewhere

## Steps

1. **Requirements coverage** — parse every requirement (FR/NFR ids) from
   `.planning/REQUIREMENTS.md`, then search `.planning/ROADMAP.md` phases for
   references to each id. Report a table: requirement id → covering phase(s)
   (or `_untraced_`). Summarize as `covered / total (%)`.
2. **Phase completion** — for each roadmap phase, determine completion from
   ROADMAP checkboxes and presence of `phases/phase-N-*/SUMMARY.md`
   (see @reis/references/artifact-paths.md). Report a table: phase → status
   (✓ complete / ◉ in progress / ○ pending) → completion %.
3. **Wave success rate** — read the fixed Metrics block of `.planning/STATE.md`
   (`Total waves planned`, `Waves completed`, `Success rate`,
   `Average wave duration`; see @reis/references/state-format.md). If metrics
   are absent, say so rather than estimating.
4. **Commits per phase** — run `git log --grep="Phase N" --oneline` per phase
   (heuristic match on `Phase <N>` in the subject). Report counts in a table
   and label the column clearly as heuristic — grep matches are not proof of
   attribution.
5. **Estimated vs actual timeline** — for each executed phase, sum
   `estimatedMinutes` from its PLAN.md tasks and compare against actual
   duration evidence in STATE.md wave entries / Recent Activity timestamps.
   Where no duration evidence exists, show `_n/a_` — do not fabricate numbers.
   Report variance (plan vs actual) per phase plus a total row when possible.
6. Format everything as compact markdown tables with a one-line takeaway per
   section (e.g. largest timeline overrun, untraced requirements count).

## Completion criteria

- All five metric sections were reported from real file/git data, with
  missing-evidence cells shown honestly instead of estimated
- Coverage %, completion %, success rate, commit counts, and plan-vs-actual
  variance are each traceable to their source file
- No file was written anywhere during the run

## References

- @reis/references/state-format.md (STATE.md Metrics block)
- @reis/references/artifact-paths.md (phase artifact locations)
- @reis/workflows/progress.md (lighter-weight status view)
