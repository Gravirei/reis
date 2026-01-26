const chalk = require('chalk');
const { runCycle } = require('../utils/cycle-orchestrator');
const stateManager = require('../utils/cycle-state-manager');
const { showError, checkPlanningDir } = require('../utils/command-helpers');
const { showKanbanBoard } = require('../utils/kanban-renderer');

/**
 * Cycle Command
 * Complete PLAN → EXECUTE → VERIFY → DEBUG workflow automation
 */

/**
 * Main cycle command
 * @param {number|string} phaseOrPlan - Phase number or plan path
 * @param {Object} options - Command options
 */
async function cycle(phaseOrPlan, options = {}) {
  // Show kanban board (unless disabled)
  showKanbanBoard({ noKanban: options?.noKanban });
  try {
    // Show welcome banner
    showBanner(phaseOrPlan, options);
    
    // Check for existing interrupted cycle
    if (!options.resume && stateManager.isResumable()) {
      const shouldResume = await promptResume();
      if (shouldResume) {
        options.resume = true;
      }
    }
    
    // Validate project
    if (!checkPlanningDir()) {
      showError('Not a REIS project. Run "reis new" or "reis map" first.');
      process.exit(1);
    }
    
    // Parse options
    const cycleOptions = {
      maxAttempts: parseInt(options.maxAttempts) || 3,
      autoFix: options.autoFix || false,
      continueOnFail: options.continueOnFail || false,
      verbose: options.verbose || false,
      resume: options.resume || false,
      skipGates: options.skipGates || false,
      gateOnly: options.gateOnly || null
    };
    
    // Show cycle configuration
    if (cycleOptions.verbose) {
      showConfiguration(cycleOptions);
    }
    
    // Run the cycle
    console.log(chalk.blue('\n🔄 Starting cycle...\n'));
    
    const result = await runCycle(phaseOrPlan, cycleOptions);
    
    // Show success summary
    showSuccessSummary(result);
    
    process.exit(0);
    
  } catch (error) {
    showErrorSummary(error);
    process.exit(1);
  }
}

/**
 * Show welcome banner
 */
function showBanner(phaseOrPlan, options) {
  console.log();
  console.log(chalk.blue('╔═══════════════════════════════════════════════════════════╗'));
  
  if (options.resume) {
    console.log(chalk.blue('║  🔄 REIS Complete Cycle - Resuming                        ║'));
  } else {
    const displayPhase = phaseOrPlan ? `Phase ${phaseOrPlan}` : 'Custom Plan';
    const paddedText = `  🔄 REIS Complete Cycle - ${displayPhase}`;
    const padding = ' '.repeat(Math.max(0, 59 - paddedText.length));
    console.log(chalk.blue(`║${paddedText}${padding}║`));
  }
  
  console.log(chalk.blue('╚═══════════════════════════════════════════════════════════╝'));
  console.log();
}

/**
 * Prompt user to resume interrupted cycle
 */
async function promptResume() {
  const state = stateManager.loadState();
  
  if (!state) return false;
  
  console.log(chalk.yellow('⚠️  Interrupted cycle detected'));
  console.log(chalk.gray(`   Phase: ${state.phase}`));
  console.log(chalk.gray(`   State: ${state.currentState}`));
  console.log(chalk.gray(`   Attempts: ${state.attempts}/${state.maxAttempts}`));
  console.log();
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise(resolve => {
    rl.question(chalk.cyan('Resume cycle? (Y/n): '), answer => {
      rl.close();
      const shouldResume = !answer || answer.toLowerCase() !== 'n';
      console.log();
      resolve(shouldResume);
    });
  });
}

/**
 * Show cycle configuration
 */
function showConfiguration(options) {
  console.log(chalk.gray('Configuration:'));
  console.log(chalk.gray(`  Max attempts: ${options.maxAttempts}`));
  console.log(chalk.gray(`  Auto-fix: ${options.autoFix ? 'Yes' : 'No'}`));
  console.log(chalk.gray(`  Continue on fail: ${options.continueOnFail ? 'Yes' : 'No'}`));
  console.log(chalk.gray(`  Verbose: ${options.verbose ? 'Yes' : 'No'}`));
  console.log();
}

/**
 * Show success summary
 */
function showSuccessSummary(result) {
  console.log();
  console.log(chalk.green('╔═══════════════════════════════════════════════════════════╗'));
  console.log(chalk.green('║  ✅ Cycle Complete!                                       ║'));
  console.log(chalk.green('╚═══════════════════════════════════════════════════════════╝'));
  console.log();
  
  // Show statistics
  console.log(chalk.cyan('📊 Summary:'));
  console.log(chalk.gray(`   Phase: ${result.phase || 'N/A'}`));
  console.log(chalk.gray(`   Plan: ${result.planPath || 'N/A'}`));
  console.log(chalk.gray(`   Duration: ${formatDuration(result.duration)}`));
  console.log(chalk.gray(`   Attempts: ${result.attempts || 0}`));
  
  if (result.resumed) {
    console.log(chalk.blue('   Resumed: Yes'));
  }
  
  console.log();
  
  // Show next steps
  console.log(chalk.cyan('📋 Next Steps:'));
  
  if (typeof result.phase === 'number') {
    const nextPhase = parseInt(result.phase) + 1;
    console.log(chalk.gray(`   → Run next phase: ${chalk.yellow(`reis cycle ${nextPhase}`)}`));
  } else {
    console.log(chalk.gray(`   → Review changes: ${chalk.yellow('git log')}`));
  }
  
  console.log(chalk.gray(`   → View progress: ${chalk.yellow('reis progress')}`));
  console.log(chalk.gray(`   → Check state: ${chalk.yellow('cat .planning/STATE.md')}`));
  console.log();
}

/**
 * Show error summary
 */
function showErrorSummary(error) {
  console.log();
  console.log(chalk.red('╔═══════════════════════════════════════════════════════════╗'));
  console.log(chalk.red('║  ❌ Cycle Failed                                          ║'));
  console.log(chalk.red('╚═══════════════════════════════════════════════════════════╝'));
  console.log();
  
  console.log(chalk.red('Error: ') + error.message);
  console.log();
  
  // Show state information
  const state = stateManager.loadState();
  if (state) {
    console.log(chalk.yellow('📊 Cycle State:'));
    console.log(chalk.gray(`   Phase: ${state.phase || 'N/A'}`));
    console.log(chalk.gray(`   Current state: ${state.currentState}`));
    console.log(chalk.gray(`   Attempts: ${state.attempts}/${state.maxAttempts}`));
    console.log(chalk.gray(`   Completeness: ${state.completeness}%`));
    console.log();
  }
  
  // Show recovery options
  console.log(chalk.cyan('🔧 Recovery Options:'));
  
  if (error.message.includes('Max verification attempts reached')) {
    console.log(chalk.gray('   1. Review verification output'));
    console.log(chalk.gray('   2. Fix issues manually'));
    console.log(chalk.gray(`   3. Increase max attempts: ${chalk.yellow('reis cycle --max-attempts 5')}`));
    console.log(chalk.gray(`   4. Skip verification: ${chalk.yellow('reis cycle --continue-on-fail')}`));
  } else if (error.message.includes('Plan not found')) {
    console.log(chalk.gray(`   1. Generate plan: ${chalk.yellow('reis plan <phase>')}`));
    console.log(chalk.gray('   2. Check plan path is correct'));
  } else if (error.message.includes('Fix declined')) {
    console.log(chalk.gray('   1. Review fix plan manually'));
    console.log(chalk.gray(`   2. Apply fixes automatically: ${chalk.yellow('reis cycle --auto-fix')}`));
    console.log(chalk.gray(`   3. Resume cycle: ${chalk.yellow('reis cycle --resume')}`));
  } else {
    console.log(chalk.gray(`   1. Review error details above`));
    console.log(chalk.gray(`   2. Resume cycle: ${chalk.yellow('reis cycle --resume')}`));
    console.log(chalk.gray(`   3. Start fresh: ${chalk.yellow('reis cycle <phase>')}`));
  }
  
  console.log();
  
  // Show state file location
  if (state) {
    console.log(chalk.gray('💾 State saved to: ') + chalk.cyan(stateManager.getStateFilePath()));
    console.log();
  }
}

/**
 * Format duration in human-readable format
 */
function formatDuration(seconds) {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  }
}

/**
 * Show step progress (called by orchestrator)
 */
function showStepProgress(stepNumber, totalSteps, stepName, status) {
  const icons = {
    pending: '⏳',
    success: '✓',
    failure: '❌',
    warning: '⚠️'
  };
  
  const colors = {
    pending: chalk.blue,
    success: chalk.green,
    failure: chalk.red,
    warning: chalk.yellow
  };
  
  const icon = icons[status] || '○';
  const color = colors[status] || chalk.gray;
  
  console.log(color(`${icon} Step ${stepNumber}/${totalSteps}: ${stepName}`));
}

/**
 * Show verification details
 */
function showVerificationDetails(result) {
  console.log();
  console.log(chalk.cyan('Verification Results:'));
  console.log(chalk.gray(`  Completeness: ${result.completeness}%`));
  
  if (result.issues && result.issues.length > 0) {
    console.log(chalk.yellow('\n  Issues found:'));
    result.issues.forEach(issue => {
      console.log(chalk.yellow(`    - ${issue}`));
    });
  }
  
  console.log();
}

/**
 * Show fix prompt
 */
async function showFixPrompt(fixPlanPath) {
  console.log();
  console.log(chalk.cyan('🔧 Fix Plan Generated:'));
  console.log(chalk.gray(`   ${fixPlanPath}`));
  console.log();
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise(resolve => {
    rl.question(chalk.yellow('Apply fix? (Y/n): '), answer => {
      rl.close();
      resolve(!answer || answer.toLowerCase() !== 'n');
    });
  });
}

module.exports = cycle;
module.exports.showStepProgress = showStepProgress;
module.exports.showVerificationDetails = showVerificationDetails;
module.exports.showFixPrompt = showFixPrompt;
