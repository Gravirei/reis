# Plan: 09-01 - Comprehensive Testing and Bug Fixes

## Objective
Test all 29 commands, verify installation process, and fix any bugs discovered during testing.

## Context
This is the quality assurance phase. We need to test the entire package end-to-end, including installation, all commands, error handling, and edge cases.

## Dependencies
- All previous phases (01-08) must be complete
- All 29 commands implemented
- Installation system complete
- Documentation and templates transformed

## Tasks

<task type="auto">
<name>Test installation and file copying</name>
<files>lib/install.js, .npmignore</files>
<action>
Test the installation system thoroughly:

1. Test initial installation:
   - Run: node lib/install.js
   - Verify ASCII art displays correctly
   - Test confirmation prompt (type 'y' and 'n')
   - Check directories created: ~/.rovodev/reis/, ~/.rovodev/reis/templates/, ~/.rovodev/subagents/
   - Verify all files copied correctly (count files)

2. Test idempotency:
   - Run installation again
   - Should handle existing files gracefully
   - No errors or duplicates

3. Test CI mode:
   - Run: CI=true node lib/install.js
   - Should skip prompts and install directly

4. Test file structure:
   - Verify 8 docs in ~/.rovodev/reis/
   - Verify 5 templates in ~/.rovodev/reis/templates/
   - Verify 3 subagents in ~/.rovodev/subagents/ (reis_*.md)

5. Check .npmignore:
   - Ensure .planning/ excluded
   - Ensure temporary files excluded
   - Verify necessary files included (bin/, lib/, docs/, templates/, subagents/)

Document any issues found and fix them.
</action>
<verify>node lib/install.js && ls ~/.rovodev/reis/ | wc -l && ls ~/.rovodev/reis/templates/ | wc -l && ls ~/.rovodev/subagents/reis_*.md | wc -l</verify>
<done>Installation thoroughly tested, files copied correctly, idempotency verified, issues fixed</done>
</task>

<task type="auto">
<name>Test all 29 commands systematically</name>
<files>bin/reis.js, lib/commands/*.js</files>
<action>
Create a test script: tmp_rovodev_test_commands.sh

Test each command category:

1. Core commands (6):
   - node bin/reis.js help
   - node bin/reis.js version
   - node bin/reis.js new "test idea"
   - node bin/reis.js map
   - node bin/reis.js requirements
   - node bin/reis.js roadmap

2. Phase management (7):
   - node bin/reis.js plan 1
   - node bin/reis.js discuss 1
   - node bin/reis.js research 1
   - node bin/reis.js assumptions 1
   - node bin/reis.js execute 1
   - node bin/reis.js execute-plan test.PLAN.md
   - node bin/reis.js verify 1

3. Progress & roadmap (6):
   - node bin/reis.js progress
   - node bin/reis.js pause
   - node bin/reis.js resume
   - node bin/reis.js add "feature"
   - node bin/reis.js insert 2 "phase"
   - node bin/reis.js remove 3

4. Milestones & utilities (10):
   - node bin/reis.js milestone discuss
   - node bin/reis.js milestone new "M2"
   - node bin/reis.js milestone complete "M1"
   - node bin/reis.js todo "task"
   - node bin/reis.js todos
   - node bin/reis.js todos auth
   - node bin/reis.js debug "issue"
   - node bin/reis.js update
   - node bin/reis.js whats-new
   - node bin/reis.js docs
   - node bin/reis.js uninstall

For each command:
- Verify it runs without errors
- Check output is appropriate
- Test with missing arguments (should show error)
- Test with invalid arguments (should show error)

Document all issues found.
</action>
<verify>bash tmp_rovodev_test_commands.sh 2>&1 | grep -c "Error:" && echo "Errors found, needs fixes" || echo "All commands working"</verify>
<done>All 29 commands tested, errors documented, and fixed</done>
</task>

<task type="auto">
<name>Test error handling and edge cases</name>
<files>lib/commands/*.js, lib/utils/command-helpers.js</files>
<action>
Test error handling thoroughly:

1. Test without REIS project (where applicable):
   - Commands that need .planning/ should error gracefully
   - Error message should be helpful: "Not a REIS project. Run 'reis new' or 'reis map' first."

2. Test with invalid arguments:
   - Missing required arguments
   - Invalid phase numbers (non-numeric, negative, zero)
   - Empty strings for required text arguments

3. Test edge cases:
   - Very long command arguments
   - Special characters in arguments
   - Multiple spaces in arguments

4. Test help for each command:
   - node bin/reis.js <command> --help
   - Should show usage information

5. Verify graceful degradation:
   - If ~/.rovodev/ doesn't exist (installation issue)
   - If package.json is missing (shouldn't happen, but check)

Create test script: tmp_rovodev_test_errors.sh

Run through all error scenarios and verify:
- Errors show helpful messages
- Exit codes are appropriate (1 for errors, 0 for success)
- No crashes or stack traces for expected errors

Fix any issues found.
</action>
<verify>bash tmp_rovodev_test_errors.sh 2>&1 | grep "graceful" || echo "Error handling needs work"</verify>
<done>Error handling tested and improved, all edge cases handled gracefully</done>
</task>

## Success Criteria
- Installation works correctly in all modes (interactive, CI)
- All files copied to correct locations
- All 29 commands run without errors
- Commands with required arguments show helpful errors when missing
- Commands that need REIS project validate correctly
- Error messages are clear and actionable
- No crashes or stack traces for expected errors
- Help system works for all commands

## Verification
```bash
# Full installation test
node lib/install.js
ls -R ~/.rovodev/reis/

# Test all commands
bash tmp_rovodev_test_commands.sh

# Test error handling
bash tmp_rovodev_test_errors.sh

# Clean up test scripts
rm tmp_rovodev_test_*.sh
```
