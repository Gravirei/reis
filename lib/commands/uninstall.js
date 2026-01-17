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
  console.log(chalk.bold.red('\n⚠️  Uninstall REIS\n'));
  console.log(chalk.yellow('This will remove:'));
  console.log(chalk.yellow('  • ~/.rovodev/reis/ (all documentation and templates)'));
  console.log(chalk.yellow('  • ~/.rovodev/subagents/reis_*.md (all REIS subagents)'));
  console.log(chalk.gray('\nYour project .planning/ directories will NOT be affected.\n'));
  
  try {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Are you sure you want to uninstall REIS?',
        default: false
      }
    ]);
    
    if (!confirm) {
      console.log(chalk.green('\n✓ Uninstall cancelled\n'));
      return;
    }
    
    console.log(chalk.cyan('\nUninstalling REIS...\n'));
    
    // Remove REIS directory
    const reisDir = path.join(os.homedir(), '.rovodev', 'reis');
    if (fs.existsSync(reisDir)) {
      fs.rmSync(reisDir, { recursive: true, force: true });
      console.log(chalk.green('✓ Removed ~/.rovodev/reis/'));
    } else {
      console.log(chalk.gray('○ ~/.rovodev/reis/ not found'));
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
      console.log(chalk.green(`✓ Removed ${removedCount} REIS subagent(s)`));
    } else {
      console.log(chalk.gray('○ No REIS subagents found'));
    }
    
    console.log(chalk.bold.green('\n✓ REIS uninstalled successfully!\n'));
    console.log(chalk.gray('Note: If installed globally, run: npm uninstall -g @gravirei/reis\n'));
    
  } catch (err) {
    console.log(chalk.red('\n✗ Uninstall cancelled or failed\n'));
  }
};
