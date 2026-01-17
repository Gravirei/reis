# Plan: 05-02 - Implement Core Commands

## Objective
Implement 6 core REIS commands: help, version, new, map, requirements, roadmap.

## Context
These are the foundational commands users will run first. Each command outputs a prompt for Rovo Dev to execute, following the GSD/REIS methodology.

## Dependencies
- Plan 05-01 (command infrastructure exists)

## Tasks

<task type="auto">
<name>Implement help and version commands</name>
<files>lib/commands/help.js, lib/commands/version.js</files>
<action>
Create lib/commands/help.js:
- Display "REIS - Roadmap Execution & Implementation System"
- Show version
- List all 29 commands with brief descriptions
- Group by category:
  * Getting Started: new, map, requirements, roadmap
  * Phase Management: plan, discuss, research, assumptions, execute, execute-plan, verify
  * Progress: progress, pause, resume
  * Roadmap: add, insert, remove
  * Milestones: milestone complete/discuss/new
  * Utilities: todo, todos, debug, update, whats-new, docs, uninstall
- Show "Run 'reis <command>' for details"
- Use chalk for colorful output

Create lib/commands/version.js:
- Display version from package.json
- Display "REIS v{version}"
- Show install location: "~/.rovodev/reis/"
- Use getVersion() from command-helpers

Both use: const { showInfo, getVersion } = require('../utils/command-helpers');
</action>
<verify>node -e "require('./lib/commands/help.js')()" && node -e "require('./lib/commands/version.js')()"</verify>
<done>help.js and version.js implemented, display correct information with colorful output</done>
</task>

<task type="auto">
<name>Implement new and map commands</name>
<files>lib/commands/new.js, lib/commands/map.js</files>
<action>
Create lib/commands/new.js:
- Accept [idea] argument (optional)
- Output prompt for Rovo Dev:
  * If idea provided: "Initialize a new REIS project for: {idea}. Create .planning/ directory with PROJECT.md, REQUIREMENTS.md, ROADMAP.md, and STATE.md using REIS methodology."
  * If no idea: "Initialize a new REIS project. Ask me about the project idea, then create .planning/ directory with PROJECT.md, REQUIREMENTS.md, ROADMAP.md, and STATE.md."
- Use showPrompt() from command-helpers

Create lib/commands/map.js:
- Output prompt for Rovo Dev:
  "Map this existing codebase using REIS methodology. Analyze the project structure, tech stack, and create .planning/PROJECT.md with comprehensive documentation. Use the reis_project_mapper subagent."
- Use showPrompt() from command-helpers
- Note: This invokes reis_project_mapper subagent

Both export: module.exports = function(args) { ... }
</action>
<verify>node -e "require('./lib/commands/new.js')({idea: 'test app'})" && node -e "require('./lib/commands/map.js')({})"</verify>
<done>new.js and map.js implemented, output correct prompts for project initialization</done>
</task>

<task type="auto">
<name>Implement requirements and roadmap commands</name>
<files>lib/commands/requirements.js, lib/commands/roadmap.js</files>
<action>
Create lib/commands/requirements.js:
- Check if .planning/ exists (use checkPlanningDir)
- If not: show error "Not a REIS project. Run 'reis new' or 'reis map' first."
- Output prompt for Rovo Dev:
  "Define detailed requirements for this project. Update .planning/REQUIREMENTS.md with functional and non-functional requirements following REIS methodology. Ask clarifying questions if needed."
- Use showPrompt() and checkPlanningDir() from command-helpers

Create lib/commands/roadmap.js:
- Check if .planning/ exists
- If not: show error
- Output prompt for Rovo Dev:
  "Create a comprehensive project roadmap. Break the project into phases in .planning/ROADMAP.md based on requirements. Each phase should have clear goals, deliverables, and success criteria following REIS methodology."
- Use showPrompt() and checkPlanningDir()

Both handle validation and provide clear prompts.
</action>
<verify>node -e "require('./lib/commands/requirements.js')({})" && node -e "require('./lib/commands/roadmap.js')({})"</verify>
<done>requirements.js and roadmap.js implemented, validate project exists, output correct prompts</done>
</task>

<task type="auto">
<name>Wire commands to bin/reis.js</name>
<files>bin/reis.js</files>
<action>
Update bin/reis.js to wire the 6 implemented commands:

1. At top, add requires:
const helpCmd = require('../lib/commands/help.js');
const versionCmd = require('../lib/commands/version.js');
const newCmd = require('../lib/commands/new.js');
const mapCmd = require('../lib/commands/map.js');
const requirementsCmd = require('../lib/commands/requirements.js');
const roadmapCmd = require('../lib/commands/roadmap.js');

2. Update command actions:
- help command: .action(() => helpCmd())
- version command: .action(() => versionCmd())
- new command: .action((idea) => newCmd({idea}))
- map command: .action(() => mapCmd({}))
- requirements command: .action(() => requirementsCmd({}))
- roadmap command: .action(() => roadmapCmd({}))

3. Keep other commands as placeholders for now

Test each command after wiring.
</action>
<verify>node bin/reis.js help && node bin/reis.js version && node bin/reis.js new "test app"</verify>
<done>All 6 core commands wired to CLI, tested and working correctly</done>
</task>

## Success Criteria
- help command displays all 29 commands in organized categories
- version command shows version and install location
- new command accepts optional idea and outputs appropriate prompt
- map command outputs prompt for codebase mapping
- requirements command validates project exists and outputs prompt
- roadmap command validates project exists and outputs prompt
- All commands integrated into bin/reis.js CLI
- Commands output prompts suitable for Rovo Dev

## Verification
```bash
# Test all core commands
node bin/reis.js help
node bin/reis.js version
node bin/reis.js new "my app idea"
node bin/reis.js map
node bin/reis.js requirements
node bin/reis.js roadmap
```
