# Plan: 05-01 - Command Infrastructure and Router

## Objective
Build the command routing infrastructure and utility functions to support all 29 REIS commands.

## Context
Create the foundation for the CLI command system:
- Command router in bin/reis.js
- Utility functions for common operations
- Command base structure
- Help system framework

This enables Phase 5-8 to implement individual commands cleanly.

## Dependencies
- Plan 01-02 (bin/reis.js exists)
- Plan 02-01 (installation system complete, so commands can reference it)

## Tasks

<task type="auto">
<name>Create command utility helpers</name>
<files>lib/utils/command-helpers.js</files>
<action>
Create lib/utils/command-helpers.js with reusable functions:

1. showPrompt(message) - Display a prompt message for Rovo Dev
   - Format: console.log(message)
   - Returns the message so it can be used programmatically

2. showError(error) - Display error message
   - Use chalk.red for errors
   - Format: "✗ Error: {message}"

3. showSuccess(message) - Display success message
   - Use chalk.green
   - Format: "✓ {message}"

4. showInfo(message) - Display info message
   - Use chalk.cyan
   - Format: "{message}"

5. getVersion() - Get package version
   - Read from package.json
   - Return version string

6. checkPlanningDir() - Check if .planning/ exists
   - Return true/false
   - Used by commands that require a REIS project

Use CommonJS: module.exports = { showPrompt, showError, showSuccess, showInfo, getVersion, checkPlanningDir };
</action>
<verify>node -e "const h = require('./lib/utils/command-helpers.js'); console.log(typeof h.showPrompt)"</verify>
<done>command-helpers.js created with 6 utility functions, all exportable and testable</done>
</task>

<task type="auto">
<name>Update bin/reis.js with command router</name>
<files>bin/reis.js</files>
<action>
Update bin/reis.js to implement full command routing:

1. Remove placeholder message from Phase 1
2. Set up commander properly:
   - version from package.json
   - description: "Roadmap Execution & Implementation System"
   - Usage examples

3. Create command structure (commands will be implemented in later tasks):
   - Use program.command() for each command
   - Add .description() for each
   - Add .action() that will call handler functions
   - For now, handlers can log: "Command coming soon in Phase 5-8"

4. Commands to register (29 total):
   - help (custom, not default --help)
   - version (custom, not default --version)
   - new [idea]
   - map
   - requirements
   - roadmap
   - plan [phase]
   - discuss [phase]
   - research [phase]
   - assumptions [phase]
   - execute [phase]
   - execute-plan <path>
   - verify [phase]
   - progress
   - pause
   - resume
   - add <feature>
   - insert <phase> <feature>
   - remove <phase>
   - milestone <subcommand>
   - todo <description>
   - todos [area]
   - debug <issue>
   - update
   - whats-new
   - docs
   - uninstall

5. Add default action (no command):
   - Show "Run 'reis help' for available commands"

6. Parse arguments: program.parse(process.argv)

Note: Keep handlers minimal for now - full implementation comes in Phase 5-8.
</action>
<verify>node bin/reis.js 2>&1 | grep -i "reis\|help" && node bin/reis.js --version</verify>
<done>bin/reis.js updated with complete command routing structure, all 29 commands registered</done>
</task>

<task type="auto">
<name>Create command base template</name>
<files>lib/commands/README.md</files>
<action>
Create lib/commands/README.md as a guide for implementing commands:

Document the command implementation pattern:

1. Command file structure:
   - Export a function: module.exports = function commandName(args) { ... }
   - Use command-helpers for output
   - Return appropriate exit code

2. Command pattern example:
```javascript
const { showPrompt, showError, checkPlanningDir } = require('../utils/command-helpers');

module.exports = function exampleCommand(args) {
  // 1. Validate (if needed)
  if (!checkPlanningDir()) {
    showError('Not a REIS project. Run "reis new" or "reis map" first.');
    process.exit(1);
  }

  // 2. Execute command logic
  const prompt = `Show me [what to do]`;
  
  // 3. Display prompt for Rovo Dev
  showPrompt(prompt);
  
  return 0;
};
```

3. Note about Rovo Dev integration:
   - Commands output prompts, not functionality
   - Prompts tell Rovo Dev what to execute
   - Keep prompts clear and actionable

This README guides implementation in Phase 5-8.
</action>
<verify>cat lib/commands/README.md | grep -i "module.exports"</verify>
<done>Command implementation guide created in lib/commands/README.md</done>
</task>

## Success Criteria
- lib/utils/command-helpers.js provides 6 utility functions
- bin/reis.js has complete command routing for all 29 commands
- Running `node bin/reis.js` shows helpful message
- Command implementation guide exists
- Infrastructure ready for Phase 5-8 command implementation

## Verification
```bash
# Test command helpers
node -e "const h = require('./lib/utils/command-helpers.js'); console.log(Object.keys(h))"

# Test CLI router
node bin/reis.js
node bin/reis.js --version
node bin/reis.js help

# Check command guide
cat lib/commands/README.md
```
