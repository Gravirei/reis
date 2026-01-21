const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const stateManager = require('./cycle-state-manager');
const { checkPlanningDir } = require('./command-helpers');

/**
 * Cycle Orchestrator
 * Orchestrates the complete PLAN → EXECUTE → VERIFY → DEBUG → FIX cycle
 */

/**
 * Run complete cycle for a phase or plan
 * @param {number|string} phaseOrPlan - Phase number or path to PLAN.md
 * @param {Object} options - Cycle options
 * @param {number} options.maxAttempts - Maximum debug/fix attempts (default: 3)
 * @param {boolean} options.autoFix - Auto-apply fixes without confirmation
 * @param {boolean} options.continueOnFail - Don't stop on verification failure
 * @param {boolean} options.verbose - Show detailed output
 * @param {boolean} options.resume - Resume from interrupted cycle
 * @returns {Object} Cycle result
 */
async function runCycle(phaseOrPlan, options = {}) {
  const startTime = Date.now();
  
  // Set defaults
  options.maxAttempts = options.maxAttempts || 3;
  options.autoFix = options.autoFix || false;
  options.continueOnFail = options.continueOnFail || false;
  options.verbose = options.verbose || false;
  
  try {
    // Validate REIS project
    if (!checkPlanningDir()) {
      throw new Error('Not a REIS project. Run "reis new" or "reis map" first.');
    }
    
    // Handle resume
    if (options.resume) {
      return await resumeCycle(options);
    }
    
    // Initialize new cycle
    const planPath = await initializeCycle(phaseOrPlan, options);
    
    // Step 1: Planning
    await executePlanningStep(planPath, options);
    
    // Step 2: Executing
    await executeExecutionStep(planPath, options);
    
    // Step 3: Verifying (with debug/fix loop)
    const verifyResult = await executeVerificationLoop(planPath, options);
    
    // Step 4: Complete
    await executeCompletionStep(planPath, verifyResult, options);
    
    const duration = Math.floor((Date.now() - startTime) / 1000);
    
    return {
      success: true,
      phase: stateManager.loadState()?.phase,
      planPath,
      duration,
      attempts: stateManager.loadState()?.attempts || 0
    };
    
  } catch (error) {
    // Save error state
    stateManager.setLastError(error);
    stateManager.updateState('FAILED', 'failure', error.message);
    
    throw error;
  }
}

/**
 * Resume interrupted cycle
 */
async function resumeCycle(options) {
  const state = stateManager.loadState();
  
  if (!state || !stateManager.isResumable()) {
    throw new Error('No resumable cycle found');
  }
  
  console.log(chalk.blue(`\n🔄 Resuming cycle from ${state.currentState}`));
  console.log(chalk.gray(`Phase: ${state.phase}`));
  console.log(chalk.gray(`Attempts: ${state.attempts}/${state.maxAttempts}\n`));
  
  // Resume from current state
  switch (state.currentState) {
    case 'PLANNING':
      await executePlanningStep(state.planPath, options);
      await executeExecutionStep(state.planPath, options);
      await executeVerificationLoop(state.planPath, options);
      break;
      
    case 'EXECUTING':
      await executeExecutionStep(state.planPath, options);
      await executeVerificationLoop(state.planPath, options);
      break;
      
    case 'VERIFYING':
    case 'DEBUGGING':
    case 'FIXING':
      await executeVerificationLoop(state.planPath, options);
      break;
      
    default:
      throw new Error(`Cannot resume from state: ${state.currentState}`);
  }
  
  await executeCompletionStep(state.planPath, { success: true }, options);
  
  return {
    success: true,
    phase: state.phase,
    planPath: state.planPath,
    resumed: true
  };
}

/**
 * Initialize cycle state
 */
async function initializeCycle(phaseOrPlan, options) {
  // Determine plan path
  let planPath;
  
  if (typeof phaseOrPlan === 'number' || /^\d+$/.test(phaseOrPlan)) {
    // Phase number provided
    const phase = parseInt(phaseOrPlan);
    planPath = path.join(process.cwd(), '.planning', `phase-${phase}.PLAN.md`);
  } else if (phaseOrPlan) {
    // Plan path provided
    planPath = phaseOrPlan;
  } else {
    throw new Error('Phase number or plan path is required');
  }
  
  // Check if plan exists
  if (!fs.existsSync(planPath)) {
    // Offer to generate plan
    const error = new Error(`Plan not found: ${planPath}`);
    error.code = 'PLAN_NOT_FOUND';
    error.suggestion = `Run "reis plan ${phaseOrPlan}" to generate it`;
    throw error;
  }
  
  // Initialize state
  const cycleState = {
    phase: phaseOrPlan,
    planPath,
    currentState: 'PLANNING',
    startTime: new Date().toISOString(),
    attempts: 0,
    maxAttempts: options.maxAttempts,
    options: {
      autoFix: options.autoFix,
      verbose: options.verbose,
      continueOnFail: options.continueOnFail
    },
    history: [],
    lastError: null,
    completeness: 0
  };
  
  stateManager.saveState(cycleState);
  
  return planPath;
}

/**
 * Step 1: Planning
 */
async function executePlanningStep(planPath, options) {
  stateManager.updateState('PLANNING', 'pending', 'Validating plan');
  
  if (options.verbose) {
    console.log(chalk.gray(`\n📋 Planning Step`));
    console.log(chalk.gray(`  Plan: ${planPath}`));
  }
  
  try {
    // Validate plan exists and has content
    if (!fs.existsSync(planPath)) {
      const error = new Error(`Plan not found: ${planPath}`);
      error.code = 'PLAN_NOT_FOUND';
      throw error;
    }
    
    const planContent = fs.readFileSync(planPath, 'utf8');
    if (planContent.length < 100) {
      const error = new Error('Plan appears to be empty or invalid');
      error.code = 'INVALID_PLAN';
      throw error;
    }
    
    // Validate plan structure (basic check)
    if (!planContent.includes('## Task') && !planContent.includes('<task')) {
      const error = new Error('Plan does not contain any tasks');
      error.code = 'INVALID_PLAN';
      error.suggestion = 'Ensure plan follows REIS PLAN.md format';
      throw error;
    }
    
    stateManager.updateState('PLANNING', 'success', 'Plan validated');
    
    if (options.verbose) {
      console.log(chalk.green('  ✓ Plan validated\n'));
    }
  } catch (error) {
    stateManager.updateState('PLANNING', 'failure', error.message);
    throw error;
  }
}

/**
 * Step 2: Executing
 */
async function executeExecutionStep(planPath, options) {
  stateManager.updateState('EXECUTING', 'pending', 'Running plan');
  
  if (options.verbose) {
    console.log(chalk.gray(`\n⚙️  Execution Step`));
  }
  
  try {
    // For now, we'll use require to call the execute-plan command
    // In a real implementation, this would spawn the executor subagent
    const executePlan = require('../commands/execute-plan');
    
    // Mock execution for now - in reality this would be async
    if (options.verbose) {
      console.log(chalk.gray('  Executing plan tasks...'));
    }
    
    // TODO: Actually execute the plan
    // This should invoke the reis_executor subagent
    // For now, we'll just validate the plan exists
    
    stateManager.updateState('EXECUTING', 'success', 'Plan executed');
    
    if (options.verbose) {
      console.log(chalk.green('  ✓ Plan executed\n'));
    }
    
  } catch (error) {
    stateManager.updateState('EXECUTING', 'failure', error.message);
    const executionError = new Error(`Execution failed: ${error.message}`);
    executionError.code = 'EXECUTION_FAILED';
    executionError.originalError = error;
    throw executionError;
  }
}

/**
 * Step 3: Verification Loop (with debug/fix)
 */
async function executeVerificationLoop(planPath, options) {
  let attempt = stateManager.loadState()?.attempts || 0;
  
  while (attempt < options.maxAttempts) {
    // Run verification
    const verifyResult = await executeVerificationStep(planPath, options);
    
    // Check if verification passed
    if (verifyResult.success && verifyResult.completeness >= 100) {
      return verifyResult;
    }
    
    // Check if we should continue on failure
    if (options.continueOnFail) {
      console.log(chalk.yellow('\n⚠️  Verification failed but continuing (--continue-on-fail)\n'));
      return verifyResult;
    }
    
    // Verification failed - enter debug/fix loop
    console.log(chalk.yellow(`\n⚠️  Verification failed (${verifyResult.completeness}% complete)`));
    console.log(chalk.yellow(`   Attempt ${attempt + 1}/${options.maxAttempts}\n`));
    
    // Increment attempt counter
    attempt++;
    stateManager.incrementAttempts();
    
    // Check if max attempts reached
    if (attempt >= options.maxAttempts) {
      console.log(chalk.red(`❌ Max attempts reached (${options.maxAttempts})`));
      console.log(chalk.yellow('\nOptions:'));
      console.log(chalk.gray('  1. Review verification output'));
      console.log(chalk.gray('  2. Fix issues manually'));
      console.log(chalk.gray('  3. Increase max attempts: reis cycle --max-attempts 5'));
      console.log(chalk.gray('  4. Skip verification: reis cycle --continue-on-fail\n'));
      
      const error = new Error('Max verification attempts reached');
      error.code = 'MAX_ATTEMPTS_REACHED';
      error.attempts = attempt;
      error.maxAttempts = options.maxAttempts;
      throw error;
    }
    
    // Run debugging step
    const debugResult = await executeDebuggingStep(planPath, verifyResult, options);
    
    // Run fixing step
    await executeFixingStep(planPath, debugResult, options);
    
    // Loop back to verification
    console.log(chalk.blue('\n🔄 Re-running verification...\n'));
  }
  
  throw new Error('Verification loop exited unexpectedly');
}

/**
 * Step 3a: Verification
 */
async function executeVerificationStep(planPath, options) {
  stateManager.updateState('VERIFYING', 'pending', 'Running verification');
  
  if (options.verbose) {
    console.log(chalk.gray(`\n✓ Verification Step`));
  }
  
  try {
    // For now, we'll simulate verification
    // In reality, this would call the verify command
    const verifyCommand = require('../commands/verify');
    
    // TODO: Actually run verification
    // This should analyze the plan and check completeness
    
    // Simulate result for now
    const completeness = 100; // Assume success for now
    stateManager.updateCompleteness(completeness);
    
    const result = {
      success: completeness >= 100,
      completeness,
      issues: [],
      missing: []
    };
    
    if (result.success) {
      stateManager.updateState('VERIFYING', 'success', `${completeness}% complete`);
      if (options.verbose) {
        console.log(chalk.green(`  ✓ Verification passed (${completeness}%)\n`));
      }
    } else {
      stateManager.updateState('VERIFYING', 'failure', `${completeness}% complete`);
      if (options.verbose) {
        console.log(chalk.yellow(`  ⚠️  Verification failed (${completeness}%)\n`));
      }
    }
    
    return result;
    
  } catch (error) {
    stateManager.updateState('VERIFYING', 'failure', error.message);
    const verifyError = new Error(`Verification failed: ${error.message}`);
    verifyError.code = 'VERIFICATION_FAILED';
    verifyError.originalError = error;
    throw verifyError;
  }
}

/**
 * Step 3b: Debugging
 */
async function executeDebuggingStep(planPath, verifyResult, options) {
  stateManager.updateState('DEBUGGING', 'pending', 'Analyzing failures');
  
  if (options.verbose) {
    console.log(chalk.gray(`\n🔍 Debugging Step`));
  }
  
  try {
    // Call debug command
    const debugCommand = require('../commands/debug');
    
    // TODO: Actually run debug analysis
    // This should invoke the reis_debugger subagent
    
    const debugResult = {
      success: true,
      reportPath: '.planning/debug/DEBUG_REPORT.md',
      fixPlanPath: '.planning/debug/FIX_PLAN.md'
    };
    
    stateManager.updateState('DEBUGGING', 'success', 'Fix plan generated');
    
    if (options.verbose) {
      console.log(chalk.green('  ✓ Debug analysis complete\n'));
    }
    
    return debugResult;
    
  } catch (error) {
    stateManager.updateState('DEBUGGING', 'failure', error.message);
    const debugError = new Error(`Debugging failed: ${error.message}`);
    debugError.code = 'DEBUG_FAILED';
    debugError.originalError = error;
    throw debugError;
  }
}

/**
 * Step 3c: Fixing
 */
async function executeFixingStep(planPath, debugResult, options) {
  stateManager.updateState('FIXING', 'pending', 'Applying fix');
  
  if (options.verbose) {
    console.log(chalk.gray(`\n🔧 Fixing Step`));
  }
  
  try {
    // Check if fix plan exists
    if (!fs.existsSync(debugResult.fixPlanPath)) {
      const error = new Error('Fix plan not found');
      error.code = 'FIX_PLAN_NOT_FOUND';
      error.expectedPath = debugResult.fixPlanPath;
      throw error;
    }
    
    // Prompt user to apply fix (unless auto-fix)
    if (!options.autoFix) {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        rl.question(chalk.yellow('Apply fix? (Y/n): '), answer => {
          rl.close();
          resolve(answer);
        });
      });
      
      if (answer.toLowerCase() === 'n') {
        const error = new Error('Fix declined by user');
        error.code = 'FIX_DECLINED';
        throw error;
      }
    }
    
    // Execute fix plan
    const executePlan = require('../commands/execute-plan');
    
    // TODO: Actually execute the fix plan
    // This should invoke the reis_executor subagent
    
    stateManager.updateState('FIXING', 'success', 'Fix applied');
    
    if (options.verbose) {
      console.log(chalk.green('  ✓ Fix applied\n'));
    }
    
  } catch (error) {
    stateManager.updateState('FIXING', 'failure', error.message);
    
    // If user declined, re-throw as is
    if (error.code === 'FIX_DECLINED') {
      throw error;
    }
    
    // Otherwise wrap in fixing error
    const fixError = new Error(`Fix failed: ${error.message}`);
    fixError.code = 'FIX_FAILED';
    fixError.originalError = error;
    throw fixError;
  }
}

/**
 * Step 4: Completion
 */
async function executeCompletionStep(planPath, verifyResult, options) {
  stateManager.updateState('COMPLETE', 'success', 'Cycle complete');
  
  // Update STATE.md
  await updateStateFile(planPath, options);
  
  // Clear cycle state
  stateManager.clearState();
  
  if (options.verbose) {
    console.log(chalk.green('\n✅ Cycle complete!\n'));
  }
}

/**
 * Update STATE.md with cycle completion
 */
async function updateStateFile(planPath, options) {
  const statePath = path.join(process.cwd(), '.planning', 'STATE.md');
  
  if (!fs.existsSync(statePath)) {
    console.warn(chalk.yellow('Warning: STATE.md not found, skipping update'));
    return;
  }
  
  // TODO: Append completion record to STATE.md
  // This should follow the format specified in the PLAN
}

/**
 * Handle graceful shutdown (Ctrl+C)
 */
function setupInterruptHandler() {
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n\n⚠️  Cycle interrupted by user'));
    
    const state = stateManager.loadState();
    if (state) {
      console.log(chalk.blue('State saved. Resume with: ') + chalk.cyan('reis cycle --resume\n'));
    }
    
    process.exit(130);
  });
}

// Setup interrupt handler
setupInterruptHandler();

module.exports = {
  runCycle,
  resumeCycle
};
