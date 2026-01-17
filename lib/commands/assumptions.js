const { showPrompt, showError, checkPlanningDir, validatePhaseNumber } = require('../utils/command-helpers');

module.exports = function assumptions(args) {
  // Check if .planning/ exists
  if (!checkPlanningDir()) {
    showError('Not a REIS project. Run "reis new" or "reis map" first.');
    process.exit(1);
  }
  
  // Validate phase argument
  const phase = args.phase;
  if (!phase) {
    showError('Phase number is required. Usage: reis assumptions <phase>');
    process.exit(1);
  }
  
  // Validate phase is a valid positive number
  const validatedPhase = validatePhaseNumber(phase);
  if (validatedPhase === null) {
    process.exit(1);
  }
  
  const prompt = `List all assumptions for phase ${validatedPhase}. Review the phase requirements, identify dependencies, technical assumptions, and potential risks. Document in .planning/STATE.md.`;
  
  showPrompt(prompt);
  
  return 0;
};
