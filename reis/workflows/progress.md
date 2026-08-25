# Workflow: Show Progress

Report current project status by reading `.planning/STATE.md` and
`.planning/ROADMAP.md`: current phase, completed phases, active tasks,
blockers, and next recommended actions. Optionally extend the report with
execution metrics, timeline estimates, and wave dependency detail.

## Preconditions

- `.planning/` directory exists with at least STATE.md and ROADMAP.md (if not,
  this is not a REIS project — run the new-project or map-codebase workflow
  first)
- If neither file has meaningful content yet, report that honestly rather than
  inventing progress

## Inputs

- Optional flags:
  - `--no-kanban` — skip the kanban board header
  - `--metrics` — append execution metrics (waves completed/success rate/
    average wave duration from `.planning/metrics.json` when present)
  - `--timeline` — estimate an execution timeline for the active plan's waves
    (small ≈ 2 min, medium ≈ 5 min, large ≈ 10 min per wave; parallel batches
    take their longest wave's duration) and show time saved vs sequential
  - `--dependencies` — render the wave dependency graph of the current plan as
    ASCII batches (parallel vs sequential groups), or Mermaid if a format is
    requested
  - `--compact` — single-screen summary without section banners

## Steps

1. Unless `--no-kanban`, display the kanban board (see AGENTS.md format) using
   STATE.md data: all phases, current phase/wave, cycle-stage progress.
2. Read `.planning/ROADMAP.md` and `.planning/STATE.md`.
3. Report **current phase** (number + name) and its position in the roadmap.
4. Report **completed phases**, each with a one-line outcome taken from its
   SUMMARY.md if available.
5. Report **active tasks**: open items from STATE.md (TODOs, in-flight tasks,
   checkpoint state) and any incomplete tasks in the current plan.
6. Report **blockers**: failed verifications, unresolved debug reports, gate
   failures, or TODOs marked blocking.
7. Recommend **next actions**: usually the next phase to run (`reis cycle N`),
   resuming an interrupted cycle, or resolving blockers first.
8. Optional detail (only when requested):
   - `--metrics`: show waves completed, success rate, average wave duration.
   - `--timeline`: compute per-batch estimates for the current plan and total
     parallel vs sequential time.
   - `--dependencies`: show which waves can run in parallel and which are
     gated behind others.
9. Format output clearly with status indicators (✓ complete, ◉ in progress,
   ○ pending, ✗ failed); keep the whole report scannable.

## Completion criteria

- Current phase, completed phases, active tasks, blockers, and next actions
  were each reported from real planning files
- Any requested metrics/timeline/dependency detail was derived from actual
  plan/state data, not guessed
- The report ends with at least one concrete suggested next action

## References

- @reis/references/state-format.md (STATE.md structure)
- @reis/workflows/cycle.md (what the suggested next action runs)

<!-- Migration note: from lib/commands/progress.ts + lib/commands/visualize.ts
(disposition map folds visualize into progress as optional detail). Banner/box
rendering replaced by plain formatted sections; watch mode dropped. -->
