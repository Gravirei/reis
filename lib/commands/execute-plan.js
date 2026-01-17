const { showPrompt, showError, checkPlanningDir } = require('../utils/command-helpers');

module.exports = function executePlan(args) {
  // Check if .planning/ exists
  if (!checkPlanningDir()) {
    showError('Not a REIS project. Run "reis new" or "reis map" first.');
    process.exit(1);
  }
  
  // Validate path argument
  const path = args.path;
  if (!path) {
    showError('Plan path is required. Usage: reis execute-plan <path>');
    process.exit(1);
  }
  
  const prompt = `Execute the specific plan at ${path} using the reis_executor subagent. Follow the plan's tasks sequentially, verify each step, and update .planning/STATE.md when complete.`;
  
  showPrompt(prompt);
  
  return 0;
};
