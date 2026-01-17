# Plan: 01-02 - CLI Entry Point

## Objective
Create the main CLI entry point (bin/reis.js) with basic command routing and help system.

## Context
This is the executable entry point that users interact with. It needs to:
- Have proper shebang for Node.js
- Parse command-line arguments
- Route to appropriate command handlers
- Show help when no command is provided

## Dependencies
- Plan 01-01 (package.json and directory structure must exist)

## Tasks

<task type="auto">
<name>Create bin/reis.js executable entry point</name>
<files>bin/reis.js</files>
<action>
Create bin/reis.js with:

1. Shebang: #!/usr/bin/env node
2. Require commander for CLI parsing
3. Set version from package.json
4. Define basic command structure:
   - Default action: show help
   - --version/-V flag
   - --help/-h flag
5. Add placeholder comment: "// Commands will be added in Phase 5-8"
6. For now, just show a simple message: "REIS v1.0.0 - Commands coming soon. Run 'reis help' for more info."

Make file executable: chmod +x bin/reis.js

Keep it simple for now - full command routing comes in Phase 5-8.
</action>
<verify>node bin/reis.js && node bin/reis.js --version</verify>
<done>bin/reis.js exists, is executable, runs without errors, shows version correctly</done>
</task>

<task type="auto">
<name>Create lib/index.js module entry point</name>
<files>lib/index.js</files>
<action>
Create lib/index.js as the main module export file.

For now, just export an empty object with a comment:
// Main REIS module exports
// This will be populated as commands are implemented

module.exports = {};

This satisfies the "main" field in package.json.
</action>
<verify>node -e "require('./lib/index.js')"</verify>
<done>lib/index.js exists and can be required without errors</done>
</task>

<task type="auto">
<name>Test basic package functionality</name>
<files>bin/reis.js, package.json</files>
<action>
Run basic tests to ensure package structure works:

1. Test CLI runs: node bin/reis.js
2. Test version flag: node bin/reis.js --version
3. Test help flag: node bin/reis.js --help
4. Test module loads: node -e "require('./lib/index.js')"

All should run without errors. Output can be minimal/placeholder at this stage.
</action>
<verify>node bin/reis.js && node bin/reis.js --version && node -e "require('./lib/index.js')"</verify>
<done>All basic package functionality tests pass without errors</done>
</task>

## Success Criteria
- bin/reis.js exists and is executable
- Running `node bin/reis.js` shows placeholder message
- Version flag works correctly
- lib/index.js can be required
- No errors when testing basic functionality

## Verification
```bash
# Test CLI entry point
node bin/reis.js
node bin/reis.js --version
node bin/reis.js --help

# Test module loading
node -e "require('./lib/index.js')"

# Check file is executable
ls -la bin/reis.js | grep "x"
```
