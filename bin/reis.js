#!/usr/bin/env node

const { program } = require('commander');
const packageJson = require('../package.json');

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
  .action(() => {
    console.log('Command coming soon in Phase 5-8');
  });

program
  .command('todos [area]')
  .description('List TODO items')
  .action(() => {
    console.log('Command coming soon in Phase 5-8');
  });

program
  .command('debug <issue>')
  .description('Debug a specific issue')
  .action(() => {
    console.log('Command coming soon in Phase 5-8');
  });

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
  .action(() => {
    console.log('Command coming soon in Phase 5-8');
  });

// Default action (no command)
program.action(() => {
  console.log('Run \'reis help\' for available commands');
});

// Parse command-line arguments
program.parse(process.argv);

// If no arguments provided, show default message
if (!process.argv.slice(2).length) {
  console.log('Run \'reis help\' for available commands');
}
