const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { showError, checkPlanningDir, validatePhaseNumber } = require('../utils/command-helpers');
const { invokeSubagent, SubagentInvoker, buildExecutionContext } = require('../utils/subagent-invoker');
const { showKanbanBoard, updateExecutorStatus } = require('../utils/kanban-renderer');
const { DependencyParser } = require('../utils/dependency-parser');
const { ParallelWaveScheduler } = require('../utils/parallel-wave-scheduler');
const { ExecutionCoordinator } = require('../utils/execution-coordinator');

/**
 * Execute command - Runs reis_executor subagent
 * @param {Object} args - Command arguments
 * @param {Object} options - Command options
 */
async function execute(args, options = {}) {
  // Show kanban board (unless disabled)
  showKanbanBoard({ noKanban: options?.noKanban });
  // Check if .planning/ exists
  if (!checkPlanningDir()) {
    showError('Not a REIS project. Run "reis new" or "reis map" first.');
    process.exit(1);
  }
  
  // Validate phase argument
  const phase = args.phase;
  if (!phase) {
    showError('Phase number is required. Usage: reis execute <phase>');
    process.exit(1);
  }
  
  const validatedPhase = validatePhaseNumber(phase);
  if (validatedPhase === null) {
    process.exit(1);
  }
  
  // Find plan file(s) for this phase
  const planPath = findPlanPath(validatedPhase);
  if (!planPath) {
    showError(`No plan found for phase ${validatedPhase}. Run "reis plan ${validatedPhase}" first.`);
    process.exit(1);
  }
  
  console.log(chalk.blue(`\n⚙️  REIS Executor - Phase ${validatedPhase}\n`));
  console.log(chalk.gray(`Plan: ${planPath}`));
  
  // Parse parallel execution options
  const parallelEnabled = options.parallel || false;
  const maxConcurrent = parseInt(options.maxConcurrent, 10) || 4;
  const conflictStrategy = options.conflictStrategy || 'fail';
  const showGraph = options.showGraph || false;
  
  // Validate conflict strategy
  const validStrategies = ['fail', 'queue', 'branch', 'merge'];
  if (!validStrategies.includes(conflictStrategy)) {
    showError(`Invalid conflict strategy: ${conflictStrategy}. Valid options: ${validStrategies.join(', ')}`);
    process.exit(1);
  }
  
  // Show dependency graph if requested
  if (showGraph) {
    await displayDependencyGraph(planPath);
  }
  
  // Dry run mode - show what would happen
  if (options.dryRun) {
    if (parallelEnabled) {
      console.log(chalk.yellow('\n--dry-run mode: Showing parallel execution plan\n'));
      await displayParallelExecutionPlan(planPath, maxConcurrent, conflictStrategy);
    } else {
      console.log(chalk.yellow('\n--dry-run mode: Showing prompt that would be sent\n'));
      const ctx = buildExecutionContext('reis_executor', { planPath });
      console.log(chalk.gray('─'.repeat(60)));
      console.log(ctx.buildPrompt().substring(0, 2000) + '...');
      console.log(chalk.gray('─'.repeat(60)));
    }
    return 0;
  }
  
  // Parallel execution mode
  if (parallelEnabled) {
    return await executeParallel(planPath, validatedPhase, {
      maxConcurrent,
      conflictStrategy,
      verbose: options.verbose,
      timeout: options.timeout,
      autoCommit: options.commit !== false
    });
  }
  
  // Real execution mode
  console.log(chalk.blue('\n🚀 Starting execution...\n'));
  
  const invoker = new SubagentInvoker({ verbose: options.verbose });
  
  // Set up progress display
  invoker.on('start', () => {
    console.log(chalk.gray('  Initializing executor...'));
  });
  
  invoker.on('progress', (data) => {
    console.log(chalk.gray(`  ${data.message}`));
  });
  
  invoker.on('artifact', (data) => {
    console.log(chalk.green(`  ✓ Created: ${data.path}`));
  });
  
  try {
    const result = await invokeSubagent('reis_executor', {
      planPath,
      verbose: options.verbose,
      timeout: options.timeout || 600000,
      additionalContext: {
        phase: validatedPhase,
        autoCommit: options.commit !== false
      }
    });
    
    if (result.success) {
      console.log(chalk.green('\n✅ Execution complete!\n'));
      
      if (result.metadata?.artifacts?.length > 0) {
        console.log(chalk.cyan('Artifacts created:'));
        result.metadata.artifacts.forEach(a => {
          console.log(chalk.gray(`  - ${a}`));
        });
      }
      
      console.log(chalk.blue('\nNext step: ') + chalk.cyan(`reis verify ${validatedPhase}`));
      return 0;
    } else {
      console.log(chalk.red('\n❌ Execution failed\n'));
      if (result.error) {
        console.log(chalk.red(`Error: ${result.error.message}`));
      }
      console.log(chalk.yellow('\nTry: reis debug to analyze the failure'));
      return 1;
    }
  } catch (error) {
    console.error(chalk.red(`\n❌ Execution error: ${error.message}`));
    if (options.verbose) {
      console.error(error.stack);
    }
    return 1;
  }
}

/**
 * Find plan file for a phase
 */
function findPlanPath(phase) {
  const planningDir = path.join(process.cwd(), '.planning');
  
  // Try phase-N.PLAN.md
  const directPath = path.join(planningDir, `phase-${phase}.PLAN.md`);
  if (fs.existsSync(directPath)) {
    return directPath;
  }
  
  // Try phases/N-*/PLAN.md
  const phasesDir = path.join(planningDir, 'phases');
  if (fs.existsSync(phasesDir)) {
    const dirs = fs.readdirSync(phasesDir).filter(d => d.startsWith(`${phase}-`));
    if (dirs.length > 0) {
      const phaseDir = path.join(phasesDir, dirs[0]);
      const plans = fs.readdirSync(phaseDir).filter(f => f.endsWith('.PLAN.md'));
      if (plans.length > 0) {
        return path.join(phaseDir, plans[0]);
      }
    }
  }
  
  // Try N-*/PLAN.md directly in .planning
  const dirs = fs.readdirSync(planningDir).filter(d => d.startsWith(`${phase}-`));
  if (dirs.length > 0) {
    const phaseDir = path.join(planningDir, dirs[0]);
    if (fs.statSync(phaseDir).isDirectory()) {
      const plans = fs.readdirSync(phaseDir).filter(f => f.endsWith('.PLAN.md'));
      if (plans.length > 0) {
        return path.join(phaseDir, plans[0]);
      }
    }
  }
  
  // Try priority-*/phase-N-* pattern (for priority folders)
  const priorityDirs = fs.readdirSync(planningDir).filter(d => d.startsWith('priority-'));
  for (const priorityDir of priorityDirs) {
    const priorityPath = path.join(planningDir, priorityDir);
    if (fs.statSync(priorityPath).isDirectory()) {
      const phaseDirs = fs.readdirSync(priorityPath).filter(d => 
        d.startsWith(`phase-${phase}-`) || d.startsWith(`${phase}-`)
      );
      if (phaseDirs.length > 0) {
        const phaseDir = path.join(priorityPath, phaseDirs[0]);
        const plans = fs.readdirSync(phaseDir).filter(f => f.endsWith('.PLAN.md'));
        if (plans.length > 0) {
          return path.join(phaseDir, plans[0]);
        }
      }
    }
  }
  
  return null;
}

/**
 * Display dependency graph for the plan
 * @param {string} planPath - Path to plan file
 */
async function displayDependencyGraph(planPath) {
  console.log(chalk.cyan('\n📊 Wave Dependency Graph\n'));
  
  try {
    const parser = new DependencyParser();
    const parsed = parser.parseFile(planPath);
    const graph = parser.buildGraph(parsed);
    
    if (!parsed.waves || parsed.waves.length === 0) {
      console.log(chalk.gray('  No waves found in plan'));
      return;
    }
    
    // Build ASCII dependency graph
    const waves = parsed.waves;
    const depMap = new Map();
    
    // Collect dependencies
    waves.forEach(wave => {
      depMap.set(wave.id, wave.dependencies || []);
    });
    
    // Find waves with no dependencies (roots)
    const roots = waves.filter(w => !w.dependencies || w.dependencies.length === 0);
    const nonRoots = waves.filter(w => w.dependencies && w.dependencies.length > 0);
    
    // Display graph
    console.log(chalk.white('  Dependencies:'));
    console.log(chalk.gray('  ' + '─'.repeat(50)));
    
    if (roots.length > 0) {
      console.log(chalk.green(`  Root waves (no dependencies): ${roots.map(w => w.id).join(', ')}`));
    }
    
    nonRoots.forEach(wave => {
      const deps = wave.dependencies.join(', ');
      console.log(chalk.white(`  ${wave.id} ← depends on → ${deps}`));
    });
    
    // Show parallel groups if any
    const groups = new Map();
    waves.forEach(wave => {
      if (wave.parallelGroup) {
        if (!groups.has(wave.parallelGroup)) {
          groups.set(wave.parallelGroup, []);
        }
        groups.get(wave.parallelGroup).push(wave.id);
      }
    });
    
    if (groups.size > 0) {
      console.log(chalk.gray('\n  ' + '─'.repeat(50)));
      console.log(chalk.cyan('  Parallel Groups:'));
      groups.forEach((waveIds, groupName) => {
        console.log(chalk.white(`    ${groupName}: [${waveIds.join(', ')}]`));
      });
    }
    
    console.log(chalk.gray('  ' + '─'.repeat(50)));
    console.log('');
    
  } catch (error) {
    console.log(chalk.yellow(`  Could not parse dependencies: ${error.message}`));
    console.log('');
  }
}

/**
 * Display parallel execution plan (dry-run with --parallel)
 * @param {string} planPath - Path to plan file
 * @param {number} maxConcurrent - Max concurrent waves
 * @param {string} conflictStrategy - Conflict resolution strategy
 */
async function displayParallelExecutionPlan(planPath, maxConcurrent, conflictStrategy) {
  console.log(chalk.cyan('📋 Parallel Execution Plan\n'));
  console.log(chalk.gray(`  Max Concurrent: ${maxConcurrent}`));
  console.log(chalk.gray(`  Conflict Strategy: ${conflictStrategy}`));
  console.log(chalk.gray('  ' + '─'.repeat(50)));
  
  try {
    const parser = new DependencyParser();
    const parsed = parser.parseFile(planPath);
    const graph = parser.buildGraph(parsed);
    
    if (!parsed.waves || parsed.waves.length === 0) {
      console.log(chalk.gray('\n  No waves found in plan'));
      return;
    }
    
    // Create scheduler and get execution batches
    const scheduler = new ParallelWaveScheduler({ maxConcurrent });
    scheduler.initialize(graph);
    
    const batches = [];
    let batchNum = 0;
    
    // Simulate execution to get batches
    while (!scheduler.isComplete()) {
      const batch = scheduler.getNextBatch();
      if (batch.length === 0) break;
      
      batchNum++;
      batches.push({ number: batchNum, waves: batch });
      
      // Mark as completed for next iteration
      batch.forEach(waveId => {
        scheduler.startWave(waveId);
        scheduler.completeWave(waveId);
      });
    }
    
    // Display execution plan
    console.log(chalk.white('\n  Execution Batches:\n'));
    
    let sequentialTime = 0;
    let parallelTime = 0;
    
    batches.forEach(batch => {
      const waveDetails = batch.waves.map(waveId => {
        const wave = parsed.waves.find(w => w.id === waveId);
        const size = wave?.size || 'medium';
        const timeEstimate = size === 'small' ? 2 : size === 'large' ? 10 : 5;
        sequentialTime += timeEstimate;
        return { id: waveId, time: timeEstimate };
      });
      
      const batchTime = Math.max(...waveDetails.map(w => w.time));
      parallelTime += batchTime;
      
      const waveList = waveDetails.map(w => `${w.id} (~${w.time}min)`).join(', ');
      console.log(chalk.green(`  Batch ${batch.number}: `) + chalk.white(`[${waveList}]`));
      console.log(chalk.gray(`           └─ ${batch.waves.length} waves in parallel, ~${batchTime} min`));
    });
    
    // Show time savings
    const savings = sequentialTime > 0 ? Math.round((1 - parallelTime / sequentialTime) * 100) : 0;
    console.log(chalk.gray('\n  ' + '─'.repeat(50)));
    console.log(chalk.cyan('  Time Estimate:'));
    console.log(chalk.white(`    Sequential: ~${sequentialTime} min`));
    console.log(chalk.white(`    Parallel:   ~${parallelTime} min`));
    console.log(chalk.green(`    Savings:    ${savings}% faster`));
    console.log('');
    
  } catch (error) {
    console.log(chalk.yellow(`  Could not generate plan: ${error.message}`));
    if (error.stack) {
      console.log(chalk.gray(error.stack));
    }
    console.log('');
  }
}

/**
 * Execute waves in parallel
 * @param {string} planPath - Path to plan file
 * @param {number} phase - Phase number
 * @param {Object} options - Execution options
 * @returns {number} Exit code
 */
async function executeParallel(planPath, phase, options = {}) {
  console.log(chalk.blue('\n🚀 Starting parallel execution...\n'));
  console.log(chalk.gray(`  Max concurrent waves: ${options.maxConcurrent}`));
  console.log(chalk.gray(`  Conflict strategy: ${options.conflictStrategy}`));
  console.log('');
  
  try {
    // Parse plan and build dependency graph
    const parser = new DependencyParser();
    const parsed = parser.parseFile(planPath);
    const graph = parser.buildGraph(parsed);
    
    if (!parsed.waves || parsed.waves.length === 0) {
      console.log(chalk.yellow('No waves found in plan. Falling back to sequential execution.'));
      return await executeSequential(planPath, phase, options);
    }
    
    // Create scheduler
    const scheduler = new ParallelWaveScheduler({
      maxConcurrent: options.maxConcurrent,
      strategy: 'dependency'
    });
    scheduler.initialize(graph);
    
    // Create wave executors
    const waveExecutors = new Map();
    parsed.waves.forEach(wave => {
      waveExecutors.set(wave.id, async () => {
        return await executeWave(wave, planPath, phase, options);
      });
    });
    
    // Create coordinator
    const coordinator = new ExecutionCoordinator({
      timeout: options.timeout || 600000,
      stopOnFirstFailure: options.conflictStrategy === 'fail',
      onWaveStart: ({ waveId }) => {
        console.log(chalk.blue(`  ▶ Starting ${waveId}...`));
        updateExecutorStatus(scheduler.running.size, parsed.waves.length);
      },
      onWaveComplete: ({ waveId }) => {
        console.log(chalk.green(`  ✓ Completed ${waveId}`));
        updateExecutorStatus(scheduler.running.size, parsed.waves.length);
      },
      onWaveError: ({ waveId, error }) => {
        console.log(chalk.red(`  ✗ Failed ${waveId}: ${error}`));
        updateExecutorStatus(scheduler.running.size, parsed.waves.length);
      },
      onBatchComplete: ({ batchNumber, batch }) => {
        console.log(chalk.cyan(`\n  📦 Batch ${batchNumber} complete (${batch.length} waves)\n`));
      }
    });
    
    coordinator.initialize(scheduler, waveExecutors);
    
    // Execute
    const result = await coordinator.executeAll();
    
    if (result.success) {
      console.log(chalk.green('\n✅ Parallel execution complete!\n'));
      console.log(chalk.gray(`  Duration: ${Math.round(result.duration / 1000)}s`));
      console.log(chalk.gray(`  Batches: ${result.batchesExecuted}`));
      console.log(chalk.gray(`  Waves: ${result.status.completed}/${result.status.total}`));
      console.log(chalk.blue('\nNext step: ') + chalk.cyan(`reis verify ${phase}`));
      return 0;
    } else {
      console.log(chalk.red('\n❌ Parallel execution failed\n'));
      console.log(chalk.gray(`  Completed: ${result.status.completed}/${result.status.total}`));
      console.log(chalk.gray(`  Failed: ${result.status.failed}`));
      console.log(chalk.yellow('\nTry: reis debug to analyze the failure'));
      return 1;
    }
    
  } catch (error) {
    console.error(chalk.red(`\n❌ Parallel execution error: ${error.message}`));
    if (options.verbose) {
      console.error(error.stack);
    }
    return 1;
  }
}

/**
 * Execute a single wave
 * @param {Object} wave - Wave data
 * @param {string} planPath - Path to plan file
 * @param {number} phase - Phase number
 * @param {Object} options - Execution options
 * @returns {Object} Execution result
 */
async function executeWave(wave, planPath, phase, options = {}) {
  const invoker = new SubagentInvoker({ verbose: options.verbose });
  
  try {
    const result = await invokeSubagent('reis_executor', {
      planPath,
      waveId: wave.id,
      verbose: options.verbose,
      timeout: options.timeout || 600000,
      additionalContext: {
        phase,
        wave: wave.number,
        waveName: wave.name,
        tasks: wave.tasks,
        autoCommit: options.autoCommit
      }
    });
    
    return result;
  } catch (error) {
    throw new Error(`Wave ${wave.id} failed: ${error.message}`);
  }
}

/**
 * Fallback sequential execution
 */
async function executeSequential(planPath, phase, options) {
  console.log(chalk.blue('\n🚀 Starting sequential execution...\n'));
  
  const invoker = new SubagentInvoker({ verbose: options.verbose });
  
  try {
    const result = await invokeSubagent('reis_executor', {
      planPath,
      verbose: options.verbose,
      timeout: options.timeout || 600000,
      additionalContext: {
        phase,
        autoCommit: options.autoCommit
      }
    });
    
    if (result.success) {
      console.log(chalk.green('\n✅ Execution complete!\n'));
      console.log(chalk.blue('Next step: ') + chalk.cyan(`reis verify ${phase}`));
      return 0;
    } else {
      console.log(chalk.red('\n❌ Execution failed\n'));
      console.log(chalk.yellow('\nTry: reis debug to analyze the failure'));
      return 1;
    }
  } catch (error) {
    console.error(chalk.red(`\n❌ Execution error: ${error.message}`));
    return 1;
  }
}

module.exports = execute;
