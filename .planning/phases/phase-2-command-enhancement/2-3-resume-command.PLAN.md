# Plan: 2-3 - Enhanced Resume Command

## Objective
Enhance existing `reis resume` command to support checkpoint-based resumption and wave continuation.

## Context
- Existing resume.js (lib/commands/resume.js) is a simple prompt generator
- Phase 1 StateManager supports checkpoint tracking and wave state
- Phase 1 WaveExecutor can resume from specific task/wave
- Need to enhance resume to:
  - List available checkpoints
  - Resume from specific checkpoint
  - Continue incomplete wave execution
  - Restore state from checkpoint

## Dependencies
Depends on Plan 2-2 (Checkpoint Command) - Need checkpoint infrastructure in place

## Tasks

<task type="auto">
<name>Enhance resume command with checkpoint support</name>
<files>lib/commands/resume.js</files>
<action>
Replace current simple resume.js with enhanced version:

1. Import Phase 1 utilities:
   - StateManager from '../utils/state-manager.js'
   - WaveExecutor from '../utils/wave-executor.js'
   - GitIntegration from '../utils/git-integration.js'
   - loadConfig from '../utils/config.js'

2. Support multiple modes:
   - `reis resume` - Smart resume from last state (default)
   - `reis resume --checkpoint <name>` - Resume from specific checkpoint
   - `reis resume --list` - List available resume points
   - `reis resume --continue` - Continue incomplete wave

3. Smart resume flow (default):
   - Load STATE.md using StateManager
   - Analyze current state:
     - Check for active wave (in progress)
     - Check for last checkpoint
     - Check for recent activity
   - Display resume context:
     - Last completed work
     - Current wave/phase
     - Next tasks
     - Blockers (if any)
   - Provide resume options:
     - Continue active wave
     - Start next phase
     - Resume from checkpoint
   - If --auto flag: automatically continue active wave or next phase

4. Checkpoint resume flow:
   - List available checkpoints
   - If --checkpoint <name> provided:
     - Find checkpoint in STATE.md
     - Display checkpoint details
     - Confirm resume point (unless --yes flag)
     - Restore state from checkpoint
     - If checkpoint has git commit: show diff from checkpoint to HEAD
     - Load wave context from checkpoint
     - Resume wave execution from checkpoint task
   - If no checkpoint name: prompt user to select (interactive)

5. Continue wave flow:
   - Load active wave from STATE.md
   - Find last completed task in wave
   - Display progress: "Wave 2: 3/5 tasks complete"
   - Resume WaveExecutor from next task
   - Handle checkpoints between tasks

6. List resume points:
   - Display formatted table:
     - Checkpoints (name, timestamp, context)
     - Active wave (if any)
     - Last activity
   - Show recommended resume point
   - Show command to resume from each point

7. Add helpful flags:
   - --checkpoint <name> / -c - Resume from specific checkpoint
   - --list / -l - List resume points
   - --continue - Continue active wave
   - --auto / -a - Auto-resume without prompts
   - --yes / -y - Skip confirmation prompts

8. Maintain backward compatibility:
   - If no flags and no STATE.md: use old prompt-based behavior
   - Gradual migration: warn users about new features

WHY avoid certain approaches:
- Don't force interactive mode (support scripting with --auto)
- Don't restore git commits automatically (user should verify changes)
- Don't lose checkpoint on resume failure (preserve state)
- Don't assume clean working tree (developers may have WIP)
</action>
<verify>
# Test basic resume
node bin/reis.js resume --help

# Test checkpoint listing
cd test/fixtures/sample-project 2>/dev/null || echo "Need test project"
node bin/reis.js resume --list

# Test resume from checkpoint
node bin/reis.js resume --checkpoint test-1 --dry-run
</verify>
<done>
- resume.js enhanced with checkpoint support
- Smart resume analyzes STATE.md and suggests next action
- Checkpoint resume works with validation
- Wave continuation works for incomplete waves
- List mode displays all resume points
- Flags work: --checkpoint, --list, --continue, --auto, --yes
- Backward compatibility maintained
- Error handling for missing checkpoints
</done>
</task>

<task type="auto">
<name>Create tests for enhanced resume command</name>
<files>test/commands/resume.test.js</files>
<action>
Create comprehensive test suite:

1. Setup test fixtures:
   - Temp directory with .planning/STATE.md
   - STATE.md with various states:
     - Active wave (in progress)
     - Completed wave
     - Multiple checkpoints
     - Recent activity
   - Sample PLAN.md files
   - Mock git repository with commits

2. Test smart resume (default):
   - Resume with active wave → suggests continue
   - Resume with no active wave → suggests next phase
   - Resume with checkpoints → lists options
   - Resume with blockers → displays blockers
   - Resume without STATE.md → backward compatibility

3. Test checkpoint resume:
   - Resume from valid checkpoint
   - Resume from non-existent checkpoint (error)
   - Resume with --checkpoint flag
   - Resume with git diff display
   - Resume with state restoration
   - Test --yes flag skips confirmation

4. Test wave continuation:
   - Continue incomplete wave (3/5 tasks done)
   - Continue wave with no tasks done
   - Continue wave with all tasks done (should complete)
   - Test --continue flag

5. Test list mode:
   - List with checkpoints and active wave
   - List with no checkpoints
   - List with only active wave
   - Verify formatting and output

6. Test auto mode:
   - Auto-resume with active wave
   - Auto-resume without active wave
   - Auto-resume with errors (should fail gracefully)

7. Test backward compatibility:
   - Test without STATE.md → old behavior
   - Test with minimal STATE.md → graceful degradation

8. Test error cases:
   - Invalid checkpoint name
   - Corrupted STATE.md
   - Missing PLAN.md for wave
   - Git errors during resume

Use mocha/assert consistent with existing tests.
Mock WaveExecutor to avoid actual execution.
</action>
<verify>
npm test -- test/commands/resume.test.js
</verify>
<done>
- All tests pass
- Test coverage includes smart resume
- Test coverage includes checkpoint resume
- Test coverage includes wave continuation
- Test coverage includes backward compatibility
- Tests are independent and clean up
- Mocks prevent actual wave execution
</done>
</task>

<task type="checkpoint:human-verify">
<name>Manual verification of resume command</name>
<files>lib/commands/resume.js</files>
<action>
Manual testing checklist:

1. Test smart resume flow:
   - Create REIS project with active wave
   - Run: reis resume
   - Verify context displayed correctly
   - Verify suggestions are appropriate
   - Test continuing from suggestion

2. Test checkpoint resume:
   - Create multiple checkpoints
   - Run: reis resume --list
   - Run: reis resume --checkpoint <name>
   - Verify state restored correctly
   - Verify git diff displayed (if applicable)

3. Test wave continuation:
   - Start wave execution
   - Interrupt mid-wave
   - Run: reis resume --continue
   - Verify execution continues from correct task

4. Test user experience:
   - Output is clear and actionable
   - Recommendations make sense
   - Error messages are helpful
   - Interactive prompts are user-friendly (if used)

5. Test backward compatibility:
   - Test in old REIS v1.x project (no checkpoints)
   - Verify graceful degradation
   - Verify no breaking changes
</action>
<verify>
Human verification and approval
</verify>
<done>
- Smart resume works end-to-end
- Checkpoint resume restores state correctly
- Wave continuation works seamlessly
- User experience is excellent
- Backward compatibility confirmed
- Ready for production use
</done>
</task>

## Success Criteria
- ✅ `reis resume` provides smart context and suggestions
- ✅ `reis resume --checkpoint <name>` restores from checkpoint
- ✅ `reis resume --list` shows all resume points
- ✅ `reis resume --continue` continues incomplete wave
- ✅ Git diff displayed when resuming from checkpoint
- ✅ Backward compatibility maintained
- ✅ All tests pass
- ✅ Manual verification complete

## Verification
```bash
# Run tests
npm test -- test/commands/resume.test.js

# Test smart resume
reis resume

# Test checkpoint resume
reis resume --checkpoint test-1

# Test list mode
reis resume --list

# Test continue mode
reis resume --continue

# Test help
reis resume --help
```
