const { showPrompt, showError, checkPlanningDir } = require('../utils/command-helpers');

module.exports = function requirements(args) {
  // Check if .planning/ exists
  if (!checkPlanningDir()) {
    showError('Not a REIS project. Run "reis new" or "reis map" first.');
    process.exit(1);
  }
  
  const prompt = `Define detailed requirements for this project. Update .planning/REQUIREMENTS.md with functional and non-functional requirements following REIS methodology. Ask clarifying questions if needed.`;
  
  showPrompt(prompt);
  
  return 0;
};
