const { showPrompt, showError, checkPlanningDir } = require('../utils/command-helpers');

/**
 * Show current project progress
 * Displays: current phase, completed phases, active tasks, blockers, and next actions
 */
module.exports = function progress(args) {
  // Validate REIS project exists
  if (!checkPlanningDir()) {
    showError('Not a REIS project. Run "reis new" or "reis map" first.');
    process.exit(1);
  }

  // Output prompt for Rovo Dev
  const prompt = `Show current project progress. Read .planning/STATE.md and .planning/ROADMAP.md to display: current phase, completed phases, active tasks, blockers, and next recommended actions. Format output clearly with status indicators.`;
  
  showPrompt(prompt);
  
  return 0;
};
