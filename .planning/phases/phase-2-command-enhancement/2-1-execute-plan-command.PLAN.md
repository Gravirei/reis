# Plan: 2-1 - Enhanced Execute-Plan Command

## Objective
Implement enhanced `reis execute-plan` command that uses WaveExecutor for wave-based execution with auto-commits and checkpoints.

## Context
- Phase 1 utilities are complete: config.js, state-manager.js, git-integration.js, wave-executor.js
- Existing execute-plan.js (lib/commands/execute-plan.js) is a simple prompt generator
- Need to integrate WaveExecutor for actual wave-based execution
- Must maintain backward compatibility with existing REIS v1.x workflow
- Command should parse PLAN.md, execute waves sequentially, checkpoint between waves, and auto-commit

## Dependencies
None - Can execute in Wave 1 (parallel with other commands)

## Tasks

<task type="auto">
<name>Enhance execute-plan command with WaveExecutor integration</name>
<files>lib/commands/execute-plan.js</files>
<action>
Replace the current simple prompt-based execute-plan.js with enhanced version that:

1. Import Phase 1 utilities:
   - WaveExecutor from '../utils/wave-executor.js'
   - StateManager from '../utils/state-manager.js'
   - loadConfig from '../utils/config.js'
   - GitIntegration from '../utils/git-integration.js'

2. Add --wave flag support for wave-based execution (optional):
   - If --wave flag present: Use WaveExecutor for automated wave execution
   - If no --wave flag: Use existing prompt-based behavior (backward compatibility)

3. Wave execution flow (when --wave flag used):
   - Load config from project root
   - Validate PLAN.md file exists at specified path
   - Parse PLAN.md using WaveExecutor.parsePlan()
   - Check git status (warn if dirty, don't block)
   - Execute waves sequentially using WaveExecutor.executeWave()
   - Show progress for each wave (wave N of M, task progress)
   - Create checkpoint after each wave completion
   - Auto-commit if config.git.autoCommit is true
   - Update STATE.md with wave completion
   - Handle errors gracefully with rollback suggestions

4. Display helpful output:
   - Show wave structure before execution (confirmation)
   - Progress indicators during execution
   - Success/failure summary at end
   - Next steps if incomplete

5. Error handling:
   - Invalid plan path → helpful error
   - Parse errors → show line/context
   - Git errors → suggest manual resolution
   - Execution errors → save state and suggest resume

WHY avoid certain approaches:
- Don't make --wave the default yet (breaking change for existing users)
- Don't auto-commit without checking config (user preference)
- Don't block on dirty git (developers may have intentional changes)
- Don't use complex interactive prompts (keep it fast and scriptable)
</action>
<verify>
# Test basic command works
node bin/reis.js execute-plan --help

# Test backward compatibility (should still show prompt)
cd test/fixtures/sample-project 2>/dev/null || echo "Need test project"

# Test wave execution flag
node bin/reis.js execute-plan test/fixtures/sample.PLAN.md --wave --dry-run
</verify>
<done>
- execute-plan.js loads without errors
- --wave flag enables WaveExecutor integration
- Without --wave flag, maintains backward compatibility
- Helpful error messages for all failure cases
- Git integration works with auto-commit config
- STATE.md updates on wave completion
</done>
</task>

<task type="auto">
<name>Create integration tests for execute-plan command</name>
<files>test/commands/execute-plan.test.js</files>
<action>
Create comprehensive test suite for execute-plan command:

1. Setup test fixtures:
   - Create temp test directory with .planning/
   - Create sample PLAN.md with 2 waves
   - Create sample reis.config.js
   - Initialize git repo in temp dir

2. Test cases:
   - Test backward compatibility mode (no --wave flag)
   - Test --wave flag enables WaveExecutor
   - Test plan file validation (exists, readable, valid format)
   - Test wave parsing and structure display
   - Test wave execution (mock WaveExecutor)
   - Test checkpoint creation between waves
   - Test auto-commit when enabled in config
   - Test STATE.md updates
   - Test error handling (invalid path, parse errors, git errors)
   - Test --dry-run flag (shows plan without executing)
   - Test progress output formatting

3. Use mocha/assert pattern consistent with existing tests:
   - describe/it blocks
   - beforeEach/afterEach for setup/cleanup
   - Mock filesystem operations where needed
   - Mock git operations to avoid side effects
   - Clean up temp directories after tests

4. Test edge cases:
   - Empty PLAN.md
   - PLAN.md with no waves
   - PLAN.md with only checkpoints
   - Git not initialized
   - Config file missing (should use defaults)
</action>
<verify>
npm test -- test/commands/execute-plan.test.js
</verify>
<done>
- All tests pass
- Test coverage includes backward compatibility
- Test coverage includes wave execution
- Test coverage includes error cases
- Tests clean up after themselves
- Tests run independently and deterministically
</done>
</task>

<task type="checkpoint:human-verify">
<name>Manual verification of execute-plan command</name>
<files>lib/commands/execute-plan.js</files>
<action>
Manual testing checklist:

1. Test with real REIS project:
   - Create test project with reis new
   - Create simple PLAN.md with 2 tasks in 1 wave
   - Run: reis execute-plan path/to/plan.PLAN.md --wave
   - Verify wave executes and checkpoints created
   - Check STATE.md updated correctly
   - Check git commit created (if auto-commit enabled)

2. Test backward compatibility:
   - Run: reis execute-plan path/to/plan.PLAN.md (no --wave flag)
   - Verify old prompt-based behavior still works
   - Confirm no breaking changes for v1.x users

3. Test error scenarios:
   - Invalid path → should show helpful error
   - Malformed PLAN.md → should show parse error
   - Git not initialized → should warn but continue

4. Test user experience:
   - Output is clear and informative
   - Progress indicators work
   - Error messages are actionable
   - Success messages are satisfying
</action>
<verify>
Human verification and approval
</verify>
<done>
- Command works end-to-end with real PLAN.md
- Backward compatibility confirmed
- Error handling is user-friendly
- Output is clear and professional
- Ready for production use
</done>
</task>

## Success Criteria
- ✅ execute-plan command supports --wave flag for WaveExecutor integration
- ✅ Backward compatibility maintained (no --wave = old behavior)
- ✅ Waves execute sequentially with checkpoints
- ✅ Auto-commit works when enabled in config
- ✅ STATE.md updates automatically
- ✅ Error handling is comprehensive and helpful
- ✅ All tests pass (unit + integration)
- ✅ Manual verification complete

## Verification
```bash
# Run all tests
npm test

# Test backward compatibility
node bin/reis.js execute-plan test/fixtures/sample.PLAN.md

# Test wave execution
node bin/reis.js execute-plan test/fixtures/sample.PLAN.md --wave --dry-run

# Check help text
node bin/reis.js execute-plan --help
```
