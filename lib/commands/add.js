const { showPrompt, showError, checkPlanningDir } = require('../utils/command-helpers');

/**
 * Add a new phase to the roadmap
 * Appends to ROADMAP.md with proper phase numbering
 */
module.exports = function add(args) {
  // Validate REIS project exists
  if (!checkPlanningDir()) {
    showError('Not a REIS project. Run "reis new" or "reis map" first.');
    process.exit(1);
  }

  // Validate feature is provided
  if (!args.feature) {
    showError('Feature description is required. Usage: reis add <feature>');
    process.exit(1);
  }

  // Output prompt for Rovo Dev
  const prompt = `Add a new phase to the roadmap for: ${args.feature}. Append to .planning/ROADMAP.md with proper phase numbering, goals, deliverables, and success criteria following REIS methodology.`;
  
  showPrompt(prompt);
  
  return 0;
};
