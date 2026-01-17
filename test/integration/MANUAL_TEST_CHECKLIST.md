# Phase 2 Manual Integration Test Checklist

## Test Environment
- [ ] Fresh REIS installation
- [ ] Clean test project directory
- [ ] Git initialized
- [ ] Node.js version verified (v14+ recommended)

## Basic Command Flow
- [ ] `reis config init` - Creates reis.config.js
- [ ] `reis config show` - Displays formatted config output
- [ ] `reis config validate` - Shows validation success
- [ ] Create sample PLAN.md with multiple waves
- [ ] `reis execute-plan sample.PLAN.md --wave` - Executes plan
- [ ] Verify wave execution output in real-time
- [ ] Check .planning/STATE.md updates after execution
- [ ] Check git commits created (if autoCommit enabled)

## Checkpoint Flow
- [ ] `reis checkpoint create test-1` - Creates checkpoint
- [ ] Verify STATE.md updated with checkpoint
- [ ] `reis checkpoint list` - Shows all checkpoints
- [ ] `reis checkpoint show test-1` - Shows checkpoint details
- [ ] Make file changes
- [ ] `reis checkpoint create test-2 --commit` - Creates checkpoint with git commit
- [ ] Verify git commit created with changes
- [ ] `reis checkpoint create test-3 -m "Custom message"` - Custom commit message works

## Resume Flow
- [ ] Start multi-wave execution
- [ ] Interrupt mid-execution (Ctrl+C or simulate)
- [ ] `reis resume` - Shows resume context
- [ ] `reis resume --list` - Shows available checkpoints
- [ ] `reis resume --continue` - Continues from last checkpoint
- [ ] Verify execution resumes correctly
- [ ] `reis resume --checkpoint test-1` - Restores to specific checkpoint
- [ ] Verify state restored correctly

## Config Variations
- [ ] Test with `autoCommit: false` - No auto-commits created
- [ ] Test with `autoCommit: true` - Auto-commits created after waves
- [ ] Test with different wave sizes (small, medium, large)
- [ ] Test with custom commit templates
- [ ] Test config validation errors (invalid values)
- [ ] Verify validation catches: invalid wave sizes, negative numbers, wrong types

## Error Scenarios
- [ ] Invalid PLAN.md path - Shows clear error
- [ ] Malformed PLAN.md - Shows parse error with line info
- [ ] Non-existent checkpoint - Shows "checkpoint not found" error
- [ ] Invalid config values - Falls back to defaults or shows validation error
- [ ] Git errors (dirty tree) - Shows warning or error
- [ ] Git errors (merge conflicts) - Handles gracefully
- [ ] No .planning/ directory - Shows "not a REIS project" error
- [ ] Resume without active wave - Shows appropriate message

## User Experience
- [ ] Help text is clear for all commands (`reis help config`, `reis help execute-plan`, etc.)
- [ ] Error messages are actionable (tell user what to do)
- [ ] Progress indicators work during execution
- [ ] Output is well-formatted (aligned, readable)
- [ ] Colors enhance readability (errors in red, success in green)
- [ ] Verbose mode provides useful debug info

## Backward Compatibility
- [ ] Test in REIS v1.x project (with old .planning/ structure)
- [ ] Verify old commands still work (`reis plan`, `reis execute`, etc.)
- [ ] Verify new commands degrade gracefully in v1.x projects
- [ ] Verify migration path is clear (documentation)

## Performance
- [ ] Large PLAN.md (10+ waves) - Completes in reasonable time (<30s)
- [ ] Many checkpoints (20+) - List/show commands fast (<1s)
- [ ] All operations complete reasonably:
  - `reis config show` - Instant
  - `reis checkpoint list` - <1s
  - `reis execute-plan` - Depends on plan size, but responsive
  - STATE.md updates - <500ms

## Integration Scenarios

### Scenario A: New Project Setup
1. [ ] `mkdir test-project && cd test-project`
2. [ ] `git init`
3. [ ] `reis new` or create .planning/ manually
4. [ ] `reis config init`
5. [ ] Edit reis.config.js with custom settings
6. [ ] `reis config validate`
7. [ ] Create a simple PLAN.md
8. [ ] `reis execute-plan .planning/PLAN.md --wave`
9. [ ] Verify everything works end-to-end

### Scenario B: Feature Development Workflow
1. [ ] `git checkout -b feature/new-feature`
2. [ ] Create feature PLAN.md with 3 waves
3. [ ] `reis checkpoint create before-feature`
4. [ ] `reis execute-plan feature.PLAN.md --wave --interactive`
5. [ ] Complete wave 1, verify checkpoint created
6. [ ] Complete wave 2, verify checkpoint created
7. [ ] `reis checkpoint list` - See all checkpoints
8. [ ] Complete wave 3
9. [ ] `reis checkpoint create feature-complete --commit`
10. [ ] Verify git history shows clean commits

### Scenario C: Recovery from Mistakes
1. [ ] Create checkpoint before risky changes
2. [ ] Make changes
3. [ ] Realize mistake
4. [ ] `reis checkpoint list` - Find checkpoint
5. [ ] `reis resume --checkpoint <name>` - Restore
6. [ ] Verify files restored (git reset was done)
7. [ ] Try again with different approach

### Scenario D: Multi-Phase Project
1. [ ] Complete Phase 1 with multiple waves
2. [ ] `reis checkpoint create phase-1-complete`
3. [ ] Start Phase 2
4. [ ] Interrupt during Phase 2
5. [ ] `reis resume --continue`
6. [ ] Complete Phase 2
7. [ ] Verify STATE.md tracks both phases correctly

## Cross-Platform Testing (if applicable)
- [ ] Test on Linux
- [ ] Test on macOS
- [ ] Test on Windows (WSL)
- [ ] Verify git integration works on all platforms
- [ ] Verify file paths work correctly

## Edge Cases
- [ ] Empty PLAN.md - Handles gracefully
- [ ] PLAN.md with only one task - Works correctly
- [ ] Very long checkpoint names - Handles or validates
- [ ] Special characters in checkpoint names - Sanitizes or rejects
- [ ] Checkpoint during active wave - Records wave context
- [ ] Multiple checkpoints in quick succession - All recorded
- [ ] STATE.md manually edited (corrupted) - Recovers or shows error

## Documentation Verification
- [ ] README.md explains new Phase 2 commands
- [ ] Config documentation complete and accurate
- [ ] Example PLAN.md files are valid
- [ ] Migration guide from v1.x to v2.0 exists
- [ ] Troubleshooting section covers common issues

## Sign-off

**All critical tests passed:** [ ]

**All nice-to-have tests passed:** [ ]

**No blocking issues found:** [ ]

**User experience is excellent:** [ ]

**Performance is acceptable:** [ ]

**Ready for production:** [ ]

---

**Tester Name:** ________________

**Date:** ________________

**REIS Version:** ________________

**Node Version:** ________________

**OS/Platform:** ________________

## Issues Found

| Issue # | Severity | Description | Status |
|---------|----------|-------------|--------|
| 1       |          |             |        |
| 2       |          |             |        |
| 3       |          |             |        |

## Notes

_Additional observations, suggestions, or comments:_

---

## Automated Test Status Reference

For comparison with automated tests:

```bash
# Run all tests
npm test

# Run Phase 2 integration tests
npm test -- test/integration/phase2-integration.test.js

# Run E2E scenarios
npm test -- test/e2e/phase2-scenarios.test.js

# Expected results:
# - All unit tests passing
# - All integration tests passing
# - All E2E scenarios passing
```

Last automated test run: ________________

Automated tests passing: _____ / _____
