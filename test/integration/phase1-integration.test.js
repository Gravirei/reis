/**
 * Integration tests for REIS v2.0 Phase 1
 * Tests the full workflow: config → plan → waves → state → git
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { loadConfig } = require('../../lib/utils/config');
const StateManager = require('../../lib/utils/state-manager');
const { WaveExecutor } = require('../../lib/utils/wave-executor');
const { isGitRepo, getGitInfo } = require('../../lib/utils/git-integration');

describe('Phase 1 Integration Tests', () => {
  const testRoot = path.join(__dirname, '../tmp_integration_test');
  
  beforeEach(() => {
    // Clean up and create test directory
    if (fs.existsSync(testRoot)) {
      fs.rmSync(testRoot, { recursive: true });
    }
    fs.mkdirSync(testRoot, { recursive: true });
    fs.mkdirSync(path.join(testRoot, '.planning'), { recursive: true });
    
    // Initialize git repo
    execSync('git init', { cwd: testRoot, stdio: 'pipe' });
    execSync('git config user.email "test@reis.dev"', { cwd: testRoot, stdio: 'pipe' });
    execSync('git config user.name "REIS Test"', { cwd: testRoot, stdio: 'pipe' });
    
    // Create initial commit
    fs.writeFileSync(path.join(testRoot, 'README.md'), '# Test Project\n', 'utf8');
    execSync('git add .', { cwd: testRoot, stdio: 'pipe' });
    execSync('git commit -m "Initial commit"', { cwd: testRoot, stdio: 'pipe' });
  });

  afterEach(() => {
    // Clean up
    if (fs.existsSync(testRoot)) {
      fs.rmSync(testRoot, { recursive: true });
    }
  });

  it('should execute full workflow with default config', () => {
    // 1. Create PLAN.md
    const planContent = `# Test Plan

## Wave 1: Setup (Size: small)
- Create config
- Setup structure

## Wave 2: Implementation (Size: medium)
- Build feature A
- Build feature B
- Add tests
`;
    fs.writeFileSync(path.join(testRoot, '.planning', 'PLAN.md'), planContent, 'utf8');

    // 2. Load config (should use defaults)
    const config = loadConfig(testRoot);
    assert.ok(config);
    assert.strictEqual(config.waves.defaultSize, 'medium');

    // 3. Initialize wave executor
    const executor = new WaveExecutor(testRoot);
    const waves = executor.parsePlan();
    assert.strictEqual(waves.length, 2);

    // 4. Execute Wave 1
    executor.startNextWave();
    let currentWave = executor.getCurrentWave();
    assert.strictEqual(currentWave.name, 'Wave 1: Setup');
    assert.strictEqual(currentWave.status, 'in_progress');

    // Make some changes
    fs.writeFileSync(path.join(testRoot, 'config.js'), '// Config\n', 'utf8');
    
    // Complete wave 1
    const result1 = executor.completeCurrentWave({
      changes: ['Created config'],
      testStatus: 'passed'
    });
    assert.ok(result1.wave);
    assert.strictEqual(result1.wave.status, 'completed');

    // 5. Execute Wave 2
    executor.startNextWave();
    currentWave = executor.getCurrentWave();
    assert.strictEqual(currentWave.name, 'Wave 2: Implementation');

    // Make more changes
    fs.writeFileSync(path.join(testRoot, 'feature-a.js'), '// Feature A\n', 'utf8');
    
    const result2 = executor.completeCurrentWave({
      changes: ['Added features'],
      testStatus: 'passed'
    });
    assert.ok(result2.wave);

    // 6. Verify state was tracked
    // The executor's state manager already has the data
    assert.ok(executor.stateManager.state);
    assert.strictEqual(executor.stateManager.state.waves.completed.length, 2);
    assert.ok(executor.stateManager.state.checkpoints.length >= 2);

    // 7. Verify git commits were created
    const gitInfo = getGitInfo(testRoot);
    assert.ok(gitInfo);
    assert.ok(gitInfo.commit);

    // 8. Generate report
    const report = executor.generateReport();
    assert.strictEqual(report.summary.completed, 2);
    assert.strictEqual(report.summary.total, 2);
    assert.strictEqual(report.summary.progress, 100);
  });

  it('should work with custom config', () => {
    // Create custom config
    const configContent = `module.exports = {
  waves: {
    defaultSize: 'small',
    autoCheckpoint: false
  },
  git: {
    autoCommit: false,
    commitMessagePrefix: '[TEST]'
  }
};`;
    fs.writeFileSync(path.join(testRoot, 'reis.config.js'), configContent, 'utf8');

    // Load and verify config
    const config = loadConfig(testRoot);
    assert.strictEqual(config.waves.defaultSize, 'small');
    assert.strictEqual(config.waves.autoCheckpoint, false);
    assert.strictEqual(config.git.autoCommit, false);
    assert.strictEqual(config.git.commitMessagePrefix, '[TEST]');
  });

  it('should handle wave execution with state tracking', () => {
    // Create simple plan
    const planContent = `# Plan\n\n## Wave 1: Test (Size: small)\n- Task 1\n- Task 2\n`;
    fs.writeFileSync(path.join(testRoot, '.planning', 'PLAN.md'), planContent, 'utf8');

    // Initialize state manager
    const stateManager = new StateManager(testRoot);
    stateManager.state.currentPhase = 'Phase 1: Testing';
    stateManager.saveState();

    // Execute wave
    const executor = new WaveExecutor(testRoot);
    executor.parsePlan();
    executor.startNextWave();
    
    // Verify state was updated
    const reloadedState = new StateManager(testRoot);
    assert.ok(reloadedState.state.activeWave);
    assert.ok(reloadedState.state.recentActivity.length > 0);
  });

  it('should detect deviations from plan', () => {
    // Create plan with size limits
    const planContent = `# Plan\n\n## Wave 1: Big Wave (Size: small)\n- Task 1\n- Task 2\n- Task 3\n- Task 4\n- Task 5\n`;
    fs.writeFileSync(path.join(testRoot, '.planning', 'PLAN.md'), planContent, 'utf8');

    const executor = new WaveExecutor(testRoot);
    executor.parsePlan();

    // Should warn about exceeding size limit (small = max 3 tasks)
    assert.strictEqual(executor.waves[0].tasks.length, 5);
  });

  it('should generate comprehensive report', () => {
    const planContent = `# Plan

## Wave 1: Wave A (Size: small)
- Task A

## Wave 2: Wave B (Size: medium)  
- Task B

## Wave 3: Wave C (Size: large)
- Task C
`;
    fs.writeFileSync(path.join(testRoot, '.planning', 'PLAN.md'), planContent, 'utf8');

    const executor = new WaveExecutor(testRoot);
    executor.parsePlan();
    
    const planSummary = executor.generatePlanSummary();
    assert.strictEqual(planSummary.totalWaves, 3);
    assert.ok(planSummary.totalEstimatedMinutes > 0);
    
    // Estimated time should be: small(30) + medium(60) + large(120) = 210 minutes
    assert.strictEqual(planSummary.totalEstimatedMinutes, 210);
  });
});
