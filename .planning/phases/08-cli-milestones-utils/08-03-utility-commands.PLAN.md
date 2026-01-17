# Plan: 08-03 - Implement Utility Commands

## Objective
Implement final 4 utility commands: update, whats-new, docs, uninstall.

## Context
These are system-level utilities for package management, documentation access, and maintenance.

## Dependencies
- Plan 05-01 (command infrastructure exists)
- Plan 02-01 (installation system, needed for understanding uninstall)

## Tasks

<task type="auto">
<name>Implement update and whats-new commands</name>
<files>lib/commands/update.js, lib/commands/whats-new.js</files>
<action>
Create lib/commands/update.js:
- No arguments required
- Check current version from package.json
- Output message:
  "Checking for REIS updates..."
  "Current version: {version}"
  "To update: npm update -g reis"
  "(If installed via npx, it will automatically use latest)"
- Use showInfo() and getVersion() from command-helpers
- Note: Since this is npx-based, updates are automatic, but inform user

Create lib/commands/whats-new.js:
- No arguments required
- Display recent changes and new features
- Output formatted changelog:
  "REIS v1.0.0 - What's New"
  "• Initial release"
  "• 29 commands for systematic development"
  "• Parallel subagent execution (up to 4 simultaneous)"
  "• Fresh context per task (200k tokens)"
  "• Transformed from GSD for Rovo Dev"
  ""
  "Full documentation: ~/.rovodev/reis/README.md"
- Use showInfo() from command-helpers
- For future versions, this would read from CHANGELOG.md

Both export: module.exports = function(args) { ... }
</action>
<verify>node -e "require('./lib/commands/update.js')({})" && node -e "require('./lib/commands/whats-new.js')({})"</verify>
<done>update.js and whats-new.js implemented with version info and changelog</done>
</task>

<task type="auto">
<name>Implement docs and uninstall commands</name>
<files>lib/commands/docs.js, lib/commands/uninstall.js</files>
<action>
Create lib/commands/docs.js:
- No arguments required
- Display documentation locations and options
- Output:
  "REIS Documentation"
  ""
  "Documentation is installed at:"
  "  ~/.rovodev/reis/"
  ""
  "Available docs:"
  "  • README.md - Main documentation"
  "  • QUICK_REFERENCE.md - Quick command reference"
  "  • WORKFLOW_EXAMPLES.md - Example workflows"
  "  • COMPLETE_COMMANDS.md - All 29 commands detailed"
  "  • INTEGRATION_GUIDE.md - Rovo Dev integration"
  ""
  "To open: cat ~/.rovodev/reis/README.md"
- Use showInfo() from command-helpers

Create lib/commands/uninstall.js:
- No arguments required
- Display uninstall instructions
- Output:
  "Uninstall REIS"
  ""
  "To remove REIS files:"
  "  rm -rf ~/.rovodev/reis/"
  "  rm -rf ~/.rovodev/subagents/reis_*.md"
  ""
  "To uninstall the package:"
  "  npm uninstall -g reis"
  "(If installed via npx, no package uninstall needed)"
  ""
  "Warning: This will remove all REIS documentation and templates."
  "Your project .planning/ directories will not be affected."
- Use showInfo() and chalk.yellow() for warning from command-helpers

Both export: module.exports = function(args) { ... }
</action>
<verify>node -e "require('./lib/commands/docs.js')({})" && node -e "require('./lib/commands/uninstall.js')({})"</verify>
<done>docs.js and uninstall.js implemented with helpful information</done>
</task>

<task type="auto">
<name>Wire final commands to CLI</name>
<files>bin/reis.js</files>
<action>
Update bin/reis.js to wire the final 4 commands:

1. Add requires at top:
const updateCmd = require('../lib/commands/update.js');
const whatsNewCmd = require('../lib/commands/whats-new.js');
const docsCmd = require('../lib/commands/docs.js');
const uninstallCmd = require('../lib/commands/uninstall.js');

2. Update command actions:
- update: .action(() => updateCmd({}))
- whats-new: .action(() => whatsNewCmd({}))
- docs: .action(() => docsCmd({}))
- uninstall: .action(() => uninstallCmd({}))

3. Verify all 29 commands are now wired
4. Remove any placeholder/stub code from earlier phases
5. Test that default action (no command) shows helpful message

Test each command works correctly.
</action>
<verify>node bin/reis.js update && node bin/reis.js whats-new && node bin/reis.js docs && node bin/reis.js uninstall</verify>
<done>All 29 commands wired to CLI, complete command set implemented and tested</done>
</task>

## Success Criteria
- update command shows version and update instructions
- whats-new command displays changelog/features
- docs command shows documentation locations
- uninstall command provides safe uninstall instructions
- All commands work without requiring REIS project
- All 29 commands now implemented in REIS CLI
- bin/reis.js has no placeholder code remaining

## Verification
```bash
# Test utility commands
node bin/reis.js update
node bin/reis.js whats-new
node bin/reis.js docs
node bin/reis.js uninstall

# Verify all 29 commands work
node bin/reis.js help  # Should list all 29 commands

# Test CLI completeness
node bin/reis.js  # Should show helpful message
```
