<div align="center">

# REIS

**Roadmap Execution & Implementation System**

Systematic development with parallel subagent execution for Atlassian Rovo Dev

[![npm version](https://img.shields.io/badge/version-v2.0.0--beta.1-blue.svg)](https://www.npmjs.com/package/@gravirei/reis)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[What is REIS?](#what-is-reis) •
[Installation](#installation) •
[Quick Start](#quick-start) •
[Commands](#commands) •
[Documentation](#documentation)

<img src=".github/assets/reis-demo.png" alt="REIS Demo" width="800">

</div>

## What is REIS?

**REIS (Roadmap Execution & Implementation System)** is a systematic development framework for building better software with AI. Designed for Atlassian Rovo Dev, REIS provides structured workflows, specialized subagents, and comprehensive documentation to take projects from idea to deployment.

### ✨ What's New in v2.0

REIS v2.0 introduces powerful wave-based execution with smart checkpoints, making development more predictable and resilient:

- 🌊 **Wave Execution** - Sequential waves with automatic checkpoints between phases
- 💾 **Smart Resume** - Resume from any checkpoint with deviation detection
- ⚙️ **Config System** - Customize wave sizes, git behavior, and templates via `reis.config.js`
- 📊 **Metrics Tracking** - Track success rates, durations, and deviations automatically
- 📈 **Visualization** - ASCII charts for progress, roadmap, and metrics
- ✅ **Plan Validation** - Catch issues before execution with comprehensive validation

### Why REIS?

- 📋 **Structured Workflow** - Clear phases from requirements to deployment
- 🤖 **3 Specialized Subagents** - Planner, Executor, and Project Mapper working in parallel
- 🔄 **Parallel Execution** - Run up to 4 subagents simultaneously
- 💾 **No Context Rot** - Fresh 200k context per task
- ⚡ **Atomic Commits** - One commit per task with automatic tracking
- 🛠️ **Auto-Fix** - Automatic bug detection and gap filling
- 📚 **Always-Loaded Context** - Structured documentation in `~/.rovodev/`

Inspired by [Get Shit Done](https://github.com/glittercowboy/get-shit-done) and enhanced for Rovo Dev.

## Installation

```bash
npx @gravirei/reis
```

Or install globally:

```bash
npm install -g @gravirei/reis
```

On first run, REIS installs to `~/.rovodev/reis/` and sets up subagents for Rovo Dev.

## Quick Start

### Initialize a new project

```bash
reis new "build a todo app with React and Node.js"
```

This creates:
- `PROJECT.md` - Your project vision
- `REQUIREMENTS.md` - Detailed requirements
- `ROADMAP.md` - Phase-based roadmap
- `STATE.md` - Progress tracking

### Configure your project (v2.0)

```bash
# Initialize configuration file
reis config init

# View current configuration
reis config show
```

### Map an existing codebase

```bash
reis map
```

Analyzes your project and generates REIS structure.

### Execute your roadmap

```bash
# Traditional workflow
reis plan          # Plan next phase
reis execute       # Execute the plan
reis verify        # Verify completion
reis progress      # Track progress

# v2.0 Wave-based workflow
reis execute-plan  # Execute with automatic waves and checkpoints
reis checkpoint "Feature complete"  # Create manual checkpoint
reis resume        # Resume from last checkpoint
reis visualize --type progress      # Visualize progress
```

## Commands

REIS provides comprehensive commands organized into categories. See [COMPLETE_COMMANDS.md](package/docs/COMPLETE_COMMANDS.md) for full details.

### Getting Started
```bash
reis new [idea]         # Initialize new REIS project
reis map                # Map existing codebase
reis help               # Show all commands
reis version            # Show current version
```

### Configuration (v2.0)
```bash
reis config init        # Create reis.config.js
reis config show        # Show current config
reis config validate    # Validate config file
```

### Requirements & Planning
```bash
reis requirements       # Work on requirements
reis roadmap            # Work on roadmap
reis assumptions        # Document assumptions
```

### Phase Execution
```bash
reis plan               # Create phase plan
reis discuss            # Discuss phase approach
reis research           # Research requirements
reis execute            # Execute current phase
reis execute-plan [f]   # Execute with wave-based flow (v2.0)
reis verify             # Verify completion
```

### Checkpoints & Resume (v2.0)
```bash
reis checkpoint [msg]   # Create checkpoint
reis checkpoint --list  # List all checkpoints
reis resume             # Smart resume from last checkpoint
reis resume --from [cp] # Resume from specific checkpoint
```

### Visualization (v2.0)
```bash
reis visualize --type progress  # Progress visualization
reis visualize --type roadmap   # Roadmap timeline
reis visualize --type metrics   # Metrics dashboard
reis visualize --watch          # Auto-refresh mode
```

### Progress Management
```bash
reis progress           # Show progress
reis pause              # Pause work
reis todo               # Add todo
reis todos              # Show todos
```

### Roadmap Management
```bash
reis add [phase]        # Add phase
reis insert [p] [after] # Insert phase
reis remove [phase]     # Remove phase
```

### Milestones
```bash
reis milestone complete [name]  # Complete milestone
reis milestone discuss [name]   # Discuss milestone
reis milestone new [name]       # Create milestone
```

### Utilities
```bash
reis debug              # Debug info
reis update             # Update REIS
reis docs               # Open docs
reis whats-new          # What's new
reis uninstall          # Uninstall
```

## Subagents

REIS includes 3 specialized subagents for Rovo Dev:

### 🎯 reis_planner
Creates executable phase plans with task breakdown, dependency analysis, resource requirements, and success criteria.

### ⚡ reis_executor
Executes plans with atomic commits, deviation handling, checkpoints, state management, and auto-fix capabilities.

### 🗺️ reis_project_mapper
Maps codebases with architecture analysis, dependency mapping, tech stack identification, and REIS structure initialization.

## Documentation

### Core Documentation

- [COMPLETE_COMMANDS.md](package/docs/COMPLETE_COMMANDS.md) - All commands with examples
- [QUICK_REFERENCE.md](package/docs/QUICK_REFERENCE.md) - Quick reference for daily use
- [WORKFLOW_EXAMPLES.md](package/docs/WORKFLOW_EXAMPLES.md) - Real-world workflows
- [INTEGRATION_GUIDE.md](package/docs/INTEGRATION_GUIDE.md) - Rovo Dev integration

### v2.0 Documentation

- [V2_FEATURES.md](package/docs/V2_FEATURES.md) - Complete v2.0 features overview
- [MIGRATION_GUIDE.md](package/docs/MIGRATION_GUIDE.md) - Migrating from v1.x to v2.0
- [WAVE_EXECUTION.md](package/docs/WAVE_EXECUTION.md) - Wave-based execution guide
- [CHECKPOINTS.md](package/docs/CHECKPOINTS.md) - Checkpoint system documentation
- [CONFIG_GUIDE.md](package/docs/CONFIG_GUIDE.md) - Configuration reference

### After Installation

Full documentation is also available at `~/.rovodev/reis/`

Access from CLI:
```bash
reis docs
```

## Example Workflow

```bash
# Start a new project
reis new "build an AI chatbot"

# Refine requirements
reis requirements

# Create roadmap
reis roadmap

# Execute phases
reis plan && reis execute && reis verify

# Track progress
reis progress

# Continue to next phase
reis plan && reis execute
```

## Tech Stack

- Node.js
- Chalk (terminal styling)
- Inquirer (interactive prompts)
- Rovo Dev (AI development)

## Credits

Inspired by [Get Shit Done](https://github.com/glittercowboy/get-shit-done) by TÂCHES.

Adapted and enhanced for Atlassian Rovo Dev with parallel subagent execution.

## License

MIT - see [LICENSE](LICENSE) file.

## Links

- [npm package](https://www.npmjs.com/package/@gravirei/reis)
- [Report issues](https://github.com/Gravirei/reis/issues)

---

<div align="center">

Made with ❤️ for systematic development

</div>
