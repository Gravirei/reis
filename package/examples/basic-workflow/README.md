# Basic REIS v2.0 Workflow Example

## What This Example Demonstrates

This example shows the complete REIS v2.0 workflow for building a simple TODO CLI application. You'll learn:

- **Project initialization** with REIS v2.0 structure
- **Configuration** using reis.config.js
- **Wave-based planning** with proper task definitions
- **Plan execution** with automatic git commits
- **Checkpoint creation** for saving progress
- **Progress visualization** using built-in tools

Perfect for developers new to REIS or exploring v2.0 features for the first time.

## Project Overview

**Goal:** Build a command-line TODO application with CRUD operations

**Tech Stack:**
- Node.js
- JSON file storage
- Commander.js for CLI

**Timeline:** 2 phases, 3 waves total (approx. 2-3 hours)

## How to Follow Along

### Prerequisites
- Node.js 16+ installed
- REIS v2.0 installed globally (`npm install -g reis`)
- Basic familiarity with command-line tools

### Step-by-Step Instructions

```bash
# Step 1: Navigate to the example
cd package/examples/basic-workflow

# Step 2: Review the project structure
cat PROJECT.md          # Understand the vision
cat REQUIREMENTS.md     # Review requirements
cat ROADMAP.md          # See the phases and waves

# Step 3: Initialize REIS (if not already initialized)
reis init

# Step 4: Review the configuration
cat reis.config.js      # See wave sizes and git settings

# Step 5: Review the first plan
cat .planning/phases/phase-1-setup/1-1-initial-setup.PLAN.md

# Step 6: Execute the first wave
reis execute-plan .planning/phases/phase-1-setup/1-1-initial-setup.PLAN.md

# Step 7: Create a checkpoint after the wave completes
reis checkpoint "Phase 1 Wave 1 complete - core setup done"

# Step 8: View your progress
reis visualize --type progress

# Step 9: Check STATE.md for recorded progress
cat STATE.md
```

## Expected Outcomes

After following this example, you will have:

1. ✅ A complete TODO CLI project structure
2. ✅ Understanding of REIS v2.0 wave-based planning
3. ✅ Experience with checkpoint and resume workflow
4. ✅ Knowledge of reis.config.js customization
5. ✅ Familiarity with REIS visualization tools

## Key REIS v2.0 Concepts Demonstrated

### 1. Wave Structure
Plans are organized into waves - small, focused chunks of work:
- **Small waves**: 1-2 tasks, 15-30 minutes
- **Medium waves**: 2-4 tasks, 30-60 minutes

### 2. Automatic Git Integration
With `git.autoCommit: true`, REIS automatically commits each task completion.

### 3. Checkpoint System
Create checkpoints at logical stopping points to save progress and enable resume.

### 4. State Tracking
STATE.md automatically tracks all completed work, checkpoints, and project history.

### 5. Configuration
reis.config.js allows customizing wave sizes, git behavior, and execution preferences.

## Next Steps

After completing this basic example:

1. Explore **examples/advanced-features/** for complex scenarios
2. Review **examples/sample-configs/** for configuration patterns
3. Check **examples/migration-example/** if upgrading from REIS v1.x

## File Structure

```
basic-workflow/
├── README.md              # This file
├── PROJECT.md             # Project vision and goals
├── REQUIREMENTS.md        # Feature and technical requirements
├── ROADMAP.md             # Phase and wave structure
├── STATE.md               # Progress tracking (auto-generated)
├── reis.config.js         # REIS configuration
└── .planning/
    └── phases/
        └── phase-1-setup/
            └── 1-1-initial-setup.PLAN.md  # Executable plan
```

## Troubleshooting

**Q: `reis` command not found**
A: Install REIS globally: `npm install -g reis`

**Q: Execution fails with git errors**
A: Ensure git is initialized: `git init && git add . && git commit -m "Initial commit"`

**Q: How do I undo a checkpoint?**
A: Use git to revert: `git reset --hard <checkpoint-commit>`

## Learn More

- [REIS Documentation](../../docs/USER_GUIDE.md)
- [Configuration Reference](../../docs/CONFIGURATION.md)
- [Advanced Features](../advanced-features/README.md)
