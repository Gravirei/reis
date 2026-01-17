# REIS - Roadmap Execution & Implementation System

<div align="center">

[![npm version](https://img.shields.io/npm/v/@gravirei/reis.svg)](https://www.npmjs.com/package/@gravirei/reis)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

🚀 **Systematic development with parallel subagent execution for Atlassian Rovo Dev**

[Installation](#installation) • [Quick Start](#quick-start) • [Features](#features) • [Documentation](#documentation)

</div>

---

## ✨ What is REIS?

**REIS (Roadmap Execution & Implementation System)** is a systematic development framework designed specifically for Atlassian Rovo Dev. It provides a structured workflow with 29 commands, 3 specialized subagents, and comprehensive documentation to help you build better software faster.

### Key Benefits

- 📋 **Structured Workflow** - Clear phases from requirements to deployment
- 🤖 **3 Specialized Subagents** - Planner, Executor, and Project Mapper
- 🔄 **Parallel Execution** - Run up to 4 subagents simultaneously
- 💾 **No Context Rot** - Fresh 200k context per task
- ⚡ **Atomic Commits** - One commit per task with automatic tracking
- 🛠️ **Auto-Fix** - Automatic bug detection and gap filling
- 📚 **Always-Loaded Context** - Structured documentation in `~/.rovodev/`

---

## 🚀 Installation

Install REIS globally or run it directly with npx:

```bash
# Run directly (recommended)
npx @gravirei/reis

# Or install globally
npm install -g @gravirei/reis
```

On first run, REIS will install to `~/.rovodev/reis/` and set up subagents for Rovo Dev.

---

## 🎯 Quick Start

### Start a New Project

```bash
reis new "build a todo app with React and Node.js"
```

This will:
1. Create `PROJECT.md` with your vision
2. Generate `REQUIREMENTS.md`
3. Build a phase-based `ROADMAP.md`
4. Initialize `STATE.md` for tracking

### Map an Existing Codebase

```bash
reis map
```

Analyzes your existing project and generates REIS structure.

### Execute Your Roadmap

```bash
reis plan          # Plan next phase
reis execute       # Execute the plan
reis verify        # Verify completion
reis progress      # Track progress
```

---

## 🎨 Features

### 29 Commands Organized by Category

#### **Getting Started**
- `reis new [idea]` - Initialize new REIS project
- `reis map` - Analyze and map existing codebase
- `reis help` - Show all commands
- `reis version` - Show current version

#### **Requirements & Planning**
- `reis requirements` - Work on requirements document
- `reis roadmap` - Work on project roadmap
- `reis assumptions` - Document assumptions

#### **Phase Execution**
- `reis plan` - Create phase execution plan
- `reis discuss` - Discuss phase approach
- `reis research` - Research phase requirements
- `reis execute` - Execute current phase
- `reis execute-plan [file]` - Execute specific plan file
- `reis verify` - Verify phase completion

#### **Progress Management**
- `reis progress` - Show current progress
- `reis pause` - Pause current work
- `reis resume` - Resume paused work
- `reis todo` - Add a todo item
- `reis todos` - Show all todos

#### **Roadmap Management**
- `reis add [phase]` - Add new phase to roadmap
- `reis insert [phase] [after]` - Insert phase after another
- `reis remove [phase]` - Remove phase from roadmap

#### **Milestones**
- `reis milestone complete [name]` - Mark milestone complete
- `reis milestone discuss [name]` - Discuss milestone
- `reis milestone new [name]` - Create new milestone

#### **Utilities**
- `reis debug` - Show debug information
- `reis update` - Update REIS to latest version
- `reis docs` - Open documentation
- `reis whats-new` - Show what's new
- `reis uninstall` - Uninstall REIS

### 3 Specialized Subagents

#### 🎯 **reis_planner**
Creates executable phase plans with:
- Task breakdown and dependency analysis
- Resource requirements
- Risk assessment
- Success criteria

#### ⚡ **reis_executor**
Executes plans with:
- Atomic commits per task
- Deviation handling and checkpoints
- State management
- Auto-fix capabilities

#### 🗺️ **reis_project_mapper**
Maps codebases with:
- Architecture analysis
- Dependency mapping
- Tech stack identification
- REIS structure initialization

---

## 📚 Documentation

After installation, comprehensive documentation is available:

- **Quick Reference**: `~/.rovodev/reis/QUICK_REFERENCE.md`
- **Complete Commands**: `~/.rovodev/reis/COMPLETE_COMMANDS.md`
- **Workflow Examples**: `~/.rovodev/reis/WORKFLOW_EXAMPLES.md`
- **Integration Guide**: `~/.rovodev/reis/INTEGRATION_GUIDE.md`
- **Full Guide**: `~/.rovodev/reis/README.md`

Or access directly:
```bash
reis docs    # Open documentation
```

---

## 🎓 Example Workflow

```bash
# 1. Start a new project
reis new "build an AI chatbot"

# 2. Review and refine requirements
reis requirements

# 3. Create roadmap
reis roadmap

# 4. Execute first phase
reis plan           # Plan Phase 1
reis execute        # Execute Phase 1
reis verify         # Verify completion

# 5. Track progress
reis progress       # See what's done

# 6. Continue to next phase
reis plan           # Plan Phase 2
reis execute        # Execute Phase 2
```

---

## 🛠️ Tech Stack

- **Node.js** - Runtime environment
- **Chalk** - Terminal styling
- **Inquirer** - Interactive prompts
- **Rovo Dev** - AI-powered development platform

---

## 🤝 Contributing

Contributions are welcome! This project is in active development.

---

## 📝 Credits

Inspired by [Get Shit Done](https://github.com/glittercowboy/get-shit-done) by TÂCHES, adapted and enhanced for Atlassian Rovo Dev with parallel subagent execution capabilities.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🔗 Links

- **npm Package**: [@gravirei/reis](https://www.npmjs.com/package/@gravirei/reis)
- **GitHub**: [Gravirei/reis](https://github.com/Gravirei/reis)
- **Issues**: [Report a bug](https://github.com/Gravirei/reis/issues)

---

<div align="center">

**Made with ❤️ for systematic development**

[⬆ back to top](#reis---roadmap-execution--implementation-system)

</div>
