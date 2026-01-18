/**
 * Team-Optimized REIS Configuration
 * 
 * Strict workflow for team collaboration. Ensures consistency,
 * frequent integration, and easy coordination among team members.
 * 
 * Use when:
 * - Multiple developers on shared repository
 * - Need consistent git history
 * - Want to prevent integration conflicts
 * - Require code review coordination
 * - Working in sprints with regular check-ins
 */

module.exports = {
  // Conservative wave sizes - encourage frequent integration
  waves: {
    small: {
      tasks: '1-2',              // Keep waves focused
      duration: '15-30min',      // Short, frequent work chunks
      checkpointEvery: 3         // Checkpoint every 45-90 min
    },
    medium: {
      tasks: '2-4',              // Standard medium wave
      duration: '30-60min',
      checkpointEvery: 1         // Checkpoint after each medium wave
    },
    large: {
      tasks: '4-6',              // Limit large wave size
      duration: '60-90min',      // Shorter than solo work
      checkpointEvery: 1         // Always checkpoint large waves
    }
  },

  // Strict git workflow for team coordination
  git: {
    autoCommit: true,            // Consistent commit history
    commitPrefix: '[TEAM]',      // Identify team commits
    requireCleanTree: true,      // Prevent accidental uncommitted work
    autoTag: true,               // Tag all checkpoints
    tagPrefix: 'team-checkpoint/'  // Team-specific tag prefix
  },

  // Careful execution - pause for team review
  execution: {
    pauseOnDeviation: true,      // Pause if plan deviates (team review)
    autoRetry: true,             // Retry once automatically
    maxRetries: 2,               // Limited retries (flag for help)
    confirmDestructive: true     // Always confirm destructive operations
  },

  // Full metrics for team visibility
  metrics: {
    enabled: true,               // Track all team metrics
    waveCompletion: true,        // Compare actual vs estimated times
    deviationTracking: true,     // Identify planning issues
    checkpointAnalysis: true     // Optimize checkpoint strategy
  },

  // Team-specific settings
  team: {
    checkpointReview: true,      // Require checkpoint review/approval
    dailyStandupReport: true,    // Generate standup reports from metrics
    notifyOnLargeWave: true      // Notify team when starting large waves
  }
};

/*
 * TEAM WORKFLOW EXAMPLE:
 * 
 * Morning:
 * 1. Pull latest: $ git pull origin main
 * 2. Resume work: $ reis resume
 * 3. Execute wave: $ reis execute-plan path/to/plan.md
 * 
 * During Work:
 * - REIS auto-commits after each task
 * - Checkpoints created automatically
 * - Pauses if plan deviates (team reviews deviation)
 * 
 * End of Day:
 * 1. Create checkpoint: $ reis checkpoint "EOD - auth module 80% complete"
 * 2. Push to remote: $ git push origin feature/auth
 * 3. Update team: $ reis visualize --type metrics > standup.txt
 * 
 * BENEFITS:
 * - Consistent git history for code review
 * - Easy to see what each team member accomplished
 * - Frequent checkpoints prevent large conflicts
 * - Metrics help with sprint planning
 * - Clean tree requirement prevents "works on my machine" issues
 */
