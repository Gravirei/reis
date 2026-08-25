import { showPrompt, showError, checkPlanningDir, validatePhaseNumber } from '../utils/command-helpers.js';

interface DiscussArgs {
  phase?: string;
  [key: string]: unknown;
}

function discuss(args: DiscussArgs): number {
  // Check if .planning/ exists
  if (!checkPlanningDir()) {
    showError('Not a REIS project. Run "reis new" or "reis map" first.');
    process.exit(1);
  }

  // Validate phase argument
  const phase = args.phase;
  if (!phase) {
    showError('Phase number is required. Usage: reis discuss <phase>');
    process.exit(1);
  }

  // Validate phase is a valid positive number
  const validatedPhase = validatePhaseNumber(phase);
  if (validatedPhase === null) {
    process.exit(1);
  }

  const prompt = `Discuss phase ${validatedPhase} implementation. Gather context, ask clarifying questions, identify potential challenges, and document key decisions before planning. Update .planning/STATE.md with discussion notes.`;

  showPrompt(prompt);

  return 0;
};

export = discuss;
