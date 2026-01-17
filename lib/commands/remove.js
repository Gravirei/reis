const { showPrompt, showError, checkPlanningDir } = require('../utils/command-helpers');

/**
 * Remove a phase from the roadmap
 * Removes the phase, renumbers remaining phases, and archives existing plans
 */
module.exports = function remove(args) {
  // Validate REIS project exists
  if (!checkPlanningDir()) {
    showError('Not a REIS project. Run "reis new" or "reis map" first.');
    process.exit(1);
  }

  // Validate phase is a number
  if (!args.phase || isNaN(parseInt(args.phase))) {
    showError('Phase number is required. Usage: reis remove <phase>');
    process.exit(1);
  }

  // Output prompt for Rovo Dev
  const prompt = `Remove phase ${args.phase} from the roadmap. Update .planning/ROADMAP.md by removing the phase and renumbering remaining phases. Archive any existing plans for this phase.`;
  
  showPrompt(prompt);
  
  return 0;
};
