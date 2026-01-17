const { showPrompt, showError, checkPlanningDir } = require('../utils/command-helpers.js');

/**
 * Todos command - list all TODO items
 * @param {Object} args - { area }
 */
module.exports = function(args) {
  const area = args.area;
  
  // Validate REIS project
  if (!checkPlanningDir()) {
    showError('Not a REIS project. Run "reis new" or "reis map" first.');
    process.exit(1);
  }
  
  if (area) {
    showPrompt(`Show all TODO items for area: ${area}. Read .planning/STATE.md and display TODOs matching this area with their status and priority.`);
  } else {
    showPrompt('Show all TODO items. Read .planning/STATE.md and display all TODOs grouped by area, with status indicators and priorities.');
  }
};
