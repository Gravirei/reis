# REIS Competitive Features Plan (v3.x)

**Branch:** `feature/enhancements`
**Baseline:** v3.0.0 agent-native pivot (complete)
**Reference competitor:** GSD (`temp_reference/get-shit-done` v1.50)
**Goal:** Close GSD's genuine moats (hooks, profiles, autonomy) and add differentiators it lacks — without copying its niche features (ultraplan, eval framework, SDK).

---

## Phase overview

| # | Phase | Deliverables | Est. | Depends on |
|---|---|---|---|---|
| F1 | Journey commands | 6 new `/reis:*` workflows + dispatchers | 2–3 d | — |
| F2 | Hooks infrastructure | Hook scripts + settings injection + uninstall parity | 3–4 d | — |
| F3 | Token profiles | Profile taxonomy + installer `--profile` | 1–2 d | F1 (command inventory final) |
| F4 | Cross-runtime verification suite | Test harness + docs | 2–3 d | F2 (hooks change install layout) |

Recommended order: **F1 → F2 → F3 → F4**. F1 is pure content (fast wins, no installer risk); F2 is the moat; F3/F4 build on its install-layout changes.

---

## F1 — Journey Commands (pure Markdown)

New workflow + dispatcher pairs, same authoring pattern as the pivot (thin dispatcher @-referencing workflow).

### F1.1 `reis:autonomous`
- Runs all remaining ROADMAP phases hands-off: per phase → research(skip if exists) → plan → review → execute → verify; gate+debug only on config.
- Workflow must define: loop termination (all phases COMPLETE), failure policy (stop vs continue-on-fail from config), state transitions via `.reis/cycle-state.json` per phase, progress reporting cadence (after each phase).
- Guardrails: require clean tree + explicit "run all remaining" confirmation listing phases before starting.
- Sources of logic: old cycle.ts orchestration semantics (deleted; use reis/workflows/cycle.md as base).

### F1.2 `reis:ship`
- Post-verify flow: confirm VERIFICATION_REPORT.md passing → branch hygiene check → conventional commit squash decision → push → `gh pr create` with body generated from SUMMARY.md + verification evidence → mark milestone contribution.
- Graceful degradation when `gh` is unavailable or repo has no remote (print manual steps).
- New reference needed: `reis/references/pr-template.md`.

### F1.3 `reis:stats`
- Aggregate report: requirements coverage (FRs traced to phases), phase completion %, wave success rate from METRICS.md/STATE.md, git metrics (commits per phase via `git log --grep`), timeline vs estimatedMinutes from PLAN.md.
- Output: compact tables (no ASCII art). Read-only command.

### F1.4 `reis:extract-learnings`
- After milestone completion: mine decisions (.reis/decisions.json), deviations logged in SUMMARY.md files, debug reports → produce `.planning/LEARNINGS.md` sections (Decisions confirmed / Patterns discovered / Surprises / Recommendations for future phases).
- Optionally append condensed lessons to project AGENTS.md/CLAUDE.md-equivalent (ask first).

### F1.5 `reis:ingest-docs`
- Bootstrap `.planning/` from existing repo artifacts: ADRs, PRD/spec files, README architecture sections.
- Ambiguity handling: never invent requirements; list open questions for the user when evidence is thin.
- Complements (does not replace) `reis:map`: map reads code, ingest reads documents; both may run then merge.

### F1.6 `reis:forensics`
- When a cycle/workflow fails weirdly (not code failure): audit the 6 integrity points GSD checks plus ours — state file consistency (.reis/*.json parse + monotonic history), artifact presence (PLAN/SUMMARY/VERIFICATION chain), orphaned waves, checkpoint drift, path violations (per references/artifact-paths.md), gate bypass detection (verify passed but gates missing).
- Produces FORENSICS.md with root cause + recovery plan; routes to resume/debug as appropriate.

**Exit criteria:** 24→30 dispatchers; each smoke-tested in Claude Code; README command table updated.

---

## F2 — Hooks Infrastructure (the reliability moat)

Ship opt-in lifecycle hooks that enforce methodology mechanically.

### F2.1 Hook scripts (new top-level `hooks/` dir, shipped in package)
Port/adapt concepts, not code:
- `session-start.sh` — prints REIS context banner (current phase/state from `.planning/STATE.md`) into session context
- `phase-boundary.sh` — blocks Edit/Write when `.reis/cycle-state.json` says a required prior stage didn't complete (e.g. EXECUTING before REVIEWING passed)
- `workflow-guard.js` — warns when agent edits `.planning/*` artifacts outside the matching command context
- `validate-commit.sh` — commit-msg check against `references/commit-conventions.md`
- `statusline.js` (deferred to F5 unless trivial) — REIS phase in terminal statusline

### F2.2 Installer injection
- Claude Code: merge hooks into `~/.claude/settings.json` (or project `.claude/settings.json` for local scope) under a managed marker key; **never clobber user hooks** — read-modify-write with JSON merge on our namespace (`hooks.reis.*`).
- Codex: append `[hooks]`-equivalent TOML section guarded by marker comments (GSD does exactly this with ownership markers — copy that pattern).
- Gemini/Copilot/Rovo: no hook support today — skip, document limitation.
- Opt-in: interactive yes/no question (default: yes for global installs) + `--hooks/--no-hooks` flags.
- Uninstall must remove exactly what we injected (marker-scoped).

### F2.3 Portability & safety
- Paths in injected settings must be `$HOME`-relative where supported (WSL/docker bind-mounts — GSD learned this as `--portable-hooks`).
- Hook scripts must be defensive: exit 0 on any internal error (never brick a session), 10s timeout, work when node isn't on PATH where possible (prefer POSIX sh for guards; node only for statusline).
- **Exit criteria:** clean-room install enables hooks; violating phase order triggers guard in a real Claude session; uninstall removes all traces; user hooks untouched.

---

## F3 — Token Profiles

Cold-start token cost scales with installed file count; give users control.

### F3.1 Profile taxonomy
- **core** (default going forward?): new-project, map, requirements, roadmap, research, plan, execute, cycle, verify, debug, progress (~11 commands + minimal references)
- **standard**: core + review, gate, checkpoint, resume, pause, quick, ship
- **full**: everything (30)
References/contexts are always fully installed (loaded on demand, cheap); only *commands* and their auto-loaded descriptions dominate cold start — so profiles filter the commands layer primarily.

### F3.2 Mechanics
- Manifest: `commands/reis/profiles.json` mapping command → tier.
- Installer flag `--profile=core|standard|full` (default full for back-compat at 3.x; revisit default later). Persist chosen profile in `~/.<base>/reis/.profile` so `reis update` respects it.
- Interactive prompt when targets selected (skip when `--profile` given).
- Uninstall unaffected (removes all reis-* regardless).
- **Exit criteria:** core install exposes exactly the core set in Claude Code; update retains profile; switching profile adds/removes correctly.

---

## F4 — Cross-Runtime Verification Suite

Turn the manual fake-HOME testing we've been doing into an automated harness.

### F4.1 Harness: `scripts/verify-runtimes.sh` (+ node helper)
For each runtime with a locally-available CLI binary (claude, codex, copilot; gemini/rovo skipped with notice):
1. Create isolated HOME (or CODEX_HOME/COPILOT_HOME equivalent); link auth artifacts when present.
2. Run installer (global scope) → assert file tree matches expectations (agents count, commands format, path rewriting).
3. Discovery probe: invoke the runtime non-interactively asking it to list custom agents/commands → assert `reis_*` present (parse output).
4. Invocation probe (budgeted): one cheap round-trip through `/reis:progress`-equivalent asserting the response references REIS state.
5. Emit pass/fail matrix; nonzero exit on discovery failures (auth-limited runs reported as SKIPPED, not failed).

### F4.2 CI integration
- GitHub Actions workflow (manual trigger + weekly cron) running the harness; auth secrets via repository secrets where feasible.
- **Exit criteria:** one command proves "install → discover → invoke" per available runtime; regressions in packaging/format caught before publish.

---

## Deferred / F5 backlog (not scheduled)
- Statusline integration (needs per-terminal research)
- Multi-agent parallel phase execution (methodology experiment first)
- MCP server exposing REIS state (industry converging on MCP; revisit after hooks)
- Additional runtimes (Cursor/Windsurf/OpenCode/Qwen…) — registry makes this cheap once there's demand

---

## Versioning
- F1 lands as **3.1.0**, F2 as **3.2.0**, F3 as **3.3.0**, F4 tooling-only (**3.3.x**).
- Each phase updates CHANGELOG + README command table.

## Risks
| Risk | Mitigation |
|---|---|
| Hooks bricking user sessions | Defensive scripts (exit 0), marker-scoped injection, opt-in default off until proven |
| Settings.json merge corrupting user config | Read-modify-write with JSON parse validation + backup file before write |
| Autonomous mode runaway costs | Hard confirmation listing phases + per-phase budget note + continue-on-fail defaults conservative |
| Runtime CLI output formats drift breaking F4 probes | Probes assert loosely (substring), SKIPPED-not-failed for auth issues; weekly cadence catches drift early |
