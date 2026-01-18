# Sample REIS Configurations

This directory contains sample `reis.config.js` files for different scenarios and team workflows.

## Available Configs

1. **minimal.reis.config.js** - Bare minimum configuration
2. **solo-developer.reis.config.js** - Flexible setup for individual developers
3. **team-optimized.reis.config.js** - Strict workflow for team collaboration
4. **ci-cd.reis.config.js** - Automated pipeline configuration

---

## Usage

Copy the appropriate config to your project root:

```bash
# For solo development
cp examples/sample-configs/solo-developer.reis.config.js ./reis.config.js

# For team projects
cp examples/sample-configs/team-optimized.reis.config.js ./reis.config.js

# For CI/CD pipelines
cp examples/sample-configs/ci-cd.reis.config.js ./reis.config.js
```

Then customize as needed for your specific requirements.

---

## Configuration Scenarios

### Minimal Configuration

**Use when**: You want REIS v2.0 features with minimal customization

**Key features**:
- Uses all default values except git.autoCommit
- Simplest possible config
- Good starting point for exploration

**See**: `minimal.reis.config.js`

---

### Solo Developer

**Use when**: Working alone on personal projects

**Key features**:
- Flexible wave sizes (can work longer before checkpoints)
- Manual git commits (you control when to commit)
- No strict requirements (clean tree not enforced)
- Auto-retry enabled (forgiving of errors)
- Infrequent checkpoints (checkpoint every 4 small waves)

**Best for**:
- Personal projects
- Experimental work
- Rapid prototyping
- Learning REIS

**See**: `solo-developer.reis.config.js`

---

### Team Optimized

**Use when**: Multiple developers collaborating on a shared codebase

**Key features**:
- Stricter wave sizes (encourages frequent integration)
- Automatic git commits (consistent history)
- Clean tree required (prevents conflicts)
- Pause on deviations (team reviews changes)
- Frequent checkpoints (easy rollback for team)
- Commit prefixes (team identification)

**Best for**:
- Team projects
- Shared repositories
- Code review workflows
- Coordinated development

**See**: `team-optimized.reis.config.js`

---

### CI/CD Pipeline

**Use when**: Running REIS in automated environments

**Key features**:
- No pauses or interactions (fully automated)
- Auto-commit enabled (trackable builds)
- Clean tree required (deterministic builds)
- No auto-tagging (CI system handles tags)
- Auto-retry with limits (recovers from transient failures)
- Never pause on deviations (fails fast)

**Best for**:
- Continuous integration
- Automated testing
- Build pipelines
- Deployment automation

**See**: `ci-cd.reis.config.js`

---

## Configuration Options Reference

### Waves

Configure wave sizes and checkpoint frequency:

```javascript
waves: {
  small: {
    tasks: '1-2',              // Number of tasks in a small wave
    duration: '15-30min',      // Expected duration
    checkpointEvery: 3         // Checkpoint every N small waves
  },
  medium: { /* ... */ },
  large: { /* ... */ }
}
```

**Tip**: Adjust `checkpointEvery` based on your risk tolerance and interruption frequency.

### Git Integration

Control automatic git operations:

```javascript
git: {
  autoCommit: true,            // Auto-commit after each task
  commitPrefix: '[PREFIX]',    // Prefix for commit messages
  requireCleanTree: true,      // Enforce clean working directory
  autoTag: true,               // Auto-tag checkpoints
  tagPrefix: 'checkpoint/'     // Tag naming format
}
```

**Tip**: Teams should use `requireCleanTree: true` to prevent conflicts.

### Execution

Control plan execution behavior:

```javascript
execution: {
  pauseOnDeviation: true,      // Pause if plan deviates
  autoRetry: true,             // Retry failed tasks
  maxRetries: 3,               // Maximum retry attempts
  confirmDestructive: true     // Confirm before destructive ops
}
```

**Tip**: Use `pauseOnDeviation: true` for important production work.

### Metrics (Optional)

Control metrics collection:

```javascript
metrics: {
  enabled: true,               // Enable metrics tracking
  waveCompletion: true,        // Track wave times
  deviationTracking: true,     // Track plan deviations
  checkpointAnalysis: true     // Analyze checkpoint patterns
}
```

---

## Customization Tips

### 1. Adjusting Wave Sizes

**Smaller tasks**: Reduce task counts
```javascript
waves: {
  small: { tasks: '1', duration: '10-15min' },
  medium: { tasks: '1-2', duration: '20-30min' }
}
```

**Larger tasks**: Increase task counts
```javascript
waves: {
  small: { tasks: '2-3', duration: '30-45min' },
  medium: { tasks: '4-5', duration: '60-90min' }
}
```

### 2. Checkpoint Frequency

**More checkpoints** (safer, more savepoints):
```javascript
waves: {
  small: { checkpointEvery: 2 },
  medium: { checkpointEvery: 1 }
}
```

**Fewer checkpoints** (less interruption):
```javascript
waves: {
  small: { checkpointEvery: 5 },
  medium: { checkpointEvery: 2 }
}
```

### 3. Git Workflow

**Manual commits** (full control):
```javascript
git: {
  autoCommit: false,
  requireCleanTree: false
}
```

**Strict commits** (team discipline):
```javascript
git: {
  autoCommit: true,
  requireCleanTree: true,
  commitPrefix: '[TEAM-' + process.env.DEV_NAME + ']'
}
```

---

## Environment-Specific Configs

You can create different configs per environment:

```javascript
// reis.config.js
const env = process.env.NODE_ENV || 'development';

const configs = {
  development: {
    git: { autoCommit: false },
    execution: { pauseOnDeviation: false }
  },
  production: {
    git: { autoCommit: true, requireCleanTree: true },
    execution: { pauseOnDeviation: true }
  }
};

module.exports = {
  waves: { /* common wave config */ },
  ...configs[env]
};
```

---

## Common Patterns

### Pattern 1: Safe Experimentation

For trying new approaches with easy rollback:

```javascript
{
  waves: {
    small: { checkpointEvery: 1 }  // Checkpoint very frequently
  },
  git: {
    autoCommit: true,
    autoTag: true  // Tag every checkpoint for easy revert
  }
}
```

### Pattern 2: Production Deployment

For deploying to production with safety checks:

```javascript
{
  git: {
    requireCleanTree: true,
    autoCommit: true
  },
  execution: {
    pauseOnDeviation: true,
    confirmDestructive: true
  }
}
```

### Pattern 3: Rapid Prototyping

For quick iteration without interruptions:

```javascript
{
  waves: {
    small: { checkpointEvery: 10 }  // Very infrequent checkpoints
  },
  git: {
    autoCommit: false  // Manual commits only
  },
  execution: {
    pauseOnDeviation: false,
    autoRetry: true
  }
}
```

---

## Testing Your Config

Validate your configuration:

```bash
# Check if config loads
node -e "require('./reis.config.js')"

# Test with a small plan
reis execute-plan path/to/test-plan.md --dry-run

# View effective configuration
reis config show
```

---

## Learn More

- [Configuration Documentation](../../docs/CONFIGURATION.md)
- [Wave System Guide](../../docs/WAVES.md)
- [Checkpoint System](../../docs/CHECKPOINTS.md)
- [Git Integration](../../docs/GIT.md)
