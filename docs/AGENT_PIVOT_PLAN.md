# REIS v3 — Agent-Native Restructuring Plan

**Branch:** `feature/enhancements`
**Goal:** Pivot REIS from a human-facing CLI application into an **agent-native methodology package**: the AI tools (Claude Code, Codex, Gemini CLI, Copilot CLI, Rovo Dev) are the primary interface; humans talk to their agent, the agent follows REIS.

**Explicitly out of scope:** a standalone `gsd-tools`-style SDK. Deterministic operations stay inside workflow instructions (bash snippets the agent runs) until proven necessary.

**Reference model:** `temp_reference/get-shit-done` (GSD) — commands as Markdown prompt files, plain-text workflows, one installer binary.

---

## 1. Target architecture

```
reis/
├── bin/
│   ├── reis.js              ← slim: install | uninstall | update | version ONLY
│   └── install.js           ← postinstall entry (current lib/install.ts)
├── commands/
│   └── reis/*.md            ← ~35 slash-command prompt definitions
├── agents/                  ← 11 subagents (existing subagents/, renamed)
├── get-shit-done-equivalent:
│   └── reis/
│       ├── workflows/*.md   ← imperative methodology extracted from old JS commands
│       ├── references/*.md  ← kanban format, state formats, gate specs, exit codes
│       └── contexts/*.md    ← planning / execution / verification context primers
├── templates/               ← unchanged (PLAN.md, ROADMAP.md, ...)
├── docs/                    ← user-facing guides (slimmed)
├── lib/install.ts           ← multi-platform installer (kept, extended)
└── package.json             ← deps shrink to ~zero runtime deps
```

Install layout per platform (global): agents → `~/.<tool>/agents|subagents/`, commands → skills/slash-command dir, methodology → `~/.<tool>/reis/`. Local/project install writes `.claude/`, `.codex/`, etc. inside the project.

---

## 2. Command disposition map (40 existing commands)

| Disposition | Commands | Notes |
|---|---|---|
| **→ MD command** (agent executes workflow) | plan, research, assumptions, discuss, execute, execute-plan, verify, review, debug, audit, cycle, checkpoint, resume, pause, progress, complete-milestone, milestone, plan-gaps, add, insert, remove, todo, todos, decisions, tree, quick, new-project, requirements, roadmap, map, config, help | 32 core workflow commands |
| **→ merged into other commands** | visualize + progress → one `progress`; execute-plan folds into `execute`; discuss/assumptions fold into `plan --discuss` style flags | reduces count |
| **→ installer flags, not commands** | update, uninstall, version, docs | belong to the slim binary |
| **→ dropped** | kanban (rendering lives in references; agents draw inline) | |

Net target: **~30 slash commands**, each a thin dispatcher referencing workflow prose.

## 3. What gets deleted from `lib/`

The following JS logic becomes either workflow prose or is dropped outright:

- All 40 `lib/commands/*` implementations (replaced by MD)
- Presentation utils: `kanban-renderer`, `cycle-ui`, `visualizer`, `gate-reporter` (agents format output themselves per `references/` specs)
- Orchestrators that merely sequenced prompts: `cycle-orchestrator`, `execution-coordinator` (the *agent* is the orchestrator now)
- commander + inquirer dependencies

Kept in `lib/`: `install.ts` (extended), plus nothing else initially. State/checkpoint file formats are preserved verbatim and specified in `references/` so agents read/write them directly with bash.

---

## 4. Phases

### Phase A — Inventory & Skeleton (1 day)
- Freeze current behavior as documentation source: for each of the 40 commands, extract its *logic* (what it reads, decides, writes) into a migration note appended to the command's future MD file.
- Create target directory skeleton (`commands/reis/`, `reis/workflows|references|contexts/`, move `subagents/` → `agents/`).
- **Exit:** skeleton committed; disposition map reviewed/approved.

### Phase B — Methodology Extraction (3–5 days, parallelizable)
Translate JS command logic into plain-text units under `reis/`:
- `workflows/`: one per command (~30) — step-by-step agent instructions incl. exact bash for state manipulation
- `references/`: STATE/PLAN/ROADMAP formats, wave sizing rules, kanban spec, quality-gate check specs, commit message conventions, exit-code tables
- `contexts/`: planning, execution, verification primers loaded at phase boundaries
- Port the *content* of existing docs/ (QUALITY_GATES, WAVE_EXECUTION, CYCLE_WORKFLOW…) rather than rewriting from scratch
- **Exit:** every disposition-mapped command has a workflow file; references cover all persisted file formats.

### Phase C — Command Files (2–4 days, parallelizable)
Author `commands/reis/*.md` in GSD-compatible frontmatter format (`name`, `description`, `argument-hint`, `allowed-tools`) with `<objective>/<process>/<execution_context>` bodies that `@-reference` the Phase B files.
- Batches mirror the TS migration grouping: planning batch, execution batch, verification batch, utility batch
- **Exit:** all commands authored; each manually smoke-tested in Claude Code via `/reis:<cmd>`.

### Phase D — Installer Upgrade (2–3 days)
Extend the existing registry-based installer:
- Global vs `--local` (project-level) installs
- Runtime transforms: slash-namespace conversion where needed, skills-path rewriting, Copilot `.github/agents` vs user dir
- Install commands → correct mechanism per runtime (Claude skills dir, Gemini extensions, Copilot prompts, Codex prompts)
- Uninstall parity (reuse detection, add commands/workflows dirs)
- Optional `--profile=core|full` later (defer if time-boxed)
- **Exit:** clean-room install for all 5 runtimes; `/reis:progress` works in Claude Code and Copilot CLI e2e.

### Phase E — Binary Slim-Down & Cleanup (1–2 days)
- Reduce `bin/reis.ts` to: interactive first-run install, `uninstall`, `update`, `version`; drop commander usage there (plain argv parsing suffices)
- Delete superseded `lib/**` code and their tests; keep installer tests
- Update README/AGENTS.md/docs; bump to **3.0.0**
- **Exit:** suite green on remaining tests; package ships only installer + MD assets.

**Total estimate: 9–15 working days.**

---

## 5. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Workflow prose loses edge cases encoded in JS | Phase A extraction notes are mandatory input to Phase B; diff-driven review against old command code |
| Token bloat from @-referencing everything | Commands reference only their own workflow; references loaded on demand; consider profiles in a follow-up |
| Runtime quirks (Codex TOML prompts, Copilot naming) | Same transform-test loop as the agent-file work; verify per-runtime in Phase D |
| Losing deterministic guarantees (state parsing) | References include exact bash + format specs; revisit SDK decision only after real-world friction |

## 6. Open decisions (need your call before Phase C)

1. Slash namespace: `reis:*` (colon) or `reis-*` (hyphen)? GSD moved to hyphen for compatibility.
2. Keep Rovo Dev tool lists in agent frontmatter, or strip everywhere?
3. Project-local installs: default off (flag-only) or offered interactively?
