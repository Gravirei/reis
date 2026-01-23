const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { showError, checkPlanningDir, validatePhaseNumber } = require('../utils/command-helpers');
const { invokeSubagent, SubagentInvoker, buildExecutionContext } = require('../utils/subagent-invoker');
const { showKanbanBoard } = require('../utils/kanban-renderer');

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
  
  // Dry run mode - just show what would happen
  if (options.dryRun) {
    console.log(chalk.yellow('\n--dry-run mode: Showing prompt that would be sent\n'));
    const ctx = buildExecutionContext('reis_executor', { planPath });
    console.log(chalk.gray('─'.repeat(60)));
    console.log(ctx.buildPrompt().substring(0, 2000) + '...');
    console.log(chalk.gray('─'.repeat(60)));
    return 0;
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

module.exports = execute;
