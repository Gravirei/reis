const { showPrompt, showError, checkPlanningDir } = require('../utils/command-helpers.js');

/**
 * Todo command - add a new TODO item
 * @param {Object} args - { description }
 */
module.exports = function(args) {
  const description = args.description;
  
  // Validate REIS project
  if (!checkPlanningDir()) {
    showError('Not a REIS project. Run "reis new" or "reis map" first.');
    process.exit(1);
  }
  
  // Validate description
  if (!description) {
    showError('Description required. Usage: reis todo <description>');
    process.exit(1);
  }
  
  const date = new Date().toISOString().split('T')[0];
  showPrompt(`Add TODO item: ${description}. Append to .planning/STATE.md in the TODOs section with timestamp and context. Format: - [ ] ${description} (added: ${date})`);
};
