import { showPrompt, showError, checkPlanningDir } from '../utils/command-helpers.js';
import { showKanbanBoard } from '../utils/kanban-renderer.js';

interface ProgressOptions {
  noKanban?: boolean;
  [key: string]: unknown;
}

/**
 * Show current project progress
 * Displays: current phase, completed phases, active tasks, blockers, and next actions
 */
function progress(args: Record<string, unknown>, options: ProgressOptions = {}): number {
  // Show kanban board (unless disabled)
  showKanbanBoard({ noKanban: options?.noKanban });
  // Validate REIS project exists
  if (!checkPlanningDir()) {
    showError('Not a REIS project. Run "reis new" or "reis map" first.');
    process.exit(1);
  }

  // Output prompt for Rovo Dev
  const prompt = `Show current project progress. Read .planning/STATE.md and .planning/ROADMAP.md to display: current phase, completed phases, active tasks, blockers, and next recommended actions. Format output clearly with status indicators.`;

  showPrompt(prompt);

  return 0;
};

export = progress;
