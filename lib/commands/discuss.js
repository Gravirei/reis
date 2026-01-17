const { showPrompt, showError, checkPlanningDir } = require('../utils/command-helpers');

module.exports = function discuss(args) {
  // Check if .planning/ exists
  if (!checkPlanningDir()) {
    showError('Not a REIS project. Run "reis new" or "reis map" first.');
    process.exit(1);
  }
  
  // Validate phase argument
  const phase = args.phase;
  if (!phase) {
    showError('Phase number is required. Usage: reis discuss <phase>');
    process.exit(1);
  }
  
  // Validate phase is a number
  if (isNaN(parseInt(phase))) {
    showError('Phase must be a number. Example: reis discuss 1');
    process.exit(1);
  }
  
  const prompt = `Discuss phase ${phase} implementation. Gather context, ask clarifying questions, identify potential challenges, and document key decisions before planning. Update .planning/STATE.md with discussion notes.`;
  
  showPrompt(prompt);
  
  return 0;
};
