const { showPrompt, showError, checkPlanningDir, validatePhaseNumber } = require('../utils/command-helpers');

module.exports = function plan(args) {
  // Check if .planning/ exists
  if (!checkPlanningDir()) {
    showError('Not a REIS project. Run "reis new" or "reis map" first.');
    process.exit(1);
  }
  
  // Validate phase argument
  const phase = args.phase;
  if (!phase) {
    showError('Phase number is required. Usage: reis plan <phase>');
    process.exit(1);
  }
  
  // Validate phase is a valid positive number
  const validatedPhase = validatePhaseNumber(phase);
  if (validatedPhase === null) {
    process.exit(1);
  }
  
  const prompt = `Plan phase ${validatedPhase} using REIS methodology. Use the reis_planner subagent to break down the phase into 2-3 task plans with clear dependencies, success criteria, and verification steps. Save plans to .planning/phases/${validatedPhase}-{name}/`;
  
  showPrompt(prompt);
  
  return 0;
};
