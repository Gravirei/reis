/**
 * REIS Quick Command
 * Fast task execution without full research/plan/verify cycle
 * 
 * Usage:
 *   reis quick <task-description>
 *   reis quick "Add error handling to login endpoint"
 *   reis quick --no-commit "Fix typo in README"
 *   reis quick --verify "Update user validation"
 */

const chalk = require('chalk');
const { showPrompt, showError, showSuccess, showWarning, checkPlanningDir } = require('../utils/command-helpers');

/**
 * Quick command - Fast task execution with minimal ceremony
 * @param {Object} args - Command arguments
 * @param {string[]} args._ - Positional arguments (task description)
 * @param {boolean} args.noCommit - Skip git commit after task
 * @param {boolean} args.verify - Run quick verification after task
 * @param {boolean} args.verbose - Show detailed output
 * @returns {number} Exit code
 */
function quick(args) {
  // Validate .planning/ exists
  if (!checkPlanningDir()) {
    showError('Not a REIS project. Run "reis new" or "reis map" first.');
    return 1;
  }

  // Parse task description from args
  const taskDescription = args._ && args._.length > 0 
    ? args._.join(' ') 
    : args.task;

  if (!taskDescription) {
    showError('Task description is required.');
    console.log(chalk.gray('\nUsage:'));
    console.log(chalk.gray('  reis quick <task-description>'));
    console.log(chalk.gray('  reis quick "Add error handling to login endpoint"'));
    console.log(chalk.gray('  reis quick --no-commit "Fix typo in README"'));
    console.log(chalk.gray('  reis quick --verify "Update user validation"\n'));
    console.log(chalk.gray('Options:'));
    console.log(chalk.gray('  --no-commit    Skip git commit after completing task'));
    console.log(chalk.gray('  --verify       Run quick verification after task'));
    console.log(chalk.gray('  --verbose      Show detailed output\n'));
    return 1;
  }

  // Parse options
  const noCommit = args['no-commit'] || args.noCommit || false;
  const shouldVerify = args.verify || false;
  const verbose = args.verbose || false;

  // Show banner
  console.log();
  console.log(chalk.blue('╔═══════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue('║  ⚡ REIS Quick Task                                       ║'));
  console.log(chalk.blue('╚═══════════════════════════════════════════════════════════╝'));
  console.log();

  // Show task info
  console.log(chalk.cyan('📋 Task: ') + taskDescription);
  console.log(chalk.gray(`   Commit: ${noCommit ? 'No' : 'Yes'}`));
  console.log(chalk.gray(`   Verify: ${shouldVerify ? 'Yes' : 'No'}`));
  console.log();

  // Generate prompt for quick execution
  const prompt = generateQuickPrompt(taskDescription, { noCommit, shouldVerify, verbose });
  
  showPrompt(prompt);
  
  return 0;
}

/**
 * Generate the prompt for quick task execution
 * @param {string} task - Task description
 * @param {Object} options - Execution options
 * @returns {string} The generated prompt
 */
function generateQuickPrompt(task, options) {
  const { noCommit, shouldVerify, verbose } = options;

  let prompt = `## Quick Task Execution

**Task:** ${task}

### Instructions

Execute this task with minimal ceremony:

1. **Focus** - Work only on the specific task described above
2. **Minimal Changes** - Make targeted changes, avoid scope creep
3. **Skip Research** - Don't do extensive research or planning
4. **Direct Implementation** - Implement the solution directly

### Execution Steps

1. Identify the relevant file(s) for this task
2. Make the necessary changes
3. ${shouldVerify ? 'Verify the change works (run tests, check functionality)' : 'Do a quick sanity check'}
4. ${noCommit ? 'Skip git commit (--no-commit specified)' : 'Commit with a descriptive message following conventional commits format'}

### Quality Checks

- [ ] Changes are minimal and focused
- [ ] No unrelated modifications
- [ ] Code follows existing patterns
${shouldVerify ? '- [ ] Tests pass (if applicable)\n- [ ] Functionality verified' : ''}
${!noCommit ? '- [ ] Committed with descriptive message' : ''}

### Commit Message Format (if committing)

\`\`\`
<type>(<scope>): <description>

Examples:
- fix(auth): add error handling to login endpoint
- docs(readme): fix typo in installation section
- feat(api): add rate limiting to endpoints
\`\`\`
`;

  if (verbose) {
    prompt += `
### Verbose Mode

Report on:
- Files modified
- Lines changed
- Time taken
- Any issues encountered
`;
  }

  return prompt;
}

module.exports = quick;
