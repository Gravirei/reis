const { showInfo } = require('../utils/command-helpers.js');

/**
 * Docs command - show documentation locations
 * @param {Object} args - {}
 */
module.exports = function(args) {
  showInfo('REIS Documentation');
  showInfo('');
  showInfo('Documentation is installed at:');
  showInfo('  ~/.rovodev/reis/');
  showInfo('');
  showInfo('Available docs:');
  showInfo('  • README.md - Main documentation');
  showInfo('  • QUICK_REFERENCE.md - Quick command reference');
  showInfo('  • WORKFLOW_EXAMPLES.md - Example workflows');
  showInfo('  • COMPLETE_COMMANDS.md - All 29 commands detailed');
  showInfo('  • INTEGRATION_GUIDE.md - Rovo Dev integration');
  showInfo('');
  showInfo('To open: cat ~/.rovodev/reis/README.md');
};
