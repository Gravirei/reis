/**
 * Solo Developer REIS Configuration
 * 
 * Optimized for individual developers working on personal projects.
 * Flexible, forgiving, and allows longer work sessions.
 * 
 * Use when:
 * - Working alone on personal projects
 * - Want full control over commits
 * - Prefer flexibility over strict discipline
 * - Doing experimental or exploratory work
 */

module.exports = {
  // Flexible wave sizes - can work longer between checkpoints
  waves: {
    small: {
      tasks: '1-3',              // Allow up to 3 tasks in "small" wave
      duration: '30-60min',      // Longer durations acceptable
      checkpointEvery: 4         // Checkpoint every 4 small waves (2-4 hours)
    },
    medium: {
      tasks: '3-5',              // Slightly larger medium waves
      duration: '45-90min',
      checkpointEvery: 2         // Checkpoint every 2 medium waves
    },
    large: {
      tasks: '5-8',              // Can handle more tasks at once
      duration: '90-150min',
      checkpointEvery: 1         // Still checkpoint large waves
    }
  },

  // Manual git control - you decide when to commit
  git: {
    autoCommit: false,           // Manual commits (full control)
    commitPrefix: '',            // No prefix (personal preference)
    requireCleanTree: false,     // Allow working with uncommitted changes
    autoTag: false               // Manual tagging preferred
  },

  // Forgiving execution
  execution: {
    pauseOnDeviation: false,     // Keep going if plan changes
    autoRetry: true,             // Auto-retry failed tasks
    maxRetries: 3,               // Give tasks multiple chances
    confirmDestructive: false    // Trust yourself, no confirmations
  },

  // Metrics optional but useful
  metrics: {
    enabled: true,               // Track your patterns
    waveCompletion: true,        // See how long waves actually take
    deviationTracking: true      // Learn from plan changes
  }
};

/*
 * WORKFLOW EXAMPLE:
 * 
 * 1. Work for 2-4 hours without interruption
 * 2. Create manual checkpoint when ready:
 *    $ git add . && git commit -m "Feature X working"
 *    $ reis checkpoint "Feature X complete"
 * 3. Continue to next wave
 * 4. If interrupted, use `reis resume` to pick up where you left off
 * 
 * BENEFITS:
 * - Work at your own pace
 * - Full control over git history
 * - Fewer interruptions
 * - Flexible wave sizes adapt to your style
 */
