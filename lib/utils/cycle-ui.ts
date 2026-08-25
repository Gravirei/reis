import chalk from 'chalk';

/**
 * Cycle UI Components
 * Visual feedback and progress indicators for cycle command
 */

// Cycle phases in order
export const CYCLE_PHASES = ['PLANNING', 'REVIEWING', 'EXECUTING', 'VERIFYING', 'GATING', 'DEBUGGING', 'FIXING', 'COMPLETED'];

/**
 * Get icon for a cycle phase
 * @param {string} phase - Phase name
 * @returns {string} Icon for the phase
 */
export function getPhaseIcon(phase: string) {
  const icons = {
    PLANNING: '📝',
    REVIEWING: '📋',    // clipboard for review
    EXECUTING: '⚡',
    VERIFYING: '🔍',
    GATING: '🛡️',
    DEBUGGING: '🐛',
    FIXING: '🔧',
    COMPLETED: '✅'
  };
  return (icons as Record<string, string>)[phase] || '❓';
}

/**
 * Display review status result
 * @param {Object} reviewResult - Review result object
 * @returns {string} Formatted review status string
 */
export function displayReviewStatus(reviewResult: any) {
  if (!reviewResult) return '';
  
  const icon = reviewResult.success ? '✅' : (reviewResult.hasWarnings ? '⚠️' : '❌');
  const status = reviewResult.success ? 'Passed' : 'Failed';
  const issues = reviewResult.issues?.length || 0;
  
  return `${icon} Review: ${status} (${issues} issues)`;
}

/**
 * Display gate status result
 * @param {Object} gateResult - Gate result object
 * @returns {string} Formatted gate status string
 */
export function displayGateStatus(gateResult: any) {
  if (!gateResult) return '';
  
  const icon = gateResult.passed ? '✅' : (gateResult.hasWarnings ? '⚠️' : '❌');
  const status = gateResult.passed ? 'Passed' : 'Failed';
  const counts = gateResult.summary || {};
  
  return `${icon} Gates: ${status} (${counts.passed || 0} passed, ${counts.failed || 0} failed)`;
}

/**
 * Show gate results in detail
 * @param {Object} gateResult - Gate result from quality gates
 */
export function showGateResults(gateResult: any) {
  if (!gateResult) return;
  
  console.log();
  console.log(chalk.cyan('Quality Gate Results:'));
  
  const icon = gateResult.passed ? chalk.green('✅') : (gateResult.hasWarnings ? chalk.yellow('⚠️') : chalk.red('❌'));
  const status = gateResult.passed ? chalk.green('Passed') : chalk.red('Failed');
  console.log(`  ${icon} Status: ${status}`);
  
  // Summary counts
  const summary = gateResult.summary || {};
  console.log(chalk.gray(`  Checks: ${summary.total || 0} total, ${summary.passed || 0} passed, ${summary.failed || 0} failed`));
  
  // Show failed checks
  if (gateResult.failedChecks && gateResult.failedChecks.length > 0) {
    console.log();
    console.log(chalk.yellow('  Failed Checks:'));
    gateResult.failedChecks.forEach((check: any) => {
      console.log(chalk.yellow(`    - ${check.name}: ${check.message || 'Failed'}`));
    });
  }
  
  // Show warnings
  if (gateResult.warnings && gateResult.warnings.length > 0) {
    console.log();
    console.log(chalk.yellow('  Warnings:'));
    gateResult.warnings.forEach((warning: any) => {
      console.log(chalk.yellow(`    - ${warning}`));
    });
  }
  
  console.log();
}

// Spinner states
let spinnerInterval: ReturnType<typeof setInterval> | null = null;
let spinnerFrame = 0;
const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

/**
 * Show step start
 * @param {string} stepName - Name of the step
 * @param {number} stepNumber - Current step number
 * @param {number} total - Total number of steps
 */
export function showStepStart(stepName: string, stepNumber: number, total: number) {
  console.log();
  console.log(chalk.blue(`⏳ Step ${stepNumber}/${total}: ${stepName}`));
}

/**
 * Show step success
 * @param {string} stepName - Name of the step
 * @param {string} details - Additional details
 */
export function showStepSuccess(stepName: string, details = '') {
  const message = details ? `${stepName} - ${details}` : stepName;
  console.log(chalk.green(`✓ ${message}`));
}

/**
 * Show step failure
 * @param {string} stepName - Name of the step
 * @param {Error|string} error - Error object or message
 */
export function showStepFailure(stepName: string, error: any) {
  const message = error.message || String(error);
  console.log(chalk.red(`✗ ${stepName} - ${message}`));
}

/**
 * Show step warning
 * @param {string} stepName - Name of the step
 * @param {string} warning - Warning message
 */
export function showStepWarning(stepName: string, warning: string) {
  console.log(chalk.yellow(`⚠️  ${stepName} - ${warning}`));
}

/**
 * Start spinner with message
 * @param {string} message - Message to display
 */
export function showSpinner(message: string) {
  // Clear any existing spinner
  stopSpinner();
  
  process.stdout.write(`   ${spinnerFrames[0]} ${message}`);
  
  spinnerInterval = setInterval(() => {
    spinnerFrame = (spinnerFrame + 1) % spinnerFrames.length;
    process.stdout.write(`\r   ${spinnerFrames[spinnerFrame]} ${message}`);
  }, 80);
}

/**
 * Stop spinner
 * @param {string} finalMessage - Optional message to show after stopping
 * @param {boolean} success - Whether operation was successful
 */
export function stopSpinner(finalMessage: string | null = null, success = true) {
  if (spinnerInterval) {
    clearInterval(spinnerInterval);
    spinnerInterval = null;
    spinnerFrame = 0;

    if (finalMessage) {
      const icon = success ? chalk.green('✓') : chalk.red('✗');
      process.stdout.write(`\r   ${icon} ${finalMessage}\n`);
    } else {
      process.stdout.write('\r');
      (process.stdout.clearLine as any)();
    }
  }
}

/**
 * Show progress bar
 * @param {number} current - Current progress
 * @param {number} total - Total items
 * @param {string} label - Label for progress bar
 */
export function showProgressBar(current: number, total: number, label = '') {
  const percentage = Math.floor((current / total) * 100);
  const barWidth = 30;
  const filled = Math.floor((current / total) * barWidth);
  const empty = barWidth - filled;
  
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  const percentageStr = `${percentage}%`.padStart(4);
  const countStr = `(${current}/${total})`;
  
  let line = `   [${bar}] ${percentageStr} ${countStr}`;
  if (label) {
    line += ` ${label}`;
  }
  
  process.stdout.write(`\r${line}`);
}

/**
 * Clear progress bar
 */
export function clearProgressBar() {
  process.stdout.write('\r');
  (process.stdout.clearLine as any)();
}

/**
 * Show elapsed time
 * @param {number} seconds - Elapsed seconds
 * @returns {string} Formatted time
 */
export function formatElapsedTime(seconds: number) {
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
 * Show time elapsed
 * @param {number} startTime - Start timestamp (milliseconds)
 */
export function showElapsedTime(startTime: number) {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  console.log(chalk.gray(`   Elapsed: ${formatElapsedTime(elapsed)}`));
}

/**
 * Show cycle summary
 * @param {Object} results - Cycle results
 */
export function showSummary(results: any) {
  console.log();
  console.log(chalk.cyan('═══════════════════════════════════════════════════════════'));
  console.log(chalk.cyan('                    Cycle Summary'));
  console.log(chalk.cyan('═══════════════════════════════════════════════════════════'));
  console.log();
  
  // Status
  const statusIcon = results.success ? chalk.green('✅') : chalk.red('❌');
  const statusText = results.success ? 'Complete' : 'Failed';
  console.log(`${statusIcon} Status: ${chalk.bold(statusText)}`);
  console.log();
  
  // Details
  if (results.phase) {
    console.log(chalk.gray(`Phase: ${results.phase}`));
  }
  if (results.planPath) {
    console.log(chalk.gray(`Plan: ${results.planPath}`));
  }
  if (results.duration !== undefined) {
    console.log(chalk.gray(`Duration: ${formatElapsedTime(results.duration)}`));
  }
  if (results.attempts !== undefined) {
    console.log(chalk.gray(`Attempts: ${results.attempts}`));
  }
  if (results.completeness !== undefined) {
    const color = results.completeness >= 100 ? chalk.green : chalk.yellow;
    console.log(color(`Completeness: ${results.completeness}%`));
  }
  
  console.log();
}

/**
 * Show verification results
 * @param {Object} results - Verification results
 */
export function showVerificationResults(results: any) {
  console.log();
  console.log(chalk.cyan('Verification Results:'));
  
  // Completeness
  const completenessColor = results.completeness >= 100 ? chalk.green : chalk.yellow;
  console.log(completenessColor(`  Completeness: ${results.completeness}%`));
  
  // Issues
  if (results.issues && results.issues.length > 0) {
    console.log();
    console.log(chalk.yellow('  Issues found:'));
    results.issues.forEach((issue: any) => {
      console.log(chalk.yellow(`    - ${issue}`));
    });
  }
  
  // Missing items
  if (results.missing && results.missing.length > 0) {
    console.log();
    console.log(chalk.yellow('  Missing items:'));
    results.missing.forEach((item: any) => {
      console.log(chalk.yellow(`    - ${item}`));
    });
  }
  
  console.log();
}

/**
 * Show debug summary
 * @param {Object} debugResult - Debug result
 */
export function showDebugSummary(debugResult: any) {
  console.log();
  console.log(chalk.cyan('Debug Analysis:'));
  
  if (debugResult.issueType) {
    console.log(chalk.gray(`  Type: ${debugResult.issueType}`));
  }
  
  if (debugResult.reportPath) {
    console.log(chalk.gray(`  Report: ${debugResult.reportPath}`));
  }
  
  if (debugResult.fixPlanPath) {
    console.log(chalk.gray(`  Fix Plan: ${debugResult.fixPlanPath}`));
  }
  
  console.log();
}

/**
 * Show section header
 * @param {string} title - Section title
 */
export function showSectionHeader(title: string) {
  console.log();
  console.log(chalk.blue.bold(`◆ ${title}`));
  console.log(chalk.blue('─'.repeat(60)));
}

/**
 * Show section footer
 */
export function showSectionFooter() {
  console.log(chalk.blue('─'.repeat(60)));
}

/**
 * Show info message
 * @param {string} message - Message to display
 */
export function showInfo(message: string) {
  console.log(chalk.blue(`ℹ ${message}`));
}

/**
 * Show success message
 * @param {string} message - Message to display
 */
export function showSuccess(message: string) {
  console.log(chalk.green(`✓ ${message}`));
}

/**
 * Show error message
 * @param {string} message - Message to display
 */
export function showError(message: string) {
  console.log(chalk.red(`✗ ${message}`));
}

/**
 * Show warning message
 * @param {string} message - Message to display
 */
export function showWarning(message: string) {
  console.log(chalk.yellow(`⚠️  ${message}`));
}

/**
 * Show a box with message
 * @param {string} message - Message to display
 * @param {string} type - Box type: 'success', 'error', 'warning', 'info'
 */
export function showBox(message: string, type = 'info') {
  const colors = {
    success: chalk.green,
    error: chalk.red,
    warning: chalk.yellow,
    info: chalk.blue
  };
  
  const color = (colors as Record<string, typeof chalk.blue>)[type] || chalk.blue;
  const width = 60;
  const padding = Math.max(0, width - message.length - 2);
  const leftPad = Math.floor(padding / 2);
  const rightPad = padding - leftPad;
  
  console.log();
  console.log(color('╔' + '═'.repeat(width) + '╗'));
  console.log(color('║' + ' '.repeat(leftPad) + message + ' '.repeat(rightPad) + '║'));
  console.log(color('╚' + '═'.repeat(width) + '╝'));
  console.log();
}

/**
 * Show a list of items
 * @param {Array<string>} items - Items to display
 * @param {string} bullet - Bullet character
 */
export function showList(items: string[], bullet = '•') {
  items.forEach(item => {
    console.log(`   ${bullet} ${item}`);
  });
}

/**
 * Show a table
 * @param {Array<Array<string>>} rows - Table rows (including header)
 * @param {Array<number>} columnWidths - Width for each column
 */
export function showTable(rows: string[][], columnWidths: number[]) {
  rows.forEach((row, index) => {
    const cells = row.map((cell, i) => {
      const width = columnWidths[i] || 20;
      return String(cell).padEnd(width);
    });
    
    if (index === 0) {
      // Header
      console.log(chalk.cyan(cells.join(' │ ')));
      console.log(chalk.cyan('─'.repeat(cells.join(' │ ').length)));
    } else {
      console.log(chalk.gray(cells.join(' │ ')));
    }
  });
}

/**
 * Clear current line
 */
export function clearLine() {
  process.stdout.write('\r');
  (process.stdout.clearLine as any)();
}

/**
 * Move cursor up
 * @param {number} lines - Number of lines to move up
 */
export function moveCursorUp(lines = 1) {
  process.stdout.write(`\x1b[${lines}A`);
}

/**
 * Move cursor down
 * @param {number} lines - Number of lines to move down
 */
export function moveCursorDown(lines = 1) {
  process.stdout.write(`\x1b[${lines}B`);
}
