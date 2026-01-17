const { showInfo, getVersion } = require('../utils/command-helpers.js');

/**
 * Update command - check for REIS updates
 * @param {Object} args - {}
 */
module.exports = function(args) {
  const version = getVersion();
  
  showInfo('Checking for REIS updates...');
  showInfo(`Current version: ${version}`);
  showInfo('');
  showInfo('To update: npm update -g reis');
  showInfo('(If installed via npx, it will automatically use latest)');
};
