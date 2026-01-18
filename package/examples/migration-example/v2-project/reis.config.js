/**
 * REIS v2.0 Configuration - Task Management API
 * 
 * This configuration is NEW in v2.0. It's optional - REIS will use
 * sensible defaults if this file is not present.
 */

module.exports = {
  // Wave size definitions
  waves: {
    small: {
      tasks: '1-2',
      duration: '20-30min',
      checkpointEvery: 3  // Checkpoint every 3 small waves
    },
    medium: {
      tasks: '2-4',
      duration: '40-60min',
      checkpointEvery: 2  // Checkpoint every 2 medium waves
    },
    large: {
      tasks: '4-6',
      duration: '90-120min',
      checkpointEvery: 1  // Always checkpoint after large waves
    }
  },

  // Git integration
  git: {
    autoCommit: true,          // Commit after each task completion
    commitPrefix: '[API]',     // Prefix for task commits
    requireCleanTree: false,   // Allow working with uncommitted changes
    autoTag: true              // Tag checkpoints automatically
  },

  // Execution preferences
  execution: {
    pauseOnDeviation: false,   // Continue if plans deviate slightly
    autoRetry: true,           // Retry failed tasks once
    maxRetries: 2              // Maximum retry attempts
  }
};
