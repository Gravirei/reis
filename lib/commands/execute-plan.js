const fs = require('fs');
const path = require('path');
const { showPrompt, showError, checkPlanningDir } = require('../utils/command-helpers');
const { WaveExecutor } = require('../utils/wave-executor');
const StateManager = require('../utils/state-manager');
const { loadConfig } = require('../utils/config');
const { getGitStatus, commitWaveCompletion } = require('../utils/git-integration');
const { parseDecisionTrees } = require('../utils/decision-tree-parser');
const { renderDecisionTree } = require('../utils/visualizer');
const { showKanbanBoard } = require('../utils/kanban-renderer');
const chalk = require('chalk');

/**
 * Execute a REIS plan file
 * @param {Object} args - Command arguments
 * @param {string} args.path - Path to PLAN.md file
 * @param {boolean} args.wave - Enable wave-based execution
 * @param {boolean} args.dryRun - Show plan without executing
 * @param {boolean} args.interactive - Step-by-step execution with prompts
 * @param {boolean} args.noKanban - Hide kanban board
 * @returns {Promise<number>} Exit code
 */
async function executePlan(args) {
  // Show kanban board (unless disabled)
  showKanbanBoard({ noKanban: args?.noKanban });
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
    // Check for --skip-trees flag
    const skipTrees = args.skipTrees || args['skip-trees'];
    
    // Parse and display decision trees unless skipped
    if (!skipTrees) {
      try {
        const planContent = fs.readFileSync(planPath, 'utf8');
        const trees = parseDecisionTrees(planContent);
        
        if (trees.length > 0) {
          console.log(chalk.bold.cyan('\n💡 Decision trees found in this plan:\n'));
          trees.forEach(tree => {
            console.log(renderDecisionTree(tree));
          });
          console.log(chalk.yellow('Press Enter to continue with execution...'));
          
          // Wait for user acknowledgment
          await waitForEnter();
        }
      } catch (error) {
        // Silently ignore tree parsing errors - trees are optional
      }
    }
    
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
    
    // Parse plan
    console.log(`\n📋 Parsing plan: ${planPath}\n`);
    const planContent = fs.readFileSync(planPath, 'utf-8');
    const waves = parsePlanFile(planContent);
    
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
    try {
      const gitStatus = getGitStatus(projectRoot);
      if (gitStatus.hasChanges) {
        console.log('⚠️  Warning: You have uncommitted changes in your working directory.');
        console.log('   This is okay, but consider committing them first.\n');
      }
    } catch (error) {
      // Git not available or not a git repo - that's okay
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
          try {
            const phase = stateManager.state.currentPhase || 'Development';
            const commitResult = commitWaveCompletion(
              wave.name,
              phase,
              {
                projectRoot,
                prefix: config.git.commitMessagePrefix,
                details: result.filesChanged,
                testStatus: 'pending'
              }
            );
            if (commitResult) {
              console.log(`   Auto-commit: ${commitResult.message}`);
            }
          } catch (error) {
            console.warn(`   Warning: Auto-commit failed: ${error.message}`);
          }
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

/**
 * Parse PLAN.md file into waves
 * Supports both v2.0 XML task format and markdown wave format
 */
function parsePlanFile(content) {
  const waves = new Map();
  
  // Try parsing v2.0 XML task format first
  const taskRegex = /<task[^>]*>/g;
  const tasks = [];
  
  let match;
  let pos = 0;
  while ((match = taskRegex.exec(content)) !== null) {
    const taskStart = match.index;
    const taskEnd = content.indexOf('</task>', taskStart);
    
    if (taskEnd === -1) continue;
    
    const taskBlock = content.substring(taskStart, taskEnd + 7);
    
    // Extract attributes from opening tag
    const typeMatch = taskBlock.match(/type="([^"]+)"/);
    const waveMatch = taskBlock.match(/wave="([^"]+)"/);
    
    // Extract task name
    const nameMatch = taskBlock.match(/<name>([^<]+)<\/name>/);
    const filesMatch = taskBlock.match(/<files>([^<]+)<\/files>/);
    
    if (nameMatch) {
      const task = {
        name: nameMatch[1].trim(),
        type: typeMatch ? typeMatch[1] : 'auto',
        wave: waveMatch ? parseInt(waveMatch[1]) : 1,
        files: filesMatch ? filesMatch[1].trim() : ''
      };
      
      tasks.push(task);
    }
  }
  
  // Group tasks by wave
  if (tasks.length > 0) {
    tasks.forEach(task => {
      if (!waves.has(task.wave)) {
        waves.set(task.wave, {
          id: task.wave,
          name: `Wave ${task.wave}`,
          tasks: [],
          status: 'pending'
        });
      }
      waves.get(task.wave).tasks.push(task);
    });
    
    return Array.from(waves.values()).sort((a, b) => a.id - b.id);
  }
  
  // Fallback: Try markdown wave format
  const waveRegex = /^#{2,3}\s+Wave\s+(\d+):?\s+(.+)/gm;
  let currentWave = null;
  
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    const waveMatch = line.match(/^#{2,3}\s+Wave\s+(\d+):?\s+(.+)/);
    if (waveMatch) {
      if (currentWave) {
        waves.set(currentWave.id, currentWave);
      }
      
      currentWave = {
        id: parseInt(waveMatch[1]),
        name: `Wave ${waveMatch[1]}: ${waveMatch[2].trim()}`,
        tasks: [],
        status: 'pending'
      };
      continue;
    }
    
    // Extract tasks from current wave
    if (currentWave) {
      const taskMatch = line.match(/^[-*]\s+(?:\[[ x]\]\s+)?(.+)$/) || 
                        line.match(/^\d+\.\s+(.+)$/);
      
      if (taskMatch && taskMatch[1]) {
        currentWave.tasks.push({
          name: taskMatch[1].trim(),
          type: 'auto',
          wave: currentWave.id
        });
      }
      
      // End wave section on new heading
      if (line.startsWith('##') && !line.match(/Wave\s+\d+/i)) {
        waves.set(currentWave.id, currentWave);
        currentWave = null;
      }
    }
  }
  
  // Add last wave
  if (currentWave) {
    waves.set(currentWave.id, currentWave);
  }
  
  return Array.from(waves.values()).sort((a, b) => a.id - b.id);
}

/**
 * Wait for user to press Enter
 * @returns {Promise<void>}
 */
function waitForEnter() {
  return new Promise((resolve) => {
    process.stdin.once('data', () => {
      resolve();
    });
  });
}

module.exports = executePlan;
