# Plan: 08-01 - Implement Milestone Commands

## Objective
Implement milestone management command with 3 subcommands: milestone complete, milestone discuss, milestone new.

## Context
Milestones group multiple phases together. These commands manage milestone lifecycle in the roadmap.

## Dependencies
- Plan 05-01 (command infrastructure exists)

## Tasks

<task type="auto">
<name>Implement milestone command with subcommands</name>
<files>lib/commands/milestone.js</files>
<action>
Create lib/commands/milestone.js with subcommand handling:

Main function structure:
module.exports = function(args) {
  const subcommand = args.subcommand;
  const name = args.name;
  
  // Validate REIS project
  if (!checkPlanningDir()) {
    showError('Not a REIS project. Run "reis new" or "reis map" first.');
    process.exit(1);
  }
  
  // Handle subcommands
  switch(subcommand) {
    case 'complete':
      // Complete and archive milestone
      break;
    case 'discuss':
      // Discuss next milestone
      break;
    case 'new':
      // Create new milestone
      break;
    default:
      showError('Invalid milestone subcommand. Use: complete, discuss, or new');
      process.exit(1);
  }
}

Subcommand logic:

1. milestone complete [name]:
   - Validate name is provided
   - Output prompt: "Complete and archive milestone: {name}. Update .planning/ROADMAP.md to mark all phases in this milestone as complete. Create archive in .planning/archive/{name}/ with completed plans and summary."

2. milestone discuss:
   - No name required
   - Output prompt: "Discuss next milestone planning. Review completed work, gather requirements for upcoming milestone, identify goals, and plan the next set of phases. Document discussion in .planning/STATE.md."

3. milestone new [name]:
   - Validate name is provided
   - Output prompt: "Create new milestone: {name}. Add to .planning/ROADMAP.md with description, goals, and placeholder phases. Set up milestone structure following REIS methodology."

Use command-helpers for all output.
</action>
<verify>node -e "require('./lib/commands/milestone.js')({subcommand: 'discuss'})" && node -e "require('./lib/commands/milestone.js')({subcommand: 'new', name: 'v2'})"</verify>
<done>milestone.js implemented with 3 subcommands, validation, and correct prompts</done>
</task>

<task type="auto">
<name>Wire milestone command to CLI</name>
<files>bin/reis.js</files>
<action>
Update bin/reis.js to wire milestone command:

1. Add require at top:
const milestoneCmd = require('../lib/commands/milestone.js');

2. Update milestone command configuration:
   - Use commander's .command() with subcommands
   - For 'milestone complete [name]': .action((name) => milestoneCmd({subcommand: 'complete', name}))
   - For 'milestone discuss': .action(() => milestoneCmd({subcommand: 'discuss'}))
   - For 'milestone new <name>': .action((name) => milestoneCmd({subcommand: 'new', name}))

Alternative approach if commander doesn't handle subcommands well:
   - Parse 'milestone <subcommand> [name]' manually
   - Extract subcommand and name from args
   - Call milestoneCmd with appropriate parameters

Test all three subcommands work correctly.
</action>
<verify>node bin/reis.js milestone discuss && node bin/reis.js milestone new "Milestone 2" && node bin/reis.js milestone complete "Milestone 1"</verify>
<done>Milestone command wired to CLI with all 3 subcommands working</done>
</task>

## Success Criteria
- milestone command handles 3 subcommands: complete, discuss, new
- complete requires name parameter
- discuss works without parameters
- new requires name parameter
- All subcommands validate REIS project exists
- Invalid subcommands show helpful error
- All subcommands output appropriate prompts for Rovo Dev
- Command integrated into bin/reis.js CLI

## Verification
```bash
# Test milestone subcommands
node bin/reis.js milestone discuss
node bin/reis.js milestone new "Milestone 2"
node bin/reis.js milestone complete "Milestone 1"

# Test error handling
node bin/reis.js milestone invalid
node bin/reis.js milestone complete  # Missing name
```
