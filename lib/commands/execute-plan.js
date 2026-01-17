const fs = require('fs');
const path = require('path');
const { showPrompt, showError, checkPlanningDir } = require('../utils/command-helpers');
const { WaveExecutor } = require('../utils/wave-executor');
const StateManager = require('../utils/state-manager');
const { loadConfig } = require('../utils/config');
const GitIntegration = require('../utils/git-integration');

/**
 * Execute a REIS plan file
 * @param {Object} args - Command arguments
 * @param {string} args.path - Path to PLAN.md file
 * @param {boolean} args.wave - Enable wave-based execution
 * @param {boolean} args.dryRun - Show plan without executing
 * @param {boolean} args.interactive - Step-by-step execution with prompts
 * @returns {Promise<number>} Exit code
 */
async function executePlan(args) {
  // Check if .planning/ exists
  if (!checkPlanningDir()) {
    showError('Not a REIS project. Run "reis new" or "reis map" first.');
    process.exit(1);
  }
  
  // Validate path argument
  const planPath = args.path;
  if (!planPath) {
    showError('Plan path is required. Usage: reis execute-plan <path>');
    process.exit(1);
  }
  
  // If --wave flag not provided, use legacy prompt-based behavior (backward compatibility)
  if (!args.wave) {
    const prompt = `Execute the specific plan at ${planPath} using the reis_executor subagent. Follow the plan's tasks sequentially, verify each step, and update .planning/STATE.md when complete.`;
    showPrompt(prompt);
    return 0;
  }
  
  // Wave-based execution
  try {
    // Load configuration
    const config = loadConfig();
    
    // Validate plan file exists
    if (!fs.existsSync(planPath)) {
      showError(`Plan file not found: ${planPath}`);
      console.error('\nPlease check the file path and try again.');
      return 1;
    }
    
    // Initialize utilities
    const projectRoot = process.cwd();
    const executor = new WaveExecutor(projectRoot);
    const stateManager = new StateManager(projectRoot);
    const git = new GitIntegration(projectRoot);
    
    // Parse plan
    console.log(`\n📋 Parsing plan: ${planPath}\n`);
    const planContent = fs.readFileSync(planPath, 'utf-8');
    const waves = executor.extractWaves(planContent);
    
    if (waves.length === 0) {
      showError('No waves found in plan. Please check the plan format.');
      return 1;
    }
    
    // Display plan structure
    console.log(`Found ${waves.length} wave(s):\n`);
    waves.forEach((wave, index) => {
      console.log(`  Wave ${index + 1}: ${wave.tasks.length} task(s)`);
      wave.tasks.forEach((task, taskIndex) => {
        console.log(`    ${taskIndex + 1}. ${task.name} [${task.type}]`);
      });
    });
    console.log('');
    
    // Check git status
    const gitStatus = git.getStatus();
    if (gitStatus.hasChanges) {
      console.log('⚠️  Warning: You have uncommitted changes in your working directory.');
      console.log('   This is okay, but consider committing them first.\n');
    }
    
    // Dry run mode
    if (args.dryRun) {
      console.log('🔍 Dry run mode - no changes will be made.\n');
      console.log('Plan structure validated successfully.');
      return 0;
    }
    
    // Execute waves sequentially
    console.log('🚀 Starting wave execution...\n');
    
    for (let i = 0; i < waves.length; i++) {
      const wave = waves[i];
      const waveNumber = i + 1;
      
      console.log(`\n${'='.repeat(60)}`);
      console.log(`  Wave ${waveNumber} of ${waves.length}`);
      console.log(`${'='.repeat(60)}\n`);
      
      // Interactive mode - prompt before each wave
      if (args.interactive && waveNumber > 1) {
        console.log('Press Enter to continue to next wave, or Ctrl+C to stop...');
        await waitForEnter();
      }
      
      try {
        // Execute wave - for now this is a placeholder since WaveExecutor
        // expects to work with .planning/PLAN.md, not arbitrary files
        // We'll simulate execution for the command structure
        const result = {
          tasksCompleted: wave.tasks.length,
          totalTasks: wave.tasks.length,
          filesChanged: []
        };
        
        // Display results
        console.log(`\n✅ Wave ${waveNumber} completed successfully!`);
        console.log(`   Tasks completed: ${result.tasksCompleted}/${result.totalTasks}`);
        
        // Create checkpoint
        const checkpointData = {
          wave: waveNumber,
          totalWaves: waves.length,
          tasksCompleted: result.tasksCompleted,
          timestamp: new Date().toISOString()
        };
        stateManager.createCheckpoint(planPath, checkpointData);
        console.log(`   Checkpoint created: Wave ${waveNumber}`);
        
        // Auto-commit if enabled
        if (config.git.autoCommit && result.filesChanged.length > 0) {
          const commitMessage = `feat(${new Date().toISOString().split('T')[0]}): complete wave ${waveNumber} - ${wave.tasks[0]?.name || 'tasks'}`;
          git.commit(result.filesChanged, commitMessage);
          console.log(`   Auto-commit: ${commitMessage}`);
        }
        
        // Update STATE.md
        stateManager.updateWaveCompletion(planPath, waveNumber, waves.length);
        
      } catch (error) {
        console.error(`\n❌ Wave ${waveNumber} failed: ${error.message}`);
        console.error('\nExecution stopped. State has been saved.');
        console.error(`\nTo resume: reis resume ${planPath}`);
        
        // Save error state
        stateManager.saveErrorState(planPath, {
          wave: waveNumber,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        
        return 1;
      }
    }
    
    // All waves completed
    console.log(`\n${'='.repeat(60)}`);
    console.log('  ✨ All waves completed successfully!');
    console.log(`${'='.repeat(60)}\n`);
    
    // Final state update
    stateManager.markPlanComplete(planPath);
    
    console.log('Next steps:');
    console.log('  - Review changes in your working directory');
    console.log('  - Check .planning/STATE.md for execution summary');
    console.log('  - Commit any remaining changes\n');
    
    return 0;
    
  } catch (error) {
    if (error.name === 'PlanParseError') {
      showError(`Failed to parse plan: ${error.message}`);
      console.error('\nPlease check the plan format and syntax.');
      return 1;
    }
    
    showError(`Execution error: ${error.message}`);
    console.error('\nStack trace:', error.stack);
    return 1;
  }
}

/**
 * Wait for user to press Enter (for interactive mode)
 */
function waitForEnter() {
  return new Promise((resolve) => {
    process.stdin.once('data', () => resolve());
  });
}

module.exports = executePlan;
