const chalk = require('chalk');
const { getVersion } = require('../utils/command-helpers');

module.exports = function help() {
  const version = getVersion();
  const w = chalk.bold.white; // shorthand for bold white
  
  // ASCII Art Banner - Centered
  console.log(w(`
                       ██████╗ ███████╗██╗███████╗
                       ██╔══██╗██╔════╝██║██╔════╝
                       ██████╔╝█████╗  ██║███████╗
                       ██╔══██╗██╔══╝  ██║╚════██║
                       ██║  ██║███████╗██║███████║
                       ╚═╝  ╚═╝╚══════╝╚═╝╚══════╝
`));
  
  console.log(w('              REIS - Roadmap Execution & Implementation System'));
  console.log(w('                   Specially designed for Atlassian Rovo Dev'));
  console.log(w(`                              Version ${version}`));
  console.log('');
  console.log(chalk.italic.white('         "Transform your roadmap into reality, one phase at a time"'));
  console.log('');
  console.log('');
  console.log(w('●  Available Commands:'));
  console.log('');

  // Project Setup
  console.log(w('   Project Setup'));
  console.log(w('   ─────────────'));
  console.log(w('   reis new                    - Initialize a new REIS project with PROJECT.md, ROADMAP.md, and configuration files'));
  console.log(w('   reis map                    - Analyze and map an existing codebase structure, dependencies, and architecture'));
  console.log(w('   reis config                 - View, edit, or reset REIS configuration settings for your project'));
  console.log('');

  // Planning & Roadmap
  console.log(w('   Planning & Roadmap'));
  console.log(w('   ──────────────────'));
  console.log(w('   reis plan                   - Create detailed execution plans with tasks, dependencies, and success criteria'));
  console.log(w('   reis roadmap                - Display the project roadmap with phases, milestones, and progress status'));
  console.log(w('   reis requirements           - Manage and track project requirements, constraints, and acceptance criteria'));
  console.log(w('   reis milestone              - Define, track, and update project milestones with deadlines and deliverables'));
  console.log(w('   reis add <feature>          - Add a new feature or phase to the roadmap'));
  console.log(w('   reis insert <pos> <feature> - Insert a feature at a specific position in the roadmap'));
  console.log(w('   reis remove <phase>         - Remove a phase from the roadmap'));
  console.log('');

  // Execution
  console.log(w('   Execution'));
  console.log(w('   ─────────'));
  console.log(w('   reis execute <phase> [--dry-run] [--verbose] [--timeout <ms>]'));
  console.log(w('                               - Execute a phase using reis_executor subagent'));
  console.log(w('   reis execute-plan           - Run the current execution plan with progress tracking'));
  console.log(w('   reis resume                 - Resume a previously paused execution from the last checkpoint'));
  console.log(w('   reis pause                  - Pause current execution and save state for later continuation'));
  console.log(w('   reis checkpoint             - Create a manual checkpoint to save current progress and state'));
  console.log('');

  // Automated Workflow
  console.log(w('   Automated Workflow'));
  console.log(w('   ──────────────────'));
  console.log(w('   reis cycle [phase]          - Run the complete automated workflow: PLAN → EXECUTE → VERIFY → DEBUG'));
  console.log(w('   reis cycle --resume         - Resume an interrupted cycle from where it left off'));
  console.log('');

  // Verification
  console.log(w('   Verification'));
  console.log(w('   ────────────'));
  console.log(w('   reis verify [target] [--dry-run] [--verbose] [--strict] [--timeout <ms>]'));
  console.log(w('                               - Verify execution results using reis_verifier subagent'));
  console.log(w('   reis progress               - Show detailed execution progress with completion percentages'));
  console.log(w('   reis visualize              - Generate visual representation of project state and progress'));
  console.log('');

  // Decision Trees
  console.log(w('   Decision Trees'));
  console.log(w('   ──────────────'));
  console.log(w('   reis tree show <file>       - Display a decision tree from a markdown file with formatting and colors'));
  console.log(w('   reis tree list              - List all available built-in decision tree templates'));
  console.log(w('   reis tree new <template>    - Create a new decision tree file from a built-in template'));
  console.log(w('   reis tree validate <file>   - Validate decision tree syntax, structure, and metadata'));
  console.log(w('   reis tree export <file>     - Export decision tree to HTML, SVG, or Mermaid format'));
  console.log(w('   reis tree diff <f1> <f2>    - Compare two decision trees and show added, removed, or modified branches'));
  console.log(w('   reis tree lint <file>       - Check decision tree for issues like circular refs or unbalanced branches'));
  console.log(w('   reis tree --interactive     - Enable interactive mode with arrow key navigation and selection'));
  console.log('');

  // Decision Tracking
  console.log(w('   Decision Tracking'));
  console.log(w('   ─────────────────'));
  console.log(w('   reis decisions list         - Display all recorded decisions with tree, selection, and timestamp'));
  console.log(w('   reis decisions show <id>    - View detailed information about a specific decision including context'));
  console.log(w('   reis decisions revert <id>  - Mark a decision as reverted and optionally select a new option'));
  console.log(w('   reis decisions export       - Export decision history to JSON or CSV format for analysis'));
  console.log(w('   reis decisions stats        - Show decision statistics including counts by tree, risk, and time period'));
  console.log('');

  // Research & Discussion
  console.log(w('   Research & Discussion'));
  console.log(w('   ─────────────────────'));
  console.log(w('   reis research <topic>       - Research a topic and gather information for implementation decisions'));
  console.log(w('   reis discuss <topic>        - Start a discussion thread about implementation options and trade-offs'));
  console.log(w('   reis assumptions            - Document and track project assumptions that may affect implementation'));
  console.log('');

  // Utilities
  console.log(w('   Utilities'));
  console.log(w('   ─────────'));
  console.log(w('   reis todo <desc>            - Add a new TODO item to track tasks that need attention'));
  console.log(w('   reis todos [area]           - List all TODO items, optionally filtered by area or status'));
  console.log(w('   reis debug [target] [--dry-run] [--verbose] [--input <path>] [--timeout <ms>]'));
  console.log(w('                               - Analyze failures using reis_debugger subagent'));
  console.log(w('   reis update                 - Check for and install the latest version of REIS'));
  console.log(w('   reis whats-new              - Display release notes and new features in the latest version'));
  console.log(w('   reis docs                   - Open REIS documentation in your default browser'));
  console.log(w('   reis uninstall              - Remove REIS from your system and clean up configuration files'));
  console.log('');

  // Help & Info
  console.log(w('   Help & Info'));
  console.log(w('   ───────────'));
  console.log(w('   reis help                   - Show this help message with all available commands'));
  console.log(w('   reis version                - Display current version, install location, and system information'));
  console.log('');

  // Footer
  console.log(w('   Use \'reis <command> --help\' for more information on a specific command.'));
  console.log('');
  
  return 0;
};
