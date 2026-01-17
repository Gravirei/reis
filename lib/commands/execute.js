const { showPrompt, showError, checkPlanningDir, validatePhaseNumber } = require('../utils/command-helpers');

module.exports = function execute(args) {
  // Check if .planning/ exists
  if (!checkPlanningDir()) {
    showError('Not a REIS project. Run "reis new" or "reis map" first.');
    process.exit(1);
  }
  
  // Validate phase argument
  const phase = args.phase;
  if (!phase) {
    showError('Phase number is required. Usage: reis execute <phase>');
    process.exit(1);
  }
  
  // Validate phase is a valid positive number
  const validatedPhase = validatePhaseNumber(phase);
  if (validatedPhase === null) {
    process.exit(1);
  }
  
  const prompt = `Execute phase ${validatedPhase} using REIS methodology. Use the reis_executor subagent to execute all plans for this phase in parallel where possible (up to 4 simultaneous tasks). Each task gets fresh 200k context. Update .planning/STATE.md with progress.`;
  
  showPrompt(prompt);
  
  return 0;
};
