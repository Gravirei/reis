/**
 * REIS v2.0 Configuration
 * 
 * Customize your REIS workflow with these settings.
 * All fields are optional - defaults will be used if omitted.
 * 
 * For full documentation, run: reis config docs
 */

module.exports = {
  // Wave execution settings
  // Configure how tasks are grouped and executed
  waves: {
    // Default wave size: 'small' | 'medium' | 'large'
    // Small: 3 tasks, ~30 min - Quick focused tasks
    // Medium: 5 tasks, ~60 min - Standard development tasks (default)
    // Large: 8 tasks, ~120 min - Complex multi-step tasks
    defaultSize: 'medium',
    
    // Custom wave size definitions (optional)
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
    
    // Auto-checkpoint after each wave
    autoCheckpoint: true,
    
    // Continue execution if a wave fails
    continueOnError: false
  },

  // Git integration settings
  // Configure automatic git operations
  git: {
    // Auto-commit after wave completion
    autoCommit: true,
    
    // Prefix for commit messages
    commitMessagePrefix: '[REIS v2.0]',
    
    // Require clean working tree before starting
    requireCleanTree: true,
    
    // Auto-create branch for project
    createBranch: false,
    
    // Prefix for auto-created branches
    branchPrefix: 'reis/'
  },

  // State management settings
  // Configure how REIS tracks progress
  state: {
    // Track performance metrics
    trackMetrics: true,
    
    // Save checkpoint history
    saveCheckpoints: true,
    
    // Maximum checkpoints to keep
    maxCheckpoints: 10
  },

  // LLM preferences
  // Configure AI assistant behavior
  llm: {
    // Provider: 'auto' | 'openai' | 'anthropic' | 'custom'
    // 'auto' detects based on environment
    provider: 'auto',
    
    // Temperature for generation (0-1)
    // Lower = more focused, Higher = more creative
    temperature: 0.7,
    
    // Maximum tokens per request
    maxTokens: 4096
  },

  // Planning settings
  // Configure planning and validation behavior
  planning: {
    // Require PLAN.md before execution
    requirePlan: true,
    
    // Validate wave structure in plans
    validateWaves: true,
    
    // Suggest wave optimizations
    autoOptimize: false
  },

  // Output settings
  // Configure console output preferences
  output: {
    // Detailed logging
    verbose: false,
    
    // Show progress indicators
    showProgress: true,
    
    // Use colors in output
    colorize: true
  }
};

/**
 * Common Customization Examples:
 * 
 * 1. Prefer larger waves:
 *    waves: { defaultSize: 'large' }
 * 
 * 2. Disable auto-commit:
 *    git: { autoCommit: false }
 * 
 * 3. More verbose output:
 *    output: { verbose: true }
 * 
 * 4. Custom wave sizes:
 *    waves: {
 *      sizes: {
 *        small: { maxTasks: 2, estimatedMinutes: 15 }
 *      }
 *    }
 */
