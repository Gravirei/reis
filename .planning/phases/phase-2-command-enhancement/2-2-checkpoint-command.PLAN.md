# Plan: 2-2 - Checkpoint Command

## Objective
Implement `reis checkpoint` command for manual checkpoint creation, listing, and management.

## Context
- Phase 1 StateManager supports checkpoint tracking in STATE.md
- Phase 1 GitIntegration supports creating checkpoints with git commits
- Checkpoints are currently auto-created by wave execution
- Need manual checkpoint command for ad-hoc saves during development
- Checkpoints should capture: state snapshot, git commit (optional), timestamp, custom name

## Dependencies
None - Can execute in Wave 1 (parallel with other commands)

## Tasks

<task type="auto">
<name>Create checkpoint command implementation</name>
<files>lib/commands/checkpoint.js</files>
<action>
Create new checkpoint.js command that:

1. Import Phase 1 utilities:
   - StateManager from '../utils/state-manager.js'
   - GitIntegration from '../utils/git-integration.js'
   - loadConfig from '../utils/config.js'
   - Command helpers for output formatting

2. Support multiple subcommands:
   - `reis checkpoint create [name]` - Create new checkpoint
   - `reis checkpoint list` - List all checkpoints with details
   - `reis checkpoint show <name>` - Show checkpoint details
   - `reis checkpoint` (no args) - List checkpoints (alias for list)

3. Create checkpoint flow:
   - Accept optional custom name (default: auto-generated from timestamp)
   - Load current STATE.md using StateManager
   - Validate REIS project exists (.planning/ directory)
   - Create git commit if:
     - Git repo exists AND
     - Working tree has changes AND
     - config.git.autoCommit is true OR --commit flag provided
   - Add checkpoint to STATE.md with:
     - Name (custom or generated)
     - Timestamp (ISO 8601)
     - Git commit SHA (if commit created)
     - Current phase/wave context
   - Update STATE.md using StateManager.addCheckpoint()
   - Display success message with checkpoint details

4. List checkpoints flow:
   - Load STATE.md using StateManager
   - Parse checkpoints section
   - Display formatted table:
     - Checkpoint name
     - Timestamp (relative: "2 hours ago")
     - Git commit SHA (first 7 chars)
     - Phase/wave context
   - Show count: "5 checkpoints found"
   - If no checkpoints: "No checkpoints yet. Create one with: reis checkpoint create"

5. Show checkpoint details:
   - Load STATE.md
   - Find checkpoint by name
   - Display full details:
     - Name
     - Full timestamp
     - Full git commit SHA and message
     - Phase and wave context
     - Git diff stats if available
   - If not found: "Checkpoint 'name' not found. Use 'reis checkpoint list' to see available checkpoints."

6. Add helpful flags:
   - --commit / -c - Force git commit even if auto-commit disabled
   - --no-commit - Skip git commit even if auto-commit enabled
   - --message / -m - Custom git commit message

WHY avoid certain approaches:
- Don't require git commit (not all users use git, checkpoints are about STATE.md)
- Don't overwrite existing checkpoint names (creates confusion)
- Don't use interactive prompts for checkpoint creation (keep it fast)
- Don't auto-clean old checkpoints (user decides when to remove)
</action>
<verify>
# Test command loads
node bin/reis.js checkpoint --help

# Test checkpoint creation
cd test/fixtures/sample-project 2>/dev/null || mkdir -p test/fixtures/sample-project/.planning
node bin/reis.js checkpoint create test-checkpoint --dry-run

# Test listing
node bin/reis.js checkpoint list
</verify>
<done>
- checkpoint.js created and loads without errors
- Create subcommand works with optional name
- List subcommand displays formatted checkpoints
- Show subcommand displays detailed checkpoint info
- Git integration respects config and flags
- STATE.md updates correctly
- Helpful error messages for all failure cases
</done>
</task>

<task type="auto">
<name>Create tests for checkpoint command</name>
<files>test/commands/checkpoint.test.js</files>
<action>
Create comprehensive test suite:

1. Setup test fixtures:
   - Temp directory with .planning/STATE.md
   - Sample STATE.md with existing checkpoints
   - Mock git repository
   - Sample reis.config.js

2. Test checkpoint create:
   - Create checkpoint with custom name
   - Create checkpoint with auto-generated name
   - Create checkpoint with git commit (--commit flag)
   - Create checkpoint without git commit (--no-commit flag)
   - Create checkpoint with custom message
   - Validate checkpoint added to STATE.md
   - Test duplicate name prevention
   - Test without REIS project (should error)

3. Test checkpoint list:
   - List checkpoints from STATE.md
   - List when no checkpoints exist
   - List with multiple checkpoints
   - Verify output formatting (table format)
   - Verify relative timestamps

4. Test checkpoint show:
   - Show existing checkpoint details
   - Show non-existent checkpoint (error)
   - Verify all checkpoint fields displayed
   - Verify git commit details if available

5. Test git integration:
   - Mock git commands to avoid side effects
   - Test auto-commit when enabled in config
   - Test --commit flag overrides config
   - Test --no-commit flag overrides config
   - Test git not initialized (should work without git)
   - Test dirty working tree handling

6. Test error cases:
   - No .planning/ directory
   - STATE.md not readable
   - Invalid checkpoint name (special chars)
   - Git errors (should warn, not fail)

Use mocha/assert consistent with existing tests.
</action>
<verify>
npm test -- test/commands/checkpoint.test.js
</verify>
<done>
- All tests pass
- Test coverage includes all subcommands
- Test coverage includes git integration
- Test coverage includes error cases
- Tests are independent and clean up
- Mocks prevent side effects
</done>
</task>

<task type="auto">
<name>Register checkpoint command in CLI</name>
<files>bin/reis.js</files>
<action>
Add checkpoint command to REIS CLI:

1. Import checkpoint command:
   ```javascript
   const checkpoint = require('../lib/commands/checkpoint');
   ```

2. Add command definition with commander:
   ```javascript
   program
     .command('checkpoint')
     .description('Manage checkpoints (create, list, show)')
     .argument('[subcommand]', 'Subcommand: create, list, show')
     .argument('[name]', 'Checkpoint name (for create/show)')
     .option('-c, --commit', 'Force git commit')
     .option('--no-commit', 'Skip git commit')
     .option('-m, --message <message>', 'Custom commit message')
     .action((subcommand, name, options) => {
       checkpoint({ subcommand, name, ...options });
     });
   ```

3. Ensure command appears in help text (should be automatic with commander)

4. Test command registration:
   - Verify command shows in `reis --help`
   - Verify subcommands work: create, list, show
   - Verify flags work: --commit, --no-commit, --message

WHY this approach:
- commander.js handles argument parsing automatically
- Consistent with existing REIS commands
- Supports both positional args and flags
- Auto-generates help text
</action>
<verify>
# Test command is registered
node bin/reis.js --help | grep checkpoint

# Test command works
node bin/reis.js checkpoint --help
</verify>
<done>
- checkpoint command registered in bin/reis.js
- Command appears in help text
- All subcommands and flags work
- Consistent with other REIS commands
</done>
</task>

## Success Criteria
- ✅ `reis checkpoint create [name]` creates checkpoint in STATE.md
- ✅ `reis checkpoint list` displays all checkpoints formatted
- ✅ `reis checkpoint show <name>` displays checkpoint details
- ✅ Git integration respects config and flags
- ✅ Works with or without git repository
- ✅ Duplicate names prevented
- ✅ All tests pass
- ✅ Command registered in CLI
- ✅ Help text is clear and useful

## Verification
```bash
# Run tests
npm test -- test/commands/checkpoint.test.js

# Test command
reis checkpoint create test-1
reis checkpoint list
reis checkpoint show test-1

# Test with git
reis checkpoint create test-2 --commit -m "Test checkpoint"

# Test help
reis checkpoint --help
```
