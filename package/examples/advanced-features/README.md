# Advanced REIS v2.0 Features Example

## What This Example Demonstrates

This example showcases advanced REIS v2.0 capabilities for complex projects:

- **Complex wave dependencies** across multiple phases
- **Manual checkpoint creation** during development
- **Resume functionality** after interruptions
- **Metrics tracking** and performance analysis
- **Custom visualization** of project progress
- **Large wave handling** with automatic checkpoints

Perfect for experienced developers building production systems or teams coordinating complex work.

## Prerequisites

Before starting this example, you should:

1. ✅ Complete **basic-workflow** example first
2. ✅ Understand REIS v2.0 wave concepts
3. ✅ Have experience with REST APIs and authentication
4. ✅ Be comfortable with Node.js, Express, and databases

## Project Overview

**Goal:** Build a REST API with JWT authentication and protected routes

**Tech Stack:**
- Node.js + Express
- PostgreSQL database
- JWT for authentication
- Bcrypt for password hashing

**Complexity:**
- 3 phases
- 7 waves total
- Wave dependencies across phases
- ~6-8 hours of development

## Key Advanced Features Demonstrated

### 1. Wave Dependencies

Waves can depend on completion of other waves:

```markdown
## Phase 2: API Endpoints [3 waves]
Wave 1: User endpoints (depends: Phase 1)
Wave 2: Auth endpoints (depends: Phase 2 Wave 1)
Wave 3: Protected routes (depends: Phase 2 Wave 2)
```

REIS tracks these dependencies and ensures proper execution order.

### 2. Manual Checkpoints

Create checkpoints at strategic points during development:

```bash
# After completing a critical feature
reis checkpoint "Authentication flow complete - ready for testing"

# Before making risky changes
reis checkpoint "Pre-refactor checkpoint"

# At end of day
reis checkpoint "EOD 2026-01-18 - auth middleware done"
```

### 3. Resume After Interruption

If work is interrupted, resume exactly where you left off:

```bash
# Check what's in progress
reis status

# Resume from last checkpoint
reis resume

# Resume shows context:
# "Resuming from checkpoint: 'Auth basic flow complete'"
# "Next wave: Phase 2 Wave 3 - Protected Routes"
# "Estimated time: 45-60 minutes"
```

### 4. Metrics Tracking

REIS v2.0 automatically tracks:
- Wave completion times
- Deviation counts
- Checkpoint frequency
- Task success rates

View metrics with:

```bash
# Overall metrics
reis visualize --type metrics

# Performance over time
reis visualize --type timeline

# Wave size analysis
reis visualize --type waves
```

### 5. Large Wave Management

Large waves (4-6 tasks, 60-120 min) automatically create mid-wave checkpoints:

```javascript
// In reis.config.js
waves: {
  large: {
    tasks: '4-6',
    duration: '60-120min',
    checkpointEvery: 1  // Auto-checkpoint after each large wave
  }
}
```

## Quick Start

```bash
# 1. Navigate to the example
cd package/examples/advanced-features

# 2. Review the project structure
cat PROJECT.md
cat ROADMAP.md

# 3. Review the advanced configuration
cat reis.config.js

# 4. Start with Phase 2 (assume Phase 1 database setup is done)
reis execute-plan .planning/phases/phase-2-api/2-1-rest-endpoints.PLAN.md

# 5. During Wave 2, simulate an interruption
# (Stop execution with Ctrl+C during task execution)

# 6. Create a checkpoint manually
reis checkpoint "Pausing mid-development"

# 7. Resume later
reis resume

# 8. View metrics after completion
reis visualize --type metrics
```

## Tutorial: Interruption & Resume Scenario

Follow along with **TUTORIAL.md** for a detailed walkthrough of:

1. Starting Phase 2 Wave 2 (Auth endpoints)
2. Completing first 2 tasks
3. Creating manual checkpoint
4. Simulating interruption (system reboot, context switch)
5. Resuming with full context restoration
6. Completing the wave
7. Analyzing metrics

This tutorial demonstrates the power of REIS v2.0's checkpoint system for real-world development workflows.

## Configuration Highlights

The `reis.config.js` in this example demonstrates:

```javascript
{
  waves: {
    small: { checkpointEvery: 2 },   // Checkpoint every 2 small waves
    medium: { checkpointEvery: 1 },  // Checkpoint after each medium wave
    large: { checkpointEvery: 1 }    // Always checkpoint large waves
  },
  git: {
    requireCleanTree: true,          // Enforce clean state (team setting)
    autoTag: true                    // Auto-tag checkpoints
  },
  execution: {
    pauseOnDeviation: true,          // Pause if plan deviates (careful mode)
    autoRetry: true,                 // Retry failed tasks
    maxRetries: 3                    // Up to 3 retry attempts
  }
}
```

## File Structure

```
advanced-features/
├── README.md                  # This file
├── PROJECT.md                 # REST API project vision
├── ROADMAP.md                 # 3-phase roadmap with dependencies
├── TUTORIAL.md                # Step-by-step interruption scenario
├── reis.config.js             # Advanced configuration
└── .planning/
    └── phases/
        └── phase-2-api/
            └── 2-1-rest-endpoints.PLAN.md  # Complex plan with dependencies
```

## Metrics You'll See

After completing this example, expect to see:

- **Wave completion times**: 15min (small) to 90min (large)
- **Checkpoint count**: 7-8 checkpoints
- **Deviation rate**: ~10-15% (normal for real development)
- **Resume count**: 1-2 resumes (from tutorial)

## Common Patterns Demonstrated

### Pattern 1: Defensive Checkpointing
```bash
# Before risky refactoring
reis checkpoint "Pre-refactor - all tests passing"

# Do refactoring...

# If it works
reis checkpoint "Refactor complete - tests still passing"

# If it fails, easy to revert
git reset --hard <checkpoint-hash>
```

### Pattern 2: End-of-Day Checkpoint
```bash
# Before closing laptop
reis checkpoint "EOD $(date +%Y-%m-%d) - middleware complete"

# Next day
reis resume  # Pick up exactly where you left off
```

### Pattern 3: Milestone Checkpoints
```bash
# After completing major feature
reis checkpoint "MILESTONE: Authentication system complete - ready for PR"
```

## When to Use Advanced Features

Use this approach for:

- ✅ Multi-phase projects (3+ phases)
- ✅ Projects with complex dependencies
- ✅ Team environments requiring coordination
- ✅ Long-running development (days/weeks)
- ✅ High-risk changes needing rollback safety

**Not needed for:**
- ❌ Simple scripts or tools
- ❌ Single-phase projects
- ❌ Quick prototypes

## Next Steps

After mastering this example:

1. Review **examples/sample-configs/** for configuration patterns
2. Check **examples/migration-example/** for v1.x → v2.0 migration
3. Apply these patterns to your own projects

## Troubleshooting

**Q: Resume doesn't find checkpoint**
A: Use `reis status` to see available checkpoints, then `git log --grep="checkpoint"` to find them

**Q: Metrics show high deviation rate**
A: Normal for complex projects. Review deviations with `reis visualize --type deviations`

**Q: Wave dependencies not enforced**
A: Ensure ROADMAP.md has clear dependency notation: `Wave 2 (depends: Wave 1)`

## Learn More

- [Checkpoint System Documentation](../../docs/CHECKPOINTS.md)
- [Wave Dependencies Guide](../../docs/WAVES.md)
- [Metrics & Visualization](../../docs/METRICS.md)
