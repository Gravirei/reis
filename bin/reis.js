#!/usr/bin/env node

const { program } = require('commander');
const packageJson = require('../package.json');
const fs = require('fs');
const path = require('path');
const os = require('os');
const chalk = require('chalk');

// Show welcome banner (always, not just first run)
function showBanner() {
  console.log(chalk.white.bold(`
  ██████  ███████ ██ ███████
  ██   ██ ██      ██ ██     
  ██████  █████   ██ ███████
  ██   ██ ██      ██      ██
  ██   ██ ███████ ██ ███████
  `));
  
  console.log(chalk.blue.bold('  REIS - Roadmap Execution & Implementation System'));
  console.log(chalk.gray('  Specially designed for Atlassian Rovo Dev\n'));
  console.log(chalk.white(`  Version ${packageJson.version}\n`));
}

// Check if REIS is already installed
function checkExistingInstallation() {
  const reisDir = path.join(os.homedir(), '.rovodev', 'reis');
  
  if (fs.existsSync(reisDir)) {
    try {
      const files = fs.readdirSync(reisDir);
      // If directory has files (not just .first-run-done), it's installed
      const hasFiles = files.some(f => f !== '.first-run-done' && f !== '.installed');
      if (hasFiles) {
        return true;
      }
    } catch (err) {
      // Ignore
    }
  }
  
  return false;
}

// Show banner when no command is given (default action)
let shouldShowBanner = false;

// Command implementations - Core commands
const helpCmd = require('../lib/commands/help.js');
const versionCmd = require('../lib/commands/version.js');
const newCmd = require('../lib/commands/new.js');
const mapCmd = require('../lib/commands/map.js');
const requirementsCmd = require('../lib/commands/requirements.js');
const roadmapCmd = require('../lib/commands/roadmap.js');

// Command implementations - Phase Management commands
const planCmd = require('../lib/commands/plan.js');
const discussCmd = require('../lib/commands/discuss.js');
const researchCmd = require('../lib/commands/research.js');
const assumptionsCmd = require('../lib/commands/assumptions.js');
const executeCmd = require('../lib/commands/execute.js');
const executePlanCmd = require('../lib/commands/execute-plan.js');
const verifyCmd = require('../lib/commands/verify.js');

// Command implementations - Other commands
const progressCmd = require('../lib/commands/progress.js');
const pauseCmd = require('../lib/commands/pause.js');
const resumeCmd = require('../lib/commands/resume.js');
const checkpointCmd = require('../lib/commands/checkpoint.js');
const addCmd = require('../lib/commands/add.js');
const insertCmd = require('../lib/commands/insert.js');
const removeCmd = require('../lib/commands/remove.js');
const milestoneCmd = require('../lib/commands/milestone.js');
const todoCmd = require('../lib/commands/todo.js');
const todosCmd = require('../lib/commands/todos.js');
const debugCmd = require('../lib/commands/debug.js');
const configCmd = require('../lib/commands/config.js');
const cycleCmd = require('../lib/commands/cycle.js');
const decisionsCmd = require('../lib/commands/decisions.js');
const treeCmd = require('../lib/commands/tree.js');
const kanbanCmd = require('../lib/commands/kanban.js');
const { reviewCommand } = require('../lib/commands/review.js');

// Check for --help or -h flag before Commander parses
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  // If it's just "reis --help" or "reis -h" (no subcommand), show our custom help
  if (process.argv.length === 3) {
    helpCmd();
    process.exit(0);
  }
}

// Set up commander
program
  .name('reis')
  .version(packageJson.version, '-V, --version', 'output the current version')
  .description('REIS - Roadmap Execution & Implementation System')
  .usage('<command> [options]');

// Global option for kanban
program.option('--no-kanban', 'Hide kanban board for this command');

// Getting Started Commands
program
  .command('help')
  .description('Show comprehensive help with all commands')
  .action(() => helpCmd());

program
  .command('version')
  .description('Show version and install location')
  .action(() => versionCmd());

program
  .command('new [idea]')
  .description('Initialize a new REIS project')
  .action((idea) => newCmd({idea}));

program
  .command('map')
  .description('Analyze and map existing codebase')
  .action(() => mapCmd({}));

program
  .command('requirements')
  .description('Generate or update requirements document')
  .action(() => requirementsCmd({}));

program
  .command('roadmap')
  .description('Generate or update project roadmap')
  .action(() => roadmapCmd({}));

// Phase Management Commands
program
  .command('plan [phase]')
  .description('Create detailed plan for a phase')
  .action((phase, options, command) => {
    const globalOpts = command.parent?.opts() || {};
    planCmd({ phase }, { noKanban: globalOpts.kanban === false });
  });

program
  .command('discuss [phase]')
  .description('Discuss implementation approach for a phase')
  .action((phase) => discussCmd({phase}));

program
  .command('research [phase]')
  .description('Research technical solutions for a phase')
  .action((phase) => researchCmd({phase}));

program
  .command('assumptions [phase]')
  .description('Document and validate assumptions')
  .action((phase) => assumptionsCmd({phase}));

program
  .command('execute [phase]')
  .description('Execute a phase')
  .option('--parallel', 'Enable parallel wave execution')
  .option('--max-concurrent <n>', 'Maximum concurrent waves (default: 4)', '4')
  .option('--conflict-strategy <strategy>', 'Conflict resolution: fail|queue|branch|merge (default: fail)', 'fail')
  .option('--show-graph', 'Display dependency graph before execution')
  .option('--dry-run', 'Show execution plan without running')
  .option('-v, --verbose', 'Show detailed output')
  .option('--no-commit', 'Skip auto-commit')
  .option('--timeout <ms>', 'Execution timeout in milliseconds')
  .action(async (phase, options, command) => {
    const globalOpts = command.parent?.opts() || {};
    const exitCode = await executeCmd({ phase }, { ...options, noKanban: globalOpts.kanban === false });
    process.exit(exitCode);
  });

program
  .command('execute-plan <path>')
  .description('Execute a specific plan file')
  .option('--wave', 'Enable wave-based execution (v2.0 feature)')
  .option('--dry-run', 'Show plan structure without executing')
  .option('--interactive', 'Step-by-step execution with prompts between waves')
  .action(async (planPath, options, command) => {
    const globalOpts = command.parent?.opts() || {};
    await executePlanCmd({
      path: planPath,
      wave: options.wave,
      dryRun: options.dryRun,
      interactive: options.interactive,
      noKanban: globalOpts.kanban === false
    });
  });

program
  .command('verify <target>')
  .description('Verify execution results against success criteria (uses reis_verifier subagent)')
  .option('--dry-run', 'Show prompt without executing')
  .option('-v, --verbose', 'Show detailed verification output')
  .option('-s, --strict', 'Fail on warnings')
  .option('--with-gates', 'Run quality gates after verification')
  .option('--skip-gates', 'Skip gates even if configured')
  .option('--timeout <ms>', 'Verification timeout in milliseconds')
  .action(async (target, options, command) => {
    const globalOpts = command.parent?.opts() || {};
    await verifyCmd(target, { ...options, noKanban: globalOpts.kanban === false });
  });

// Review command
program
  .command('review [target]')
  .description('Review plans against codebase before execution')
  .option('--auto-fix', 'Automatically fix simple issues')
  .option('--strict', 'Fail on warnings')
  .option('--report [file]', 'Save review report to file')
  .option('-v, --verbose', 'Show detailed output')
  .action(async (target, options) => {
    await reviewCommand(target, options);
  });

// Progress Commands
program
  .command('progress')
  .description('Show current project progress')
  .action((options, command) => {
    const globalOpts = command.parent?.opts() || {};
    progressCmd({}, { noKanban: globalOpts.kanban === false });
  });

program
  .command('visualize')
  .description('Visualize project data (progress, waves, roadmap, metrics, dependencies, timeline)')
  .option('--type <type>', 'Visualization type: progress|waves|roadmap|metrics|dependencies|timeline', 'progress')
  .option('--dependencies', 'Show wave dependency graph')
  .option('--timeline', 'Show estimated execution timeline')
  .option('--format <fmt>', 'Output format: ascii|mermaid (for dependencies)', 'ascii')
  .option('--watch', 'Auto-refresh display')
  .option('--compact', 'Compact output')
  .option('--no-color', 'Disable colors')
  .action(async (options) => {
    const visualizeCmd = require('../lib/commands/visualize.js');
    const args = [];
    if (options.type) { args.push('--type', options.type); }
    if (options.dependencies) { args.push('--dependencies'); }
    if (options.timeline) { args.push('--timeline'); }
    if (options.format) { args.push('--format', options.format); }
    if (options.watch) { args.push('--watch'); }
    if (options.compact) { args.push('--compact'); }
    if (options.color === false) { args.push('--no-color'); }
    await visualizeCmd(args);
  });

// Quality Gates Commands
program
  .command('gate [subcommand]')
  .description('Run quality gates (security, quality, performance, accessibility)')
  .option('-v, --verbose', 'Show detailed output')
  .option('--format <format>', 'Output format: ascii|json|markdown', 'ascii')
  .option('--output <file>', 'Output file for report command')
  .action(async (subcommand, options) => {
    const { gateCommand } = require('../lib/commands/gate.js');
    await gateCommand(subcommand, options);
  });

program
  .command('pause')
  .description('Pause current work and save state')
  .action(() => pauseCmd({}));

program
  .command('resume')
  .description('Resume paused work')
  .action((options, command) => {
    const globalOpts = command.parent?.opts() || {};
    resumeCmd({}, { noKanban: globalOpts.kanban === false });
  });

// Checkpoint Management Commands
program
  .command('checkpoint [subcommand] [name]')
  .description('Manage checkpoints (create, list, show, delete)')
  .option('-c, --commit', 'Force git commit')
  .option('--no-commit', 'Skip git commit')
  .option('-m, --message <message>', 'Custom commit message')
  .action((subcommand, name, options, command) => {
    const globalOpts = command.parent?.opts() || {};
    checkpointCmd({ subcommand, name, ...options, noKanban: globalOpts.kanban === false });
  });

// Roadmap Management Commands
program
  .command('add <feature>')
  .description('Add feature to roadmap')
  .action((feature) => addCmd({feature}));

program
  .command('insert <phase> <feature>')
  .description('Insert feature at specific phase')
  .action((phase, feature) => insertCmd({phase, feature}));

program
  .command('remove <phase>')
  .description('Remove phase from roadmap')
  .action((phase) => removeCmd({phase}));

// Milestone Commands
program
  .command('milestone')
  .description('Manage milestones')
  .argument('<subcommand>', 'Subcommand: complete, discuss, or new')
  .argument('[name]', 'Milestone name (required for complete/new)')
  .action((subcommand, name) => milestoneCmd({subcommand, name}));

// Utility Commands
program
  .command('todo <description>')
  .description('Add a TODO item')
  .action((description) => todoCmd({description}));

program
  .command('todos [area]')
  .description('List TODO items')
  .action((area) => todosCmd({area}));

program
  .command('debug [target]')
  .description('Analyze failures and generate fix plans (uses reis_debugger subagent)')
  .option('--dry-run', 'Show prompt without executing')
  .option('-i, --input <path>', 'Path to DEBUG_INPUT.md or plan file')
  .option('-f, --focus <area>', 'Focus analysis on specific area')
  .option('-v, --verbose', 'Show detailed debug output')
  .option('--timeout <ms>', 'Debug timeout in milliseconds')
  .action(async (target, options, command) => {
    const globalOpts = command.parent?.opts() || {};
    await debugCmd(target, { ...options, noKanban: globalOpts.kanban === false });
  });

program
  .command('cycle [phase-or-plan]')
  .description('Complete PLAN → EXECUTE → VERIFY → GATE → DEBUG cycle')
  .option('--max-attempts <n>', 'Maximum debug/fix attempts', '3')
  .option('--auto-fix', 'Apply fixes without confirmation')
  .option('--resume', 'Resume interrupted cycle')
  .option('--continue-on-fail', 'Continue even if verification fails')
  .option('--skip-review', 'Skip plan review phase')
  .option('--skip-gates', 'Skip quality gates phase')
  .option('--gate-only <category>', 'Run only specific gate category (security|quality|performance|accessibility)')
  .option('-v, --verbose', 'Detailed output')
  .action(async (phaseOrPlan, options, command) => {
    const globalOpts = command.parent?.opts() || {};
    await cycleCmd(phaseOrPlan, { ...options, noKanban: globalOpts.kanban === false });
  });

program
  .command('config [subcommand]')
  .description('Manage REIS configuration (show, init, validate, docs)')
  .option('--json', 'Output as JSON (for show)')
  .option('-f, --force', 'Force overwrite (for init)')
  .option('--path <path>', 'Custom config path')
  .action((subcommand, options) => configCmd({ subcommand, ...options }));

// Decision Tree Commands
program
  .command('decisions [subcommand] [id]')
  .description('Manage decision tracking (list, show, revert, export, stats)')
  .option('--tree <treeId>', 'Filter by tree ID')
  .option('--phase <phase>', 'Filter by phase')
  .option('--limit <n>', 'Limit number of results')
  .option('--format <format>', 'Export format (json, csv)')
  .option('--output <path>', 'Output file path')
  .option('--reason <reason>', 'Reason for revert')
  .option('--no-color', 'Disable colors (screen reader friendly)')
  .option('--high-contrast', 'High contrast color scheme')
  .option('--ascii-only', 'Use ASCII characters only')
  .action(async (subcommand, id, options) => {
    const args = id ? [id] : [];
    await decisionsCmd(subcommand, args, options);
  });

program
  .command('tree [subcommand]')
  .description('Manage decision trees (show, new, list, validate, export, diff, lint)')
  .argument('[file-or-template]', 'File path or template name')
  .argument('[file2]', 'Second file path (for diff subcommand)')
  .option('--depth <n>', 'Maximum depth to display')
  .option('--no-metadata', 'Hide metadata badges')
  .option('--interactive', 'Interactive selection mode')
  .option('--context <json>', 'Context for condition evaluation (JSON string)')
  .option('--no-color', 'Disable colors (screen reader friendly)')
  .option('--high-contrast', 'High contrast color scheme')
  .option('--ascii-only', 'Use ASCII characters only (├─└─ becomes |-- `--)')
  .option('--format <format>', 'Export format (html, svg, mermaid, json, all)')
  .option('--output <path>', 'Output file path')
  .option('--verbose', 'Show detailed validation output')
  .option('--fix', 'Auto-fix issues (validate subcommand)')
  .option('--strict', 'Fail on warnings (lint subcommand)')
  .action(async (subcommand, fileOrTemplate, file2, options) => {
    const args = [];
    if (fileOrTemplate) args.push(fileOrTemplate);
    if (file2) args.push(file2);
    await treeCmd(subcommand, args, options);
  });

program
  .command('kanban [subcommand] [value]')
  .description('Manage kanban board settings')
  .action((subcommand, value) => {
    const args = [subcommand, value].filter(Boolean);
    kanbanCmd(args, {});
  });

const updateCmd = require('../lib/commands/update.js');
const whatsNewCmd = require('../lib/commands/whats-new.js');
const docsCmd = require('../lib/commands/docs.js');

program
  .command('update')
  .description('Update REIS to latest version')
  .action(async () => {
    await updateCmd({});
  });

program
  .command('whats-new')
  .description('Show what\'s new in latest version')
  .action(() => {
    whatsNewCmd({});
  });

program
  .command('docs')
  .description('Open REIS documentation')
  .action(() => {
    docsCmd({});
  });

program
  .command('uninstall')
  .description('Uninstall REIS')
  .action(async () => {
    const uninstallCmd = require('../lib/commands/uninstall');
    await uninstallCmd({});
  });

// Default action (no command)
program.action(async () => {
  // Show banner first
  showBanner();
  
  // Check if already installed
  const isInstalled = checkExistingInstallation();
  
  if (isInstalled) {
    console.log(chalk.yellow('  ⚠️  REIS is already installed at ~/.rovodev/reis/\n'));
    
    // Use inquirer for simple input prompt
    const inquirer = require('inquirer');
    try {
      const { reinstall } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'reinstall',
          message: 'Reinstall and replace existing files?',
          default: false
        }
      ]);
      
      console.log('');
      
      if (reinstall) {
        // Perform installation directly with overwrite
        const { performInstallation } = require('../lib/install.js');
        await performInstallation(true, true); // overwrite=true, silent=true
        
        console.log(chalk.green('  ✓ REIS reinstalled successfully'));
        console.log(chalk.gray('  Location: ~/.rovodev/reis/'));
        console.log(chalk.white(`  Open Atlassian Rovo Dev and run ${chalk.cyan('reis help')} to get started\n`));
      } else {
        console.log(chalk.cyan('  Keeping existing installation\n'));
        console.log(chalk.green('  ✓ Using existing documentation'));
        console.log(chalk.green('  ✓ Using existing templates'));
        console.log(chalk.green('  ✓ Using existing subagents'));
        console.log(chalk.green(`  ✓ Current VERSION (${packageJson.version})`));
        console.log(chalk.white(`\n  Open Atlassian Rovo Dev and run ${chalk.cyan('reis help')} to get started\n`));
      }
      
    } catch (err) {
      // If inquirer fails (non-interactive), just show help
      console.log(chalk.gray('  Non-interactive mode - showing help...\n'));
      const helpCmd = require('../lib/commands/help');
      helpCmd();
    }
  } else {
    // First-time installation
    console.log(chalk.green('  REIS is not installed yet.\n'));
    
    // Use inquirer for simple input prompt
    const inquirer = require('inquirer');
    try {
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Proceed with installation?',
          default: true
        }
      ]);
      
      console.log('');
      
      if (!confirm) {
        console.log(chalk.yellow('  Installation cancelled\n'));
        return;
      }
      
      // Perform installation directly
      const { performInstallation } = require('../lib/install.js');
      await performInstallation(false, true); // overwrite=false, silent=true
      
      console.log(chalk.green('  ✓ REIS installed successfully'));
      console.log(chalk.gray('  Location: ~/.rovodev/reis/'));
      console.log(chalk.white(`  Open Atlassian Rovo Dev and run ${chalk.cyan('reis help')} to get started\n`));
      
    } catch (err) {
      // inquirer failed, auto-install as default
      console.log(chalk.gray('  Non-interactive mode - installing automatically...\n'));
      
      // Perform installation directly
      const { performInstallation } = require('../lib/install.js');
      await performInstallation(false, true); // overwrite=false, silent=true
      
      console.log(chalk.green('  ✓ REIS installed successfully'));
      console.log(chalk.gray('  Location: ~/.rovodev/reis/'));
      console.log(chalk.white(`  Open Atlassian Rovo Dev and run ${chalk.cyan('reis help')} to get started\n`));
    }
  }
});

// Parse command-line arguments
program.parse(process.argv);
