/**
 * REIS v2.0 Configuration - TODO CLI Example
 * 
 * This is a basic configuration suitable for small projects.
 * It demonstrates wave sizing and automatic git integration.
 */

module.exports = {
  // Wave size definitions
  waves: {
    // Small waves: Quick, focused work
    small: {
      tasks: '1-2',              // 1-2 tasks per wave
      duration: '15-30min',      // Expected time
      checkpointEvery: 3         // Checkpoint every 3 small waves
    },
    
    // Medium waves: Standard feature development
    medium: {
      tasks: '2-4',              // 2-4 tasks per wave
      duration: '30-60min',      // Expected time
      checkpointEvery: 1         // Checkpoint after each medium wave
    }
  },

  // Git integration settings
  git: {
    autoCommit: true,            // Automatically commit after each task
    commitPrefix: '[TODO-CLI]',  // Prefix for commit messages
    requireCleanTree: false,     // Allow uncommitted changes (flexible for examples)
    autoTag: false               // Don't auto-tag (manual tagging preferred)
  },

  // Execution preferences
  execution: {
    pauseOnDeviation: false,     // Continue even if tasks deviate from plan
    autoRetry: true,             // Retry failed tasks once automatically
    maxRetries: 2                // Maximum retry attempts
  }
};
