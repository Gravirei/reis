const { showPrompt, showError, checkPlanningDir } = require('../utils/command-helpers.js');

/**
 * Milestone command - manage milestones with subcommands
 * @param {Object} args - { subcommand, name }
 */
module.exports = function(args) {
  const subcommand = args.subcommand;
  const name = args.name;
  
  // Validate REIS project
  if (!checkPlanningDir()) {
    showError('Not a REIS project. Run "reis new" or "reis map" first.');
    process.exit(1);
  }
  
  // Handle subcommands
  switch(subcommand) {
    case 'complete':
      if (!name) {
        showError('Milestone name required. Usage: reis milestone complete <name>');
        process.exit(1);
      }
      showPrompt(`Complete and archive milestone: ${name}. Update .planning/ROADMAP.md to mark all phases in this milestone as complete. Create archive in .planning/archive/${name}/ with completed plans and summary.`);
      break;
      
    case 'discuss':
      showPrompt('Discuss next milestone planning. Review completed work, gather requirements for upcoming milestone, identify goals, and plan the next set of phases. Document discussion in .planning/STATE.md.');
      break;
      
    case 'new':
      if (!name) {
        showError('Milestone name required. Usage: reis milestone new <name>');
        process.exit(1);
      }
      showPrompt(`Create new milestone: ${name}. Add to .planning/ROADMAP.md with description, goals, and placeholder phases. Set up milestone structure following REIS methodology.`);
      break;
      
    default:
      showError('Invalid milestone subcommand. Use: complete, discuss, or new');
      process.exit(1);
  }
};
