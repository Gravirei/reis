import { showPrompt } from '../utils/command-helpers.js';

interface NewArgs {
  idea?: string;
  [key: string]: unknown;
}

function newProject(args: NewArgs): number {
  const idea = args.idea;

  let prompt;
  if (idea) {
    prompt = `Initialize a new REIS project for: ${idea}. Create .planning/ directory with PROJECT.md, REQUIREMENTS.md, ROADMAP.md, and STATE.md using REIS methodology.`;
  } else {
    prompt = `Initialize a new REIS project. Ask me about the project idea, then create .planning/ directory with PROJECT.md, REQUIREMENTS.md, ROADMAP.md, and STATE.md.`;
  }

  showPrompt(prompt);

  return 0;
};

export = newProject;
