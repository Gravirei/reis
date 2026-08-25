# Workflow: Milestone Management

Check milestone status and complete/archive a finished milestone — verifying
every phase in the milestone is done (ideally via an integration audit) before
marking ROADMAP.md, archiving artifacts, and tagging.

## Preconditions

- `.planning/` directory exists with ROADMAP.md and STATE.md
- For completion mode: a milestone name is given; every phase belonging to it
  must have been executed and verified first

## Inputs

- Mode (required): `status` or `complete <milestone>`
- Optional flags for complete:
  - `--no-tag` / `--tag` — control annotated git tag creation (default: tag)
  - `--no-archive` — skip artifact archiving (default: archive)
  - `--force` — proceed despite audit warnings
  - `--skip-audit` — skip integration checks entirely (dangerous; say so)

## Steps

### status

1. Read `.planning/ROADMAP.md` and list all milestones with their phases.
2. For each phase, determine completion from ROADMAP checkboxes, presence of
   `phases/<N>-<name>/SUMMARY.md`, and STATE.md history.
3. Report per milestone: total phases, completed count/percent, current phase,
   blockers if any, and whether the milestone looks ready to complete.

### complete

4. **Audit** (unless `--skip-audit`): run the audit workflow for the milestone
   — cross-phase integration checks, stub detection, API contract validation.
   Failures → stop and offer: run debug workflow on failures, retry with
   `--force` (accepting warnings), or `--skip-audit` (warn loudly). Audit
   passes or `--force` → continue.
5. **Verify phase completeness**: read ROADMAP.md, identify every phase in the
   milestone, confirm each shows complete. Any incomplete phase → stop and
   report which ones remain.
6. **Archive** (unless `--no-archive`): create `.planning/archive/<name>/`;
   copy the milestone's completed plans and summaries into it, snapshot
   STATE.md as `STATE-snapshot.md`, and write `MANIFEST.md` with archive date
   and contents list.
7. **Update ROADMAP.md**: mark all of the milestone's phases complete
   (`[x] ... ✓ Complete` style consistent with the file's existing format).
8. **Update STATE.md**: add a "Milestone Completed" entry with date, phases
   completed (with descriptions), integration health (verified vs skipped),
   total duration (first to last phase), and key deliverables.
9. **Tag** (unless `--no-tag`): create an annotated git tag named after the
   milestone listing included phases and key features; do not push unless
   asked.
10. Summarize: phases completed, duration, integration status, archived yes/no,
    tag name — then suggest next steps (push tag, update external docs, plan
    the next milestone).

## Completion criteria

- status: every milestone's phase-level completeness reported accurately
- complete: audit outcome recorded; no phase left unverified; archive,
  ROADMAP.md marks, STATE.md entry, and tag each either done or explicitly
  declined via flags; summary reflects what actually happened

## References

- @reis/workflows/audit.md (integration checks run before completion)
- @reis/workflows/debug.md (when the audit finds issues)
- @reis/references/state-format.md (STATE.md entry format)

<!-- Migration note: from lib/commands/milestone.ts +
lib/commands/complete-milestone.ts. The `new`/`discuss` subcommands folded into
roadmap-edit and planning workflows respectively; ASCII banner replaced by a
plain summary line. -->
