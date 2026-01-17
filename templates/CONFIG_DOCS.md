# REIS Configuration Documentation

## Overview

REIS v2.0 can be customized through a `reis.config.js` file in your project root. This configuration allows you to tailor the REIS workflow to your specific needs and preferences.

## Getting Started

### Create a Config File

```bash
reis config init
```

This creates a `reis.config.js` with all available options documented.

### View Current Configuration

```bash
reis config show
```

Display your current configuration with highlighted custom values.

### Validate Configuration

```bash
reis config validate
```

Check if your configuration is valid and get helpful error messages.

## Configuration Sections

### 1. Waves

Configure how tasks are grouped and executed in waves.

```javascript
waves: {
  defaultSize: 'medium',  // 'small' | 'medium' | 'large'
  sizes: {
    small: {
      maxTasks: 3,
      estimatedMinutes: 30,
      description: 'Quick focused tasks'
    },
    medium: {
      maxTasks: 5,
      estimatedMinutes: 60,
      description: 'Standard development tasks'
    },
    large: {
      maxTasks: 8,
      estimatedMinutes: 120,
      description: 'Complex multi-step tasks'
    }
  },
  autoCheckpoint: true,      // Auto-checkpoint after each wave
  continueOnError: false     // Stop execution if wave fails
}
```

**Options:**

- **defaultSize** (string): Default wave size for execution
  - `'small'`: 3 tasks, ~30 minutes
  - `'medium'`: 5 tasks, ~60 minutes (default)
  - `'large'`: 8 tasks, ~120 minutes

- **sizes** (object): Custom wave size definitions
  - Customize `maxTasks` and `estimatedMinutes` for each size
  - Add custom descriptions

- **autoCheckpoint** (boolean): Auto-create checkpoints after each wave
  - Default: `true`
  - Allows easy resumption if interrupted

- **continueOnError** (boolean): Continue execution even if a wave fails
  - Default: `false`
  - If `true`, errors are logged but execution continues

**Examples:**

```javascript
// Prefer larger batches
waves: { defaultSize: 'large' }

// Custom wave sizes for tight deadlines
waves: {
  sizes: {
    small: { maxTasks: 2, estimatedMinutes: 15 }
  }
}
```

### 2. Git Integration

Configure automatic git operations.

```javascript
git: {
  autoCommit: true,
  commitMessagePrefix: '[REIS v2.0]',
  requireCleanTree: true,
  createBranch: false,
  branchPrefix: 'reis/'
}
```

**Options:**

- **autoCommit** (boolean): Auto-commit after wave completion
  - Default: `true`
  - Creates atomic commits per wave

- **commitMessagePrefix** (string): Prefix for commit messages
  - Default: `'[REIS v2.0]'`
  - Example: `'[REIS v2.0] Wave 1: Setup authentication'`

- **requireCleanTree** (boolean): Require clean working tree before starting
  - Default: `true`
  - Prevents accidental loss of uncommitted work

- **createBranch** (boolean): Auto-create branch for project
  - Default: `false`
  - Creates branch using `branchPrefix`

- **branchPrefix** (string): Prefix for auto-created branches
  - Default: `'reis/'`
  - Example: `'reis/feature-authentication'`

**Examples:**

```javascript
// Manual commit control
git: { autoCommit: false }

// Custom commit prefix
git: { commitMessagePrefix: '[Project]' }

// Auto-create feature branches
git: {
  createBranch: true,
  branchPrefix: 'feature/'
}
```

### 3. State Management

Configure how REIS tracks progress and creates checkpoints.

```javascript
state: {
  trackMetrics: true,
  saveCheckpoints: true,
  maxCheckpoints: 10
}
```

**Options:**

- **trackMetrics** (boolean): Track performance metrics
  - Default: `true`
  - Records wave duration, success rate, etc.

- **saveCheckpoints** (boolean): Save checkpoint history
  - Default: `true`
  - Enables `reis resume` functionality

- **maxCheckpoints** (number): Maximum checkpoints to keep
  - Default: `10`
  - Older checkpoints are automatically pruned

**Examples:**

```javascript
// Minimal tracking
state: { trackMetrics: false }

// Keep more checkpoints
state: { maxCheckpoints: 20 }
```

### 4. LLM Preferences

Configure AI assistant behavior.

```javascript
llm: {
  provider: 'auto',      // 'auto' | 'openai' | 'anthropic' | 'custom'
  temperature: 0.7,
  maxTokens: 4096
}
```

**Options:**

- **provider** (string): LLM provider to use
  - `'auto'`: Auto-detect from environment (default)
  - `'openai'`: OpenAI GPT models
  - `'anthropic'`: Anthropic Claude models
  - `'custom'`: Custom provider

- **temperature** (number): Generation temperature (0-1)
  - Default: `0.7`
  - Lower = more focused and deterministic
  - Higher = more creative and varied

- **maxTokens** (number): Maximum tokens per request
  - Default: `4096`
  - Adjust based on your plan complexity

**Examples:**

```javascript
// More focused output
llm: { temperature: 0.3 }

// Larger context for complex projects
llm: { maxTokens: 8192 }
```

### 5. Planning

Configure planning and validation behavior.

```javascript
planning: {
  requirePlan: true,
  validateWaves: true,
  autoOptimize: false
}
```

**Options:**

- **requirePlan** (boolean): Require PLAN.md before execution
  - Default: `true`
  - Ensures systematic development

- **validateWaves** (boolean): Validate wave structure
  - Default: `true`
  - Checks wave sizes and dependencies

- **autoOptimize** (boolean): Suggest wave optimizations
  - Default: `false`
  - AI suggests better wave groupings

**Examples:**

```javascript
// Enable optimization suggestions
planning: { autoOptimize: true }

// Skip plan validation for quick iterations
planning: { requirePlan: false }
```

### 6. Output

Configure console output preferences.

```javascript
output: {
  verbose: false,
  showProgress: true,
  colorize: true
}
```

**Options:**

- **verbose** (boolean): Detailed logging
  - Default: `false`
  - Shows internal operations

- **showProgress** (boolean): Show progress indicators
  - Default: `true`
  - Displays wave progress

- **colorize** (boolean): Use colors in output
  - Default: `true`
  - Enhances readability

**Examples:**

```javascript
// Debug mode
output: { verbose: true }

// Plain output for CI/CD
output: {
  showProgress: false,
  colorize: false
}
```

## Configuration Patterns

### Minimal Configuration

Override only what you need. Defaults are used for everything else.

```javascript
module.exports = {
  waves: { defaultSize: 'large' },
  git: { autoCommit: false }
};
```

### Solo Developer

Optimized for individual developers working on features.

```javascript
module.exports = {
  waves: { defaultSize: 'medium' },
  git: {
    autoCommit: true,
    createBranch: true,
    branchPrefix: 'feature/'
  },
  output: { verbose: true }
};
```

### Team Project

Optimized for team collaboration with strict practices.

```javascript
module.exports = {
  waves: { defaultSize: 'small' },
  git: {
    autoCommit: true,
    requireCleanTree: true,
    commitMessagePrefix: '[TEAM]'
  },
  planning: {
    requirePlan: true,
    validateWaves: true,
    autoOptimize: true
  }
};
```

### CI/CD Pipeline

Optimized for automated environments.

```javascript
module.exports = {
  waves: { defaultSize: 'large', continueOnError: true },
  git: { autoCommit: false, requireCleanTree: false },
  output: {
    verbose: true,
    showProgress: false,
    colorize: false
  }
};
```

## Validation

REIS validates your configuration on load. Common errors:

### Invalid Wave Size

```
✗ Invalid defaultSize: xlarge. Must be one of: small, medium, large
```

**Fix:** Use a valid size or define custom sizes.

### Invalid Type

```
✗ git.autoCommit must be a boolean
```

**Fix:** Ensure correct data types (boolean, string, number).

### Invalid Range

```
✗ state.maxCheckpoints must be a positive number
```

**Fix:** Use positive numbers for numeric fields.

## Best Practices

1. **Start Small**: Begin with minimal config and add as needed
2. **Version Control**: Commit `reis.config.js` to your repo
3. **Team Alignment**: Discuss config with team members
4. **Validate Often**: Run `reis config validate` after changes
5. **Document Changes**: Comment why you changed defaults

## Commands Reference

```bash
# View current configuration
reis config show

# View as JSON (machine-readable)
reis config show --json

# Create config file
reis config init

# Force overwrite existing config
reis config init --force

# Validate configuration
reis config validate

# Show this documentation
reis config docs

# Use custom config path
reis config show --path /path/to/config.js
```

## Migration from v1.x

REIS v2.0 introduces a new configuration system. To migrate:

1. Create new config: `reis config init`
2. Review your v1.x preferences
3. Update `reis.config.js` accordingly
4. Validate: `reis config validate`

**Note:** v1.x settings files are not automatically migrated.

## Support

For issues or questions:

- Run `reis config docs` for this documentation
- Run `reis config validate` to check your config
- Check GitHub issues: https://github.com/Gravirei/reis/issues

## Example Complete Configuration

```javascript
/**
 * Production REIS Configuration
 * Team: Backend Engineering
 * Project: API v2 Migration
 */

module.exports = {
  waves: {
    defaultSize: 'medium',
    sizes: {
      small: { maxTasks: 3, estimatedMinutes: 30 },
      medium: { maxTasks: 5, estimatedMinutes: 60 },
      large: { maxTasks: 8, estimatedMinutes: 120 }
    },
    autoCheckpoint: true,
    continueOnError: false
  },

  git: {
    autoCommit: true,
    commitMessagePrefix: '[API-v2]',
    requireCleanTree: true,
    createBranch: true,
    branchPrefix: 'api-v2/'
  },

  state: {
    trackMetrics: true,
    saveCheckpoints: true,
    maxCheckpoints: 15
  },

  llm: {
    provider: 'auto',
    temperature: 0.5,
    maxTokens: 8192
  },

  planning: {
    requirePlan: true,
    validateWaves: true,
    autoOptimize: true
  },

  output: {
    verbose: false,
    showProgress: true,
    colorize: true
  }
};
```
