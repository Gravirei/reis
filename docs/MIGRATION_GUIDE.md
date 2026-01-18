# REIS v1.x to v2.0 Migration Guide

## Overview

REIS v2.0 introduces powerful new features while maintaining **100% backward compatibility** with v1.x projects. You can upgrade immediately and adopt new features at your own pace.

### What's New in v2.0

- 🌊 **Wave Execution** - Sequential waves with automatic checkpoints
- 💾 **Smart Checkpoints** - Resume from any point with full context
- ⚙️ **Configuration System** - Customize behavior via `reis.config.js`
- 📊 **Metrics Tracking** - Automatic success rate and duration tracking
- 📈 **Visualization** - ASCII charts for progress and roadmap
- ✅ **Plan Validation** - Catch issues before execution
- 🔧 **Enhanced Commands** - New `config`, `checkpoint`, `resume`, `visualize` commands

## Breaking Changes

**None!** REIS v2.0 is fully backward compatible with v1.x.

All existing commands, workflows, and PLAN.md files work exactly as before. New features are opt-in enhancements.

## Migration Steps

### Step 1: Upgrade REIS

```bash
# Via npx (recommended)
npx @gravirei/reis@2.0.0-beta.1

# Or install globally
npm install -g @gravirei/reis@2.0.0-beta.1
```

Verify installation:
```bash
reis version
# Output: REIS v2.0.0-beta.1
```

### Step 2: Test Existing Commands

All v1.x commands still work:

```bash
# Traditional workflow (still works!)
reis new "my project"
reis requirements
reis roadmap
reis plan
reis execute
reis verify
reis progress
```

Your existing `.planning/` directory, STATE.md, and PLAN.md files are compatible with v2.0.

### Step 3: Optional - Add Configuration

Create a `reis.config.js` file to customize v2.0 features:

```bash
reis config init
```

This creates `reis.config.js` in your project root with sensible defaults. You can customize:
- Wave sizes and behavior
- Git integration settings
- Metrics tracking options
- Visualization preferences

**Note:** Configuration is entirely optional. v2.0 works perfectly with default settings.

### Step 4: Try New Features

#### Wave-Based Execution

The `execute-plan` command now automatically detects waves in your PLAN.md:

```bash
reis execute-plan
```

If your PLAN.md doesn't have explicit wave markers, REIS groups tasks intelligently.

#### Manual Checkpoints

Create checkpoints at any point:

```bash
reis checkpoint "Feature complete - ready for testing"
```

List all checkpoints:

```bash
reis checkpoint --list
```

#### Smart Resume

If execution is interrupted, resume with context:

```bash
reis resume
```

Resume from a specific checkpoint:

```bash
reis resume --from checkpoint-2024-01-18-1
```

#### Visualize Progress

View progress in multiple formats:

```bash
# Progress visualization
reis visualize --type progress

# Roadmap timeline
reis visualize --type roadmap

# Metrics dashboard
reis visualize --type metrics

# Watch mode (auto-refresh)
reis visualize --watch
```

## New Features You Can Adopt

### 1. Wave-Based Execution (Automatic)

**What it does:** Groups tasks into waves with automatic checkpoints between them.

**Why it matters:** Better progress tracking, easier resume, clearer state management.

**How to use:**
```bash
reis execute-plan  # Now uses wave-based execution automatically
```

**Migration tip:** Add wave markers to your PLAN.md for better control:

```markdown
## Wave 1: Foundation [M]
- Task 1
- Task 2

## Wave 2: Core Features [L]
- Task 3
- Task 4
```

Size indicators: `[S]` (small), `[M]` (medium), `[L]` (large)

### 2. Checkpoints (Automatic + Manual)

**What it does:** Creates save points you can resume from.

**Why it matters:** Interrupt work safely, experiment without fear, recover from issues.

**How to use:**
```bash
# Automatic: Created between waves
reis execute-plan

# Manual: Create whenever you want
reis checkpoint "Safe point before refactor"
```

**Migration tip:** Start using manual checkpoints before risky changes.

### 3. Configuration (Optional)

**What it does:** Customize REIS behavior for your team/project.

**Why it matters:** Adapt REIS to your workflow, not the other way around.

**How to use:**
```bash
# Create config file
reis config init

# Edit reis.config.js
# Customize waves, git, metrics, etc.

# Validate config
reis config validate
```

**Migration tip:** Start with defaults, customize as needed. See [CONFIG_GUIDE.md](CONFIG_GUIDE.md).

### 4. Metrics Tracking (Automatic)

**What it does:** Tracks success rates, durations, deviations automatically.

**Why it matters:** Data-driven insights into your development process.

**How to use:**
```bash
# View metrics
reis visualize --type metrics

# Metrics are tracked automatically
# No setup required
```

**Migration tip:** Metrics accumulate over time. Start using v2.0 to build history.

### 5. Visualization (New Command)

**What it does:** Visual representation of progress, roadmap, and metrics.

**Why it matters:** Quickly understand project status at a glance.

**How to use:**
```bash
# Various visualization types
reis visualize --type progress
reis visualize --type roadmap
reis visualize --type metrics

# Watch mode for live updates
reis visualize --watch
```

**Migration tip:** Use `reis visualize --type roadmap` to visualize your existing ROADMAP.md.

## What Works Without Changes

✅ **All v1.x Commands** - `new`, `map`, `plan`, `execute`, `verify`, `progress`, etc.

✅ **Existing PLAN.md Files** - Your current plans work as-is

✅ **STATE.md Tracking** - Enhanced but backward compatible

✅ **Subagents** - `reis_planner`, `reis_executor`, `reis_project_mapper` still work

✅ **Documentation Structure** - `.planning/` directory unchanged

✅ **Git Workflow** - Atomic commits still work

✅ **Parallel Execution** - Multiple subagents still supported

## What You Should Consider Updating

### PLAN.md Format

While not required, adding wave markers improves v2.0 experience:

**Before (still works):**
```markdown
## Phase 1: Setup

### Tasks
- Task 1
- Task 2
- Task 3
```

**After (better with v2.0):**
```markdown
## Phase 1: Setup

## Wave 1: Foundation [S]
- Task 1
- Task 2

## Wave 2: Configuration [M]
- Task 3
```

### Configuration for Teams

If multiple developers work on the project, add `reis.config.js`:

```javascript
module.exports = {
  waves: {
    defaultSize: 'medium',  // Consistent wave sizes
    autoCheckpoint: true    // Automatic checkpoints
  },
  git: {
    autoCommit: true,
    commitMessagePrefix: '[REIS v2.0]'
  }
};
```

Commit this file to share settings across the team.

## Troubleshooting

### Issue: "Config file invalid"

**Solution:** Run `reis config validate` to see specific errors. Most common issues:
- Invalid JavaScript syntax in `reis.config.js`
- Unknown configuration keys
- Invalid values (e.g., negative numbers)

Fix the file or delete it to use defaults.

### Issue: "Cannot resume - no checkpoints found"

**Solution:** Checkpoints are only created in v2.0. If you upgraded mid-project:
1. Create a manual checkpoint: `reis checkpoint "Migration to v2.0"`
2. Continue work normally
3. Future resumes will work

### Issue: "Wave execution differs from v1.x"

**Solution:** Wave execution is more structured but might behave differently:
- Tasks are grouped into waves
- Checkpoints are created between waves
- Git commits are per-wave, not per-task (configurable)

To disable wave execution, use traditional commands:
```bash
reis execute  # Traditional execution (still available)
```

### Issue: "Metrics show 0 waves completed"

**Solution:** Metrics are tracked from v2.0 onward. Past work isn't included:
- Metrics accumulate as you use v2.0
- Historical data from v1.x isn't migrated
- This is by design - fresh start for v2.0 metrics

### Issue: "Documentation links broken"

**Solution:** New docs are in `package/docs/`:
- `V2_FEATURES.md`
- `MIGRATION_GUIDE.md` (this file)
- `WAVE_EXECUTION.md`
- `CHECKPOINTS.md`
- `CONFIG_GUIDE.md`

Docs are also at `~/.rovodev/reis/` after installation.

## Getting Help

### Documentation

- [V2_FEATURES.md](V2_FEATURES.md) - Complete v2.0 features overview
- [WAVE_EXECUTION.md](WAVE_EXECUTION.md) - Wave-based execution guide
- [CHECKPOINTS.md](CHECKPOINTS.md) - Checkpoint system details
- [CONFIG_GUIDE.md](CONFIG_GUIDE.md) - Configuration reference
- [COMPLETE_COMMANDS.md](COMPLETE_COMMANDS.md) - All commands

### Commands

```bash
# Built-in help
reis help

# Command-specific help
reis help execute-plan
reis help checkpoint
reis help resume
reis help visualize

# View configuration
reis config show

# Debug information
reis debug
```

### Common Migration Questions

**Q: Do I need to update my existing PLAN.md files?**

A: No. They work as-is. Adding wave markers is optional but recommended for better v2.0 experience.

**Q: Can I use v1.x and v2.0 commands together?**

A: Yes! All v1.x commands work in v2.0. You can mix traditional and new commands freely.

**Q: Will my subagent configurations break?**

A: No. Subagents (`reis_planner`, `reis_executor`, `reis_project_mapper`) work unchanged.

**Q: Do I need to migrate my existing STATE.md?**

A: No. v2.0 reads and enhances existing STATE.md files automatically.

**Q: What happens to my git history?**

A: Nothing changes. v2.0 adds new commit structures but doesn't modify existing history.

**Q: Can I roll back to v1.x?**

A: Yes. Install v1.x again:
```bash
npm install -g @gravirei/reis@1.2.3
```

Your project files are compatible with both versions.

## Next Steps

1. ✅ Upgrade to v2.0.0-beta.1
2. ✅ Test existing workflows
3. ✅ Create `reis.config.js` (optional)
4. ✅ Try new commands (`checkpoint`, `resume`, `visualize`)
5. ✅ Add wave markers to PLAN.md (optional)
6. ✅ Share feedback and report issues

Welcome to REIS v2.0! 🚀

---

**Related Documentation:**
- [V2_FEATURES.md](V2_FEATURES.md) - v2.0 features overview
- [WAVE_EXECUTION.md](WAVE_EXECUTION.md) - Wave execution guide
- [CHECKPOINTS.md](CHECKPOINTS.md) - Checkpoint system
- [CONFIG_GUIDE.md](CONFIG_GUIDE.md) - Configuration reference
