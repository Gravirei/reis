# [DRAFT] REIS v2.0.0-beta.1 Release Notes

🎉 **First Beta Release** - Major upgrade with wave execution, checkpoints, and visualization!

## 🚀 What's New in v2.0

REIS v2.0 brings powerful new features for systematic development:

### 🌊 Wave Execution
Execute plans in sequential waves with automatic checkpoints between each wave. No more losing progress!

**Commands:**
- `reis execute-plan` - Enhanced with wave-based execution
- Wave progress tracked automatically in STATE.md
- Git commits created per wave completion

**Features:**
- Break large plans into manageable waves
- Automatic checkpoints between waves
- Smart context management (no context rot)
- Parallel task execution within waves
- Wave-level git commits

### 💾 Checkpoints & Smart Resume
Save your progress at any point and resume intelligently.

**Commands:**
- `reis checkpoint "message"` - Create manual checkpoints
- `reis checkpoint --list` - View all checkpoints
- `reis resume` - Smart resume with recommendations
- `reis resume --from <checkpoint>` - Resume from specific point

**Features:**
- Automatic checkpoints at wave boundaries
- Manual checkpoint creation anytime
- Context-aware resume recommendations
- Checkpoint history in STATE.md
- Git integration for checkpoint commits

### ⚙️ Configuration System
Customize REIS behavior with reis.config.js in your project root.

**Commands:**
- `reis config init` - Create config template
- `reis config show` - View merged configuration
- `reis config validate` - Validate config files

**Configure:**
- Wave sizes (small/medium/large task counts)
- Git integration settings (auto-commit, commit format)
- Auto-commit behavior
- Checkpoint intervals
- LLM preferences (model, temperature, tokens)
- Subagent customization

### 📊 Metrics Tracking
Automatic tracking of execution metrics, success rates, and performance.

**Features:**
- Wave duration tracking
- Success rate calculation
- Deviation logging
- Phase-level statistics
- JSON-based metrics storage
- Historical trend analysis

**Metrics tracked:**
- Wave completion times
- Task success/failure rates
- Checkpoint frequency
- Deviation types and counts
- Overall project progress

### 📈 Visualization
Beautiful ASCII charts for progress and roadmap visualization.

**Commands:**
- `reis visualize --type progress` - Current progress bars
- `reis visualize --type waves` - Wave execution timeline
- `reis visualize --type roadmap` - Full roadmap overview
- `reis visualize --type metrics` - Metrics dashboard
- `reis visualize --watch` - Auto-refresh every 5 seconds

**Features:**
- Terminal-safe, width-adaptive rendering
- Color and monochrome modes
- Progress bars with ETA
- Distribution charts
- Tables with borders
- ASCII bar charts for metrics

### ✅ Plan Validation
Catch PLAN.md issues before execution.

**Features:**
- Structure validation (required sections, proper headers)
- Wave dependency checking
- Task completeness verification (name, type, action, verify)
- Circular dependency detection
- Actionable error messages
- Validates before execution starts

## 📦 What's Included

### Core Utilities (8 files)
- **config.js** - Configuration system with defaults and merging
- **state-manager.js** - STATE.md management and checkpoint tracking
- **git-integration.js** - Git operations (commit, tag, status)
- **wave-executor.js** - Wave-based execution engine
- **metrics-tracker.js** - Metrics collection and reporting
- **visualizer.js** - ASCII visualization rendering
- **plan-validator.js** - Plan structure and dependency validation
- **command-helpers.js** - Shared command utilities

### Enhanced Commands (5 files)
- **execute-plan.js** - Wave-based plan execution
- **checkpoint.js** - Manual checkpoint creation and listing
- **resume.js** - Smart resume with recommendations
- **config.js** - Configuration management
- **visualize.js** - Progress and metrics visualization

### Subagents (3 files)
- **reis_planner.md** - Phase planning subagent
- **reis_executor.md** - Plan execution subagent
- **reis_project_mapper.md** - Codebase mapping subagent

### Documentation (5 new guides)
- **MIGRATION_GUIDE.md** - v1.x → v2.0 migration guide
- **WAVE_EXECUTION.md** - Wave-based execution system
- **CHECKPOINTS.md** - Checkpoint system and recovery
- **CONFIG_GUIDE.md** - Complete configuration reference
- **V2_FEATURES.md** - All v2.0 features overview

### Example Projects (3 complete examples)
1. **basic-workflow/** - TODO CLI app (beginner friendly)
2. **advanced-features/** - REST API with auth (shows complex waves)
3. **migration-example/** - v1.x → v2.0 transition (side-by-side comparison)

### Sample Configurations (4 configs)
- **minimal.js** - Bare minimum config
- **team-optimized.js** - Multi-developer team settings
- **solo-developer.js** - Individual developer workflow
- **ci-cd.js** - Continuous integration settings

### Test Suite
- **309 tests passing** - Comprehensive test coverage
- **4 pending tests** - Intentionally skipped, not blocking
- Performance benchmarks included
- All utilities tested with edge cases

## 🔄 Migration from v1.x

**Good news:** REIS v2.0 is **fully backward compatible**!

Your existing v1.x projects will work without any changes. Upgrade and continue using REIS as before, then adopt new features at your own pace.

### Migration steps:
1. **Upgrade**: `npm install -g @gravirei/reis@2.0.0-beta.1`
2. **(Optional) Add config**: `reis config init`
3. **Continue using existing commands** - All v1.x commands still work
4. **Try new features**: `reis execute-plan`, `reis checkpoint`, `reis visualize`

### What stays the same:
- ✅ All v1.x commands work unchanged
- ✅ Existing ROADMAP.md, STATE.md, PLAN.md formats
- ✅ Project structure and file locations
- ✅ Subagent behavior and templates
- ✅ Installation and setup process

### What's new (opt-in):
- ⭐ Wave-based execution (use `execute-plan` instead of `execute`)
- ⭐ Configuration system (optional reis.config.js)
- ⭐ Checkpoint commands (optional manual checkpoints)
- ⭐ Visualization commands (optional progress viewing)
- ⭐ Metrics tracking (automatic, view with `visualize`)

See [MIGRATION_GUIDE.md](../../../docs/MIGRATION_GUIDE.md) for detailed migration instructions.

## ⚡ Performance

All utilities meet strict performance targets:

| Utility | Target | Actual |
|---------|--------|--------|
| Config load | <50ms | ✅ ~30ms |
| STATE.md updates | <100ms | ✅ ~60ms |
| Git commits | <250ms | ✅ ~180ms |
| Wave parsing | <150ms | ✅ ~90ms |
| Metrics operations | <10ms | ✅ ~5ms |
| Plan validation | <200ms | ✅ ~120ms |
| Visualization | <10ms | ✅ ~7ms |

**No performance regressions** - v2.0 is as fast or faster than v1.x for all operations.

## 🐛 Known Issues

- 4 pending tests (intentionally skipped for future features, not blocking)
- Beta release - may have undiscovered edge cases
- Please report issues at: https://github.com/Gravirei/reis/issues

**No critical bugs known** - Beta release is stable for testing.

## 🙏 Feedback Welcome

This is a **beta release** - we need your feedback!

**What we want to know:**
- Does wave execution work well for your projects?
- Is the configuration system intuitive?
- Are the visualizations helpful?
- What features are missing?
- Any bugs or unexpected behavior?

**How to provide feedback:**
- 🐛 Report bugs: https://github.com/Gravirei/reis/issues
- 💡 Feature requests: https://github.com/Gravirei/reis/discussions
- 📧 Direct feedback: [email or discussion link]
- ⭐ Star the repo if you like it!

## 📥 Installation

```bash
# Global installation
npm install -g @gravirei/reis@2.0.0-beta.1

# Or use with npx
npx @gravirei/reis@2.0.0-beta.1 --version

# Verify installation
reis --version
# Should output: 2.0.0-beta.1
```

## 🔗 Links

- **Repository**: https://github.com/Gravirei/reis
- **Issues**: https://github.com/Gravirei/reis/issues
- **Discussions**: https://github.com/Gravirei/reis/discussions
- **Documentation**: [docs/](../../../docs/)
- **Examples**: [examples/](../../../examples/)
- **NPM Package**: https://www.npmjs.com/package/@gravirei/reis

## 🎓 Getting Started

```bash
# Initialize new project
reis new my-project
cd my-project

# Configure (optional, but recommended for v2.0)
reis config init

# Create roadmap
reis roadmap

# Plan first phase
reis plan

# Execute with wave-based flow (new in v2.0!)
reis execute-plan

# Create manual checkpoint
reis checkpoint "First milestone complete"

# Visualize progress
reis visualize --type progress

# View wave timeline
reis visualize --type waves

# Check metrics
reis visualize --type metrics
```

## 🎯 Quick Feature Tour

### Configuration
```bash
# Create config with defaults
reis config init

# View merged config (defaults + your overrides)
reis config show

# Validate your config
reis config validate
```

### Wave Execution
```bash
# Execute plan with waves (replaces old 'execute')
reis execute-plan

# Waves are created automatically based on task complexity
# Checkpoints created between waves
# Progress tracked in STATE.md
```

### Checkpoints
```bash
# Create manual checkpoint
reis checkpoint "Completed user auth"

# List all checkpoints
reis checkpoint --list

# Resume from last checkpoint
reis resume

# Resume from specific checkpoint
reis resume --from checkpoint-20260118-103045
```

### Visualization
```bash
# Current progress bars
reis visualize --type progress

# Wave execution timeline
reis visualize --type waves

# Full roadmap overview
reis visualize --type roadmap

# Metrics dashboard
reis visualize --type metrics

# Auto-refresh mode (updates every 5 seconds)
reis visualize --type progress --watch
```

## 💝 Credits

Inspired by [Get Shit Done](https://github.com/glittercowboy/get-shit-done) by TÂCHES, adapted for Atlassian Rovo Dev with enhanced features for systematic development.

Thanks to all contributors and testers who helped shape v2.0!

---

**Full Changelog**: [CHANGELOG.md](../../../CHANGELOG.md)

**Documentation**: [docs/](../../../docs/)

**Examples**: [examples/](../../../examples/)

---

*This is a DRAFT release note. Final version will be published after Wave 3.3 manual testing completes.*
