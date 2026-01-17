const { showInfo } = require('../utils/command-helpers.js');
const chalk = require('chalk');

/**
 * Uninstall command - show uninstall instructions
 * @param {Object} args - {}
 */
module.exports = function(args) {
  showInfo('Uninstall REIS');
  showInfo('');
  showInfo('To remove REIS files:');
  showInfo('  rm -rf ~/.rovodev/reis/');
  showInfo('  rm -rf ~/.rovodev/subagents/reis_*.md');
  showInfo('');
  showInfo('To uninstall the package:');
  showInfo('  npm uninstall -g reis');
  showInfo('(If installed via npx, no package uninstall needed)');
  showInfo('');
  console.log(chalk.yellow('Warning: This will remove all REIS documentation and templates.'));
  console.log(chalk.yellow('Your project .planning/ directories will not be affected.'));
};
