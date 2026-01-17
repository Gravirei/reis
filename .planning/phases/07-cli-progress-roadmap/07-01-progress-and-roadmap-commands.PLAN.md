# Plan: 07-01 - Implement Progress and Roadmap Commands

## Objective
Implement 6 commands: progress, pause, resume, add, insert, remove.

## Context
These commands handle project progress tracking and roadmap modifications. They interact with .planning/STATE.md and .planning/ROADMAP.md files.

## Dependencies
- Plan 05-01 (command infrastructure exists)

## Tasks

<task type="auto">
<name>Implement progress, pause, and resume commands</name>
<files>lib/commands/progress.js, lib/commands/pause.js, lib/commands/resume.js</files>
<action>
Create lib/commands/progress.js:
- Validate: checkPlanningDir()
- Output prompt: "Show current project progress. Read .planning/STATE.md and .planning/ROADMAP.md to display: current phase, completed phases, active tasks, blockers, and next recommended actions. Format output clearly with status indicators."
- Use command-helpers

Create lib/commands/pause.js:
- Validate: checkPlanningDir()
- Output prompt: "Pause work and create a handoff document. Update .planning/STATE.md with: current progress, work in progress, next steps, active decisions, and any blockers. Ensure another developer could resume from this point."
- Use command-helpers

Create lib/commands/resume.js:
- Validate: checkPlanningDir()
- Output prompt: "Resume work from last session. Read .planning/STATE.md to understand: last completed work, work in progress, next actions, and any blockers. Provide a summary and recommend next steps."
- Use command-helpers

All export: module.exports = function(args) { ... }
</action>
<verify>node -e "require('./lib/commands/progress.js')({})" && node -e "require('./lib/commands/pause.js')({})" && node -e "require('./lib/commands/resume.js')({})"</verify>
<done>progress.js, pause.js, and resume.js implemented with validation and correct prompts</done>
</task>

<task type="auto">
<name>Implement add, insert, and remove commands</name>
<files>lib/commands/add.js, lib/commands/insert.js, lib/commands/remove.js</files>
<action>
Create lib/commands/add.js:
- Accept <feature> argument (required)
- Validate: checkPlanningDir()
- Validate: feature is provided
- Output prompt: "Add a new phase to the roadmap for: {feature}. Append to .planning/ROADMAP.md with proper phase numbering, goals, deliverables, and success criteria following REIS methodology."
- Use command-helpers

Create lib/commands/insert.js:
- Accept <phase> and <feature> arguments (both required)
- Validate: checkPlanningDir()
- Validate: phase is number and feature is provided
- Output prompt: "Insert a new phase at position {phase} for: {feature}. Update .planning/ROADMAP.md by renumbering existing phases and adding the new phase with proper goals, deliverables, and success criteria."
- Use command-helpers

Create lib/commands/remove.js:
- Accept <phase> argument (required)
- Validate: checkPlanningDir()
- Validate: phase is number
- Output prompt: "Remove phase {phase} from the roadmap. Update .planning/ROADMAP.md by removing the phase and renumbering remaining phases. Archive any existing plans for this phase."
- Use command-helpers

All validate required arguments before showing prompts.
</action>
<verify>node -e "require('./lib/commands/add.js')({feature: 'new feature'})" && node -e "require('./lib/commands/insert.js')({phase: 2, feature: 'inserted'})" && node -e "require('./lib/commands/remove.js')({phase: 3})"</verify>
<done>add.js, insert.js, and remove.js implemented with validation and correct prompts</done>
</task>

<task type="auto">
<name>Wire all commands to CLI</name>
<files>bin/reis.js</files>
<action>
Update bin/reis.js to wire all 6 commands:

1. Add requires at top:
const progressCmd = require('../lib/commands/progress.js');
const pauseCmd = require('../lib/commands/pause.js');
const resumeCmd = require('../lib/commands/resume.js');
const addCmd = require('../lib/commands/add.js');
const insertCmd = require('../lib/commands/insert.js');
const removeCmd = require('../lib/commands/remove.js');

2. Update command actions:
- progress: .action(() => progressCmd({}))
- pause: .action(() => pauseCmd({}))
- resume: .action(() => resumeCmd({}))
- add <feature>: .action((feature) => addCmd({feature}))
- insert <phase> <feature>: .action((phase, feature) => insertCmd({phase, feature}))
- remove <phase>: .action((phase) => removeCmd({phase}))

3. Ensure commander properly captures multiple arguments for insert command

Test all commands work correctly.
</action>
<verify>node bin/reis.js progress && node bin/reis.js add "test feature" && node bin/reis.js insert 2 "new phase"</verify>
<done>All 6 commands wired to CLI, tested and working correctly</done>
</task>

## Success Criteria
- All 6 commands implemented (progress, pause, resume, add, insert, remove)
- Each command validates REIS project exists
- add validates feature is provided
- insert validates both phase and feature
- remove validates phase number
- All commands output appropriate prompts for Rovo Dev
- All commands integrated into bin/reis.js CLI

## Verification
```bash
# Test progress tracking commands
node bin/reis.js progress
node bin/reis.js pause
node bin/reis.js resume

# Test roadmap modification commands
node bin/reis.js add "new feature"
node bin/reis.js insert 2 "inserted phase"
node bin/reis.js remove 5
```
