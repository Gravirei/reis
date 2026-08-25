import { showPrompt, showError, checkPlanningDir } from '../utils/command-helpers.js';

interface InsertArgs {
  phase?: string;
  feature?: string;
  [key: string]: unknown;
}

/**
 * Insert a new phase at a specific position in the roadmap
 * Renumbers existing phases and adds the new phase
 */
function insert(args: InsertArgs): number {
  // Validate REIS project exists
  if (!checkPlanningDir()) {
    showError('Not a REIS project. Run "reis new" or "reis map" first.');
    process.exit(1);
  }

  // Validate phase is a number
  if (!args.phase || isNaN(parseInt(args.phase))) {
    showError('Phase number is required. Usage: reis insert <phase> <feature>');
    process.exit(1);
  }

  // Validate feature is provided
  if (!args.feature) {
    showError('Feature description is required. Usage: reis insert <phase> <feature>');
    process.exit(1);
  }

  // Output prompt for Rovo Dev
  const prompt = `Insert a new phase at position ${args.phase} for: ${args.feature}. Update .planning/ROADMAP.md by renumbering existing phases and adding the new phase with proper goals, deliverables, and success criteria.`;

  showPrompt(prompt);

  return 0;
};

export = insert;
