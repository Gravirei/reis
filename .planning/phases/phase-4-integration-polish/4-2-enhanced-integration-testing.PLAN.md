# Plan: 4-2 - Enhanced Integration Testing

## Objective
Create comprehensive end-to-end tests covering full project lifecycle, performance benchmarks, error recovery, and backward compatibility verification.

## Context
Phase 1-3 complete with 271 tests passing. We now need comprehensive integration testing that validates the entire system working together in realistic scenarios, including edge cases and performance requirements.

Previous integration tests:
- Phase 2: test/integration/phase2-integration.test.js (23 tests)
- Phase 3: test/integration/phase3-integration.test.js (planned but scope reduced)

## Dependencies
- Wave 1 complete (4-1-visualizer-utility.PLAN.md should be done)

## Wave Assignment
**Wave 2** (depends on Wave 1 for analyze/visualize commands)

## Tasks

<task type="auto">
<name>Create end-to-end workflow tests for full project lifecycle</name>
<files>test/e2e/full-lifecycle.test.js</files>
<action>
Create comprehensive E2E tests simulating real-world project workflows from start to finish.

**Test scenarios:**

1. **Complete Project Lifecycle**
   - Initialize new project with `reis new`
   - Create ROADMAP.md with multiple phases
   - Generate plans for Phase 1
   - Execute all Phase 1 waves sequentially
   - Create checkpoints at each wave
   - Complete Phase 1 and move to Phase 2
   - Verify STATE.md accuracy throughout
   - Verify git commits at each stage

2. **Multi-Phase Project**
   - 3-phase project simulation
   - Each phase has 2-3 waves
   - Test phase transitions
   - Verify metrics tracking across phases
   - Test analyze command shows all phases
   - Verify visualize command shows roadmap correctly

3. **Complex Dependency Chain**
   - Wave 1 → Wave 2 → Wave 3 (sequential)
   - Wave 4 + Wave 5 (parallel after Wave 3)
   - Verify execution order
   - Test that parallel waves don't block each other
   - Verify state tracking for complex dependencies

4. **Resume and Recovery**
   - Start wave execution
   - Simulate failure mid-wave
   - Create checkpoint
   - Resume from checkpoint
   - Verify no data loss
   - Verify git history preserved
   - Test multiple resume scenarios

5. **Validation and Optimization Workflow**
   - Create PLAN.md with intentional issues
   - Run `reis validate` - should catch issues
   - Fix issues
   - Run `reis optimize` - should suggest improvements
   - Accept optimizations
   - Execute optimized plan
   - Verify improved execution

6. **Visualization Throughout Lifecycle**
   - Run `reis visualize` at project start (0% progress)
   - Run after each wave (progress updates)
   - Run `reis analyze` after phase completion
   - Verify metrics accumulate correctly
   - Test watch mode doesn't crash during execution

**Implementation approach:**
- Use real filesystem (temp directories cleaned up after)
- Use real git operations
- Each test is fully isolated
- Tests should complete in <30 seconds each
- Use async/await for all operations
- Comprehensive assertions at each step

**Test structure:**
```javascript
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const assert = require('assert');

describe('E2E: Full Project Lifecycle', () => {
  let testDir;
  
  beforeEach(async () => {
    testDir = path.join(__dirname, `../../tmp_rovodev_e2e_${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    process.chdir(testDir);
    execSync('git init');
    execSync('git config user.name "Test"');
    execSync('git config user.email "test@test.com"');
  });
  
  afterEach(async () => {
    process.chdir(__dirname);
    await fs.rm(testDir, { recursive: true, force: true });
  });
  
  it('should complete full project lifecycle', async () => {
    // Test implementation
  });
});
```

**Coverage:**
- 15+ E2E scenarios
- Every major command combination
- Success and failure paths
- Edge cases (empty projects, corrupted state, etc.)
</action>
<verify>
npm test -- test/e2e/full-lifecycle.test.js
</verify>
<done>
- 15+ E2E tests covering complete project lifecycle
- All tests pass in <5 minutes total
- Tests verify STATE.md, git commits, metrics, and visualizations
- No test pollution (all temp files cleaned up)
- Tests can run in parallel without conflicts
</done>
</task>

<task type="auto">
<name>Create performance benchmark suite</name>
<files>test/performance/benchmarks.test.js, test/performance/benchmark-utils.js</files>
<action>
Create performance benchmarks to ensure REIS v2.0 meets performance requirements and doesn't regress.

**Benchmark targets:**

1. **Config Loading**
   - Target: <50ms for default config
   - Target: <100ms for complex merged config
   - Test with various config sizes

2. **STATE.md Operations**
   - Read state: <20ms
   - Update state: <50ms
   - Add wave: <30ms
   - 100 sequential updates: <2s

3. **Git Operations**
   - Status check: <100ms
   - Create commit: <200ms
   - Create checkpoint: <300ms (includes commit + tag)

4. **Wave Execution**
   - Parse PLAN.md (10 waves): <100ms
   - Execute empty wave: <500ms
   - Execute wave with 5 tasks: <2s (excluding actual task work)

5. **Metrics Tracking**
   - Record event: <10ms
   - Load history (100 events): <50ms
   - Generate report: <100ms

6. **Plan Validation**
   - Validate small plan (3 waves): <200ms
   - Validate large plan (20 waves): <500ms

7. **Plan Optimization**
   - Optimize small plan: <300ms
   - Optimize large plan: <1s

8. **Visualization Rendering**
   - Create bar chart: <50ms
   - Create timeline: <100ms
   - Full analyze report: <500ms
   - Full visualize render: <300ms

**Implementation:**

Create test/performance/benchmark-utils.js:
```javascript
/**
 * Measure execution time of async function
 */
async function measureTime(fn, iterations = 1) {
  const times = [];
  for (let i = 0; i < iterations; i++) {
    const start = process.hrtime.bigint();
    await fn();
    const end = process.hrtime.bigint();
    times.push(Number(end - start) / 1_000_000); // Convert to ms
  }
  return {
    avg: times.reduce((a, b) => a + b) / times.length,
    min: Math.min(...times),
    max: Math.max(...times),
    median: times.sort()[Math.floor(times.length / 2)]
  };
}

/**
 * Assert performance target
 */
function assertPerformance(result, targetMs, description) {
  console.log(`  ${description}: avg=${result.avg.toFixed(2)}ms, target=${targetMs}ms`);
  if (result.avg > targetMs) {
    throw new Error(`Performance regression: ${description} took ${result.avg.toFixed(2)}ms (target: ${targetMs}ms)`);
  }
}

module.exports = { measureTime, assertPerformance };
```

Create test/performance/benchmarks.test.js:
```javascript
const { measureTime, assertPerformance } = require('./benchmark-utils.js');
const { loadConfig } = require('../../lib/utils/config.js');
const StateManager = require('../../lib/utils/state-manager.js');
// ... other imports

describe('Performance Benchmarks', function() {
  // Longer timeout for performance tests
  this.timeout(30000);
  
  describe('Config Loading', () => {
    it('should load default config in <50ms', async () => {
      const result = await measureTime(async () => {
        await loadConfig();
      }, 10); // Run 10 times and average
      
      assertPerformance(result, 50, 'Config loading');
    });
  });
  
  // ... more benchmarks
});
```

**Reporting:**
- Print performance results to console during test run
- Fail tests if performance targets missed
- Generate performance report JSON file
- Compare with baseline (if exists)

**Notes:**
- Use process.hrtime.bigint() for accurate timing
- Run each benchmark multiple times and average
- Exclude setup/teardown time from measurements
- Tests should be deterministic (no network calls)
- Document why each target was chosen
</action>
<verify>
npm test -- test/performance/benchmarks.test.js
</verify>
<done>
- Performance benchmark suite with 15+ benchmarks
- All benchmarks meet or exceed performance targets
- Benchmark utilities created for reusability
- Performance report generated
- Tests document performance expectations
- No performance regressions from Phase 1-3
</done>
</task>

<task type="auto">
<name>Create error recovery and edge case tests</name>
<files>test/integration/error-recovery.test.js, test/integration/edge-cases.test.js</files>
<action>
Create comprehensive tests for error scenarios, recovery mechanisms, and edge cases.

**test/integration/error-recovery.test.js:**

1. **Corrupted STATE.md Recovery**
   - STATE.md with invalid JSON
   - STATE.md with missing sections
   - STATE.md deleted mid-execution
   - Recovery: recreate from git history or prompt user

2. **Git Issues**
   - Dirty working tree during checkpoint
   - Detached HEAD state
   - Merge conflicts during resume
   - Missing git repository
   - Recovery: detect and show clear error messages

3. **Metrics Data Corruption**
   - Invalid JSON in metrics files
   - Missing metrics directory
   - Corrupted history files
   - Recovery: recreate metrics structure

4. **Plan File Issues**
   - PLAN.md not found
   - Malformed wave definitions
   - Missing required sections
   - Circular dependencies
   - Recovery: validation errors with fix suggestions

5. **Checkpoint Recovery**
   - Resume from old checkpoint (weeks ago)
   - Resume with modified files
   - Resume after git reset
   - Multiple checkpoints available
   - Recovery: show diff and prompt user

6. **Concurrent Execution**
   - Two REIS processes running simultaneously
   - Lock file detection
   - Stale lock cleanup
   - Recovery: prevent conflicts, show clear error

**test/integration/edge-cases.test.js:**

1. **Empty Projects**
   - No ROADMAP.md
   - Empty PLAN.md
   - Zero waves defined
   - Expected: graceful messages, not crashes

2. **Massive Scale**
   - 100+ waves in single plan
   - 1000+ tasks total
   - Very long file paths (250+ chars)
   - Huge commit messages (10KB+)
   - Expected: performance degrades gracefully

3. **Special Characters**
   - Unicode in file names
   - Special chars in wave names (emoji, symbols)
   - Newlines in task descriptions
   - Expected: proper escaping and handling

4. **Filesystem Edge Cases**
   - No write permissions
   - Disk full scenarios
   - Symlinks in project structure
   - Case-insensitive filesystems
   - Expected: clear error messages

5. **Config Edge Cases**
   - Invalid config types
   - Conflicting settings
   - Missing optional fields
   - Extreme values (negative numbers, huge sizes)
   - Expected: validation catches issues

6. **Command Chaining**
   - Multiple commands in rapid succession
   - Commands on uninitialized project
   - Commands with invalid flags
   - Expected: proper state management

**Implementation approach:**
```javascript
describe('Error Recovery: Corrupted STATE.md', () => {
  it('should recover from invalid JSON in STATE.md', async () => {
    // Setup: create valid state
    const state = new StateManager(config);
    await state.init();
    
    // Corrupt the file
    await fs.writeFile('.planning/STATE.md', 'INVALID JSON {{{');
    
    // Try to read - should recover or show helpful error
    try {
      await state.getState();
      assert.fail('Should have thrown error');
    } catch (err) {
      assert(err.message.includes('corrupted'));
      assert(err.message.includes('backup'));
    }
  });
});

describe('Edge Cases: Empty Projects', () => {
  it('should handle project with no ROADMAP.md gracefully', async () => {
    // Try to execute plan without roadmap
    const result = await executeCommand('execute-plan');
    assert(result.includes('ROADMAP.md not found'));
    assert(result.includes('reis new'));
  });
});
```

**Coverage:**
- 30+ error recovery scenarios
- 20+ edge case tests
- All errors have helpful messages
- No silent failures
- Recovery paths documented
</action>
<verify>
npm test -- test/integration/error-recovery.test.js
npm test -- test/integration/edge-cases.test.js
</verify>
<done>
- 50+ tests covering error scenarios and edge cases
- All error paths tested
- Recovery mechanisms verified
- Helpful error messages confirmed
- No crashes on invalid input
- Edge cases handled gracefully
</done>
</task>

<task type="checkpoint:human-verify">
<name>Backward compatibility verification with REIS v1.x</name>
<files>test/compatibility/v1-compatibility.test.js, docs/MIGRATION_GUIDE.md</files>
<action>
Create compatibility tests and migration guide to ensure smooth transition from REIS v1.x to v2.0.

**test/compatibility/v1-compatibility.test.js:**

Test that REIS v2.0 can work with v1.x project structures:

1. **V1.x STATE.md Format**
   - Load old STATE.md without wave tracking
   - Migrate to v2.0 format
   - Preserve existing data
   - Test: use real v1.x STATE.md samples

2. **V1.x PLAN.md Format**
   - Plans without wave annotations
   - Old-style task definitions
   - Parse and execute successfully
   - Test: backward-compatible parsing

3. **V1.x Project Structure**
   - .planning/ without metrics/
   - No reis.config.js
   - Old commit message format
   - Test: auto-upgrade gracefully

4. **V1.x Commands**
   - Test that old command syntax still works
   - Deprecated commands show migration hints
   - New commands available
   - Test: CLI backward compatibility

**docs/MIGRATION_GUIDE.md:**

Create comprehensive migration guide:

```markdown
# REIS v1.x to v2.0 Migration Guide

## Overview
REIS v2.0 introduces wave-based execution, enhanced state tracking, and powerful visualization features while maintaining backward compatibility with v1.x projects.

## Automatic Migration

When you run REIS v2.0 on a v1.x project:
1. STATE.md auto-upgrades to include wave tracking
2. Default reis.config.js is used (no file needed)
3. Existing git history preserved
4. No data loss

## New Features Available

### Wave-Based Execution
- Plans now parsed into waves
- Automatic checkpointing between waves
- Resume from any checkpoint

### Visualization & Analytics
- `reis analyze` - execution history and metrics
- `reis visualize` - real-time progress
- `reis validate` - plan validation
- `reis optimize` - plan optimization

### Enhanced State Tracking
- Wave progress tracking
- Checkpoint history
- Execution metrics
- Activity logging

## Breaking Changes
**None** - v2.0 is fully backward compatible.

## Recommended Upgrades

### 1. Add reis.config.js (optional)
```javascript
module.exports = {
  waves: {
    small: 2,
    medium: 5,
    large: 10
  },
  git: {
    autoCommit: true
  }
};
```

### 2. Update PLAN.md Format (optional)
Add wave annotations:
```markdown
<!-- WAVE 1: SMALL -->
## Tasks
...
<!-- /WAVE 1 -->
```

### 3. Enable New Features
- Run `reis analyze` to see historical metrics
- Use `reis visualize --watch` for live progress
- Validate plans with `reis validate` before execution

## Troubleshooting

### "STATE.md format not recognized"
- Backup your STATE.md
- Let v2.0 auto-migrate
- Verify data preserved

### "Old command not found"
- Check `reis --help` for new command names
- Most commands remain the same
- New commands added, none removed

## Support
- GitHub Issues: https://github.com/Gravirei/reis/issues
- Documentation: README.md
```

**Compatibility test implementation:**
```javascript
describe('V1.x Compatibility', () => {
  it('should read v1.x STATE.md format', async () => {
    const v1State = `# Project State
## Current Phase
Phase 1
## Active Wave
None
## Recent Activity
...`;
    await fs.writeFile('.planning/STATE.md', v1State);
    
    const state = new StateManager(config);
    const data = await state.getState();
    
    assert.equal(data.currentPhase, 'Phase 1');
    // Should parse successfully even without v2.0 sections
  });
  
  it('should execute v1.x PLAN.md without wave annotations', async () => {
    const v1Plan = `# Plan
## Tasks
1. Task one
2. Task two`;
    await fs.writeFile('PLAN.md', v1Plan);
    
    const executor = new WaveExecutor(config);
    const waves = await executor.parsePlan('PLAN.md');
    
    // Should create default waves
    assert(waves.length > 0);
  });
});
```
</action>
<verify>
# Run compatibility tests
npm test -- test/compatibility/v1-compatibility.test.js

# Manual verification needed:
# 1. Test with actual v1.x project (if available)
# 2. Verify MIGRATION_GUIDE.md accuracy
# 3. Check that no v1.x features broken
# 4. Confirm all v1.x commands still work

# HUMAN: Please verify migration guide is accurate and complete
</verify>
<done>
- Compatibility tests created and passing
- V1.x STATE.md format can be read
- V1.x PLAN.md format executes successfully
- MIGRATION_GUIDE.md created with clear instructions
- No breaking changes to v1.x functionality
- Auto-migration works smoothly
- **Human verified migration guide accuracy**
</done>
</task>

## Success Criteria
- 80+ new integration/E2E tests passing
- Performance benchmarks all meet targets
- 50+ error recovery and edge case tests passing
- Backward compatibility with v1.x verified
- MIGRATION_GUIDE.md created and reviewed
- All tests complete in <10 minutes total
- Zero test failures in full suite (~350+ tests)

## Verification
```bash
# E2E tests
npm test -- test/e2e/

# Performance benchmarks
npm test -- test/performance/

# Error recovery
npm test -- test/integration/error-recovery.test.js
npm test -- test/integration/edge-cases.test.js

# Compatibility
npm test -- test/compatibility/

# Full suite
npm test
# Should show ~420+ tests passing (271 + 65 from Wave 1 + 80+ from Wave 2)
```
