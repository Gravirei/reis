import { showPrompt, showError, checkPlanningDir } from '../utils/command-helpers.js';

interface TodosArgs {
  area?: string;
  [key: string]: unknown;
}

/**
 * Todos command - list all TODO items
 * @param args - { area }
 */
export function todos(args: TodosArgs): void {
  const area = args.area;

  // Validate REIS project
  if (!checkPlanningDir()) {
    showError('Not a REIS project. Run "reis new" or "reis map" first.');
    process.exit(1);
  }

  if (area) {
    showPrompt(`Show all TODO items for area: ${area}. Read .planning/STATE.md and display TODOs matching this area with their status and priority.`);
  } else {
    showPrompt('Show all TODO items. Read .planning/STATE.md and display all TODOs grouped by area, with status indicators and priorities.');
  }
}
