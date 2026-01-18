/**
 * Minimal REIS v2.0 Configuration
 * 
 * This is the simplest possible config. Everything else uses defaults.
 * 
 * Use when: You want REIS v2.0 features with minimal customization.
 * 
 * Default values (when not specified):
 * - waves.small: { tasks: '1-2', duration: '15-30min', checkpointEvery: 3 }
 * - waves.medium: { tasks: '2-4', duration: '30-60min', checkpointEvery: 1 }
 * - waves.large: { tasks: '4-6', duration: '60-120min', checkpointEvery: 1 }
 * - git.autoCommit: false
 * - git.requireCleanTree: false
 * - execution.pauseOnDeviation: false
 * - execution.autoRetry: true
 */

module.exports = {
  // Only override what you need
  git: {
    autoCommit: true  // Enable automatic commits
  }
};

// That's it! Everything else uses sensible defaults.
