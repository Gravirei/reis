const { showInfo, getVersion } = require('../utils/command-helpers.js');

/**
 * Whats-new command - show recent changes and features
 * @param {Object} args - {}
 */
module.exports = function(args) {
  const version = getVersion();
  
  showInfo(`REIS v${version} - What's New`);
  showInfo('');
  showInfo('• Initial release');
  showInfo('• 29 commands for systematic development');
  showInfo('• Parallel subagent execution (up to 4 simultaneous)');
  showInfo('• Fresh context per task (200k tokens)');
  showInfo('• Transformed from GSD for Rovo Dev');
  showInfo('');
  showInfo('Full documentation: ~/.rovodev/reis/README.md');
};
