#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import { program } from 'commander';

const packageJson = require('../package.json');

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
  const targets: string[] = [];
  const platformDirs: Record<string, string> = {
    rovodev: '.rovodev',
    gemini: '.gemini',
    claude: '.claude',
    codex: '.codex',
    copilot: '.copilot'
  };

  for (const [key, dirName] of Object.entries(platformDirs)) {
    const reisDir = path.join(os.homedir(), dirName, 'reis');
    try {
      if (fs.existsSync(reisDir)) {
        const files = fs.readdirSync(reisDir);
        // If directory has files (not just .first-run-done), it's installed
        if (files.some(f => f !== '.first-run-done' && f !== '.installed')) {
          targets.push(key);
        }
      }
    } catch (err) {
      // Ignore
    }
  }

  return targets;
}

// Show banner when no command is given (default action)
let shouldShowBanner = false;

// Command implementations - Core commands
import helpCmd from '../lib/commands/help.js';
import versionCmd from '../lib/commands/version.js';
import newCmd from '../lib/commands/new.js';
import mapCmd from '../lib/commands/map.js';
import requirementsCmd from '../lib/commands/requirements.js';
import roadmapCmd from '../lib/commands/roadmap.js';

// Command implementations - Phase Management commands
import planCmd from '../lib/commands/plan.js';
import discussCmd from '../lib/commands/discuss.js';
import researchCmd from '../lib/commands/research.js';
import assumptionsCmd from '../lib/commands/assumptions.js';
import executeCmd from '../lib/commands/execute.js';
import executePlanCmd from '../lib/commands/execute-plan.js';
import verifyCmd from '../lib/commands/verify.js';

// Command implementations - Other commands
import progressCmd from '../lib/commands/progress.js';
import pauseCmd from '../lib/commands/pause.js';
import resumeCmd from '../lib/commands/resume.js';
import checkpointCmd from '../lib/commands/checkpoint.js';
import addCmd from '../lib/commands/add.js';
import insertCmd from '../lib/commands/insert.js';
import removeCmd from '../lib/commands/remove.js';
import { milestone as milestoneCmd } from '../lib/commands/milestone.js';
import { todo as todoCmd } from '../lib/commands/todo.js';
import { todos as todosCmd } from '../lib/commands/todos.js';
import debugCmd from '../lib/commands/debug.js';
import configCmd from '../lib/commands/config.js';
import cycleCmd from '../lib/commands/cycle.js';
import decisionsCmd from '../lib/commands/decisions.js';
import treeCmd from '../lib/commands/tree.js';
import kanbanCmd from '../lib/commands/kanban.js';
import { reviewCommand } from '../lib/commands/review.js';

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
  .action(() => { helpCmd(); });

program
  .command('version')
  .description('Show version and install location')
  .action(() => { versionCmd(); });

program
  .command('new [idea]')
  .description('Initialize a new REIS project')
  .action((idea) => { newCmd({idea}); });

program
  .command('map')
  .description('Analyze and map existing codebase')
  .action(() => { mapCmd({}); });

program
  .command('requirements')
  .description('Generate or update requirements document')
  .action(() => { requirementsCmd({}); });

program
  .command('roadmap')
  .description('Generate or update project roadmap')
  .action(() => { roadmapCmd({}); });

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
  .action((phase) => { discussCmd({phase}); });

program
  .command('research [phase]')
  .description('Research technical solutions for a phase')
  .action((phase) => { researchCmd({phase}); });

program
  .command('assumptions [phase]')
  .description('Document and validate assumptions')
  .action((phase) => { assumptionsCmd({phase}); });

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
  .action(() => { pauseCmd({}); });

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
  .action((feature) => { addCmd({feature}); });

program
  .command('insert <phase> <feature>')
  .description('Insert feature at specific phase')
  .action((phase, feature) => { insertCmd({phase, feature}); });

program
  .command('remove <phase>')
  .description('Remove phase from roadmap')
  .action((phase) => { removeCmd({phase}); });

// Milestone Commands
program
  .command('milestone')
  .description('Manage milestones')
  .argument('<subcommand>', 'Subcommand: complete, discuss, or new')
  .argument('[name]', 'Milestone name (required for complete/new)')
  .action((subcommand, name) => { milestoneCmd({subcommand, name}); });

// Utility Commands
program
  .command('todo <description>')
  .description('Add a TODO item')
  .action((description) => { todoCmd({description}); });

program
  .command('todos [area]')
  .description('List TODO items')
  .action((area) => { todosCmd({area}); });

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

// Quick task execution (no full cycle)
import quickCmd from '../lib/commands/quick.js';
program
  .command('quick <task>')
  .description('Execute a quick task without full research/verification cycle')
  .option('--no-commit', 'Skip git commit after execution')
  .option('--verify', 'Run quick verification after execution')
  .option('-v, --verbose', 'Detailed output')
  .action(async (task, options, command) => {
    const globalOpts = command.parent?.opts() || {};
    await quickCmd(task);
  });

// Audit command (milestone verification)
import auditCmd from '../lib/commands/audit.js';
program
  .command('audit [milestone]')
  .description('Audit milestone completion and cross-phase integration (uses reis_integrator)')
  .option('--phase <n>', 'Audit single phase instead of milestone')
  .option('--strict', 'Fail on any incomplete item or integration issue')
  .option('-o, --output <file>', 'Custom output location for report')
  .option('-v, --verbose', 'Detailed verification output')
  .action(async (milestone, options, command) => {
    const globalOpts = command.parent?.opts() || {};
    await auditCmd({ milestone, ...options, noKanban: globalOpts.kanban === false });
  });

// Complete milestone command
import completeMilestoneCmd from '../lib/commands/complete-milestone.js';
program
  .command('complete-milestone <milestone>')
  .description('Archive completed milestone (runs audit first)')
  .option('--tag', 'Create git tag for milestone (default: true)')
  .option('--no-tag', 'Skip git tag creation')
  .option('--no-archive', 'Skip archiving phase plans')
  .option('--skip-audit', 'Skip audit verification (dangerous)')
  .option('--force', 'Complete even with audit warnings')
  .action(async (milestone, options, command) => {
    const globalOpts = command.parent?.opts() || {};
    await completeMilestoneCmd({ milestone, ...options, noKanban: globalOpts.kanban === false });
  });

// Plan gaps command
import planGapsCmd from '../lib/commands/plan-gaps.js';
program
  .command('plan-gaps [milestone]')
  .description('Identify and plan for tech debt and gaps before milestone completion')
  .option('--priority <level>', 'Filter by priority (high|medium|low|all)', 'all')
  .option('--from-audit <file>', 'Use specific audit file as input')
  .option('--dry-run', 'Preview gaps without generating plans')
  .option('--max-plans <n>', 'Maximum number of plans to generate')
  .option('-v, --verbose', 'Detailed output')
  .action(async (milestone, options, command) => {
    const globalOpts = command.parent?.opts() || {};
    await planGapsCmd({ milestone, ...options, noKanban: globalOpts.kanban === false });
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
  .option('--research', 'Run reis_scout research before planning')
  .option('--full-research', 'Run reis_analyst + reis_scout before planning')
  .option('--quick', 'Fast mode: skip research, review, and gates (use for small, low-risk changes)')
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
  .action((subcommand, options) => { configCmd({ subcommand, ...options }); });

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

import { update as updateCmd } from '../lib/commands/update.js';
import { whatsNew as whatsNewCmd } from '../lib/commands/whats-new.js';
import { docs as docsCmd } from '../lib/commands/docs.js';

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
  const installedTargets = checkExistingInstallation();
  const isInstalled = installedTargets.length > 0;
  
  if (isInstalled) {
    console.log(chalk.yellow(`  ⚠️  REIS is already installed at: ${installedTargets.map(t => '~/.' + t + '/reis/').join(', ')}\n`));
    
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
        const { target } = await inquirer.prompt([
          {
            type: 'checkbox',
            name: 'target',
            message: 'Which AI CLI tools should REIS be reinstalled for?',
            choices: [
              { name: 'Atlassian Rovo Dev (~/.rovodev)', value: 'rovodev' },
              { name: 'Gemini CLI (~/.gemini)', value: 'gemini' },
              { name: 'Claude Code (~/.claude)', value: 'claude' },
              { name: 'OpenAI Codex (~/.codex, TOML agents)', value: 'codex' },
              { name: 'GitHub Copilot CLI (~/.copilot, .agent.md)', value: 'copilot' }
            ],
            default: ['rovodev', 'gemini'],
            validate: (answers: string[]) => answers.length > 0 || 'Select at least one target.'
          }
        ]);

        // Perform installation directly with overwrite
        const { performInstallation } = require('../lib/install.js');
        await performInstallation(true, true, target.join(',')); // overwrite=true, silent=true

        console.log(chalk.green('  ✓ REIS reinstalled successfully'));
        console.log(chalk.gray(`  Locations: ${target.map((t: string) => '~/.' + t + '/reis/').join(', ')}`));
        console.log(chalk.white(`  Open your CLI and run ${chalk.cyan('reis help')} to get started\n`));
      } else {
        console.log(chalk.cyan('  Keeping existing installation\n'));
        console.log(chalk.green('  ✓ Using existing documentation'));
        console.log(chalk.green('  ✓ Using existing templates'));
        console.log(chalk.green('  ✓ Using existing subagents'));
        console.log(chalk.green(`  ✓ Current VERSION (${packageJson.version})`));
        console.log(chalk.white(`\n  Open your CLI and run ${chalk.cyan('reis help')} to get started\n`));
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
      
      const { target } = await inquirer.prompt([
        {
          type: 'list',
          name: 'target',
          message: 'Where would you like to install REIS?',
          choices: [
            { name: 'Both (Atlassian Rovo Dev & Gemini CLI)', value: 'both' },
            { name: 'Atlassian Rovo Dev (~/.rovodev)', value: 'rovodev' },
            { name: 'Gemini CLI (~/.gemini)', value: 'gemini' }
          ],
          default: 'both'
        }
      ]);
      
      // Perform installation directly
      const { performInstallation } = require('../lib/install.js');
      await performInstallation(false, true, target); // overwrite=false, silent=true
      
      console.log(chalk.green('  ✓ REIS installed successfully'));
      console.log(chalk.gray(`  Location: ${target === 'both' ? '~/.rovodev/reis/ and ~/.gemini/reis/' : '~/.' + target + '/reis/'}`));
      console.log(chalk.white(`  Open your CLI and run ${chalk.cyan('reis help')} to get started\n`));
      
    } catch (err) {
      // inquirer failed, auto-install as default
      console.log(chalk.gray('  Non-interactive mode - installing automatically...\n'));
      
      // Perform installation directly
      const { performInstallation } = require('../lib/install.js');
      await performInstallation(false, true, 'both'); // overwrite=false, silent=true
      
      console.log(chalk.green('  ✓ REIS installed successfully'));
      console.log(chalk.gray('  Location: ~/.rovodev/reis/ and ~/.gemini/reis/'));
      console.log(chalk.white(`  Open your CLI and run ${chalk.cyan('reis help')} to get started\n`));
    }
  }
});

// Parse command-line arguments
program.parse(process.argv);
