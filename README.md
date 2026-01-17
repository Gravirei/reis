<div align="center">

# REIS

**Roadmap Execution & Implementation System**

Systematic development with parallel subagent execution for Atlassian Rovo Dev

[![npm version](https://img.shields.io/npm/v/@gravirei/reis.svg)](https://www.npmjs.com/package/@gravirei/reis)
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

### Map an existing codebase

```bash
reis map
```

Analyzes your project and generates REIS structure.

### Execute your roadmap

```bash
reis plan          # Plan next phase
reis execute       # Execute the plan
reis verify        # Verify completion
reis progress      # Track progress
```

## Commands

REIS provides 29 commands organized into categories:

### Getting Started
```bash
reis new [idea]         # Initialize new REIS project
reis map                # Map existing codebase
reis help               # Show all commands
reis version            # Show current version
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
reis execute-plan [f]   # Execute specific plan
reis verify             # Verify completion
```

### Progress Management
```bash
reis progress           # Show progress
reis pause              # Pause work
reis resume             # Resume work
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

After installation, full documentation is available at:

- `~/.rovodev/reis/README.md` - Full guide
- `~/.rovodev/reis/QUICK_REFERENCE.md` - Quick reference
- `~/.rovodev/reis/COMPLETE_COMMANDS.md` - All commands
- `~/.rovodev/reis/WORKFLOW_EXAMPLES.md` - Real examples
- `~/.rovodev/reis/INTEGRATION_GUIDE.md` - Rovo Dev integration

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
