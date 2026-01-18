/**
 * REIS v2.0 Configuration - Advanced Features Example
 * 
 * This configuration demonstrates advanced settings for complex projects
 * with strict team workflows and production requirements.
 */

module.exports = {
  // Wave size definitions with aggressive checkpointing
  waves: {
    // Small waves: Quick tasks, checkpoint less frequently
    small: {
      tasks: '1-2',
      duration: '15-30min',
      checkpointEvery: 2  // Checkpoint every 2 small waves (30-60 min work)
    },
    
    // Medium waves: Standard feature work, always checkpoint
    medium: {
      tasks: '2-4',
      duration: '30-60min',
      checkpointEvery: 1  // Checkpoint after each medium wave
    },
    
    // Large waves: Complex features, always checkpoint
    large: {
      tasks: '4-6',
      duration: '60-120min',
      checkpointEvery: 1  // Always checkpoint large waves (critical savepoint)
    }
  },

  // Strict git integration for team environments
  git: {
    autoCommit: true,           // Commit every completed task automatically
    commitPrefix: '[API]',      // Prefix all commits for easy filtering
    requireCleanTree: true,     // Enforce clean working tree (team best practice)
    autoTag: true,              // Automatically tag checkpoints
    tagPrefix: 'checkpoint/'    // Tag format: checkpoint/YYYY-MM-DD-HHmmss
  },

  // Careful execution settings
  execution: {
    pauseOnDeviation: true,     // Pause if plan deviates (review before continuing)
    autoRetry: true,            // Retry failed tasks automatically
    maxRetries: 3,              // Up to 3 retry attempts
    confirmDestructive: true    // Confirm before destructive operations
  },

  // Metrics and tracking
  metrics: {
    enabled: true,              // Track all metrics
    waveCompletion: true,       // Track wave completion times
    deviationTracking: true,    // Track plan deviations
    checkpointAnalysis: true    // Analyze checkpoint patterns
  },

  // Custom checkpoint triggers (advanced)
  checkpoints: {
    autoOnLargeWave: true,      // Auto-checkpoint after large waves
    autoOnPhase: true,          // Auto-checkpoint at phase boundaries
    autoOnMilestone: true,      // Auto-checkpoint at milestones
    maxTimeBetween: '90min'     // Force checkpoint if > 90min since last
  }
};
