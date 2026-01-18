# Wave-Based Execution Guide

## Overview

Wave-based execution is the core innovation in REIS v2.0. Instead of executing all tasks at once, REIS groups tasks into **waves** - logical chunks that are executed sequentially with automatic checkpoints between them.

### Why Waves?

- **Better Progress Tracking** - Clear milestones show exactly where you are
- **Safer Interruption** - Stop and resume at wave boundaries
- **Automatic Checkpoints** - Save points created automatically
- **Reduced Context Rot** - Smaller, focused execution units
- **Clearer State Management** - Easy to understand what's in progress vs. complete

### Wave Lifecycle

```
PENDING → IN_PROGRESS → COMPLETE
                     ↓
                   FAILED
```

Each wave moves through these states, tracked in STATE.md.

## Wave Definition in PLAN.md

### Basic Wave Syntax

Waves are defined in PLAN.md using markdown headers:

```markdown
## Wave 1: Foundation Setup

- Create project structure
- Initialize configuration
- Set up development environment

## Wave 2: Core Implementation

- Implement authentication
- Create database schema
- Build API endpoints
```

### Wave Size Indicators

Add size indicators to help REIS estimate duration:

```markdown
## Wave 1: Foundation Setup [S]
## Wave 2: Core Implementation [M]
## Wave 3: Integration Testing [L]
```

**Size Guide:**
- `[S]` **Small** - 1-2 tasks, 15-30 minutes
- `[M]` **Medium** - 2-4 tasks, 30-60 minutes (default)
- `[L]` **Large** - 4-6 tasks, 60-120 minutes

Size indicators are optional but help with planning and progress estimation.

### Wave Dependencies

Specify dependencies when waves must execute in order:

```markdown
## Wave 1: Database Setup [M]
**Depends on:** None

- Create database schema
- Set up migrations

## Wave 2: API Implementation [L]
**Depends on:** Wave 1 (Database Setup)

- Build REST endpoints
- Implement data validation
```

REIS validates dependencies before execution and prevents parallel execution of dependent waves.

### Complete Wave Example

```markdown
# Phase 2: User Authentication

## Objective
Implement secure user authentication with JWT tokens.

## Wave 1: Auth Foundation [S]

**Tasks:**
- Create User model
- Set up password hashing
- Install JWT dependencies

**Estimated Duration:** 30 minutes

## Wave 2: Auth Endpoints [M]

**Depends on:** Wave 1

**Tasks:**
- Implement POST /auth/register
- Implement POST /auth/login
- Create token generation utility
- Add input validation

**Estimated Duration:** 60 minutes

## Wave 3: Auth Middleware [S]

**Depends on:** Wave 2

**Tasks:**
- Create authentication middleware
- Add token verification
- Protect routes

**Estimated Duration:** 30 minutes

## Wave 4: Testing [M]

**Depends on:** Wave 3

**Tasks:**
- Unit tests for auth utilities
- Integration tests for endpoints
- Test token expiration
- Test invalid credentials

**Estimated Duration:** 45 minutes
```

## Execution Flow

### Sequential Wave Execution

REIS executes waves in order:

1. **Parse PLAN.md** - Identify all waves and dependencies
2. **Validate Structure** - Check for circular dependencies, missing files
3. **Execute Wave 1** - Complete all tasks in the wave
4. **Create Checkpoint** - Automatic checkpoint after wave completion
5. **Git Commit** - Commit wave changes (if configured)
6. **Execute Wave 2** - Continue to next wave
7. **Repeat** - Until all waves complete

### Automatic Checkpoints

After each wave completes, REIS automatically:
- Creates a checkpoint in STATE.md
- Creates a git commit (if `git.autoCommit: true`)
- Records metrics (duration, success/failure)
- Updates progress tracking

You can resume from any checkpoint if execution is interrupted.

### Interactive Mode

Execute waves interactively with confirmation prompts:

```bash
reis execute-plan --interactive
```

After each wave:
```
✓ Wave 1: Foundation Setup complete (32 minutes)

Continue to Wave 2: Core Implementation? (y/n)
```

This is useful for:
- Long-running plans with many waves
- Learning REIS wave execution
- Reviewing changes between waves

### Deviation Detection

REIS compares actual execution against the plan:

**Types of Deviations:**
- **Task Added** - Extra work not in plan
- **Task Skipped** - Planned task not completed
- **Duration Variance** - Actual time vs. estimated time
- **Blocker Encountered** - Unexpected issue

Deviations are logged in STATE.md and can trigger warnings or pauses (configurable).

## Wave Lifecycle States

### PENDING

Wave is defined but not started.

**STATE.md entry:**
```markdown
## Wave 1: Foundation Setup [PENDING]
- Status: Not started
- Estimated: 30 minutes
```

### IN_PROGRESS

Wave is currently executing.

**STATE.md entry:**
```markdown
## Wave 1: Foundation Setup [IN_PROGRESS]
- Status: Executing
- Started: 2026-01-18T10:00:00Z
- Progress: 1/3 tasks complete
```

### COMPLETE

Wave successfully completed all tasks.

**STATE.md entry:**
```markdown
## Wave 1: Foundation Setup [COMPLETE]
- Status: Complete
- Duration: 28 minutes
- Completed: 2026-01-18T10:28:00Z
- Checkpoint: checkpoint-2026-01-18-1
- Commit: abc123def
```

### FAILED

Wave failed to complete due to errors.

**STATE.md entry:**
```markdown
## Wave 1: Foundation Setup [FAILED]
- Status: Failed
- Duration: 15 minutes
- Failed: 2026-01-18T10:15:00Z
- Error: Database connection timeout
- Next Steps: Fix database configuration
```

You can resume from the failed wave after resolving issues.

## Examples

### Simple 3-Wave Plan

```markdown
# Phase 1: Project Setup

## Wave 1: Initialize [S]
- Create package.json
- Install dependencies
- Set up git

## Wave 2: Configure [M]
- Add ESLint config
- Add Prettier config
- Create .env template

## Wave 3: Document [S]
- Write README.md
- Add CONTRIBUTING.md
- Document environment setup
```

**Execution:**
```bash
reis execute-plan
```

**Output:**
```
📋 Executing Phase 1: Project Setup

🌊 Wave 1: Initialize [S]
  ✓ Create package.json
  ✓ Install dependencies
  ✓ Set up git
  ✓ Wave 1 complete (18 minutes)
  💾 Checkpoint created: checkpoint-2026-01-18-1

🌊 Wave 2: Configure [M]
  ✓ Add ESLint config
  ✓ Add Prettier config
  ✓ Create .env template
  ✓ Wave 2 complete (42 minutes)
  💾 Checkpoint created: checkpoint-2026-01-18-2

🌊 Wave 3: Document [S]
  ✓ Write README.md
  ✓ Add CONTRIBUTING.md
  ✓ Document environment setup
  ✓ Wave 3 complete (25 minutes)
  💾 Checkpoint created: checkpoint-2026-01-18-3

✅ Phase 1 complete! Total: 85 minutes
```

### Complex Multi-Phase Plan with Dependencies

```markdown
# Phase 3: Database Integration

## Wave 1: Schema Design [M]
**Depends on:** None

- Design user table
- Design posts table
- Design comments table
- Define relationships

## Wave 2: Migrations [M]
**Depends on:** Wave 1

- Create user migration
- Create posts migration
- Create comments migration
- Add indexes

## Wave 3: Models [L]
**Depends on:** Wave 2

- Implement User model
- Implement Post model
- Implement Comment model
- Add model associations
- Write model validations

## Wave 4: Seeders [S]
**Depends on:** Wave 3

- Create user seeder
- Create posts seeder
- Create comments seeder
- Run seeders

## Wave 5: Testing [M]
**Depends on:** Wave 4

- Test user CRUD
- Test post CRUD
- Test comment CRUD
- Test associations
- Test validations
```

**Execution:**
```bash
reis execute-plan
```

REIS validates dependencies and executes waves in correct order.

### Resuming After Interruption

**Scenario:** Wave 3 interrupted due to laptop battery dying.

**STATE.md shows:**
```markdown
## Wave 1: Schema Design [COMPLETE]
## Wave 2: Migrations [COMPLETE]
## Wave 3: Models [IN_PROGRESS]
- Progress: 2/5 tasks complete
## Wave 4: Seeders [PENDING]
## Wave 5: Testing [PENDING]
```

**Resume:**
```bash
reis resume
```

**Output:**
```
🔍 Analyzing project state...

📊 Last checkpoint: Wave 2 complete
🌊 Wave 3 (Models) was in progress

Changes since checkpoint:
  + lib/models/User.js (new)
  + lib/models/Post.js (new)
  M test/models/User.test.js (modified)

Resume Wave 3 from current state? (y/n)
```

REIS shows context and asks how to proceed.

## Best Practices

### 1. Keep Waves Focused

**Good:**
```markdown
## Wave 1: User Authentication [M]
- Implement login endpoint
- Add JWT token generation
- Create auth middleware
```

**Too Large:**
```markdown
## Wave 1: Complete User System [L]
- Implement authentication
- Add user profiles
- Create admin dashboard
- Build notification system
- Add email verification
```

Split large waves into smaller, focused waves.

### 2. Use Size Indicators

Always add size indicators for better planning:

```markdown
## Wave 1: Quick Setup [S]
## Wave 2: Main Implementation [M]
## Wave 3: Complex Integration [L]
```

REIS uses these to estimate completion time and plan checkpoints.

### 3. Name Waves Descriptively

**Good:**
```markdown
## Wave 1: Database Schema Setup
## Wave 2: API Endpoint Implementation
## Wave 3: Frontend Integration
```

**Too Vague:**
```markdown
## Wave 1: Setup
## Wave 2: Implementation
## Wave 3: Finish
```

Descriptive names help when resuming or reviewing progress.

### 4. Document Dependencies

Make dependencies explicit:

```markdown
## Wave 2: API Layer [M]
**Depends on:** Wave 1 (Database Schema)
```

This prevents errors and helps REIS validate execution order.

### 5. Group Related Tasks

Tasks in a wave should be logically related:

**Good Grouping:**
```markdown
## Wave 1: Authentication Foundation
- Create User model
- Set up password hashing
- Install auth dependencies
```

**Poor Grouping:**
```markdown
## Wave 1: Random Tasks
- Create User model
- Add CSS styling
- Fix unrelated bug
```

### 6. Add Estimated Duration

Help REIS track progress:

```markdown
## Wave 2: Core Features [M]
**Estimated Duration:** 60 minutes

- Task 1
- Task 2
- Task 3
```

REIS compares estimates vs. actuals for better future planning.

## Troubleshooting

### Issue: "Wave not executing in order"

**Solution:** Check dependencies. REIS executes waves sequentially unless dependencies are violated. Verify:
```bash
reis visualize --type roadmap
```

### Issue: "Cannot find wave definition"

**Solution:** Waves must be defined with `## Wave N:` syntax. Check PLAN.md format:
```markdown
## Wave 1: Name    ✓ Correct
## wave 1: Name    ✗ Wrong (lowercase)
Wave 1: Name       ✗ Wrong (no ##)
```

### Issue: "Circular dependency detected"

**Solution:** Wave A depends on Wave B, Wave B depends on Wave A. Fix dependencies:
```markdown
## Wave 1: Foundation
**Depends on:** None

## Wave 2: Implementation
**Depends on:** Wave 1    ← One-way dependency
```

### Issue: "Wave takes much longer than estimated"

**Solution:** Adjust wave size or split into smaller waves:
```markdown
## Wave 2a: Core Implementation [M]
## Wave 2b: Advanced Features [M]
```

Smaller waves = better tracking and easier resume.

### Issue: "Checkpoint not created after wave"

**Solution:** Check configuration:
```javascript
// reis.config.js
module.exports = {
  waves: {
    autoCheckpoint: true  // ← Ensure this is true
  }
};
```

Or create manual checkpoints:
```bash
reis checkpoint "Wave 2 complete"
```

## Configuration

Customize wave execution via `reis.config.js`:

```javascript
module.exports = {
  waves: {
    // Default wave size
    defaultSize: 'medium',
    
    // Custom size definitions
    sizes: {
      small: {
        maxTasks: 2,
        estimatedMinutes: 20
      },
      medium: {
        maxTasks: 4,
        estimatedMinutes: 50
      },
      large: {
        maxTasks: 6,
        estimatedMinutes: 90
      }
    },
    
    // Auto-checkpoint after each wave
    autoCheckpoint: true,
    
    // Continue execution if wave fails
    continueOnError: false
  },
  
  git: {
    // Auto-commit after wave completion
    autoCommit: true,
    
    // Commit message format
    commitMessagePrefix: '[REIS Wave]'
  }
};
```

See [CONFIG_GUIDE.md](CONFIG_GUIDE.md) for complete configuration reference.

## Related Documentation

- [CHECKPOINTS.md](CHECKPOINTS.md) - Checkpoint system details
- [CONFIG_GUIDE.md](CONFIG_GUIDE.md) - Configuration guide
- [V2_FEATURES.md](V2_FEATURES.md) - v2.0 features overview
- [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) - Migrating from v1.x

---

**Next Steps:**
- Learn about [Checkpoints](CHECKPOINTS.md)
- Customize [Configuration](CONFIG_GUIDE.md)
- View [Complete Commands](COMPLETE_COMMANDS.md)
