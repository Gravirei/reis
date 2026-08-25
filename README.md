<div align="center">

# REIS

**Roadmap Execution & Implementation System**

An agent-native development methodology for AI CLI tools — plan, execute, and verify software projects through structured workflows, specialized subagents, and quality gates.

[![npm version](https://img.shields.io/badge/version-v3.0.0-blue.svg)](https://www.npmjs.com/package/@gravirei/reis)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

REIS v3 is not a human-facing CLI. It's a methodology package that installs into your AI coding tool: slash-command dispatchers, 11 specialized subagents, and plain-Markdown workflows your agent follows to take a project from idea to deployment. You talk to your AI tool; your tool runs REIS.

## Supported Tools

| Tool | Install location | Invocation |
|------|------------------|------------|
| Claude Code | `~/.claude/commands/reis/` | `/reis:<cmd>` |
| Gemini CLI | `~/.gemini/` (TOML commands) | `/reis:<cmd>` |
| Codex | `~/.codex/prompts/` | `/prompts:reis-<cmd>` |
| Copilot CLI | skills directory (`reis-*` skills) | `reis-*` skills |
| Rovo Dev | `~/.rovodev/` (agents only) | Ask it to use `reis_planner`, etc. |

## Installation

```bash
# Global install (recommended) — postinstall auto-installs into detected tools
npm install -g @gravirei/reis

# Or run without installing globally
npx @gravirei/reis
```

The binary only manages installation:

```bash
reis            # install (default)
reis update
reis uninstall
reis version
reis help
```

Flags:

```bash
--local                   # project-local install instead of global home dirs
--claude --codex --gemini --copilot --rovodev   # target specific tools
```

Example: local install for Claude Code only:

```bash
npx @gravirei/reis --local --claude
```

## Quick Start

```bash
npm install -g @gravirei/reis   # 1. install
```

2. Open your AI tool (e.g. Claude Code).
3. Run `/reis:new-project` — initializes `.planning/` structure.
4. Run `/reis:cycle 1` — full automated loop for phase 1.

That's it. The cycle handles planning, review, execution, verification, gates, and debugging automatically.

## Commands

All commands run inside your AI tool via its invocation syntax above.

| Command | Description |
|---------|-------------|
| `new-project` | Initialize a new REIS project with `.planning/` structure |
| `map` | Map an existing codebase into REIS structure |
| `requirements` | Generate or refine REQUIREMENTS.md |
| `roadmap` | Create ROADMAP.md from project analysis |
| `research` | Research implementation approaches for a phase |
| `plan` | Create wave-based PLAN.md for a phase (`discuss`/`assumptions` are plan flags) |
| `execute` | Execute the current phase plan |
| `execute-plan` | Execute a specific plan file path |
| `cycle` | Full automated loop: PLAN→REVIEW→EXECUTE→VERIFY→GATE→DEBUG→re-VERIFY |
| `verify` | Verify completion against plan success criteria |
| `review` | Review a plan against the codebase before execution |
| `gate` | Run quality gates (security / quality / performance / accessibility) |
| `debug` | Deep root-cause analysis of verification failures |
| `audit` | Milestone-level cross-phase integration audit |
| `checkpoint` | Manage execution checkpoints |
| `resume` | Resume interrupted work from checkpoint/state |
| `pause` | Pause current work safely |
| `quick` | Quick one-off task without full ceremony |
| `progress` | Show progress report and route to next action |
| `todo` | Add TODO items |
| `decisions` | Track architectural decisions |
| `tree` | Interactive decision trees with export |
| `milestone` | Manage milestone lifecycle |
| `roadmap-edit` | Add / insert / remove roadmap phases |
| `config` | Manage REIS configuration |
| `autonomous` | Run all remaining phases hands-off with per-phase reporting |
| `ship` | Create a PR from verified work using verification evidence |
| `stats` | Aggregate project metrics: coverage, completion, timeline |
| `extract-learnings` | Mine decisions/patterns/surprises into LEARNINGS.md |
| `ingest-docs` | Bootstrap `.planning/` from existing ADRs/PRDs/specs |
| `forensics` | Post-mortem audit when a REIS workflow itself fails |

## Subagents

Your AI tool dispatches these agents as needed:

- **reis_analyst** — analyzes project requirements, tech choices, risks
- **reis_architect** — decomposes goals into phased roadmaps
- **reis_scout** — researches implementation approaches per phase
- **reis_synthesizer** — merges parallel research findings
- **reis_planner** — creates wave-based, dependency-aware PLAN.md files
- **reis_plan_reviewer** — validates plans against the actual codebase pre-execution
- **reis_executor** — executes plans with atomic commits and checkpoints
- **reis_verifier** — verifies feature completeness, tests, success criteria
- **reis_integrator** — cross-phase integration audits (via `audit`)
- **reis_debugger** — root-cause analysis; generates FIX_PLAN.md
- **reis_project_mapper** — maps existing codebases into REIS structure

## Key Concepts

- **`.planning/` artifacts** — PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md, and per-phase PLAN/SUMMARY/report files live here.
- **`.reis/` runtime state** — `cycle-state.json` state machine, execution checkpoints, locks. Survives crashes so work can resume mid-task.
- **Wave execution** — plans decompose into waves of independent tasks; independent waves run in parallel (up to 4 concurrent).
- **Quality gates** — security, quality, performance, and accessibility checks run after verification; failures feed the debug loop.
- **Checkpoints & crash recovery** — task-level checkpointing lets `/reis:resume` pick up exactly where execution stopped.

Canonical documentation for each concept lives in [`reis/workflows/*.md`](reis/workflows/) (per command), with supporting material in [`reis/references/`](reis/references/) and [`reis/contexts/`](reis/contexts/).

## How It Works

1. The installer copies agent definitions, command dispatchers, and methodology Markdown into each supported tool's configuration directory (see table above), or into the project when using `--local`.
2. Paths inside those files are rewritten per platform so each tool's native mechanism (slash commands, TOML prompts, skills, or agents) can resolve them.
3. At runtime, your AI tool reads the dispatcher for the command you invoked, loads the relevant workflow from `reis/workflows/`, and orchestrates subagents to do the work.
4. Global installs serve all projects from one location; local installs vendor REIS into the repo for team-shared, versioned setups.

## Development

```bash
npm install          # install dependencies
npm run build        # compile TypeScript to lib/ + bin/
npm run typecheck    # tsc --noEmit (strict mode)
npm run lint         # eslint
npm test             # Jest unit/integration/e2e suites
npm run test:perf    # performance benchmarks
```

## License

MIT — see [LICENSE](LICENSE).

## Links

- [npm package](https://www.npmjs.com/package/@gravirei/reis)
- [Report issues](https://github.com/Gravirei/reis/issues)
