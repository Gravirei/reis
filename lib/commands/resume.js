const { showPrompt, showError, checkPlanningDir } = require('../utils/command-helpers');

/**
 * Resume work from last session
 * Reads STATE.md to understand last completed work, WIP, next actions, and blockers
 */
module.exports = function resume(args) {
  // Validate REIS project exists
  if (!checkPlanningDir()) {
    showError('Not a REIS project. Run "reis new" or "reis map" first.');
    process.exit(1);
  }

  // Output prompt for Rovo Dev
  const prompt = `Resume work from last session. Read .planning/STATE.md to understand: last completed work, work in progress, next actions, and any blockers. Provide a summary and recommend next steps.`;
  
  showPrompt(prompt);
  
  return 0;
};
