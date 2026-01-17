const { showPrompt, showError, checkPlanningDir } = require('../utils/command-helpers.js');

/**
 * Debug command - systematic debugging assistance
 * @param {Object} args - { issue }
 */
module.exports = function(args) {
  const issue = args.issue;
  
  // Validate REIS project
  if (!checkPlanningDir()) {
    showError('Not a REIS project. Run "reis new" or "reis map" first.');
    process.exit(1);
  }
  
  // Validate issue
  if (!issue) {
    showError('Issue description required. Usage: reis debug <issue>');
    process.exit(1);
  }
  
  showPrompt(`Systematic debugging for: ${issue}. Follow REIS debugging methodology: 1) Reproduce the issue, 2) Isolate the problem, 3) Identify root cause, 4) Test solution, 5) Verify fix. Document findings in .planning/STATE.md.`);
};
