# Command Implementation Guide

This guide describes the standard pattern for implementing REIS commands.

## Command File Structure

Each command should be implemented as a separate file in `lib/commands/` that exports a single function.

```javascript
module.exports = function commandName(args) {
  // Command implementation
};
```

## Standard Command Pattern

Here's the recommended pattern for implementing commands:

```javascript
const { showPrompt, showError, showSuccess, showInfo, checkPlanningDir } = require('../utils/command-helpers');

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

## Helper Functions

### Available Helpers (from `command-helpers.js`)

- **`showPrompt(message)`** - Display a prompt message for Rovo Dev
- **`showError(error)`** - Display error message in red with ✗ symbol
- **`showSuccess(message)`** - Display success message in green with ✓ symbol
- **`showInfo(message)`** - Display info message in cyan
- **`getVersion()`** - Get the current package version
- **`checkPlanningDir()`** - Check if `.planning/` directory exists

## Rovo Dev Integration

**Important:** REIS commands are designed to work with Rovo Dev, an AI development assistant.

### How it works:
1. User runs a REIS command (e.g., `reis new "my app"`)
2. Command outputs a prompt describing what needs to be done
3. Rovo Dev receives the prompt and executes the actual work
4. Rovo Dev creates files, modifies code, and completes the task

### Prompt Guidelines:
- Keep prompts clear and actionable
- Describe the desired outcome, not implementation details
- Reference REIS methodology and subagents when appropriate
- Include context from command arguments

### Example Prompts:

**Good:**
```
Initialize a new REIS project for: todo app. Create .planning/ directory with PROJECT.md, REQUIREMENTS.md, ROADMAP.md, and STATE.md using REIS methodology.
```

**Bad:**
```
Create a directory and some files
```

## Command Categories

Commands are organized into categories:

### Getting Started
- `new` - Initialize new project
- `map` - Map existing codebase
- `requirements` - Generate requirements
- `roadmap` - Generate roadmap

### Phase Management
- `plan` - Create detailed plan
- `discuss` - Discuss implementation
- `research` - Research solutions
- `assumptions` - Document assumptions
- `execute` - Execute phase
- `execute-plan` - Execute specific plan
- `verify` - Verify completion

### Progress
- `progress` - Show progress
- `pause` - Pause work
- `resume` - Resume work

### Roadmap Management
- `add` - Add feature
- `insert` - Insert feature at phase
- `remove` - Remove phase

### Milestones
- `milestone` - Manage milestones

### Utilities
- `todo` - Add TODO
- `todos` - List TODOs
- `debug` - Debug issue
- `update` - Update REIS
- `whats-new` - Show changes
- `docs` - Open documentation
- `uninstall` - Uninstall REIS
- `help` - Show help
- `version` - Show version

## Implementation Checklist

When implementing a new command:

- [ ] Create command file in `lib/commands/`
- [ ] Export function with appropriate name
- [ ] Add validation if command requires REIS project
- [ ] Construct clear prompt for Rovo Dev
- [ ] Use helper functions for output
- [ ] Handle errors gracefully
- [ ] Update `bin/reis.js` to wire the command
- [ ] Test the command manually

## Testing Commands

Test commands directly with Node:

```bash
# Test command function
node -e "require('./lib/commands/example.js')({arg: 'value'})"

# Test via CLI
node bin/reis.js example value
```

## Error Handling

Always provide helpful error messages:

```javascript
if (!checkPlanningDir()) {
  showError('Not a REIS project. Run "reis new" or "reis map" first.');
  process.exit(1);
}
```

## Exit Codes

- `0` - Success
- `1` - Error/failure

Return appropriate exit codes from command functions.
