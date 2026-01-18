/**
 * CI/CD Pipeline REIS Configuration
 * 
 * Optimized for automated continuous integration and deployment pipelines.
 * No user interaction, deterministic builds, fail-fast behavior.
 * 
 * Use when:
 * - Running REIS in CI/CD pipelines (GitHub Actions, GitLab CI, Jenkins)
 * - Automated testing environments
 * - Build and deployment automation
 * - Infrastructure as code
 */

module.exports = {
  // Standard wave sizes (pipeline doesn't care about time)
  waves: {
    small: {
      tasks: '1-2',
      duration: 'N/A',           // Duration irrelevant in CI
      checkpointEvery: 999       // No automatic checkpoints in CI
    },
    medium: {
      tasks: '2-4',
      duration: 'N/A',
      checkpointEvery: 999
    },
    large: {
      tasks: '4-6',
      duration: 'N/A',
      checkpointEvery: 999
    }
  },

  // Strict git for deterministic builds
  git: {
    autoCommit: true,            // Track all changes in build
    commitPrefix: '[CI]',        // Identify CI commits
    requireCleanTree: true,      // Enforce clean state (no surprises)
    autoTag: false,              // CI system handles tagging
    tagPrefix: ''
  },

  // Fail-fast execution - no user interaction
  execution: {
    pauseOnDeviation: false,     // Never pause (no human to respond)
    autoRetry: true,             // Retry transient failures
    maxRetries: 2,               // Limited retries (fail fast)
    confirmDestructive: false,   // No confirmations in automation
    failFast: true,              // Stop on first error
    verbose: true                // Detailed logging for debugging
  },

  // Comprehensive metrics for pipeline analysis
  metrics: {
    enabled: true,
    waveCompletion: true,
    deviationTracking: true,
    exportFormat: 'json',        // Machine-readable format
    exportPath: './reis-metrics.json'
  },

  // CI-specific settings
  ci: {
    detectCIEnvironment: true,   // Auto-detect CI (GitHub Actions, etc.)
    logLevel: 'verbose',         // Detailed logs for debugging
    exitOnError: true,           // Exit with non-zero on failure
    timeoutPerTask: '5min',      // Timeout individual tasks
    timeoutPerWave: '30min'      // Timeout entire waves
  }
};

/*
 * CI/CD USAGE EXAMPLE:
 * 
 * GitHub Actions (.github/workflows/reis.yml):
 * 
 * name: REIS CI
 * on: [push, pull_request]
 * jobs:
 *   execute-plans:
 *     runs-on: ubuntu-latest
 *     steps:
 *       - uses: actions/checkout@v2
 *       - name: Setup Node.js
 *         uses: actions/setup-node@v2
 *       - name: Install REIS
 *         run: npm install -g reis
 *       - name: Execute Phase 1
 *         run: reis execute-plan .planning/phases/phase-1/plan.md
 *       - name: Upload Metrics
 *         uses: actions/upload-artifact@v2
 *         with:
 *           name: reis-metrics
 *           path: reis-metrics.json
 * 
 * GitLab CI (.gitlab-ci.yml):
 * 
 * reis_execute:
 *   stage: build
 *   script:
 *     - npm install -g reis
 *     - reis execute-plan .planning/phases/phase-1/plan.md
 *   artifacts:
 *     paths:
 *       - reis-metrics.json
 *     reports:
 *       junit: reis-metrics.json
 * 
 * Jenkins (Jenkinsfile):
 * 
 * pipeline {
 *   agent any
 *   stages {
 *     stage('Execute REIS Plan') {
 *       steps {
 *         sh 'npm install -g reis'
 *         sh 'reis execute-plan .planning/phases/phase-1/plan.md'
 *       }
 *     }
 *     stage('Archive Metrics') {
 *       steps {
 *         archiveArtifacts artifacts: 'reis-metrics.json'
 *       }
 *     }
 *   }
 * }
 * 
 * BENEFITS:
 * - Deterministic builds (clean tree requirement)
 * - Fail fast (catch errors immediately)
 * - No user interaction needed
 * - Detailed metrics for pipeline optimization
 * - Auto-retry handles transient failures
 * - Timeouts prevent hung builds
 */
