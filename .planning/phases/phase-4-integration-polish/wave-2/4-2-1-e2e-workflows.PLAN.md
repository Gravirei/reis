# Plan: 4-2-1 - E2E Workflow Tests

## Objective
Create comprehensive end-to-end tests covering complete project lifecycle, multi-wave execution, config variations, and real-world usage patterns.

## Context
Phase 4 Wave 1 complete (249 tests passing). All core utilities working: config, state-manager, git-integration, wave-executor, plan-validator, metrics-tracker, visualizer. All commands working: execute-plan, checkpoint, resume, config, visualize.

This plan focuses on E2E scenarios that test the entire REIS v2.0 workflow from project initialization through multi-phase execution, including visualization integration and backward compatibility.

**Existing test structure:**
- test/integration/phase1-integration.test.js - Phase 1 utilities integration
- test/integration/phase2-integration.test.js - Phase 2 commands integration  
- test/e2e/phase2-scenarios.test.js - 5 E2E scenarios (23 tests)

**Target:** Add 10-12 comprehensive E2E tests (8-10 new scenarios)

## Dependencies
- Wave 1 complete (visualizer utility and commands available)

## Wave Assignment
**Wave 2, Task 1** (parallel with 4-2-2 and 4-2-3)

## Tasks

<task type="auto">
<name>Create comprehensive E2E workflow tests</name>
<files>test/e2e/phase4-workflows.test.js</files>
<action>
Create test/e2e/phase4-workflows.test.js with comprehensive end-to-end workflow tests covering real-world usage patterns.

**Test structure setup:**
```javascript
/**
 * Phase 4 End-to-End Workflow Tests
 * Complete project lifecycle with Phase 4 features (visualizer, analyze)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const StateManager = require('../../lib/utils/state-manager');
const MetricsTracker = require('../../lib/utils/metrics-tracker').MetricsTracker;
const { loadConfig } = require('../../lib/utils/config');
const { createBarChart, createProgressBar } = require('../../lib/utils/visualizer');

describe('Phase 4 E2E Workflow Tests', function() {
  this.timeout(20000);
  
  let testRoot;
  let originalCwd;

  beforeEach(() => {
    testRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'reis-phase4-e2e-'));
    originalCwd = process.cwd();
    process.chdir(testRoot);
    
    // Initialize git repo
    execSync('git init', { stdio: 'pipe' });
    execSync('git config user.email "test@reis.dev"', { stdio: 'pipe' });
    execSync('git config user.name "REIS Test"', { stdio: 'pipe' });
    
    // Create .planning structure
    fs.mkdirSync('.planning', { recursive: true });
    fs.mkdirSync('.planning/phases', { recursive: true });
    
    // Initial commit
    fs.writeFileSync('README.md', '# Test Project\n', 'utf8');
    execSync('git add .', { stdio: 'pipe' });
    execSync('git commit -m "Initial commit"', { stdio: 'pipe' });
  });

  afterEach(() => {
    process.chdir(originalCwd);
    if (fs.existsSync(testRoot)) {
      fs.rmSync(testRoot, { recursive: true, force: true });
    }
  });

  // Tests go here...
});
```

**Scenario 1: Complete Project Lifecycle with Visualization**
Test the full journey from initialization through completion with visualization at each step.
- Initialize project with STATE.md and ROADMAP.md
- Create multi-phase PLAN.md (3 phases, 2 waves each)
- Execute Wave 1, verify STATE.md updates
- Run visualize command, verify progress renders
- Create checkpoint after Wave 1
- Execute Wave 2, verify metrics tracking
- Run analyze command (should fail gracefully - no metrics yet initially)
- Complete Phase 1, verify phase transition in STATE.md
- Run visualize for full roadmap view
- Verify all git commits created
- Verify metrics accumulated correctly

**Scenario 2: Multi-Wave Project with Config Variations**
Test different config settings impact on wave execution.
- Create project with custom reis.config.js (small waves, auto-commit enabled)
- Create PLAN.md with 5 small waves (≤4 tasks each)
- Execute all waves sequentially
- Verify each wave creates git commit (auto-commit on)
- Verify wave sizes match config expectations
- Change config to disable auto-commit
- Execute 2 more waves
- Verify no auto-commits created
- Verify STATE.md tracks all 7 waves correctly

**Scenario 3: Parallel Wave Dependencies**
Test complex dependency chains with visualization.
- Create PLAN.md with dependency structure:
  - Wave 1 (foundation, no deps)
  - Wave 2 (depends on Wave 1)
  - Wave 3 (depends on Wave 1) - parallel with Wave 2
  - Wave 4 (depends on Wave 2 and Wave 3)
- Execute Wave 1, checkpoint
- Verify Wave 2 and Wave 3 can execute (parallel eligible)
- Execute Wave 2, verify Wave 4 still blocked
- Execute Wave 3, verify Wave 4 now unblocked
- Execute Wave 4, complete project
- Run visualize to see dependency graph representation
- Verify STATE.md shows correct execution order

**Scenario 4: Checkpoint and Resume with Metrics**
Test checkpoint/resume workflow preserves metrics and state.
- Create project with 4 waves
- Execute Wave 1 successfully, record metrics
- Execute Wave 2 successfully, record metrics
- Create checkpoint "mid-project"
- Simulate Wave 3 failure (modify STATE to show failure)
- Resume from checkpoint
- Verify metrics history preserved
- Verify Wave 3 can be re-attempted
- Complete Wave 3 and Wave 4
- Run analyze to see full execution history including retry

**Scenario 5: Visualization Integration Throughout**
Test that visualize command works at every stage.
- Initialize empty project
- Run visualize (should show "No active waves")
- Add PLAN.md with 3 waves
- Run visualize (should show 0% progress)
- Execute Wave 1
- Run visualize (should show 33% progress)
- Execute Wave 2
- Run visualize (should show 67% progress)
- Execute Wave 3
- Run visualize (should show 100% complete)
- Verify visualize handles edge cases (no STATE, no PLAN, etc.)

**Scenario 6: Large Multi-Phase Project**
Test scalability with realistic project size.
- Create ROADMAP.md with 3 phases
- Phase 1: 3 waves (foundation)
- Phase 2: 4 waves (features)
- Phase 3: 2 waves (polish)
- Create PLAN.md for each phase
- Execute all Phase 1 waves
- Verify STATE.md phase transition
- Execute all Phase 2 waves
- Checkpoint "Phase 2 complete"
- Execute Phase 3 waves
- Run analyze for full project metrics
- Verify 9 waves tracked correctly
- Verify 1+ checkpoints recorded
- Verify phase transitions clean

**Scenario 7: Backward Compatibility with REIS v1.x**
Test that v2.0 works with v1.x project structure.
- Create legacy ROADMAP.md (v1.x format)
- Create legacy STATE.md (without waves/checkpoints)
- Initialize with StateManager (should migrate gracefully)
- Add v2.0 features (waves, checkpoints)
- Execute wave with v2.0 features
- Verify STATE.md upgraded to v2.0 format
- Verify v1.x data preserved
- Verify git integration works
- Verify no data loss during migration

**Scenario 8: Error Recovery and State Consistency**
Test that errors don't corrupt state.
- Create project with 3 waves
- Execute Wave 1 successfully
- Execute Wave 2 with simulated failure
- Verify STATE.md marks Wave 2 as failed
- Verify metrics record failure
- Verify git commit NOT created (failure)
- Resume and retry Wave 2 successfully
- Verify STATE.md corrected
- Verify metrics show both attempts
- Execute Wave 3
- Verify final state is consistent

**Scenario 9: Config Command Integration**
Test config command in realistic workflow.
- Initialize project (uses default config)
- Run config list (should show defaults)
- Run config set waveSize=small
- Verify reis.config.js created
- Execute wave (should use small size)
- Run config set autoCommit=false
- Execute wave (should not auto-commit)
- Run config reset
- Verify reis.config.js removed
- Execute wave (should use defaults)

**Scenario 10: Metrics Accumulation and Reporting**
Test metrics tracking across long project lifecycle.
- Create project with 6 waves
- Execute Wave 1 (duration: 5m), record metrics
- Execute Wave 2 (duration: 10m), record metrics
- Execute Wave 3 (duration: 8m), record metrics
- Checkpoint "mid-project"
- Execute Wave 4 (duration: 12m), record metrics
- Execute Wave 5 (duration: 6m), record metrics
- Execute Wave 6 (duration: 9m), record metrics
- Verify METRICS.md exists with all 6 executions
- Verify average duration calculated correctly (8.33m)
- Verify success rate is 100%
- Run analyze command
- Verify report shows all metrics
- Verify trends calculated correctly

**Implementation notes:**
- Use real filesystem operations (temp dirs cleaned up)
- Use real git operations for fidelity
- Mock time where needed for deterministic tests
- Each test fully isolated (no shared state)
- Comprehensive assertions at each step
- Test both success and failure paths
- Verify STATE.md, METRICS.md, git commits
- Test commands via direct API calls (faster than CLI exec)

**Helper functions to create:**
```javascript
// Helper to create realistic PLAN.md
function createPlanMD(waves) {
  let plan = `# Test Plan\n\n`;
  waves.forEach((wave, i) => {
    plan += `## Wave ${i + 1}: ${wave.name}\n`;
    plan += `Size: ${wave.size || 'medium'}\n`;
    plan += `Dependencies: ${wave.deps || 'none'}\n\n`;
    plan += `### Tasks\n`;
    for (let t = 0; t < (wave.taskCount || 3); t++) {
      plan += `- Task ${t + 1}\n`;
    }
    plan += `\n`;
  });
  return plan;
}

// Helper to create ROADMAP.md
function createRoadmapMD(phases) {
  let roadmap = `# Project Roadmap\n\n`;
  phases.forEach((phase, i) => {
    roadmap += `## Phase ${i + 1}: ${phase.name}\n`;
    roadmap += `Waves: ${phase.waveCount}\n\n`;
  });
  return roadmap;
}

// Helper to execute wave and verify
async function executeWaveAndVerify(waveNum, expectedCommit = true) {
  const stateManager = new StateManager(process.cwd());
  // Execute wave logic...
  const state = stateManager.loadState();
  assert(state.completedWaves.includes(`Wave ${waveNum}`));
  
  if (expectedCommit) {
    const commits = execSync('git log --oneline', { encoding: 'utf8' });
    assert(commits.includes(`Wave ${waveNum}`));
  }
}
```

**Coverage targets:**
- 10 E2E scenarios (as described above)
- Each scenario has 5-10 assertions
- Total: ~10-12 new tests
- Test both happy path and error cases
- Verify state consistency at every step
- All tests pass in <15 seconds total
</action>
<verify>
npm test -- test/e2e/phase4-workflows.test.js

# Should show 10-12 new tests passing
# Total test count: 249 + 10-12 = 259-261 tests
</verify>
<done>
- test/e2e/phase4-workflows.test.js created with 10+ comprehensive E2E tests
- All scenarios cover real-world usage patterns
- Tests verify: STATE.md accuracy, git commits, metrics tracking, visualization integration
- Backward compatibility with v1.x verified
- Config variations tested
- Multi-phase projects tested
- Error recovery tested
- All tests passing
- No test pollution (all temp files cleaned up)
- Tests complete in <20 seconds total
</done>
</task>

## Success Criteria
- 10-12 new E2E tests covering complete project lifecycle
- All tests pass and run in <20 seconds
- Tests verify integration of all Phase 4 features
- Real-world usage patterns validated
- Backward compatibility confirmed
- State consistency verified across complex scenarios

## Verification
```bash
npm test -- test/e2e/phase4-workflows.test.js
npm test  # All 259-261 tests should pass
```
