import { showPrompt } from '../utils/command-helpers.js';

interface MapArgs {
  [key: string]: unknown;
}

function map(args: MapArgs): number {
  const prompt = `Map this existing codebase using REIS methodology. Analyze the project structure, tech stack, and create .planning/PROJECT.md with comprehensive documentation. Use the reis_project_mapper subagent.`;

  showPrompt(prompt);

  return 0;
};

export = map;
