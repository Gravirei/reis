const { showPrompt, showError, checkPlanningDir } = require('../utils/command-helpers');

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
  
  // Validate phase is a number
  if (isNaN(parseInt(phase))) {
    showError('Phase must be a number. Example: reis research 1');
    process.exit(1);
  }
  
  const prompt = `Research implementation approaches for phase ${phase}. Investigate best practices, libraries, patterns, and document findings. Update .planning/STATE.md with research results.`;
  
  showPrompt(prompt);
  
  return 0;
};
