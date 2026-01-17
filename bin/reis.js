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
const addCmd = require('../lib/commands/add.js');
const insertCmd = require('../lib/commands/insert.js');
const removeCmd = require('../lib/commands/remove.js');
const milestoneCmd = require('../lib/commands/milestone.js');
const todoCmd = require('../lib/commands/todo.js');
const todosCmd = require('../lib/commands/todos.js');
const debugCmd = require('../lib/commands/debug.js');

// Set up commander
program
  .name('reis')
  .version(packageJson.version, '-V, --version', 'output the current version')
  .description('REIS - Roadmap Execution & Implementation System')
  .usage('<command> [options]');

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
  .action((phase) => planCmd({phase}));

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
  .action((phase) => executeCmd({phase}));

program
  .command('execute-plan <path>')
  .description('Execute a specific plan file')
  .action((path) => executePlanCmd({path}));

program
  .command('verify [phase]')
  .description('Verify phase completion')
  .action((phase) => verifyCmd({phase}));

// Progress Commands
program
  .command('progress')
  .description('Show current project progress')
  .action(() => progressCmd({}));

program
  .command('pause')
  .description('Pause current work and save state')
  .action(() => pauseCmd({}));

program
  .command('resume')
  .description('Resume paused work')
  .action(() => resumeCmd({}));

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
  .command('debug <issue>')
  .description('Debug a specific issue')
  .action((issue) => debugCmd({issue}));

program
  .command('update')
  .description('Update REIS to latest version')
  .action(() => {
    console.log('Command coming soon in Phase 5-8');
  });

program
  .command('whats-new')
  .description('Show what\'s new in latest version')
  .action(() => {
    console.log('Command coming soon in Phase 5-8');
  });

program
  .command('docs')
  .description('Open REIS documentation')
  .action(() => {
    console.log('Command coming soon in Phase 5-8');
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
    console.log(chalk.white('  What would you like to do?\n'));
    console.log(chalk.white('    1) Keep existing installation'));
    console.log(chalk.white('    2) Reinstall (replace existing files)\n'));
    
    // Use inquirer for simple input prompt
    const inquirer = require('inquirer');
    try {
      const { choice } = await inquirer.prompt([
        {
          type: 'input',
          name: 'choice',
          message: 'Choice:',
          default: '1',
          validate: (input) => {
            if (input === '1' || input === '2') {
              return true;
            }
            return 'Please enter 1 or 2';
          }
        }
      ]);
      
      console.log('');
      
      if (choice === '2') {
        console.log(chalk.cyan('  Installing to ~/.rovodev/reis/\n'));
        
        // Show installation progress
        console.log(chalk.green('  ✓ Installed documentation'));
        console.log(chalk.green('  ✓ Installed templates'));
        console.log(chalk.green('  ✓ Installed subagents'));
        console.log(chalk.green(`  ✓ Wrote VERSION (${packageJson.version})`));
        console.log(chalk.green('  ✓ Configured REIS\n'));
        
        const install = require('../lib/install.js');
        // The install module runs automatically
      } else {
        console.log(chalk.cyan('  Keeping existing installation\n'));
        console.log(chalk.green('  ✓ Using existing documentation'));
        console.log(chalk.green('  ✓ Using existing templates'));
        console.log(chalk.green('  ✓ Using existing subagents'));
        console.log(chalk.green(`  ✓ Current VERSION (${packageJson.version})\n`));
      }
      
      // Show completion message
      console.log(chalk.bold.green('  🎉 Congratulations! ') + chalk.white('REIS is now in your system.'));
      console.log(chalk.white('  Open Atlassian Rovo Dev and try: ') + chalk.cyan('use reis_planner') + chalk.white(' or ') + chalk.cyan('use reis_executor'));
      console.log(chalk.white('\n  For help, run: ') + chalk.cyan('npx @gravirei/reis help\n'));
      
    } catch (err) {
      // If inquirer fails (non-interactive), just show help
      console.log(chalk.gray('  Non-interactive mode - showing help...\n'));
      const helpCmd = require('../lib/commands/help');
      helpCmd();
    }
  } else {
    console.log(chalk.green('  Installing REIS files to ~/.rovodev/reis/...\n'));
    // Show help after install
    const helpCmd = require('../lib/commands/help');
    helpCmd();
  }
});

// Parse command-line arguments
program.parse(process.argv);
