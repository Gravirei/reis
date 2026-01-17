const { showInfo, showSuccess, showError } = require('../utils/command-helpers.js');
const chalk = require('chalk');
const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Uninstall command - remove REIS files with confirmation
 * @param {Object} args - {}
 */
module.exports = async function(args) {
  // Show banner
  console.log(chalk.white.bold(`
  ██████  ███████ ██ ███████
  ██   ██ ██      ██ ██     
  ██████  █████   ██ ███████
  ██   ██ ██      ██      ██
  ██   ██ ███████ ██ ███████
  `));
  
  console.log(chalk.red.bold('  REIS - Uninstall'));
  console.log(chalk.gray('  Remove REIS from your system\n'));
  
  // Check if REIS is installed
  const reisDir = path.join(os.homedir(), '.rovodev', 'reis');
  const subagentsDir = path.join(os.homedir(), '.rovodev', 'subagents');
  const subagents = ['reis_planner.md', 'reis_executor.md', 'reis_project_mapper.md'];
  
  const reisExists = fs.existsSync(reisDir);
  const subagentsExist = subagents.some(file => fs.existsSync(path.join(subagentsDir, file)));
  
  if (!reisExists && !subagentsExist) {
    console.log(chalk.yellow('  ⚠️  REIS is not installed\n'));
    console.log(chalk.gray('  There is nothing to uninstall.'));
    console.log(chalk.gray('  REIS files were not found in ~/.rovodev/\n'));
    return;
  }
  
  console.log(chalk.bold.red('  ⚠️  Uninstall REIS\n'));
  console.log(chalk.yellow('  This will remove:'));
  console.log(chalk.yellow('    • ~/.rovodev/reis/ (all documentation and templates)'));
  console.log(chalk.yellow('    • ~/.rovodev/subagents/reis_*.md (all REIS subagents)'));
  console.log(chalk.gray('\n  Your project .planning/ directories will NOT be affected.\n'));
  
  console.log(chalk.white('  What would you like to do?\n'));
  console.log(chalk.white('    1) Remove REIS from system'));
  console.log(chalk.white('    2) Cancel\n'));
  
  try {
    const { choice } = await inquirer.prompt([
      {
        type: 'input',
        name: 'choice',
        message: 'Choice:',
        default: '2',
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
      console.log(chalk.green('  ✓ Uninstall cancelled\n'));
      return;
    }
    
    console.log(chalk.cyan('  Uninstalling REIS...\n'));
    
    // Remove REIS directory
    const reisDir = path.join(os.homedir(), '.rovodev', 'reis');
    if (fs.existsSync(reisDir)) {
      fs.rmSync(reisDir, { recursive: true, force: true });
      console.log(chalk.green('  ✓ Removed ~/.rovodev/reis/'));
    } else {
      console.log(chalk.gray('  ○ ~/.rovodev/reis/ not found'));
    }
    
    // Remove REIS subagents
    const subagentsDir = path.join(os.homedir(), '.rovodev', 'subagents');
    const subagents = ['reis_planner.md', 'reis_executor.md', 'reis_project_mapper.md'];
    let removedCount = 0;
    
    subagents.forEach(file => {
      const filePath = path.join(subagentsDir, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        removedCount++;
      }
    });
    
    if (removedCount > 0) {
      console.log(chalk.green(`  ✓ Removed ${removedCount} REIS subagent(s)`));
    } else {
      console.log(chalk.gray('  ○ No REIS subagents found'));
    }
    
    console.log(chalk.bold.green('\n  ✓ REIS uninstalled successfully!\n'));
    console.log(chalk.gray('  Note: If installed globally, run: ') + chalk.cyan('npm uninstall -g @gravirei/reis\n'));
    
  } catch (err) {
    console.log(chalk.red('\n✗ Uninstall cancelled or failed\n'));
  }
};
