const chalk = require('chalk');
const { getVersion } = require('../utils/command-helpers');

module.exports = function help() {
  const version = getVersion();
  
  // ASCII Art Banner
  console.log(chalk.white.bold(`
  ██████  ███████ ██ ███████
  ██   ██ ██      ██ ██     
  ██████  █████   ██ ███████
  ██   ██ ██      ██      ██
  ██   ██ ███████ ██ ███████
  `));
  
  console.log(chalk.blue.bold('  REIS - Roadmap Execution & Implementation System'));
  console.log(chalk.gray('  Specially designed for Atlassian Rovo Dev'));
  console.log(chalk.gray(`  Version ${version}`));
  console.log(chalk.gray('  Documentation: ~/.rovodev/reis/\n'));
  
  console.log(chalk.bold.yellow('Getting Started'));
  console.log('  ' + chalk.cyan('reis new [idea]') + '        Initialize a new REIS project');
  console.log('  ' + chalk.cyan('reis map') + '              Analyze and map existing codebase');
  console.log('  ' + chalk.cyan('reis requirements') + '     Generate or update requirements document');
  console.log('  ' + chalk.cyan('reis roadmap') + '          Generate or update project roadmap');
  
  console.log(chalk.bold.yellow('\nPhase Management'));
  console.log('  ' + chalk.cyan('reis plan [phase]') + '     Create detailed plan for a phase');
  console.log('  ' + chalk.cyan('reis discuss [phase]') + '  Discuss implementation approach');
  console.log('  ' + chalk.cyan('reis research [phase]') + ' Research technical solutions');
  console.log('  ' + chalk.cyan('reis assumptions') + '      Document and validate assumptions');
  console.log('  ' + chalk.cyan('reis execute [phase]') + '  Execute a phase');
  console.log('  ' + chalk.cyan('reis execute-plan') + '     Execute a specific plan file');
  console.log('  ' + chalk.cyan('reis verify [phase]') + '   Verify phase completion');
  
  console.log(chalk.bold.yellow('\nProgress & State'));
  console.log('  ' + chalk.cyan('reis progress') + '         Show current project progress');
  console.log('  ' + chalk.cyan('reis pause') + '            Pause current work and save state');
  console.log('  ' + chalk.cyan('reis resume') + '           Resume paused work');
  
  console.log(chalk.bold.yellow('\nRoadmap Management'));
  console.log('  ' + chalk.cyan('reis add <feature>') + '    Add feature to roadmap');
  console.log('  ' + chalk.cyan('reis insert <phase>') + '   Insert feature at specific phase');
  console.log('  ' + chalk.cyan('reis remove <phase>') + '   Remove phase from roadmap');
  
  console.log(chalk.bold.yellow('\nMilestones'));
  console.log('  ' + chalk.cyan('reis milestone complete') + '  Mark milestone as complete');
  console.log('  ' + chalk.cyan('reis milestone discuss') + '   Discuss milestone approach');
  console.log('  ' + chalk.cyan('reis milestone new') + '      Create new milestone');
  
  console.log(chalk.bold.yellow('\nUtilities'));
  console.log('  ' + chalk.cyan('reis todo <desc>') + '      Add a TODO item');
  console.log('  ' + chalk.cyan('reis todos [area]') + '     List TODO items');
  console.log('  ' + chalk.cyan('reis debug <issue>') + '    Debug a specific issue');
  console.log('  ' + chalk.cyan('reis update') + '           Update REIS to latest version');
  console.log('  ' + chalk.cyan('reis whats-new') + '        Show what\'s new in latest version');
  console.log('  ' + chalk.cyan('reis docs') + '             Open REIS documentation');
  console.log('  ' + chalk.cyan('reis uninstall') + '        Uninstall REIS');
  
  console.log(chalk.bold.yellow('\nHelp & Info'));
  console.log('  ' + chalk.cyan('reis help') + '             Show this help message');
  console.log('  ' + chalk.cyan('reis version') + '          Show version and install location');
  
  console.log(chalk.gray('\n  Full documentation: ~/.rovodev/reis/README.md'));
  console.log(chalk.gray('  Examples: ~/.rovodev/reis/WORKFLOW_EXAMPLES.md'));
  console.log(chalk.gray('  Quick reference: ~/.rovodev/reis/QUICK_REFERENCE.md'));
  console.log(chalk.gray('\n  Example: ' + chalk.cyan('reis new "build a todo app"') + '\n'));
  
  return 0;
};
