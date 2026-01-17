const { showPrompt } = require('../utils/command-helpers');

module.exports = function newProject(args) {
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
