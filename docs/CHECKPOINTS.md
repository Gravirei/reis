# Checkpoint System Guide

## Overview

Checkpoints are **save points** in your development workflow. They allow you to:
- Resume work after interruptions
- Experiment without fear
- Track progress milestones
- Roll back to known-good states
- Review what changed since a point in time

Think of checkpoints like save points in a video game - you can always return to them if something goes wrong.

## Types of Checkpoints

### 1. Automatic Checkpoints

Created automatically by REIS between waves during `execute-plan`:

```bash
reis execute-plan
```

**Output:**
```
🌊 Wave 1: Foundation complete
💾 Checkpoint created: checkpoint-2026-01-18-1

🌊 Wave 2: Implementation complete
💾 Checkpoint created: checkpoint-2026-01-18-2
```

**When created:**
- After each wave completes successfully
- Before starting a new wave
- After major milestones

**Automatic checkpoint behavior is configurable:**
```javascript
// reis.config.js
module.exports = {
  waves: {
    autoCheckpoint: true  // Enable/disable
  }
};
```

### 2. Manual Checkpoints

Created explicitly by you at any time:

```bash
# Create checkpoint with message
reis checkpoint "Auth system working - ready to start frontend"

# Create checkpoint with default message
reis checkpoint
```

**When to create manual checkpoints:**
- Before risky refactors
- After completing a complex feature
- Before experimenting with new approaches
- When you want a safe fallback point
- At the end of your work day

### 3. Milestone Checkpoints

Special checkpoints marking major achievements:

```bash
reis milestone complete "MVP Feature Set"
```

Milestone checkpoints are:
- Highlighted in visualization
- Included in progress reports
- Tagged in git (if configured)
- Tracked separately in metrics

## How Checkpoints Work

### Storage

Checkpoints are stored in three places:

1. **STATE.md** - Checkpoint metadata and history
2. **Git commits** - Each checkpoint is a git commit
3. **Git refs** - Special refs in `refs/reis/checkpoints/`

### Checkpoint Metadata

Each checkpoint contains:
- **Timestamp** - When created
- **Message** - Description of what was accomplished
- **Wave** - Which wave it marks (if automatic)
- **Git commit** - SHA of the git commit
- **Files changed** - List of modified files
- **Context** - What was happening at creation time

### STATE.md Entry Example

```markdown
## Checkpoints

### checkpoint-2026-01-18-3
- **Created:** 2026-01-18T14:30:00Z
- **Wave:** Wave 3: Testing
- **Message:** All tests passing, ready for integration
- **Commit:** abc123def456
- **Files:** 
  - test/auth.test.js
  - lib/auth.js
  - README.md
- **Status:** Complete
```

## Creating Checkpoints

### Basic Usage

```bash
# Create with message
reis checkpoint "Feature complete"

# Create with default message
reis checkpoint
```

### With Context

```bash
# After completing work
reis checkpoint "User authentication complete and tested"

# Before risky change
reis checkpoint "Before refactoring database layer"

# At end of day
reis checkpoint "End of day - profile page 70% complete"
```

### Checkpoint Naming

REIS generates checkpoint IDs automatically:
```
checkpoint-2026-01-18-1    # First checkpoint on Jan 18
checkpoint-2026-01-18-2    # Second checkpoint on Jan 18
checkpoint-2026-01-18-3    # Third checkpoint on Jan 18
```

Your message is stored separately and used for display.

## Using Checkpoints

### List All Checkpoints

```bash
reis checkpoint --list
```

**Output:**
```
📋 Checkpoints for current project:

1. checkpoint-2026-01-18-1 (2 hours ago)
   Wave 1: Foundation Setup complete
   Commit: abc123d
   
2. checkpoint-2026-01-18-2 (1 hour ago)
   Wave 2: Core Implementation complete
   Commit: def456a
   
3. checkpoint-2026-01-18-3 (15 minutes ago)
   Manual: All tests passing
   Commit: 789beef

📍 Currently at: checkpoint-2026-01-18-3
```

### Resume from Last Checkpoint

```bash
reis resume
```

**Interactive resume:**
```
🔍 Analyzing project state...

📊 Last checkpoint: checkpoint-2026-01-18-2
   Wave 2: Core Implementation complete
   Created: 1 hour ago

📝 Changes since checkpoint:
   + src/components/LoginForm.js (new file)
   M src/App.js (modified)
   M STATE.md (modified)

Options:
1. Continue from current state (recommended)
2. Resume from checkpoint-2026-01-18-2 (discard changes)
3. Create new checkpoint first

Your choice (1-3):
```

REIS provides context to help you decide.

### Resume from Specific Checkpoint

```bash
# By checkpoint ID
reis resume --from checkpoint-2026-01-18-1

# By wave name
reis resume --from "Wave 1: Foundation"

# By relative position
reis resume --from -2  # Two checkpoints ago
```

**Warning prompt:**
```
⚠️  You have uncommitted changes since checkpoint-2026-01-18-1

Files changed:
  M src/auth.js
  M test/auth.test.js

Options:
1. Stash changes and resume
2. Commit changes before resume
3. Discard changes and resume
4. Cancel

Your choice (1-4):
```

REIS protects you from losing work.

### View Checkpoint Details

```bash
# Show specific checkpoint
reis checkpoint --show checkpoint-2026-01-18-2

# Show diff since checkpoint
reis checkpoint --diff checkpoint-2026-01-18-2
```

**Output:**
```
📊 Checkpoint: checkpoint-2026-01-18-2

Created: 2026-01-18T13:30:00Z (1 hour ago)
Wave: Wave 2: Core Implementation
Message: Wave 2: Core Implementation complete
Commit: def456a789b

Files changed:
  + src/auth/login.js
  + src/auth/register.js
  M src/routes/index.js
  M package.json

Tests: 15 passing, 0 failing
```

## Recovery Patterns

### 1. Rollback to Checkpoint

**Scenario:** Experimented with approach that didn't work, want to go back.

```bash
# List checkpoints
reis checkpoint --list

# Resume from safe point
reis resume --from checkpoint-2026-01-18-2

# Choose option to discard changes
```

This is safer than `git reset` because REIS handles state tracking.

### 2. Compare Changes

**Scenario:** Want to see what changed since last checkpoint.

```bash
# Show diff
reis checkpoint --diff checkpoint-2026-01-18-2
```

**Output:**
```
Changes since checkpoint-2026-01-18-2:

Files added:
  + src/components/LoginForm.js (45 lines)
  + src/hooks/useAuth.js (23 lines)

Files modified:
  M src/App.js (+12, -3)
  M src/routes/index.js (+8, -0)

Summary: 2 new files, 2 modified, 88 lines added
```

### 3. Branch from Checkpoint

**Scenario:** Want to try different approach without losing current work.

```bash
# Current work has checkpoint-2026-01-18-3
# Want to try different approach from checkpoint-2026-01-18-2

# Create branch from checkpoint
git checkout -b experiment checkpoint-2026-01-18-2

# Work on experiment
# ...

# If successful, merge back
git checkout main
git merge experiment

# If not successful, delete branch
git branch -D experiment
```

Checkpoints integrate with git branching.

### 4. Review Progress

**Scenario:** Want to see all progress since yesterday.

```bash
# List checkpoints
reis checkpoint --list

# View visualization
reis visualize --type progress
```

**Output:**
```
📊 Progress Timeline:

checkpoint-2026-01-17-4  ━━━━┓
"End of day Friday"           ┃
                              ┃ 16 hours
checkpoint-2026-01-18-1  ━━━━┫
"Wave 1 complete"             ┃
                              ┃ 2 hours
checkpoint-2026-01-18-2  ━━━━┫
"Wave 2 complete"             ┃
                              ┃ 1 hour
checkpoint-2026-01-18-3  ━━━━┛
"Current position"

Total: 3 waves, 8 tasks completed
```

## Examples

### Example 1: Daily Development Flow

```bash
# Morning: Resume from yesterday
reis resume

# Work on features...
# execute-plan creates automatic checkpoints

# Lunch break: Manual checkpoint
reis checkpoint "Morning work complete - auth UI finished"

# Afternoon: Continue work
# ...

# End of day: Save point
reis checkpoint "End of day - starting API integration tomorrow"
```

### Example 2: Experimental Feature

```bash
# Current stable state
reis checkpoint "Stable before experiment"

# Try new approach
# ... make changes ...

# Doesn't work well
reis resume --from checkpoint-2026-01-18-5
# Choose: Discard changes

# Back to stable state
```

### Example 3: Team Collaboration

```bash
# Team member A
reis checkpoint "User service complete"
git push

# Team member B
git pull
reis resume  # Picks up from A's checkpoint
# Continue work
```

### Example 4: Pre-Refactor Safety

```bash
# Before big refactor
reis checkpoint "Before refactoring database layer - all tests passing"

# Do refactor
# ... make changes ...

# Tests fail
reis resume --from checkpoint-2026-01-18-8
# Choose: Stash changes

# Review what went wrong
git stash show -p

# Try again with different approach
```

### Example 5: Checkpoint-Driven Development

```bash
# Small checkpoint after each sub-feature
reis execute-plan  # Automatic checkpoints between waves

# Or manual for finer control
git commit -m "feat: add user registration"
reis checkpoint "Registration working"

git commit -m "feat: add login form"
reis checkpoint "Login form working"

git commit -m "feat: add session management"
reis checkpoint "Sessions working"

# Can resume at any granularity
```

## Integration with Git

### Checkpoint Commits

Each checkpoint creates a git commit:

```bash
# Checkpoint command
reis checkpoint "Feature complete"

# Creates git commit
[refs/reis/checkpoints/checkpoint-2026-01-18-3 abc123d] CHECKPOINT: Feature complete
 3 files changed, 45 insertions(+), 12 deletions(-)
```

### Special Git Refs

Checkpoints use special refs under `refs/reis/checkpoints/`:

```bash
# View checkpoint refs
git show-ref | grep reis/checkpoints
```

**Output:**
```
abc123d refs/reis/checkpoints/checkpoint-2026-01-18-1
def456a refs/reis/checkpoints/checkpoint-2026-01-18-2
789beef refs/reis/checkpoints/checkpoint-2026-01-18-3
```

These refs don't interfere with regular branches.

### Git Integration Configuration

```javascript
// reis.config.js
module.exports = {
  git: {
    // Create git commit for each checkpoint
    autoCommit: true,
    
    // Commit message prefix
    commitMessagePrefix: '[REIS]',
    
    // Require clean working tree before checkpoint
    requireCleanTree: false,
    
    // Auto-tag milestone checkpoints
    autoTag: true
  }
};
```

### Working with Branches

Checkpoints work across branches:

```bash
# Create checkpoint on main
git checkout main
reis checkpoint "Main branch checkpoint"

# Switch to feature branch
git checkout -b feature/new-ui

# Checkpoints are branch-specific
reis checkpoint "UI work checkpoint"

# Can view all checkpoints across branches
reis checkpoint --list --all-branches
```

## Best Practices

### 1. Checkpoint Frequently

**Good:**
```bash
# After each meaningful unit of work
reis checkpoint "Login form working"
# ... more work ...
reis checkpoint "Validation added"
# ... more work ...
reis checkpoint "Error handling complete"
```

**Too Infrequent:**
```bash
# Only at end of day
reis checkpoint "Did a bunch of stuff today"
```

More checkpoints = more flexibility to resume.

### 2. Use Descriptive Messages

**Good:**
```bash
reis checkpoint "User authentication complete - all tests passing, ready for frontend integration"
```

**Too Vague:**
```bash
reis checkpoint "Done"
reis checkpoint "Checkpoint"
```

Future you will appreciate the context.

### 3. Checkpoint Before Risks

Always create checkpoint before:
- Major refactors
- Database schema changes
- Dependency upgrades
- Experimental approaches
- Complex merges

### 4. Review Checkpoints Regularly

```bash
# Weekly review
reis checkpoint --list

# Visualize progress
reis visualize --type progress
```

Helps you understand velocity and patterns.

### 5. Clean Up Old Checkpoints

Checkpoints accumulate over time. Clean up periodically:

```bash
# List all checkpoints
reis checkpoint --list

# Remove old checkpoints (keeps git commits)
reis checkpoint --prune --older-than 30d
```

Configuration:
```javascript
// reis.config.js
module.exports = {
  state: {
    maxCheckpoints: 50  // Keep last 50 checkpoints
  }
};
```

## Troubleshooting

### Issue: "No checkpoints found"

**Solution:** Checkpoints are only created in REIS v2.0. If you upgraded mid-project:
```bash
# Create initial checkpoint
reis checkpoint "Initial checkpoint after v2.0 upgrade"
```

### Issue: "Cannot resume - uncommitted changes"

**Solution:** REIS protects your work. Options:
```bash
# Option 1: Commit changes
git add .
git commit -m "WIP: current work"
reis resume

# Option 2: Stash changes
git stash
reis resume
git stash pop  # Later

# Option 3: Discard changes (careful!)
git reset --hard
reis resume
```

### Issue: "Checkpoint not synced across machines"

**Solution:** Checkpoints are git refs. Push them explicitly:
```bash
# Push checkpoint refs
git push origin refs/reis/checkpoints/*

# On other machine
git fetch origin refs/reis/checkpoints/*:refs/reis/checkpoints/*
```

Or configure automatic push:
```javascript
// reis.config.js
module.exports = {
  git: {
    autoCommit: true,
    autoPush: true  // Push checkpoints automatically
  }
};
```

### Issue: "Checkpoint shows wrong files"

**Solution:** Checkpoint captures state at creation time. If STATE.md is out of sync:
```bash
# Refresh state
reis progress

# Create new checkpoint
reis checkpoint "Refreshed checkpoint"
```

### Issue: "Too many checkpoints cluttering list"

**Solution:** Prune old checkpoints:
```bash
# Remove checkpoints older than 30 days
reis checkpoint --prune --older-than 30d

# Or configure max checkpoints
# reis.config.js: state.maxCheckpoints = 20
```

## Configuration

Full checkpoint configuration:

```javascript
// reis.config.js
module.exports = {
  waves: {
    // Create checkpoint after each wave
    autoCheckpoint: true
  },
  
  git: {
    // Create git commit for checkpoints
    autoCommit: true,
    
    // Commit message format
    commitMessagePrefix: '[REIS]',
    
    // Require clean tree before checkpoint
    requireCleanTree: false
  },
  
  state: {
    // Save checkpoint history
    saveCheckpoints: true,
    
    // Max checkpoints to keep
    maxCheckpoints: 50
  }
};
```

See [CONFIG_GUIDE.md](CONFIG_GUIDE.md) for complete reference.

## Related Documentation

- [WAVE_EXECUTION.md](WAVE_EXECUTION.md) - Wave-based execution
- [CONFIG_GUIDE.md](CONFIG_GUIDE.md) - Configuration guide
- [V2_FEATURES.md](V2_FEATURES.md) - v2.0 features overview
- [COMPLETE_COMMANDS.md](COMPLETE_COMMANDS.md) - All commands

---

**Next Steps:**
- Learn about [Wave Execution](WAVE_EXECUTION.md)
- Customize [Configuration](CONFIG_GUIDE.md)
- View [Complete Commands](COMPLETE_COMMANDS.md)
