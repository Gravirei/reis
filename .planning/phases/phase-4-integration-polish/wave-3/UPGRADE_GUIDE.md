# [DRAFT] REIS v2.0 Upgrade Guide

Complete guide for upgrading from REIS v1.x to v2.0.0-beta.1.

## Table of Contents
- [Quick Upgrade](#quick-upgrade)
- [What's Changed](#whats-changed)
- [Backward Compatibility](#backward-compatibility)
- [New Features](#new-features)
- [Configuration Migration](#configuration-migration)
- [Command Changes](#command-changes)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)

## Quick Upgrade

### 1. Install v2.0.0-beta.1

```bash
# Uninstall old version (optional, but recommended)
npm uninstall -g @gravirei/reis

# Install v2.0.0-beta.1
npm install -g @gravirei/reis@2.0.0-beta.1

# Verify installation
reis --version
# Should output: 2.0.0-beta.1
```

### 2. Test with Existing Project

```bash
# Navigate to your existing REIS project
cd my-existing-project

# Verify everything still works
reis status

# Your project should work exactly as before!
```

### 3. (Optional) Add Configuration

```bash
# Initialize configuration file (optional)
reis config init

# Edit reis.config.js to customize behavior
nano reis.config.js
```

### 4. Try New Features

```bash
# Try wave-based execution
reis execute-plan

# Create a checkpoint
reis checkpoint "Upgraded to v2.0"

# Visualize progress
reis visualize --type progress
```

**That's it!** You're now running REIS v2.0.

## What's Changed

### ✅ Backward Compatible Changes

These changes are **fully backward compatible** - your existing projects work without modification:

1. **New commands added** - Old commands still work
2. **New utilities added** - Don't affect existing workflows
3. **Enhanced STATE.md** - Still readable by v1.x if you downgrade
4. **New documentation** - Supplements existing docs

### ⚠️ Behavior Differences

These behaviors changed slightly but shouldn't break existing projects:

1. **`execute` command** - Now legacy, use `execute-plan` for wave features
   - **Impact**: Low - `execute` still works, just doesn't use waves
   - **Action**: Update scripts to use `execute-plan` when ready

2. **STATE.md format** - Now includes checkpoint history
   - **Impact**: Minimal - v1.x can still read v2.0 STATE.md
   - **Action**: None required

3. **Git commits** - Now include wave information in commit messages
   - **Impact**: Minimal - Just extra metadata in commits
   - **Action**: None required

### 🆕 New Features (Opt-In)

These are completely new and opt-in - won't affect you unless you use them:

1. **Wave execution** - Use `execute-plan` to enable
2. **Configuration system** - Use `reis config init` to enable
3. **Checkpoints** - Use `reis checkpoint` to create manual checkpoints
4. **Visualization** - Use `reis visualize` to see progress
5. **Metrics tracking** - Automatic, view with `reis visualize --type metrics`

## Backward Compatibility

### What Still Works

✅ **All v1.x commands:**
- `reis new`
- `reis roadmap`
- `reis plan`
- `reis execute` (legacy mode, no waves)
- `reis map`
- `reis status`

✅ **All v1.x files:**
- `ROADMAP.md`
- `STATE.md`
- `PLAN.md`
- `.planning/` directory structure

✅ **All v1.x workflows:**
- Project initialization
- Roadmap creation
- Phase planning
- Plan execution
- Project mapping

### What's Enhanced

⭐ **Enhanced but compatible:**

1. **STATE.md** - Now tracks checkpoints but still v1.x compatible
2. **Git integration** - Now more integrated but optional
3. **Plan execution** - Now supports waves but fallback to v1.x behavior

### Migration Path

```
v1.x Project → v2.0 Installation → Works immediately!
                                 ↓
                       (Optional) Add reis.config.js
                                 ↓
                       (Optional) Use new commands
                                 ↓
                       Full v2.0 feature adoption
```

## New Features

### 1. Wave Execution

**What it is:** Break plans into sequential waves with auto-checkpoints.

**How to enable:**
```bash
# Use execute-plan instead of execute
reis execute-plan
```

**Benefits:**
- No lost progress (checkpoints between waves)
- Better context management
- Clearer execution flow
- Automatic git commits per wave

**Example:**
```bash
# Old way (still works)
reis execute

# New way (with waves)
reis execute-plan
```

### 2. Configuration System

**What it is:** Customize REIS behavior with `reis.config.js`.

**How to enable:**
```bash
# Create config file
reis config init

# Edit as needed
nano reis.config.js
```

**What you can configure:**
- Wave sizes (small/medium/large)
- Git auto-commit behavior
- Checkpoint intervals
- LLM preferences
- Subagent customization

**Example config:**
```javascript
module.exports = {
  waves: {
    sizes: {
      small: 3,
      medium: 5,
      large: 8
    }
  },
  git: {
    autoCommit: true,
    commitFormat: 'feat({date}): {message}'
  }
};
```

### 3. Checkpoints

**What it is:** Save progress at any point and resume intelligently.

**How to use:**
```bash
# Create manual checkpoint
reis checkpoint "Completed authentication"

# List all checkpoints
reis checkpoint --list

# Resume from last checkpoint
reis resume

# Resume from specific checkpoint
reis resume --from checkpoint-20260118-103045
```

**When to use:**
- Before risky changes
- At project milestones
- Before breaks or context switches
- When switching branches

### 4. Visualization

**What it is:** See progress, waves, roadmap, and metrics visually.

**How to use:**
```bash
# Progress bars
reis visualize --type progress

# Wave timeline
reis visualize --type waves

# Roadmap overview
reis visualize --type roadmap

# Metrics dashboard
reis visualize --type metrics

# Auto-refresh mode
reis visualize --type progress --watch
```

**Benefits:**
- Quick progress overview
- Visual roadmap understanding
- Performance metrics
- Share status with team

### 5. Metrics Tracking

**What it is:** Automatic tracking of execution metrics.

**How to view:**
```bash
# Metrics dashboard
reis visualize --type metrics
```

**What's tracked:**
- Wave completion times
- Success/failure rates
- Checkpoint frequency
- Deviation counts
- Overall progress

## Configuration Migration

### Adding Configuration to Existing Project

If you have an existing v1.x project and want to add v2.0 configuration:

```bash
# Step 1: Navigate to project
cd my-existing-project

# Step 2: Create config
reis config init

# Step 3: Customize reis.config.js
nano reis.config.js

# Step 4: Validate
reis config validate

# Step 5: View merged config
reis config show
```

### Recommended Configuration

For most projects, this is a good starting configuration:

```javascript
// reis.config.js
module.exports = {
  waves: {
    sizes: {
      small: 3,   // 1-3 tasks
      medium: 5,  // 4-5 tasks
      large: 8    // 6-8 tasks
    },
    autoCheckpoint: true
  },
  git: {
    autoCommit: true,
    autoCommitWaves: true,
    commitFormat: 'feat({date}): {message}'
  },
  execution: {
    parallel: true,
    maxParallel: 4
  }
};
```

### Configuration for Teams

If you're working in a team:

```javascript
// reis.config.js
module.exports = {
  waves: {
    sizes: {
      small: 2,   // Smaller waves for frequent commits
      medium: 4,
      large: 6
    }
  },
  git: {
    autoCommit: true,
    autoCommitWaves: true,
    commitFormat: 'feat({date}): {message}',
    requireCleanTree: true  // Prevent accidental uncommitted changes
  },
  checkpoints: {
    autoCheckpointInterval: 30  // Checkpoint every 30 minutes
  }
};
```

## Command Changes

### Deprecated Commands

**None!** All v1.x commands still work.

### New Commands

| Command | Purpose | Example |
|---------|---------|---------|
| `reis execute-plan` | Wave-based execution | `reis execute-plan` |
| `reis checkpoint` | Create/list checkpoints | `reis checkpoint "milestone"` |
| `reis resume` | Smart resume | `reis resume` |
| `reis config` | Manage configuration | `reis config init` |
| `reis visualize` | Visualize progress | `reis visualize --type progress` |

### Command Comparison

| Task | v1.x Command | v2.0 Command | Notes |
|------|--------------|--------------|-------|
| Execute plan | `reis execute` | `reis execute-plan` | execute still works, execute-plan adds waves |
| View status | `reis status` | `reis visualize --type progress` | status still works, visualize is more visual |
| Resume work | Manual | `reis resume` | New automatic resume |

## Troubleshooting

### Issue: "Command not found: reis"

**Problem:** npm global installation didn't add reis to PATH

**Solution:**
```bash
# Check global npm bin directory
npm bin -g

# Add to PATH (add to ~/.bashrc or ~/.zshrc)
export PATH="$PATH:$(npm bin -g)"

# Reload shell
source ~/.bashrc
```

### Issue: "reis.config.js syntax error"

**Problem:** Configuration file has invalid JavaScript

**Solution:**
```bash
# Validate config
reis config validate

# Check for common issues:
# - Missing commas
# - Unclosed brackets
# - Invalid property names
```

### Issue: "execute-plan not creating waves"

**Problem:** PLAN.md doesn't have proper wave structure

**Solution:**
```bash
# Validate your plan
reis plan validate

# Make sure PLAN.md has proper structure:
# - Tasks grouped logically
# - Dependencies specified
# - No circular dependencies
```

### Issue: "Visualize shows wrong progress"

**Problem:** STATE.md might be out of sync

**Solution:**
```bash
# Check STATE.md
cat .planning/STATE.md

# Manually update if needed
# Or re-execute last wave
reis execute-plan --resume
```

### Issue: "v2.0 slower than v1.x"

**Problem:** Performance regression (shouldn't happen, but just in case)

**Solution:**
```bash
# Disable metrics tracking temporarily
# In reis.config.js:
module.exports = {
  metrics: {
    enabled: false
  }
};

# Report issue to: https://github.com/Gravirei/reis/issues
```

## FAQ

### Q: Do I need to upgrade?

**A:** No, v1.x still works. Upgrade when you want new features.

### Q: Will v2.0 break my existing projects?

**A:** No, v2.0 is fully backward compatible.

### Q: Can I use v1.x and v2.0 on the same machine?

**A:** Yes, but only one can be globally installed. Use `npx @gravirei/reis@<version>` for specific versions.

### Q: Do I have to use reis.config.js?

**A:** No, it's optional. v2.0 works without configuration.

### Q: Can I use wave execution with existing plans?

**A:** Yes! `execute-plan` automatically detects waves in any PLAN.md.

### Q: What if I don't like v2.0?

**A:** You can downgrade anytime:
```bash
npm install -g @gravirei/reis@1.2.3
```

### Q: Are there breaking changes?

**A:** No breaking changes. All v1.x behavior preserved.

### Q: How do I know which version I'm using?

**A:**
```bash
reis --version
```

### Q: Can I mix v1.x and v2.0 commands?

**A:** Yes! Use any combination. Example:
```bash
reis plan          # v1.x command
reis execute-plan  # v2.0 command
reis checkpoint    # v2.0 command
reis status        # v1.x command
```

### Q: What happens to my metrics if I downgrade?

**A:** Metrics files are preserved in `.planning/metrics/`. v1.x ignores them.

### Q: How do I contribute or report issues?

**A:** 
- Report bugs: https://github.com/Gravirei/reis/issues
- Discussions: https://github.com/Gravirei/reis/discussions
- Pull requests welcome!

## Next Steps

1. **✅ Install v2.0** - Follow [Quick Upgrade](#quick-upgrade)
2. **📚 Read docs** - Check out [V2_FEATURES.md](../../../docs/V2_FEATURES.md)
3. **🎯 Try examples** - See [examples/](../../../examples/)
4. **⚙️ Configure** - Create reis.config.js if desired
5. **🚀 Use new features** - Try wave execution and visualization

## Support

Need help? Resources available:

- **Documentation**: [docs/](../../../docs/)
- **Examples**: [examples/](../../../examples/)
- **Issues**: https://github.com/Gravirei/reis/issues
- **Discussions**: https://github.com/Gravirei/reis/discussions

---

*This is a DRAFT upgrade guide. Final version will be published after Wave 3.3 manual testing completes.*
