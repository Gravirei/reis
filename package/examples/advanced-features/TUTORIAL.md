# Tutorial: Interruption & Resume Scenario

## Overview

This tutorial demonstrates REIS v2.0's checkpoint and resume capabilities by simulating a realistic development interruption scenario.

**Scenario**: You're implementing Phase 2 Wave 2 (Auth endpoints) when you need to context-switch to an urgent issue. After resolving it, you resume exactly where you left off.

**Duration**: 30 minutes

**You'll Learn**:
- Creating manual checkpoints during development
- Using `reis resume` to restore context
- Analyzing metrics after completion
- Best practices for checkpoint strategy

---

## Prerequisites

- Completed **basic-workflow** example
- Understanding of REIS wave execution
- Terminal and git knowledge

---

## Part 1: Starting the Wave

### Step 1: Review the Plan

```bash
cd package/examples/advanced-features

# Review Phase 2 Wave 2 - this is a large wave with 5 tasks
cat .planning/phases/phase-2-api/2-1-rest-endpoints.PLAN.md
```

**What you'll see**: Wave 2 is marked `[L]` (large) with 5 tasks:
1. Create JWT utilities
2. Create auth service with bcrypt
3. Create auth routes
4. (continuing...)

### Step 2: Execute the Plan

```bash
# Start executing Phase 2
reis execute-plan .planning/phases/phase-2-api/2-1-rest-endpoints.PLAN.md

# REIS will begin executing tasks...
# Task 1 complete: "JWT utilities created"
# Task 2 complete: "Auth service created"
# Task 3 in progress: "Auth routes..."
```

---

## Part 2: Simulating Interruption

### Step 3: Pause During Task Execution

**Scenario**: You're in the middle of Task 3 (creating auth routes) when a production issue requires immediate attention.

```bash
# Stop execution (Ctrl+C or let current task finish)
^C

# Check current state
git status
reis status
```

**Output**:
```
Current Wave: Phase 2 Wave 2 (Auth Endpoints)
Tasks Completed: 2/5
Last Completed: "Auth service created with bcrypt password hashing"
Last Commit: abc1234
```

### Step 4: Create Manual Checkpoint

Before context-switching, save your progress:

```bash
# Create checkpoint with descriptive message
reis checkpoint "Phase 2 Wave 2 partial - JWT and auth service complete, routes in progress"

# Verify checkpoint created
git log --oneline -5
```

**Output**:
```
def5678 (HEAD -> main) checkpoint: Phase 2 Wave 2 partial - JWT and auth service complete
abc1234 feat(01-18): create auth service with password hashing
xyz9012 feat(01-18): create JWT utilities
...
```

---

## Part 3: Context Switch & Return

### Step 5: Handle the Production Issue

```bash
# Switch to production branch
git checkout production

# Fix the urgent issue...
# (simulate: wait 10 minutes)

# Return to development
git checkout main
```

### Step 6: Resume Development

Now you're ready to continue where you left off:

```bash
# Check what checkpoints are available
reis checkpoint list

# Resume from last checkpoint
reis resume
```

**REIS will display**:
```
🔄 Resuming from checkpoint: "Phase 2 Wave 2 partial - JWT and auth service complete"

📍 Context:
- Wave: Phase 2 Wave 2 (Auth Endpoints) [L]
- Progress: 2/5 tasks complete
- Next task: Create auth routes
- Estimated remaining time: 30-40 minutes

Would you like to continue? (y/n)
```

### Step 7: Complete the Wave

```bash
# Type 'y' to continue
y

# REIS continues execution from Task 3
# Task 3 complete: "Auth routes created"
# Task 4 complete: "Protected routes middleware created"
# Task 5 complete: "User routes protected"

# Wave complete - automatic checkpoint created (large wave)
✓ Wave 2 complete: Auth Endpoints
✓ Checkpoint created: "Wave 2 Auth Endpoints complete"
```

---

## Part 4: Analyzing Results

### Step 8: View Metrics

```bash
# View overall project metrics
reis visualize --type metrics
```

**Output**:
```
📊 Project Metrics - REST API with Authentication

Wave Completion Times:
- Wave 1 (Medium): 45 min (estimated: 30-60 min) ✓
- Wave 2 (Large): 85 min (estimated: 60-120 min) ✓
  * Interrupted: Yes (25 min pause)
  * Resume successful: Yes

Checkpoint Summary:
- Total checkpoints: 3
- Manual: 1 ("Phase 2 Wave 2 partial...")
- Automatic: 2 (Wave completions)
- Average time between: 42 minutes

Deviation Analysis:
- Tasks deviated: 0/8 (0%)
- Plan accuracy: 100%
```

### Step 9: View Timeline

```bash
# Visualize development timeline
reis visualize --type timeline
```

**Output** (simplified):
```
Timeline - Phase 2

10:00 ─────●───── Wave 1 Start (User Endpoints)
10:45 ─────●───── Wave 1 Complete ✓
10:50 ─────●───── Wave 2 Start (Auth Endpoints)
11:15 ─────●───── Manual Checkpoint (partial complete)
11:15 ─────○───── Context switch (25 min)
11:40 ─────●───── Resume Wave 2
12:15 ─────●───── Wave 2 Complete ✓ (auto-checkpoint)
```

### Step 10: Review Checkpoint History

```bash
# List all checkpoints with context
reis checkpoint list --verbose
```

**Output**:
```
Checkpoints for REST API with Authentication:

1. [def5678] 2026-01-18 11:15
   "Phase 2 Wave 2 partial - JWT and auth service complete, routes in progress"
   - Type: Manual
   - Context: Phase 2 Wave 2, 2/5 tasks
   - Files: src/utils/jwt.js, src/services/authService.js

2. [ghi3456] 2026-01-18 12:15
   "Wave 2 Auth Endpoints complete"
   - Type: Automatic (large wave)
   - Context: Phase 2 Wave 2 complete
   - Files: src/routes/auth.js, src/middleware/authenticate.js, src/routes/users.js
```

---

## Part 5: Best Practices

### When to Create Manual Checkpoints

✅ **Do create checkpoints**:
- Before context switches (meetings, urgent issues)
- After completing risky changes (refactoring)
- End of day (preserve daily progress)
- Before experimenting with uncertain approaches
- After major feature milestones

❌ **Don't create checkpoints**:
- Every few minutes (too granular)
- When automatic checkpoints suffice
- Without descriptive messages

### Checkpoint Message Guidelines

**Good checkpoint messages**:
```bash
reis checkpoint "Auth flow complete - all tests passing"
reis checkpoint "EOD 2026-01-18 - middleware 80% done"
reis checkpoint "Pre-refactor - baseline for DB layer rewrite"
```

**Poor checkpoint messages**:
```bash
reis checkpoint "checkpoint"         # Not descriptive
reis checkpoint "wip"                # What work?
reis checkpoint "saving"             # Why?
```

### Resume Workflow

**Pattern 1: Morning Startup**
```bash
# Start of day
reis status              # What was I working on?
reis resume             # Continue from yesterday's checkpoint
```

**Pattern 2: After Interruption**
```bash
reis checkpoint "Pausing for meeting"
# ... attend meeting ...
reis resume             # Pick up where you left off
```

**Pattern 3: Failed Experiment**
```bash
reis checkpoint "Pre-experiment - working baseline"
# ... try new approach, doesn't work ...
git reset --hard <checkpoint-hash>
```

---

## Key Takeaways

1. **Manual checkpoints** complement automatic ones for real-world workflows
2. **Resume** provides full context, not just git state
3. **Metrics** help optimize wave sizes and checkpoint frequency
4. **Descriptive messages** make checkpoints useful weeks later
5. **Wave sizes** affect automatic checkpoint frequency (large waves always checkpoint)

---

## Next Steps

- Try this workflow in your own projects
- Experiment with different checkpoint strategies
- Review `reis.config.js` to customize checkpoint behavior
- Read the full [Checkpoint Documentation](../../docs/CHECKPOINTS.md)

---

## Troubleshooting

**Q: Resume command says "No checkpoints found"**
A: Ensure you've created at least one checkpoint with `reis checkpoint "message"`

**Q: Can I resume from an older checkpoint, not just the latest?**
A: Yes, use `reis resume --checkpoint <hash>` to specify which checkpoint

**Q: How do I list all available checkpoints?**
A: Use `reis checkpoint list` or `git log --grep="checkpoint"`

**Q: Can I delete a checkpoint?**
A: Checkpoints are git commits/tags. Use `git tag -d <tag>` to remove checkpoint tags
