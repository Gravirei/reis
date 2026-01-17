const { showPrompt, showError, checkPlanningDir } = require('../utils/command-helpers');

module.exports = function verify(args) {
  // Check if .planning/ exists
  if (!checkPlanningDir()) {
    showError('Not a REIS project. Run "reis new" or "reis map" first.');
    process.exit(1);
  }
  
  // Validate phase argument
  const phase = args.phase;
  if (!phase) {
    showError('Phase number is required. Usage: reis verify <phase>');
    process.exit(1);
  }
  
  // Validate phase is a number
  if (isNaN(parseInt(phase))) {
    showError('Phase must be a number. Example: reis verify 1');
    process.exit(1);
  }
  
  const prompt = `Verify all work completed for phase ${phase}. Run tests, check success criteria from plans, validate functionality, and confirm all tasks are done. Update .planning/STATE.md with verification results.`;
  
  showPrompt(prompt);
  
  return 0;
};
