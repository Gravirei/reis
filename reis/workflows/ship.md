# Workflow: Ship Phase

Turn a verified phase into a pull request: confirm verification actually
passes, check branch hygiene, generate a PR body from SUMMARY.md and
VERIFICATION_REPORT.md evidence, open the PR with `gh` (with exact manual
steps as fallback), and suggest milestone follow-up.

## Preconditions

- `.planning/` directory exists (if not, this is not a REIS project — run the
  new-project or map-codebase workflow first)
- A target phase resolves to `.planning/phases/<N>-<name>/` containing both
  `SUMMARY.md` and `VERIFICATION_REPORT.md` whose Overall status shows PASS
  (or PASSED WITH WARNINGS) — if the report is missing or shows FAIL, stop and
  point to the verify/debug workflows; never ship unverified work

## Inputs

- Optional target: phase number or name (default: the most recently verified
  phase per STATE.md)
- Optional flags:
  - `--draft` — open the PR as a draft
  - `--base <branch>` — target base branch (default: repo default, usually main)

## Steps

1. Resolve the target phase and read `SUMMARY.md`,
   `VERIFICATION_REPORT.md`, and the phase's `PLAN.md` (for wave/task names).
2. Re-confirm the verification passes: parse the report's overall status and
   completeness %. FAIL or <100% → stop, recommend `/reis:debug`.
3. Branch hygiene: require a clean tree (`git status --porcelain` empty —
   commit or stash first) and confirm the current branch is NOT the mainline
   (main/master); if on mainline, stop and ask which feature branch to ship.
4. Check tooling: `git remote get-url origin` (a remote must exist) and
   `gh auth status` (gh CLI installed and authenticated).
5. Generate the PR title (`[Phase N] <name>: <one-line goal>`) and body per
   @reis/references/pr-template.md, writing the body to
   `.planning/phases/<N>-<name>/PR_BODY.md` so it is inspectable and reusable.
6. Create the PR: push the branch (`git push -u origin <branch>`), then
   `gh pr create --title <title> --body-file <PR_BODY.md>` adding `--draft`
   and/or `--base <branch>` when requested.
7. Fallback: if gh is missing/unauthenticated or no remote exists, do not fake
   it — print the EXACT manual steps: the push command, the compare/PR URL
   (`https://github.com/<owner>/<repo>/compare/<base>...<branch>`), and note
   that the ready-to-paste body is at the PR_BODY.md path.
8. Post-creation: print the PR URL prominently, remind that local commits are
   now pushed, and suggest next steps — updating ROADMAP.md/STATE.md, and
   running the milestone workflow when this was the milestone's last phase.

## Completion criteria

- PR created (URL printed) or exact manual reproduction steps printed
- PR body follows the template with real verification evidence cited
- Tree was clean and the PR came from a non-mainline branch
- PR_BODY.md persisted alongside the phase artifacts for auditability

## References

- @reis/references/pr-template.md (body structure and rules)
- @reis/references/artifact-paths.md (SUMMARY/VERIFICATION_REPORT locations)
- @reis/references/commit-conventions.md (commit/tag conventions referenced
  in the PR description)
- @reis/workflows/verify.md, @reis/workflows/debug.md (precondition flows)

<!-- Migration note: new capability; no lib/ predecessor. Replaces ad-hoc
manual PR assembly with evidence-backed generation from REIS artifacts. -->
