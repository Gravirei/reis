const { showPrompt, showError, checkPlanningDir } = require('../utils/command-helpers');

module.exports = function roadmap(args) {
  // Check if .planning/ exists
  if (!checkPlanningDir()) {
    showError('Not a REIS project. Run "reis new" or "reis map" first.');
    process.exit(1);
  }
  
  const prompt = `Create a comprehensive project roadmap. Break the project into phases in .planning/ROADMAP.md based on requirements. Each phase should have clear goals, deliverables, and success criteria following REIS methodology.`;
  
  showPrompt(prompt);
  
  return 0;
};
