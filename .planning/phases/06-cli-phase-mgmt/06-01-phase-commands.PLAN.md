# Plan: 06-01 - Implement Phase Management Commands

## Objective
Implement 7 phase-related commands: plan, discuss, research, assumptions, execute, execute-plan, verify.

## Context
These commands manage the phase execution workflow in REIS. Each command validates that a REIS project exists and outputs appropriate prompts for Rovo Dev.

## Dependencies
- Plan 05-01 (command infrastructure exists)

## Tasks

<task type="auto">
<name>Implement plan, discuss, and research commands</name>
<files>lib/commands/plan.js, lib/commands/discuss.js, lib/commands/research.js</files>
<action>
Create lib/commands/plan.js:
- Accept [phase] argument (required)
- Validate: checkPlanningDir() - show error if not REIS project
- Validate: phase is a number
- Output prompt: "Plan phase {N} using REIS methodology. Use the reis_planner subagent to break down the phase into 2-3 task plans with clear dependencies, success criteria, and verification steps. Save plans to .planning/phases/{N}-{name}/"
- Use showPrompt(), showError(), checkPlanningDir()

Create lib/commands/discuss.js:
- Accept [phase] argument (required)
- Validate: checkPlanningDir() and phase is number
- Output prompt: "Discuss phase {N} implementation. Gather context, ask clarifying questions, identify potential challenges, and document key decisions before planning. Update .planning/STATE.md with discussion notes."
- Use command-helpers

Create lib/commands/research.js:
- Accept [phase] argument (required)
- Validate: checkPlanningDir() and phase is number
- Output prompt: "Research implementation approaches for phase {N}. Investigate best practices, libraries, patterns, and document findings. Update .planning/STATE.md with research results."
- Use command-helpers

All three: module.exports = function(args) { const phase = args.phase; ... }
</action>
<verify>node -e "require('./lib/commands/plan.js')({phase: 1})" && node -e "require('./lib/commands/discuss.js')({phase: 1})" && node -e "require('./lib/commands/research.js')({phase: 1})"</verify>
<done>plan.js, discuss.js, and research.js implemented with validation and correct prompts</done>
</task>

<task type="auto">
<name>Implement assumptions, execute, and execute-plan commands</name>
<files>lib/commands/assumptions.js, lib/commands/execute.js, lib/commands/execute-plan.js</files>
<action>
Create lib/commands/assumptions.js:
- Accept [phase] argument (required)
- Validate: checkPlanningDir() and phase is number
- Output prompt: "List all assumptions for phase {N}. Review the phase requirements, identify dependencies, technical assumptions, and potential risks. Document in .planning/STATE.md."
- Use command-helpers

Create lib/commands/execute.js:
- Accept [phase] argument (required)
- Validate: checkPlanningDir() and phase is number
- Output prompt: "Execute phase {N} using REIS methodology. Use the reis_executor subagent to execute all plans for this phase in parallel where possible (up to 4 simultaneous tasks). Each task gets fresh 200k context. Update .planning/STATE.md with progress."
- Use command-helpers

Create lib/commands/execute-plan.js:
- Accept <path> argument (required)
- Validate: checkPlanningDir()
- Validate: path is provided
- Output prompt: "Execute the specific plan at {path} using the reis_executor subagent. Follow the plan's tasks sequentially, verify each step, and update .planning/STATE.md when complete."
- Use command-helpers

All export functions accepting args parameter.
</action>
<verify>node -e "require('./lib/commands/assumptions.js')({phase: 1})" && node -e "require('./lib/commands/execute.js')({phase: 1})" && node -e "require('./lib/commands/execute-plan.js')({path: 'test.PLAN.md'})"</verify>
<done>assumptions.js, execute.js, and execute-plan.js implemented with validation and correct prompts</done>
</task>

<task type="auto">
<name>Implement verify command and wire all to CLI</name>
<files>lib/commands/verify.js, bin/reis.js</files>
<action>
Create lib/commands/verify.js:
- Accept [phase] argument (required)
- Validate: checkPlanningDir() and phase is number
- Output prompt: "Verify all work completed for phase {N}. Run tests, check success criteria from plans, validate functionality, and confirm all tasks are done. Update .planning/STATE.md with verification results."
- Use command-helpers

Update bin/reis.js to wire all 7 commands:
1. Add requires at top:
const planCmd = require('../lib/commands/plan.js');
const discussCmd = require('../lib/commands/discuss.js');
const researchCmd = require('../lib/commands/research.js');
const assumptionsCmd = require('../lib/commands/assumptions.js');
const executeCmd = require('../lib/commands/execute.js');
const executePlanCmd = require('../lib/commands/execute-plan.js');
const verifyCmd = require('../lib/commands/verify.js');

2. Update command actions:
- plan [phase]: .action((phase) => planCmd({phase}))
- discuss [phase]: .action((phase) => discussCmd({phase}))
- research [phase]: .action((phase) => researchCmd({phase}))
- assumptions [phase]: .action((phase) => assumptionsCmd({phase}))
- execute [phase]: .action((phase) => executeCmd({phase}))
- execute-plan <path>: .action((path) => executePlanCmd({path}))
- verify [phase]: .action((phase) => verifyCmd({phase}))

Test each command.
</action>
<verify>node -e "require('./lib/commands/verify.js')({phase: 1})" && node bin/reis.js plan 1 && node bin/reis.js verify 1</verify>
<done>verify.js implemented, all 7 phase commands wired to CLI and tested</done>
</task>

## Success Criteria
- All 7 phase management commands implemented
- Each command validates REIS project exists
- Each command validates phase number when required
- execute-plan validates path is provided
- All commands output appropriate prompts for Rovo Dev
- Commands reference correct subagents (reis_planner, reis_executor)
- All commands integrated into bin/reis.js CLI

## Verification
```bash
# Test all phase commands
node bin/reis.js plan 1
node bin/reis.js discuss 1
node bin/reis.js research 1
node bin/reis.js assumptions 1
node bin/reis.js execute 1
node bin/reis.js execute-plan .planning/phases/01/plan.PLAN.md
node bin/reis.js verify 1
```
