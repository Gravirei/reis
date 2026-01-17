const { showPrompt, showError, checkPlanningDir, validatePhaseNumber } = require('../utils/command-helpers');

module.exports = function research(args) {
  // Check if .planning/ exists
  if (!checkPlanningDir()) {
    showError('Not a REIS project. Run "reis new" or "reis map" first.');
    process.exit(1);
  }
  
  // Validate phase argument
  const phase = args.phase;
  if (!phase) {
    showError('Phase number is required. Usage: reis research <phase>');
    process.exit(1);
  }
  
  // Validate phase is a valid positive number
  const validatedPhase = validatePhaseNumber(phase);
  if (validatedPhase === null) {
    process.exit(1);
  }
  
  const prompt = `Research implementation approaches for phase ${validatedPhase}. Investigate best practices, libraries, patterns, and document findings. Update .planning/STATE.md with research results.`;
  
  showPrompt(prompt);
  
  return 0;
};
