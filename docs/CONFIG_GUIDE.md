# REIS Configuration Guide

## Overview

REIS v2.0 introduces a flexible configuration system via `reis.config.js`. Customize wave sizes, git behavior, metrics tracking, and more to match your workflow.

**Key Points:**
- Configuration is **optional** - sensible defaults work out of the box
- Per-project configuration (no global config by design)
- JavaScript-based for flexibility and comments
- Validated on load with helpful error messages
- Hot-reloadable (no restart needed)

## Quick Start

### Initialize Configuration

```bash
# Create reis.config.js with defaults
reis config init
```

This creates `reis.config.js` in your project root with commented defaults.

### View Current Configuration

```bash
# Show effective configuration (defaults + overrides)
reis config show
```

### Validate Configuration

```bash
# Check for errors
reis config validate
```

Fix any issues before running commands.

## Configuration File Location

REIS looks for `reis.config.js` in:
1. Current directory
2. Project root (git repository root)
3. Parent directories (up to home directory)

**Recommendation:** Place in project root and commit to version control for team consistency.

## Complete Configuration Reference

### Full Example

```javascript
/**
 * REIS v2.0 Configuration
 * 
 * Complete example showing all available options.
 * All fields are optional - defaults used if omitted.
 */

module.exports = {
  // Wave execution settings
  waves: {
    // Default wave size: 'small' | 'medium' | 'large'
    defaultSize: 'medium',
    
    // Custom wave size definitions
    sizes: {
      small: {
        maxTasks: 2,
        estimatedMinutes: 20,
        description: 'Quick focused tasks'
      },
      medium: {
        maxTasks: 4,
        estimatedMinutes: 50,
        description: 'Standard development tasks'
      },
      large: {
        maxTasks: 6,
        estimatedMinutes: 90,
        description: 'Complex multi-step tasks'
      }
    },
    
    // Create checkpoint after each wave
    autoCheckpoint: true,
    
    // Frequency of auto-checkpoints (every N waves)
    checkpointEvery: 1,
    
    // Continue execution if a wave fails
    continueOnError: false,
    
    // Show wave progress in real-time
    showProgress: true
  },

  // Git integration settings
  git: {
    // Auto-commit after wave completion
    autoCommit: true,
    
    // Commit message prefix
    commitMessagePrefix: '[REIS]',
    
    // Commit message format
    // Available variables: {wave}, {phase}, {date}, {time}
    commitMessageFormat: '{prefix} {wave} - {date}',
    
    // Require clean working tree before execution
    requireCleanTree: false,
    
    // Auto-create branch for new phases
    createBranch: false,
    
    // Branch name prefix
    branchPrefix: 'reis/',
    
    // Auto-tag milestone completions
    autoTag: true,
    
    // Tag prefix
    tagPrefix: 'reis-milestone-',
    
    // Push commits/tags automatically
    autoPush: false,
    
    // Remote to push to
    pushRemote: 'origin'
  },

  // State management settings
  state: {
    // Track performance metrics
    trackMetrics: true,
    
    // Save checkpoint history
    saveCheckpoints: true,
    
    // Maximum checkpoints to keep in history
    maxCheckpoints: 50,
    
    // Auto-save STATE.md after changes
    autoSave: true,
    
    // Backup STATE.md before major changes
    createBackups: true,
    
    // Maximum backups to keep
    maxBackups: 5
  },

  // Execution settings
  execution: {
    // Pause on deviation from plan
    pauseOnDeviation: true,
    
    // Auto-retry failed tasks
    autoRetry: false,
    
    // Maximum retry attempts
    maxRetries: 3,
    
    // Delay between retries (milliseconds)
    retryDelay: 1000,
    
    // Timeout for individual tasks (minutes, 0 = no timeout)
    taskTimeout: 0,
    
    // Interactive mode (prompt for confirmations)
    interactive: false
  },

  // Validation settings
  validation: {
    // Validate PLAN.md before execution
    validateBeforeExecution: true,
    
    // Strict validation (fail on warnings)
    strict: false,
    
    // Check for circular dependencies
    checkCircularDeps: true,
    
    // Validate file paths exist
    checkFileExists: false
  },

  // Metrics and reporting
  metrics: {
    // Enable metrics tracking
    enabled: true,
    
    // Metrics storage location
    storageDir: '.reis/metrics',
    
    // Track deviations from plan
    trackDeviations: true,
    
    // Track time per task
    trackTaskDuration: true,
    
    // Export format: 'json' | 'csv' | 'both'
    exportFormat: 'json'
  },

  // Visualization settings
  visualization: {
    // Default chart width (columns)
    chartWidth: 80,
    
    // Use colors in visualization
    useColors: true,
    
    // Progress bar style: 'bar' | 'blocks' | 'dots'
    progressStyle: 'bar',
    
    // Show ETA in progress bars
    showETA: true,
    
    // Refresh interval for watch mode (seconds)
    watchInterval: 5
  },

  // Template settings
  templates: {
    // Custom PLAN.md template path
    planTemplate: null,
    
    // Custom STATE.md template path
    stateTemplate: null,
    
    // Custom ROADMAP.md template path
    roadmapTemplate: null,
    
    // Template variables
    variables: {
      author: 'Your Name',
      team: 'Your Team',
      project: 'Your Project'
    }
  },

  // LLM preferences (for AI-assisted commands)
  llm: {
    // Provider: 'auto' | 'openai' | 'anthropic' | 'rovo'
    provider: 'auto',
    
    // Model name (provider-specific)
    model: 'default',
    
    // Temperature (0-1, lower = more focused)
    temperature: 0.7,
    
    // Maximum tokens per request
    maxTokens: 4096,
    
    // System prompt customization
    systemPrompt: null
  },

  // Output and logging
  output: {
    // Verbosity level: 'quiet' | 'normal' | 'verbose' | 'debug'
    level: 'normal',
    
    // Show timestamps in output
    showTimestamps: false,
    
    // Log file location
    logFile: '.reis/reis.log',
    
    // Enable file logging
    enableFileLogging: false,
    
    // Colorize console output
    colorize: true,
    
    // Show icons/emojis
    showIcons: true
  },

  // Notification settings
  notifications: {
    // Enable desktop notifications
    enabled: false,
    
    // Notify on wave completion
    onWaveComplete: true,
    
    // Notify on phase completion
    onPhaseComplete: true,
    
    // Notify on errors
    onError: true,
    
    // Notification sound
    sound: true
  },

  // Advanced settings
  advanced: {
    // Enable experimental features
    experimentalFeatures: false,
    
    // Cache directory
    cacheDir: '.reis/cache',
    
    // Enable caching
    enableCache: true,
    
    // Cache TTL (milliseconds)
    cacheTTL: 3600000,
    
    // Parallel execution (future feature)
    maxParallelWaves: 1
  }
};
```

## Configuration Sections

### Waves Configuration

Controls wave execution behavior:

```javascript
waves: {
  defaultSize: 'medium',      // Default: 'medium'
  autoCheckpoint: true,        // Default: true
  checkpointEvery: 1,          // Default: 1 (every wave)
  continueOnError: false,      // Default: false
  showProgress: true           // Default: true
}
```

**Wave Sizes:**
```javascript
sizes: {
  small: {
    maxTasks: 2,              // Maximum tasks per wave
    estimatedMinutes: 20,     // Estimated duration
    description: 'Quick focused tasks'
  },
  medium: {
    maxTasks: 4,
    estimatedMinutes: 50,
    description: 'Standard development tasks'
  },
  large: {
    maxTasks: 6,
    estimatedMinutes: 90,
    description: 'Complex multi-step tasks'
  }
}
```

Customize for your team's velocity.

### Git Configuration

Controls git integration:

```javascript
git: {
  autoCommit: true,                          // Default: true
  commitMessagePrefix: '[REIS]',             // Default: '[REIS]'
  commitMessageFormat: '{prefix} {wave}',    // Customizable
  requireCleanTree: false,                   // Default: false
  createBranch: false,                       // Default: false
  branchPrefix: 'reis/',                     // Default: 'reis/'
  autoTag: true,                             // Default: true
  tagPrefix: 'reis-milestone-',              // Default: 'reis-milestone-'
  autoPush: false,                           // Default: false
  pushRemote: 'origin'                       // Default: 'origin'
}
```

**Commit Message Variables:**
- `{prefix}` - Commit message prefix
- `{wave}` - Wave name
- `{phase}` - Phase name
- `{date}` - Current date (YYYY-MM-DD)
- `{time}` - Current time (HH:MM)

**Example:**
```javascript
commitMessageFormat: '[{phase}] {wave} - {date}'
// Output: [Phase 2] Wave 1: Foundation - 2026-01-18
```

### State Management Configuration

Controls STATE.md and checkpoint behavior:

```javascript
state: {
  trackMetrics: true,          // Default: true
  saveCheckpoints: true,       // Default: true
  maxCheckpoints: 50,          // Default: 50
  autoSave: true,              // Default: true
  createBackups: true,         // Default: true
  maxBackups: 5                // Default: 5
}
```

Checkpoints older than `maxCheckpoints` are pruned automatically (git commits preserved).

### Execution Configuration

Controls how plans are executed:

```javascript
execution: {
  pauseOnDeviation: true,      // Pause when plan deviates
  autoRetry: false,            // Retry failed tasks
  maxRetries: 3,               // Maximum retry attempts
  retryDelay: 1000,            // Delay between retries (ms)
  taskTimeout: 0,              // Task timeout (minutes, 0 = none)
  interactive: false           // Interactive mode
}
```

**Interactive Mode:**
```bash
# Enable via config
execution: { interactive: true }

# Or via command flag
reis execute-plan --interactive
```

### Validation Configuration

Controls plan validation:

```javascript
validation: {
  validateBeforeExecution: true,    // Validate before execution
  strict: false,                    // Treat warnings as errors
  checkCircularDeps: true,          // Detect circular dependencies
  checkFileExists: false            // Validate file paths exist
}
```

Strict mode is useful for CI/CD to catch all issues.

### Metrics Configuration

Controls metrics tracking:

```javascript
metrics: {
  enabled: true,                    // Enable metrics
  storageDir: '.reis/metrics',      // Storage location
  trackDeviations: true,            // Track plan deviations
  trackTaskDuration: true,          // Track task timing
  exportFormat: 'json'              // Export format
}
```

**Export Formats:**
- `'json'` - JSON format (default)
- `'csv'` - CSV format
- `'both'` - Both formats

### Visualization Configuration

Controls visualization appearance:

```javascript
visualization: {
  chartWidth: 80,                   // Chart width (columns)
  useColors: true,                  // Use colors
  progressStyle: 'bar',             // Progress bar style
  showETA: true,                    // Show ETA
  watchInterval: 5                  // Watch mode interval (seconds)
}
```

**Progress Styles:**
- `'bar'` - █████░░░░░ (default)
- `'blocks'` - ▓▓▓▓▒▒▒▒░░
- `'dots'` - ●●●●○○○○○○

### Output Configuration

Controls console output:

```javascript
output: {
  level: 'normal',                  // Verbosity level
  showTimestamps: false,            // Show timestamps
  logFile: '.reis/reis.log',        // Log file location
  enableFileLogging: false,         // Enable file logging
  colorize: true,                   // Use colors
  showIcons: true                   // Show emojis/icons
}
```

**Verbosity Levels:**
- `'quiet'` - Minimal output (errors only)
- `'normal'` - Standard output (default)
- `'verbose'` - Detailed output
- `'debug'` - Debug information

## Common Configurations

### Minimal Configuration

Just the essentials:

```javascript
module.exports = {
  waves: {
    defaultSize: 'medium'
  },
  git: {
    autoCommit: true
  }
};
```

Everything else uses defaults.

### Team Configuration

Optimized for team collaboration:

```javascript
module.exports = {
  waves: {
    defaultSize: 'medium',
    autoCheckpoint: true,
    checkpointEvery: 1
  },
  git: {
    autoCommit: true,
    commitMessagePrefix: '[TEAM]',
    requireCleanTree: true,    // Prevent dirty commits
    autoPush: true,            // Share checkpoints
    pushRemote: 'origin'
  },
  state: {
    maxCheckpoints: 100        // Keep more history
  },
  validation: {
    strict: true               // Catch all issues
  },
  output: {
    level: 'normal',
    showTimestamps: true       // Helpful for teams
  }
};
```

### Solo Developer Configuration

Optimized for solo work:

```javascript
module.exports = {
  waves: {
    defaultSize: 'large',      // Larger waves for focus
    autoCheckpoint: true
  },
  git: {
    autoCommit: true,
    requireCleanTree: false,   // More flexible
    autoPush: false            // Manual push
  },
  execution: {
    pauseOnDeviation: false,   // Keep flowing
    interactive: false
  },
  output: {
    level: 'verbose',          // More info
    colorize: true
  }
};
```

### CI/CD Configuration

Optimized for automation:

```javascript
module.exports = {
  waves: {
    defaultSize: 'medium',
    autoCheckpoint: false      // No checkpoints in CI
  },
  git: {
    autoCommit: false,         // Manual commit control
    requireCleanTree: true
  },
  validation: {
    strict: true,              // Fail on warnings
    validateBeforeExecution: true
  },
  execution: {
    interactive: false,        // No prompts
    autoRetry: true,           // Retry on transient failures
    maxRetries: 3
  },
  output: {
    level: 'normal',
    colorize: false,           // No colors in logs
    showIcons: false,
    enableFileLogging: true    // Log to file
  },
  notifications: {
    enabled: false             // No desktop notifications
  }
};
```

### Performance-Focused Configuration

Minimize overhead:

```javascript
module.exports = {
  state: {
    trackMetrics: false,       // Disable metrics
    createBackups: false       // No backups
  },
  metrics: {
    enabled: false             // No metrics tracking
  },
  validation: {
    checkFileExists: false     // Skip file checks
  },
  output: {
    level: 'quiet',            // Minimal output
    enableFileLogging: false
  },
  advanced: {
    enableCache: true,         // Enable caching
    cacheTTL: 3600000         // 1 hour cache
  }
};
```

## Environment-Specific Configuration

Use environment variables for environment-specific settings:

```javascript
module.exports = {
  git: {
    autoCommit: process.env.CI ? false : true,
    autoPush: process.env.CI ? false : true
  },
  output: {
    colorize: process.env.CI ? false : true,
    level: process.env.DEBUG ? 'debug' : 'normal'
  },
  validation: {
    strict: process.env.CI ? true : false
  }
};
```

**Usage:**
```bash
# Local development
reis execute-plan

# CI environment
CI=true reis execute-plan

# Debug mode
DEBUG=true reis execute-plan
```

## Configuration Validation

REIS validates configuration on load:

### Valid Configuration

```javascript
module.exports = {
  waves: {
    defaultSize: 'medium'  // ✓ Valid value
  }
};
```

### Invalid Configuration

```javascript
module.exports = {
  waves: {
    defaultSize: 'huge'    // ✗ Invalid value
  }
};
```

**Error:**
```
❌ Configuration Error: Invalid value for waves.defaultSize

Expected: 'small' | 'medium' | 'large'
Received: 'huge'

Fix: Change waves.defaultSize to a valid value in reis.config.js
```

### Common Validation Errors

**1. Invalid type:**
```javascript
waves: {
  autoCheckpoint: 'yes'  // ✗ Should be boolean
}
```

**2. Unknown key:**
```javascript
waves: {
  unknownOption: true    // ✗ Unknown configuration key
}
```

**3. Invalid range:**
```javascript
state: {
  maxCheckpoints: -5     // ✗ Must be positive
}
```

**4. Missing dependency:**
```javascript
git: {
  autoPush: true,
  pushRemote: ''         // ✗ pushRemote required when autoPush is true
}
```

## Commands

### Initialize Configuration

```bash
# Create reis.config.js
reis config init

# Create with specific template
reis config init --template minimal
reis config init --template team
reis config init --template ci
```

### Show Configuration

```bash
# Show effective configuration
reis config show

# Show specific section
reis config show waves
reis config show git

# Show as JSON
reis config show --json
```

### Validate Configuration

```bash
# Validate current config
reis config validate

# Validate specific file
reis config validate --file path/to/reis.config.js
```

### Edit Configuration

```bash
# Open in default editor
reis config edit

# Open specific section
reis config edit waves
```

## Troubleshooting

### Issue: "Config file not found"

**Solution:** Create one:
```bash
reis config init
```

Or specify path:
```bash
REIS_CONFIG=path/to/config.js reis execute-plan
```

### Issue: "Invalid configuration"

**Solution:** Validate and fix:
```bash
reis config validate
# Read error message
# Fix reis.config.js
reis config validate  # Verify fix
```

### Issue: "Config changes not applied"

**Solution:** Config is reloaded on each command. If changes aren't applying:
```bash
# Validate config
reis config validate

# Show effective config
reis config show

# Check for syntax errors
node -c reis.config.js
```

### Issue: "Config ignored in subdirectory"

**Solution:** REIS looks for config in current directory and up to git root. Place config in project root:
```bash
# Move to root
mv reis.config.js ../../

# Or specify path
export REIS_CONFIG=/path/to/reis.config.js
```

### Issue: "Team members have different config"

**Solution:** Commit `reis.config.js` to git:
```bash
git add reis.config.js
git commit -m "Add REIS configuration"
git push
```

All team members will use the same config.

## Best Practices

### 1. Start with Defaults

Don't configure everything immediately:
```bash
# Start with no config
reis execute-plan

# Add config as needed
reis config init
# Edit only what you need
```

### 2. Document Your Configuration

Add comments explaining non-obvious settings:
```javascript
module.exports = {
  waves: {
    // We use large waves because our tasks are very coupled
    defaultSize: 'large'
  },
  git: {
    // We disable auto-commit because we squash commits before PR
    autoCommit: false
  }
};
```

### 3. Use Environment Variables

For settings that differ between environments:
```javascript
module.exports = {
  git: {
    autoPush: process.env.REIS_AUTO_PUSH === 'true'
  }
};
```

### 4. Validate in CI

Ensure config is valid:
```yaml
# .github/workflows/ci.yml
- name: Validate REIS config
  run: reis config validate
```

### 5. Version Your Config

Track config changes in git:
```bash
git add reis.config.js
git commit -m "Update REIS config: increase wave size"
```

## Related Documentation

- [WAVE_EXECUTION.md](WAVE_EXECUTION.md) - Wave execution guide
- [CHECKPOINTS.md](CHECKPOINTS.md) - Checkpoint system
- [V2_FEATURES.md](V2_FEATURES.md) - v2.0 features overview
- [COMPLETE_COMMANDS.md](COMPLETE_COMMANDS.md) - All commands

---

**Next Steps:**
- View [Complete Commands](COMPLETE_COMMANDS.md)
- Learn about [Wave Execution](WAVE_EXECUTION.md)
- Explore [v2.0 Features](V2_FEATURES.md)
