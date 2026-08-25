import { showPrompt, showError, checkPlanningDir } from '../utils/command-helpers.js';

interface TodoArgs {
  description?: string;
  [key: string]: unknown;
}

/**
 * Todo command - add a new TODO item
 * @param args - { description }
 */
export function todo(args: TodoArgs): void {
  const description = args.description;

  // Validate REIS project
  if (!checkPlanningDir()) {
    showError('Not a REIS project. Run "reis new" or "reis map" first.');
    process.exit(1);
  }

  // Validate description
  if (!description) {
    showError('Description required. Usage: reis todo <description>');
    process.exit(1);
  }

  const date = new Date().toISOString().split('T')[0];
  showPrompt(`Add TODO item: ${description}. Append to .planning/STATE.md in the TODOs section with timestamp and context. Format: - [ ] ${description} (added: ${date})`);
}
