# Changelog

All notable changes to REIS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0-alpha.1] - 2026-01-18 (Phase 1 Complete)

### Added - Phase 1: Foundation
- **Config System** (`lib/utils/config.js`)
  - Load and validate `reis.config.js` from project root
  - Wave size configuration (small/medium/large)
  - Git integration settings
  - Deep merge with defaults
  - Comprehensive validation
  
- **Enhanced State Management** (`lib/utils/state-manager.js`)
  - Wave tracking with start/complete/progress
  - Checkpoint management with history
  - Activity logging with timestamps
  - Metrics tracking (success rate, duration)
  - Markdown-based state persistence
  
- **Git Integration** (`lib/utils/git-integration.js`)
  - Repository detection and status checking
  - Structured commits with metadata
  - Wave completion auto-commits
  - Checkpoint commits and milestone tagging
  - Branch management and rollback support
  
- **Wave Execution Engine** (`lib/utils/wave-executor.js`)
  - Parse PLAN.md into Wave objects
  - Wave lifecycle management
  - Sequential execution with auto-checkpoints
  - Deviation detection and reporting
  - Resume from checkpoint capability

- **Comprehensive Test Suite**
  - 48 unit and integration tests (100% passing)
  - Full workflow integration tests
  - Test coverage for all Phase 1 utilities

### Technical Details
- ~1,587 lines of utility code
- 4 core utility modules
- Wave-based execution model from GSD analysis
- Backward compatible with REIS v1.x projects

## [1.0.0] - 2025-01-17

### Added - Initial Release

#### Core System
- **29 Commands** - Complete systematic development workflow
  - Project initialization: `new`, `map`
  - Requirements & roadmap: `requirements`, `roadmap`
  - Phase management: `plan`, `discuss`, `research`, `assumptions`, `execute`, `execute-plan`, `verify`
  - Progress tracking: `progress`, `pause`, `resume`
  - Roadmap management: `add`, `insert`, `remove`
  - Milestones: `milestone complete`, `milestone discuss`, `milestone new`
  - Utilities: `todo`, `todos`, `debug`, `update`, `whats-new`, `docs`, `uninstall`
  - Help: `help`, `version`

#### 3 Specialized Subagents
- **reis_planner** - Creates executable phase plans with task breakdown
- **reis_executor** - Executes plans with atomic commits and deviation handling
- **reis_project_mapper** - Maps existing codebases and bootstraps REIS structure

#### Documentation (8 files)
- `README.md` - Main documentation and architecture guide
- `COMPLETE_COMMANDS.md` - All 29 commands with examples
- `QUICK_REFERENCE.md` - Quick reference for daily use
- `WORKFLOW_EXAMPLES.md` - Real-world workflow examples
- `INTEGRATION_GUIDE.md` - Rovo Dev integration instructions
- `SHORTCUT_GUIDE.md` - Natural language shortcuts
- `README_DOCS.md` - Documentation navigation guide
- `shortcuts.json` - Structured shortcut definitions

#### Templates (5 files)
- `PROJECT.md` - Project vision template
- `REQUIREMENTS.md` - Requirements document template
- `ROADMAP.md` - Roadmap structure template
- `STATE.md` - State tracking template
- `PLAN.md` - Phase plan template

#### Features
- ✅ Parallel execution - Run up to 4 subagents simultaneously
- ✅ No context rot - Fresh 200k context per task
- ✅ Atomic commits - One commit per task
- ✅ Auto-fix - Bugs and gaps fixed automatically
- ✅ Structured documentation - Always-loaded context
- ✅ Beautiful CLI - Colors, icons, and clear formatting
- ✅ Silent mode - CI/CD friendly installation
- ✅ Idempotent installation - Safe to run multiple times

#### Installation
- NPM package with `npx reis` support
- Interactive installation with confirmation prompt
- Automatic file copying to `~/.rovodev/reis/`
- Subagent installation to `~/.rovodev/subagents/`

### Credits
Inspired by [Get Shit Done](https://github.com/glittercowboy/get-shit-done) by TÂCHES, adapted for Atlassian Rovo Dev with enhanced parallel subagent execution.

[1.0.0]: https://github.com/Gravirei/reis/releases/tag/v1.0.0
