# Plan: 2-5 - Phase 2 Integration Testing

## Objective
Create comprehensive integration tests for Phase 2 commands working together as a cohesive system.

## Context
- Phase 2 implements 4 commands: execute-plan, checkpoint, resume, config
- Each command has unit tests
- Need integration tests to verify commands work together
- Test real workflows: config → execute → checkpoint → resume
- Test git integration across commands
- Test STATE.md consistency across commands

## Dependencies
Depends on Plans 2-1, 2-2, 2-3, 2-4 - All commands must be implemented

## Tasks

<task type="auto">
<name>Create Phase 2 integration test suite</name>
<files>test/integration/phase2-integration.test.js</files>
<action>
Create comprehensive integration test suite:

1. Setup test environment:
   - Create temp directory with full REIS project structure
   - Initialize .planning/ with STATE.md, ROADMAP.md, etc.
   - Create sample PLAN.md files with multiple waves
   - Initialize git repository
   - Create sample reis.config.js

2. Test Workflow 1: Config → Execute → Checkpoint
   ```
   reis config init
   → reis config validate
   → reis execute-plan sample.PLAN.md --wave
   → reis checkpoint create workflow-1
   → verify STATE.md updated
   → verify git commit created
   → verify checkpoint recorded
   ```

3. Test Workflow 2: Execute → Interrupt → Resume
   ```
   reis execute-plan multi-wave.PLAN.md --wave
   → interrupt after wave 1
   → verify checkpoint auto-created
   → reis resume --continue
   → verify execution continues from wave 2
   → verify STATE.md shows progress
   ```

4. Test Workflow 3: Checkpoint → Resume
   ```
   reis checkpoint create before-refactor
   → make changes to files
   → reis checkpoint create after-refactor
   → reis resume --checkpoint before-refactor
   → verify state restored
   → verify git diff shown
   ```

5. Test Workflow 4: Config customization affects execution
   ```
   reis config init
   → modify config: set autoCommit: false
   → reis execute-plan sample.PLAN.md --wave
   → verify no auto-commit created
   → modify config: set autoCommit: true
   → reis execute-plan sample2.PLAN.md --wave
   → verify auto-commit created
   ```

6. Test Workflow 5: Full project lifecycle
   ```
   reis new test-project
   → reis config init
   → create PLAN.md with 3 waves
   → reis execute-plan test.PLAN.md --wave
   → reis checkpoint create phase-1-done
   → reis resume --list
   → verify full history tracked
   → reis config show
   → verify all settings consistent
   ```

7. Test STATE.md consistency:
   - Execute multiple commands in sequence
   - Verify STATE.md remains valid after each command
   - Verify no data loss or corruption
   - Verify wave tracking accurate
   - Verify checkpoint list consistent
   - Verify metrics updated correctly

8. Test git integration consistency:
   - Verify commits created by execute-plan
   - Verify commits reference correct checkpoints
   - Verify commit messages follow template
   - Verify no commits on unchanged files
   - Verify git status checks work

9. Test error recovery:
   - Simulate command failures mid-execution
   - Verify STATE.md not corrupted
   - Verify resume works after failure
   - Verify checkpoints protect against data loss

10. Test concurrent command safety:
    - Simulate overlapping command execution (rare but possible)
    - Verify STATE.md locking or safe updates
    - Verify no race conditions

11. Test backward compatibility:
    - Run new commands in v1.x project structure
    - Verify graceful degradation
    - Verify old commands still work
    - Verify migration path clear

12. Test performance:
    - Large PLAN.md (10+ waves)
    - Many checkpoints (50+)
    - Large STATE.md file
    - Verify reasonable performance (<5s for most operations)

Use mocha/assert pattern.
Use real filesystem (in temp dir) for integration fidelity.
Use real git operations (in temp repo).
Clean up thoroughly after tests.
</action>
<verify>
npm test -- test/integration/phase2-integration.test.js
</verify>
<done>
- All integration tests pass
- All workflows tested end-to-end
- STATE.md consistency verified
- Git integration verified
- Error recovery tested
- Backward compatibility confirmed
- Performance acceptable
- Tests clean up completely
</done>
</task>

<task type="auto">
<name>Create end-to-end test scenarios</name>
<files>test/e2e/phase2-scenarios.test.js</files>
<action>
Create real-world scenario tests:

1. Scenario: Solo developer building a feature
   ```
   Setup: New feature branch, clean slate
   Steps:
   - Create feature plan with 3 waves
   - Execute wave 1, checkpoint
   - Execute wave 2, checkpoint
   - Execute wave 3, checkpoint
   - Resume from wave 2 checkpoint (simulate rollback)
   - Continue from wave 3
   Verify: All state transitions clean, git history correct
   ```

2. Scenario: Interrupted development session
   ```
   Setup: Mid-feature development
   Steps:
   - Start executing multi-wave plan
   - Interrupt after 2/5 waves
   - Close terminal, restart
   - Use resume command
   - Verify picks up where left off
   Verify: No data loss, clean continuation
   ```

3. Scenario: Configuration experimentation
   ```
   Setup: Testing different wave sizes
   Steps:
   - Init config with small waves
   - Execute plan, measure time/behavior
   - Modify config to large waves
   - Execute plan, compare behavior
   - Validate config after changes
   Verify: Config changes affect execution, validation catches errors
   ```

4. Scenario: Checkpoint-driven development
   ```
   Setup: Risky refactoring ahead
   Steps:
   - Create checkpoint before refactor
   - Make changes, create checkpoint
   - Test, create checkpoint
   - Revert to pre-refactor checkpoint
   - Try different approach
   Verify: Easy rollback, clear history
   ```

5. Scenario: Multi-phase project
   ```
   Setup: Large project with multiple phases
   Steps:
   - Execute phase 1 completely
   - Checkpoint phase 1 done
   - Execute phase 2 partially
   - Resume phase 2 from checkpoint
   - Complete phase 2
   - Verify full history
   Verify: STATE.md tracks multi-phase progress correctly
   ```

Each scenario should:
- Simulate real user behavior
- Use actual command-line invocations
- Verify output and side effects
- Check git commits and STATE.md
- Test error cases within scenario
- Clean up completely

Use separate temp directory for each scenario.
Use real git operations.
Capture and verify command output.
</action>
<verify>
npm test -- test/e2e/phase2-scenarios.test.js
</verify>
<done>
- All scenarios pass
- Real-world workflows validated
- User experience verified
- Output quality confirmed
- Integration points solid
- Tests are reproducible
</done>
</task>

<task type="checkpoint:human-verify">
<name>Manual integration testing and sign-off</name>
<files>test/integration/MANUAL_TEST_CHECKLIST.md</files>
<action>
Create manual test checklist and perform verification:

1. Create checklist document (MANUAL_TEST_CHECKLIST.md):
   ```markdown
   # Phase 2 Manual Integration Test Checklist
   
   ## Test Environment
   - [ ] Fresh REIS installation
   - [ ] Clean test project directory
   - [ ] Git initialized
   - [ ] Node.js version verified
   
   ## Basic Command Flow
   - [ ] reis config init
   - [ ] reis config show (verify output)
   - [ ] reis config validate
   - [ ] Create sample PLAN.md
   - [ ] reis execute-plan sample.PLAN.md --wave
   - [ ] Verify wave execution in real-time
   - [ ] Check STATE.md updates
   - [ ] Check git commits created
   
   ## Checkpoint Flow
   - [ ] reis checkpoint create test-1
   - [ ] Verify STATE.md updated
   - [ ] reis checkpoint list (verify output)
   - [ ] reis checkpoint show test-1
   - [ ] Make file changes
   - [ ] reis checkpoint create test-2 --commit
   - [ ] Verify git commit with changes
   
   ## Resume Flow
   - [ ] Start multi-wave execution
   - [ ] Interrupt mid-execution (Ctrl+C)
   - [ ] reis resume (verify context)
   - [ ] reis resume --list (verify checkpoints)
   - [ ] reis resume --continue (verify continuation)
   - [ ] reis resume --checkpoint test-1 (verify restore)
   
   ## Config Variations
   - [ ] Test with autoCommit: false
   - [ ] Test with different wave sizes
   - [ ] Test with custom commit templates
   - [ ] Test config validation errors
   
   ## Error Scenarios
   - [ ] Invalid PLAN.md path
   - [ ] Malformed PLAN.md
   - [ ] Non-existent checkpoint
   - [ ] Invalid config values
   - [ ] Git errors (dirty tree, conflicts)
   
   ## User Experience
   - [ ] Help text is clear (all commands)
   - [ ] Error messages are actionable
   - [ ] Progress indicators work
   - [ ] Output is well-formatted
   - [ ] Colors enhance readability
   
   ## Backward Compatibility
   - [ ] Test in REIS v1.x project
   - [ ] Verify old commands work
   - [ ] Verify new commands degrade gracefully
   
   ## Performance
   - [ ] Large PLAN.md (10 waves)
   - [ ] Many checkpoints (20+)
   - [ ] All operations complete reasonably (<5s)
   
   ## Sign-off
   - [ ] All tests passed
   - [ ] No critical issues found
   - [ ] User experience is excellent
   - [ ] Ready for production
   
   Tester: ________________
   Date: ________________
   ```

2. Perform manual testing:
   - Work through checklist systematically
   - Document any issues found
   - Test in multiple scenarios
   - Verify on different platforms if possible (Linux, macOS)
   
3. Document findings:
   - Create test report with results
   - Note any edge cases discovered
   - Document any UX improvements needed
   - List any bugs found (should be minimal after unit/integration tests)

4. Final verification:
   - All checkboxes checked
   - No blocking issues
   - Performance acceptable
   - UX polished
   - Ready for production use
</action>
<verify>
Human verification - manual testing complete
</verify>
<done>
- Manual test checklist complete
- All scenarios tested by human
- User experience validated
- No critical issues found
- Performance verified
- Phase 2 ready for release
</done>
</task>

## Success Criteria
- ✅ All integration tests pass
- ✅ All E2E scenarios pass
- ✅ Manual testing checklist complete
- ✅ Commands work together seamlessly
- ✅ STATE.md consistency maintained
- ✅ Git integration works reliably
- ✅ Error recovery is robust
- ✅ Backward compatibility confirmed
- ✅ Performance is acceptable
- ✅ User experience is excellent

## Verification
```bash
# Run all integration tests
npm test -- test/integration/phase2-integration.test.js

# Run E2E scenarios
npm test -- test/e2e/phase2-scenarios.test.js

# Run full test suite
npm test

# Manual testing
# Follow checklist in test/integration/MANUAL_TEST_CHECKLIST.md

# Performance check
time reis execute-plan large-plan.PLAN.md --wave
time reis checkpoint list
time reis resume --list
```
