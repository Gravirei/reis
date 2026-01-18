# Phase 2 Wave Execution Guide

## Quick Reference

### Wave 1: Three Commands (Parallel)
**Duration**: 1-2 days (parallel) or 2-3 days (sequential)
**Dependencies**: None - can all run simultaneously

```bash
# Execute all three in parallel (3 terminals or 3 developers)
reis execute-plan .planning/phases/phase-2-command-enhancement/2-1-execute-plan-command.PLAN.md
reis execute-plan .planning/phases/phase-2-command-enhancement/2-2-checkpoint-command.PLAN.md
reis execute-plan .planning/phases/phase-2-command-enhancement/2-4-config-command.PLAN.md
```

### Wave 2: Resume Command (Sequential)
**Duration**: 1 day
**Dependencies**: Requires Plan 2-2 complete (checkpoint infrastructure)

```bash
# Execute after Wave 1 complete
reis execute-plan .planning/phases/phase-2-command-enhancement/2-3-resume-command.PLAN.md
```

### Wave 3: Integration Testing (Sequential)
**Duration**: 1 day
**Dependencies**: Requires all commands complete (Plans 2-1, 2-2, 2-3, 2-4)

```bash
# Execute after Wave 2 complete
reis execute-plan .planning/phases/phase-2-command-enhancement/2-5-integration-testing.PLAN.md
```

## Detailed Wave Breakdown

### Wave 1: Foundation Commands

#### Plan 2-1: Execute-Plan Command
**File**: `2-1-execute-plan-command.PLAN.md`
**Objective**: Enhance execute-plan with WaveExecutor integration
**Tasks**: 3 (2 auto, 1 human-verify)
**Deliverables**:
- lib/commands/execute-plan.js (enhanced)
- test/commands/execute-plan.test.js
- --wave flag for wave-based execution
- Backward compatibility maintained

**Key Features**:
- Wave-based execution
- Auto-checkpointing
- Auto-commit support
- Progress tracking

#### Plan 2-2: Checkpoint Command
**File**: `2-2-checkpoint-command.PLAN.md`
**Objective**: Create checkpoint management command
**Tasks**: 3 (3 auto)
**Deliverables**:
- lib/commands/checkpoint.js (new)
- test/commands/checkpoint.test.js
- Subcommands: create, list, show
- Git integration

**Key Features**:
- Manual checkpoint creation
- Checkpoint listing with table format
- Git commit integration (optional)
- STATE.md updates

#### Plan 2-4: Config Command
**File**: `2-4-config-command.PLAN.md`
**Objective**: Implement configuration management
**Tasks**: 3 (3 auto)
**Deliverables**:
- lib/commands/config.js (new)
- test/commands/config.test.js
- templates/reis.config.template.js
- templates/CONFIG_DOCS.md
- Subcommands: show, init, validate, docs

**Key Features**:
- Display formatted config
- Initialize sample config
- Validate config files
- Comprehensive documentation

### Wave 2: Resume Enhancement

#### Plan 2-3: Resume Command
**File**: `2-3-resume-command.PLAN.md`
**Objective**: Enhance resume with checkpoint support
**Tasks**: 3 (2 auto, 1 human-verify)
**Dependencies**: Plan 2-2 (checkpoint infrastructure)
**Deliverables**:
- lib/commands/resume.js (enhanced)
- test/commands/resume.test.js
- Smart resume analysis
- Checkpoint-based resume

**Key Features**:
- Context-aware suggestions
- Resume from checkpoint
- Continue incomplete waves
- Git diff display
- Interactive and auto modes

### Wave 3: Integration Validation

#### Plan 2-5: Integration Testing
**File**: `2-5-integration-testing.PLAN.md`
**Objective**: Comprehensive integration testing
**Tasks**: 3 (2 auto, 1 human-verify)
**Dependencies**: All commands (Plans 2-1, 2-2, 2-3, 2-4)
**Deliverables**:
- test/integration/phase2-integration.test.js
- test/e2e/phase2-scenarios.test.js
- test/integration/MANUAL_TEST_CHECKLIST.md
- Full workflow validation

**Key Features**:
- End-to-end workflows
- STATE.md consistency checks
- Git integration validation
- Error recovery testing
- Performance validation

## Execution Strategies

### Strategy 1: Solo Developer (Sequential)
**Timeline**: 4-5 days

```
Day 1: Plan 2-2 (Checkpoint)
Day 2: Plan 2-4 (Config) + start Plan 2-1
Day 3: Finish Plan 2-1 (Execute-Plan)
Day 4: Plan 2-3 (Resume)
Day 5: Plan 2-5 (Integration)
```

**Rationale**: Build foundation first (checkpoint), then independent commands, then dependent commands.

### Strategy 2: Team of 3 (Parallel)
**Timeline**: 2-3 days

```
Day 1 (Parallel):
  Dev 1: Plan 2-1 (Execute-Plan)
  Dev 2: Plan 2-2 (Checkpoint)
  Dev 3: Plan 2-4 (Config)

Day 2 (Sequential):
  Any dev: Plan 2-3 (Resume) - depends on Plan 2-2

Day 3 (Sequential):
  Any dev: Plan 2-5 (Integration) - depends on all
```

**Rationale**: Maximum parallelization in Wave 1, then sequential for dependencies.

### Strategy 3: Balanced (2 Developers)
**Timeline**: 3 days

```
Day 1 (Parallel):
  Dev 1: Plan 2-2 (Checkpoint) + Plan 2-4 (Config)
  Dev 2: Plan 2-1 (Execute-Plan)

Day 2 (Sequential):
  Dev 1: Plan 2-3 (Resume)
  Dev 2: Help with Plan 2-3 or start Plan 2-5

Day 3 (Sequential):
  Both: Plan 2-5 (Integration)
```

**Rationale**: Balance load, critical path optimization.

## Checkpoint Strategy

### Auto-Checkpoints
The system will automatically create checkpoints:
- After each plan completion
- After each wave completion within a plan
- Before manual verification tasks

### Manual Checkpoints
Create manual checkpoints at:
- Before starting Wave 1 (baseline)
- After Wave 1 complete (foundation)
- After Wave 2 complete (all commands)
- After Wave 3 complete (fully tested)

```bash
# Before starting
reis checkpoint create phase-2-start

# After Wave 1
reis checkpoint create phase-2-wave-1-complete

# After Wave 2
reis checkpoint create phase-2-wave-2-complete

# After Wave 3
reis checkpoint create phase-2-complete
```

## Testing Schedule

### During Development (Continuous)
Run unit tests after each task:
```bash
npm test -- test/commands/<command>.test.js
```

### After Each Plan (Integration)
Run related integration tests:
```bash
npm test -- test/commands/
```

### After Wave 1 (Smoke Test)
Quick validation that commands load:
```bash
reis execute-plan --help
reis checkpoint --help
reis config --help
```

### After Wave 2 (Integration)
Test commands working together:
```bash
# Create checkpoint
reis checkpoint create test-1

# Show config
reis config show

# Resume
reis resume --list
```

### After Wave 3 (Full Suite)
Run complete test suite:
```bash
npm test
```

## Common Issues & Solutions

### Issue: Plan 2-3 fails due to missing checkpoint infrastructure
**Solution**: Ensure Plan 2-2 is fully complete before starting 2-3. Check that lib/commands/checkpoint.js exists and tests pass.

### Issue: Integration tests fail due to missing templates
**Solution**: Ensure Plan 2-4 created templates/reis.config.template.js and templates/CONFIG_DOCS.md.

### Issue: Execute-plan tests fail with "WaveExecutor not found"
**Solution**: Verify Phase 1 is complete and lib/utils/wave-executor.js exists.

### Issue: Git integration tests fail
**Solution**: Check that test fixtures initialize git repositories. See test/integration/phase1-integration.test.js for examples.

### Issue: Manual verification blocked
**Solution**: Human checkpoints can be handled async. Continue with other plans while waiting for verification.

## Progress Tracking

### Track in STATE.md
After each plan completion, update .planning/STATE.md:

```markdown
## Completed Waves
- **Wave 1.1: Execute-Plan Command** (2026-01-XX) ✅
  - Enhanced lib/commands/execute-plan.js
  - Created test/commands/execute-plan.test.js
  - 15 tests passing
```

### Track Metrics
Monitor key metrics:
- Tests passing: Should increase with each plan
- Code coverage: Aim for >80%
- Manual verifications: Track completion
- Blockers: Document immediately

## Quality Gates

### Before Wave 2
- ✅ All Wave 1 plans complete
- ✅ All Wave 1 unit tests passing
- ✅ Commands load without errors
- ✅ No regressions in Phase 1 tests

### Before Wave 3
- ✅ All Wave 2 plans complete
- ✅ Resume command works with checkpoints
- ✅ All commands integrated
- ✅ No critical bugs

### Before Phase 2 Sign-off
- ✅ All Wave 3 plans complete
- ✅ 100% of automated tests passing
- ✅ Manual verification checklist complete
- ✅ Documentation updated
- ✅ Performance acceptable
- ✅ Backward compatibility confirmed

## Risk Mitigation

### Risk: Parallel execution conflicts
**Mitigation**: Wave 1 plans are truly independent. No shared files except bin/reis.js registration (do last).

### Risk: Checkpoint infrastructure incomplete for Plan 2-3
**Mitigation**: Wave 2 is sequential. Plan 2-2 must fully pass tests before 2-3 starts.

### Risk: Integration tests reveal design flaws
**Mitigation**: Wave 3 is dedicated to testing. Budget extra time for fixes. Early unit tests catch most issues.

### Risk: Manual verification delays
**Mitigation**: Schedule human checkpoints for end of day. Continue other work while waiting.

## Success Indicators

### Wave 1 Success
- ✅ 3 commands created/enhanced
- ✅ ~45-60 unit tests passing
- ✅ All commands load and show help
- ✅ No Phase 1 regressions

### Wave 2 Success
- ✅ Resume command works with checkpoints
- ✅ ~15-20 additional tests passing
- ✅ Commands interact correctly
- ✅ STATE.md updates consistent

### Wave 3 Success
- ✅ ~30-40 integration tests passing
- ✅ E2E scenarios pass
- ✅ Manual checklist 100% complete
- ✅ Performance targets met
- ✅ Zero critical bugs

### Phase 2 Complete
- ✅ All 5 plans executed
- ✅ ~100+ total tests passing
- ✅ 4 commands production-ready
- ✅ Documentation complete
- ✅ Ready for v2.0.0-alpha.2 release

---

**Ready to Execute**: Yes ✅
**Estimated Total Time**: 30-40 hours (4-5 days)
**Parallel Optimization**: 2-3 days with 3 developers
**Risk Level**: Low-Medium (well-tested utilities, comprehensive testing)
