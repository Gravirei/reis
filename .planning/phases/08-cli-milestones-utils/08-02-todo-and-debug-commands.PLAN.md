# Plan: 08-02 - Implement TODO and Debug Commands

## Objective
Implement 3 commands: todo, todos, debug.

## Context
These commands help with task tracking (TODOs) and systematic debugging within a REIS project.

## Dependencies
- Plan 05-01 (command infrastructure exists)

## Tasks

<task type="auto">
<name>Implement todo and todos commands</name>
<files>lib/commands/todo.js, lib/commands/todos.js</files>
<action>
Create lib/commands/todo.js:
- Accept <description> argument (required)
- Validate: checkPlanningDir()
- Validate: description is provided
- Output prompt: "Add TODO item: {description}. Append to .planning/STATE.md in the TODOs section with timestamp and context. Format: - [ ] {description} (added: {date})"
- Use command-helpers

Create lib/commands/todos.js:
- Accept [area] argument (optional)
- Validate: checkPlanningDir()
- Output prompt based on area:
  * If area provided: "Show all TODO items for area: {area}. Read .planning/STATE.md and display TODOs matching this area with their status and priority."
  * If no area: "Show all TODO items. Read .planning/STATE.md and display all TODOs grouped by area, with status indicators and priorities."
- Use command-helpers

Both export: module.exports = function(args) { ... }
</action>
<verify>node -e "require('./lib/commands/todo.js')({description: 'Fix bug in auth'})" && node -e "require('./lib/commands/todos.js')({area: 'auth'})" && node -e "require('./lib/commands/todos.js')({})"</verify>
<done>todo.js and todos.js implemented with validation and correct prompts</done>
</task>

<task type="auto">
<name>Implement debug command</name>
<files>lib/commands/debug.js</files>
<action>
Create lib/commands/debug.js:
- Accept <issue> argument (required)
- Validate: checkPlanningDir()
- Validate: issue is provided
- Output prompt: "Systematic debugging for: {issue}. Follow REIS debugging methodology: 1) Reproduce the issue, 2) Isolate the problem, 3) Identify root cause, 4) Test solution, 5) Verify fix. Document findings in .planning/STATE.md."
- Use command-helpers

The prompt guides a structured debugging approach rather than ad-hoc investigation.

Export: module.exports = function(args) { ... }
</action>
<verify>node -e "require('./lib/commands/debug.js')({issue: 'login fails on mobile'})"</verify>
<done>debug.js implemented with validation and systematic debugging prompt</done>
</task>

<task type="auto">
<name>Wire commands to CLI</name>
<files>bin/reis.js</files>
<action>
Update bin/reis.js to wire all 3 commands:

1. Add requires at top:
const todoCmd = require('../lib/commands/todo.js');
const todosCmd = require('../lib/commands/todos.js');
const debugCmd = require('../lib/commands/debug.js');

2. Update command actions:
- todo <description>: .action((description) => todoCmd({description}))
- todos [area]: .action((area) => todosCmd({area}))
- debug <issue>: .action((issue) => debugCmd({issue}))

Test each command works correctly.
</action>
<verify>node bin/reis.js todo "implement feature X" && node bin/reis.js todos && node bin/reis.js debug "auth bug"</verify>
<done>All 3 commands wired to CLI, tested and working correctly</done>
</task>

## Success Criteria
- todo command accepts description and outputs correct prompt
- todos command works with optional area parameter
- debug command accepts issue description and outputs systematic debugging prompt
- All commands validate REIS project exists
- All commands validate required arguments
- All commands integrated into bin/reis.js CLI

## Verification
```bash
# Test TODO commands
node bin/reis.js todo "implement user dashboard"
node bin/reis.js todos
node bin/reis.js todos auth

# Test debug command
node bin/reis.js debug "payment processing fails intermittently"
```
