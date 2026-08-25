import { showPrompt, showError, checkPlanningDir } from '../utils/command-helpers.js';

interface PauseArgs {
  [key: string]: unknown;
}

/**
 * Pause work and create a handoff document
 * Updates STATE.md with current progress, WIP, next steps, decisions, and blockers
 */
function pause(args: PauseArgs): number {
  // Validate REIS project exists
  if (!checkPlanningDir()) {
    showError('Not a REIS project. Run "reis new" or "reis map" first.');
    process.exit(1);
  }

  // Output prompt for Rovo Dev
  const prompt = `Pause work and create a handoff document. Update .planning/STATE.md with: current progress, work in progress, next steps, active decisions, and any blockers. Ensure another developer could resume from this point.`;

  showPrompt(prompt);

  return 0;
};

export = pause;
