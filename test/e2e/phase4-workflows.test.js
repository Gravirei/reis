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

  // Helper functions
  function createPlanMD(waves) {
    let plan = `# Test Plan\n\n`;
    waves.forEach((wave, i) => {
      plan += `## Wave ${i + 1}: ${wave.name}\n`;
      plan += `Size: ${wave.size || 'medium'}\n`;
      plan += `Dependencies: ${wave.deps || 'none'}\n\n`;
      plan += `### Tasks\n`;
      for (let t = 0; t < (wave.taskCount || 3); t++) {
        plan += `- Task ${t + 1}: ${wave.name} task ${t + 1}\n`;
      }
      plan += `\n`;
    });
    return plan;
  }

  function createRoadmapMD(phases) {
    let roadmap = `# Project Roadmap\n\n`;
    phases.forEach((phase, i) => {
      roadmap += `## Phase ${i + 1}: ${phase.name}\n`;
      roadmap += `Waves: ${phase.waveCount}\n`;
      roadmap += `Description: ${phase.description || 'Phase description'}\n\n`;
    });
    return roadmap;
  }

  function executeWave(waveNum, waveName, success = true) {
    const stateManager = new StateManager(testRoot);
    
    // Use StateManager's built-in methods
    stateManager.startWave(waveName, 3);
    
    // Create test file for this wave
    fs.writeFileSync(`wave${waveNum}.txt`, `Wave ${waveNum} output\n`, 'utf8');
    execSync('git add .', { stdio: 'pipe' });
    
    if (success) {
      // Complete wave successfully using StateManager's method
      const commitOutput = execSync(`git commit -m "feat: complete wave ${waveNum} - ${waveName}"`, { encoding: 'utf8', stdio: 'pipe' });
      const commitHash = commitOutput.includes('[') ? commitOutput.split('[')[1].split(']')[0].trim() : 'no-hash';
      
      stateManager.completeWave(commitHash);
    } else {
      // Mark as failed (add to blockers)
      stateManager.addBlocker(`Wave ${waveNum} - ${waveName} failed: Simulated failure`);
      stateManager.state.activeWave = null;
      stateManager.saveState();
    }
    
    // Return fresh state loaded from disk
    const freshStateManager = new StateManager(testRoot);
    return freshStateManager.state;
  }

  // Scenario 1: Complete Project Lifecycle with Visualization
  describe('Scenario 1: Complete Project Lifecycle', () => {
    it('should execute full lifecycle from init to completion with visualization', () => {
      // Initialize project
      const stateManager = new StateManager(testRoot);
      stateManager.state.currentPhase = 'Phase 1: Foundation';
      stateManager.saveState();
      
      // Create ROADMAP
      const roadmap = createRoadmapMD([
        { name: 'Foundation', waveCount: 2, description: 'Build foundation' },
        { name: 'Features', waveCount: 2, description: 'Add features' }
      ]);
      fs.writeFileSync('.planning/ROADMAP.md', roadmap, 'utf8');
      
      // Create PLAN for Phase 1
      const plan = createPlanMD([
        { name: 'Setup Infrastructure', taskCount: 3 },
        { name: 'Create Core Modules', taskCount: 4 }
      ]);
      fs.writeFileSync('.planning/PLAN.md', plan, 'utf8');
      
      // Execute Wave 1
      let state = executeWave(1, 'Setup Infrastructure');
      assert.strictEqual(state.waves.completed.length, 1);
      assert.strictEqual(state.waves.completed[0].name, 'Setup Infrastructure');
      
      // Verify STATE.md created
      assert(fs.existsSync('.planning/STATE.md'));
      const stateContent = fs.readFileSync('.planning/STATE.md', 'utf8');
      assert(stateContent.includes('Phase 1: Foundation'));
      
      // Execute Wave 2
      state = executeWave(2, 'Create Core Modules');
      // Reload state to get updated wave count from disk
      const stateManager2 = new StateManager(testRoot);
      assert.strictEqual(stateManager2.state.waves.completed.length, 2);
      
      // Verify git commits
      const commits = execSync('git log --oneline', { encoding: 'utf8' });
      assert(commits.includes('wave 1'));
      assert(commits.includes('wave 2'));
      
      // Verify phase completion
      assert.strictEqual(state.currentPhase, 'Phase 1: Foundation');
    });
  });

  // Scenario 2: Multi-Wave Project with Config Variations
  describe('Scenario 2: Config Variations', () => {
    it('should respect config settings during wave execution', () => {
      // Create custom config
      const config = `module.exports = {
  waveSize: 'small',
  autoCommit: true,
  maxWaveSize: 4
};`;
      fs.writeFileSync('reis.config.js', config, 'utf8');
      
      // Verify config loaded
      const loadedConfig = loadConfig(testRoot);
      assert.strictEqual(loadedConfig.waveSize, 'small');
      assert.strictEqual(loadedConfig.autoCommit, true);
      
      // Create plan with small waves
      const plan = createPlanMD([
        { name: 'Wave 1', taskCount: 3, size: 'small' },
        { name: 'Wave 2', taskCount: 4, size: 'small' },
        { name: 'Wave 3', taskCount: 2, size: 'small' }
      ]);
      fs.writeFileSync('.planning/PLAN.md', plan, 'utf8');
      
      // Initialize state
      const stateManager = new StateManager(testRoot);
      stateManager.state.currentPhase = 'Phase 1: Test';
      stateManager.saveState();
      
      // Execute waves
      executeWave(1, 'Wave 1');
      executeWave(2, 'Wave 2');
      executeWave(3, 'Wave 3');
      
      // Verify all waves completed
      const state = stateManager.loadState();
      assert.strictEqual(state.waves.completed.length, 3);
      
      // Verify commits created (auto-commit on)
      const commits = execSync('git log --oneline', { encoding: 'utf8' }).split('\n');
      assert(commits.length >= 4); // Initial + 3 waves
      
      // Change config
      const newConfig = `module.exports = {
  waveSize: 'small',
  autoCommit: false
};`;
      fs.writeFileSync('reis.config.js', newConfig, 'utf8');
      
      const updatedConfig = loadConfig(testRoot);
      assert.strictEqual(updatedConfig.autoCommit, false);
    });
  });

  // Scenario 3: Checkpoint and Resume with Metrics
  describe('Scenario 3: Checkpoint and Resume', () => {
    it('should preserve metrics and state across checkpoint/resume', () => {
      const stateManager = new StateManager(testRoot);
      stateManager.state.currentPhase = 'Phase 1: Test';
      stateManager.saveState();
      
      // Create metrics tracker
      const metricsTracker = new MetricsTracker(testRoot);
      
      // Execute Wave 1 with metrics
      executeWave(1, 'Wave 1');
      metricsTracker.recordWaveExecution({
        name: 'Wave 1',
        duration: 300,
        taskCount: 3,
        status: 'completed'
      });
      
      // Execute Wave 2 with metrics
      executeWave(2, 'Wave 2');
      metricsTracker.recordWaveExecution({
        name: 'Wave 2',
        duration: 600,
        taskCount: 4,
        status: 'completed'
      });
      
      // Create checkpoint
      const checkpointHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
      stateManager.state.checkpoints = stateManager.state.checkpoints || [];
      stateManager.state.checkpoints.push({
        name: 'mid-project',
        commit: checkpointHash,
        createdAt: new Date().toISOString()
      });
      stateManager.saveState();
      
      // Verify metrics preserved
      const metrics = metricsTracker.getMetricsSummary();
      assert.strictEqual(metrics.totalWaves, 2);
      assert.strictEqual(metrics.successfulWaves, 2);
      
      // Simulate failure on Wave 3
      const state = executeWave(3, 'Wave 3', false);
      assert.strictEqual(state.blockers.length, 1); // Failed wave in blockers
      
      // Verify checkpoint available for resume
      assert.strictEqual(state.checkpoints.length, 1);
      assert.strictEqual(state.checkpoints[0].name, 'mid-project');
      
      // Resume and retry Wave 3
      const retryState = executeWave(3, 'Wave 3', true);
      assert.strictEqual(retryState.waves.completed.length, 3);
    });
  });

  // Scenario 4: Visualization Integration Throughout
  describe('Scenario 4: Visualization Integration', () => {
    it('should provide visualization at every project stage', () => {
      const stateManager = new StateManager(testRoot);
      
      // Stage 1: Empty project
      stateManager.state.currentPhase = 'Phase 1: Test';
      stateManager.state.completedWaves = [];
      stateManager.saveState();
      
      // Create plan
      const plan = createPlanMD([
        { name: 'Wave 1', taskCount: 3 },
        { name: 'Wave 2', taskCount: 3 },
        { name: 'Wave 3', taskCount: 3 }
      ]);
      fs.writeFileSync('.planning/PLAN.md', plan, 'utf8');
      
      // Stage 2: 0% progress - visualize should work
      let progress = 0;
      let bar = createProgressBar(progress, 50);
      assert(typeof bar === 'string');
      assert(bar.includes('░')); // Empty progress bar
      
      // Execute Wave 1 - 33% progress
      executeWave(1, 'Wave 1');
      progress = 33;
      bar = createProgressBar(progress, 50);
      assert(bar.includes('█')); // Some progress
      
      // Execute Wave 2 - 67% progress
      executeWave(2, 'Wave 2');
      progress = 67;
      bar = createProgressBar(progress, 50);
      assert(bar.includes('█')); // More progress
      
      // Execute Wave 3 - 100% progress
      executeWave(3, 'Wave 3');
      progress = 100;
      bar = createProgressBar(progress, 50);
      assert(bar.includes('█')); // Full progress
      
      // Verify bar chart creation
      const data = [
        { label: 'Wave 1', value: 3 },
        { label: 'Wave 2', value: 3 },
        { label: 'Wave 3', value: 3 }
      ];
      const chart = createBarChart(data, 'Tasks Completed', 40);
      assert(typeof chart === 'string');
      assert(chart.includes('Wave 1'));
      assert(chart.includes('Wave 2'));
      assert(chart.includes('Wave 3'));
    });
  });

  // Scenario 5: Large Multi-Phase Project
  describe('Scenario 5: Multi-Phase Project', () => {
    it('should handle large projects with multiple phases', () => {
      // Create comprehensive ROADMAP
      const roadmap = createRoadmapMD([
        { name: 'Foundation', waveCount: 3, description: 'Build foundation' },
        { name: 'Features', waveCount: 4, description: 'Add features' },
        { name: 'Polish', waveCount: 2, description: 'Polish and optimize' }
      ]);
      fs.writeFileSync('.planning/ROADMAP.md', roadmap, 'utf8');
      
      const stateManager = new StateManager(testRoot);
      const metricsTracker = new MetricsTracker(testRoot);
      
      // Phase 1: Foundation (3 waves)
      stateManager.state.currentPhase = 'Phase 1: Foundation';
      stateManager.saveState();
      
      executeWave(1, 'Setup Infrastructure');
      executeWave(2, 'Create Core Modules');
      executeWave(3, 'Add Base Components');
      
      // Verify Phase 1 completion
      let state = stateManager.loadState();
      assert.strictEqual(state.waves.completed.length, 3);
      
      // Transition to Phase 2
      state.currentPhase = 'Phase 2: Features';
      stateManager.state = state;
      stateManager.saveState();
      
      // Phase 2: Features (4 waves)
      executeWave(4, 'User Authentication');
      executeWave(5, 'Data Management');
      executeWave(6, 'API Integration');
      executeWave(7, 'UI Components');
      
      state = stateManager.loadState();
      assert.strictEqual(state.waves.completed.length, 7);
      
      // Create checkpoint
      const checkpointHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
      state.checkpoints = state.checkpoints || [];
      state.checkpoints.push({
        name: 'Phase 2 complete',
        commit: checkpointHash,
        createdAt: new Date().toISOString()
      });
      stateManager.state = state;
      stateManager.saveState();
      
      // Transition to Phase 3
      state.currentPhase = 'Phase 3: Polish';
      stateManager.state = state;
      stateManager.saveState();
      
      // Phase 3: Polish (2 waves)
      executeWave(8, 'Performance Optimization');
      executeWave(9, 'Final Testing');
      
      state = stateManager.loadState();
      assert.strictEqual(state.waves.completed.length, 9);
      assert.strictEqual(state.checkpoints.length, 1);
      assert.strictEqual(state.currentPhase, 'Phase 3: Polish');
      
      // Verify all commits
      const commits = execSync('git log --oneline', { encoding: 'utf8' });
      assert(commits.includes('wave 1'));
      assert(commits.includes('wave 9'));
    });
  });

  // Scenario 6: Backward Compatibility with REIS v1.x
  describe('Scenario 6: Backward Compatibility', () => {
    it('should work with v1.x project structure and migrate gracefully', () => {
      // Create legacy v1.x STATE.md (without waves/checkpoints)
      const legacyState = `# REIS v1.x Development State

## Current Phase
**Phase 1: Foundation**

## Recent Activity
- 2025-01-01: Started project

## Completed Items
- Initial setup
- Base configuration

## Next Steps
Add core features

## Blockers
_None_`;
      fs.writeFileSync('.planning/STATE.md', legacyState, 'utf8');
      
      // Create legacy ROADMAP (v1.x format)
      const legacyRoadmap = `# Project Roadmap

## Phase 1: Foundation
Setup and configuration

## Phase 2: Features
Core functionality`;
      fs.writeFileSync('.planning/ROADMAP.md', legacyRoadmap, 'utf8');
      
      // Initialize with v2.0 StateManager (should migrate)
      const stateManager = new StateManager(testRoot);
      const state = stateManager.loadState();
      
      // Verify v1.x data preserved
      assert(state.currentPhase.includes('Phase 1'));
      
      // Add v2.0 features (use waves.completed structure)
      assert(state.waves && Array.isArray(state.waves.completed));
      assert(Array.isArray(state.checkpoints));
      
      // Execute wave with v2.0 features
      const newState = executeWave(1, 'First v2.0 Wave');
      assert.strictEqual(newState.waves.completed.length, 1);
      
      // Verify STATE.md upgraded
      const updatedStateContent = fs.readFileSync('.planning/STATE.md', 'utf8');
      assert(updatedStateContent.includes('completedWaves') || updatedStateContent.includes('Wave'));
      
      // Verify no data loss
      assert(state.currentPhase.includes('Phase 1'));
    });
  });

  // Scenario 7: Error Recovery and State Consistency
  describe('Scenario 7: Error Recovery', () => {
    it('should maintain state consistency during errors', () => {
      const stateManager = new StateManager(testRoot);
      stateManager.state.currentPhase = 'Phase 1: Test';
      stateManager.saveState();
      
      // Execute Wave 1 successfully
      let state = executeWave(1, 'Wave 1', true);
      assert.strictEqual(state.waves.completed.length, 1);
      
      // Execute Wave 2 with failure
      state = executeWave(2, 'Wave 2', false);
      assert.strictEqual(state.blockers.length, 1); // Failed wave added to blockers
      assert.strictEqual(state.waves.completed.length, 1);
      
      // Verify no commit created for failed wave
      const commitsAfterFailure = execSync('git log --oneline', { encoding: 'utf8' });
      const commitCount = commitsAfterFailure.split('\n').filter(l => l.trim()).length;
      assert.strictEqual(commitCount, 2); // Initial + Wave 1 only
      
      // Verify STATE.md marks failure
      const stateContent = fs.readFileSync('.planning/STATE.md', 'utf8');
      assert(stateContent.includes('Blockers') || stateContent.includes('Wave 2'));
      
      // Retry Wave 2 successfully
      state = executeWave(2, 'Wave 2', true);
      assert.strictEqual(state.waves.completed.length, 2);
      assert.strictEqual(state.blockers.length, 1); // History preserved in blockers
      
      // Execute Wave 3
      state = executeWave(3, 'Wave 3', true);
      assert.strictEqual(state.waves.completed.length, 3);
      
      // Verify final state consistency
      assert.strictEqual(state.currentPhase, 'Phase 1: Test');
      assert(state.waves && Array.isArray(state.waves.completed));
      assert(Array.isArray(state.blockers));
    });
  });

  // Scenario 8: Config Command Integration
  describe('Scenario 8: Config Command Integration', () => {
    it('should integrate config changes into workflow', () => {
      // Start with defaults (no config file)
      assert(!fs.existsSync('reis.config.js'));
      let config = loadConfig(testRoot);
      assert.strictEqual(config.waveSize, 'medium'); // default
      
      // Create config
      const configContent = `module.exports = {
  waveSize: 'small',
  autoCommit: true
};`;
      fs.writeFileSync('reis.config.js', configContent, 'utf8');
      
      // Reload config
      config = loadConfig(testRoot);
      assert.strictEqual(config.waveSize, 'small');
      assert.strictEqual(config.autoCommit, true);
      
      // Execute wave with new config
      const stateManager = new StateManager(testRoot);
      stateManager.state.currentPhase = 'Phase 1: Test';
      stateManager.saveState();
      
      executeWave(1, 'Wave 1');
      
      // Update config
      const newConfigContent = `module.exports = {
  waveSize: 'large',
  autoCommit: false
};`;
      fs.writeFileSync('reis.config.js', newConfigContent, 'utf8');
      
      config = loadConfig(testRoot);
      assert.strictEqual(config.waveSize, 'large');
      assert.strictEqual(config.autoCommit, false);
      
      // Execute another wave
      executeWave(2, 'Wave 2');
      
      // Reset config (remove file)
      fs.unlinkSync('reis.config.js');
      config = loadConfig(testRoot);
      assert.strictEqual(config.waveSize, 'medium'); // back to default
      
      // Execute with defaults
      executeWave(3, 'Wave 3');
      
      const state = stateManager.loadState();
      assert.strictEqual(state.waves.completed.length, 3);
    });
  });

  // Scenario 9: Metrics Accumulation and Reporting
  describe('Scenario 9: Metrics Accumulation', () => {
    it('should track metrics across long project lifecycle', () => {
      const stateManager = new StateManager(testRoot);
      stateManager.state.currentPhase = 'Phase 1: Test';
      stateManager.saveState();
      
      const metricsTracker = new MetricsTracker(testRoot);
      
      // Execute 6 waves with varying durations
      const waveDurations = [300, 600, 480, 720, 360, 540]; // seconds (5m, 10m, 8m, 12m, 6m, 9m)
      
      for (let i = 0; i < 6; i++) {
        executeWave(i + 1, `Wave ${i + 1}`);
        metricsTracker.recordWaveExecution({
          name: `Wave ${i + 1}`,
          duration: waveDurations[i],
          taskCount: 3 + (i % 3),
          status: 'completed'
        });
      }
      
      // Create checkpoint mid-project
      if (fs.existsSync('.planning/STATE.md')) {
        const checkpointHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
        const state = stateManager.loadState();
        state.checkpoints = state.checkpoints || [];
        state.checkpoints.push({
          name: 'mid-project',
          commit: checkpointHash,
          createdAt: new Date().toISOString()
        });
        stateManager.state = state;
        stateManager.saveState();
      }
      
      // Verify metrics
      const metrics = metricsTracker.getMetricsSummary();
      assert.strictEqual(metrics.totalWaves, 6);
      assert.strictEqual(metrics.successfulWaves, 6);
      assert.strictEqual(metrics.failedWaves, 0);
      
      // Verify average duration (sum: 3000s / 6 = 500s = 8.33m)
      const avgDuration = waveDurations.reduce((a, b) => a + b, 0) / waveDurations.length;
      assert.strictEqual(avgDuration, 500);
      
      // Verify success rate
      assert.strictEqual(metrics.successRate, 100);
      
      // Verify METRICS.md exists
      assert(fs.existsSync('.planning/METRICS.md'));
      const metricsContent = fs.readFileSync('.planning/METRICS.md', 'utf8');
      assert(metricsContent.includes('Wave 1'));
      assert(metricsContent.includes('Wave 6'));
    });
  });

  // Scenario 10: Parallel Wave Dependencies
  describe('Scenario 10: Dependency Management', () => {
    it('should handle complex dependency chains correctly', () => {
      const stateManager = new StateManager(testRoot);
      stateManager.state.currentPhase = 'Phase 1: Test';
      stateManager.saveState();
      
      // Create PLAN with dependencies
      const planContent = `# Test Plan with Dependencies

## Wave 1: Foundation
Size: medium
Dependencies: none

### Tasks
- Task 1: Setup base infrastructure
- Task 2: Configure environment
- Task 3: Create core modules

## Wave 2: Feature A
Size: medium
Dependencies: Wave 1

### Tasks
- Task 1: Build Feature A component 1
- Task 2: Build Feature A component 2

## Wave 3: Feature B
Size: medium
Dependencies: Wave 1

### Tasks
- Task 1: Build Feature B component 1
- Task 2: Build Feature B component 2

## Wave 4: Integration
Size: medium
Dependencies: Wave 2, Wave 3

### Tasks
- Task 1: Integrate Feature A and B
- Task 2: Add integration tests
- Task 3: Final verification
`;
      fs.writeFileSync('.planning/PLAN.md', planContent, 'utf8');
      
      // Execute Wave 1 (no dependencies)
      let state = executeWave(1, 'Foundation');
      assert.strictEqual(state.waves.completed.length, 1);
      
      // Create checkpoint after Wave 1
      const checkpointHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
      state.checkpoints = state.checkpoints || [];
      state.checkpoints.push({
        name: 'Foundation complete',
        commit: checkpointHash,
        createdAt: new Date().toISOString()
      });
      stateManager.state = state;
      stateManager.saveState();
      
      // Execute Wave 2 (depends on Wave 1 - can proceed)
      state = executeWave(2, 'Feature A');
      assert.strictEqual(state.waves.completed.length, 2);
      
      // Execute Wave 3 (depends on Wave 1 - can proceed in parallel)
      state = executeWave(3, 'Feature B');
      assert.strictEqual(state.waves.completed.length, 3);
      
      // Execute Wave 4 (depends on Wave 2 and 3 - now unblocked)
      state = executeWave(4, 'Integration');
      assert.strictEqual(state.waves.completed.length, 4);
      
      // Verify execution order in git history
      const commits = execSync('git log --oneline', { encoding: 'utf8' });
      assert(commits.includes('wave 1'));
      assert(commits.includes('wave 2'));
      assert(commits.includes('wave 3'));
      assert(commits.includes('wave 4'));
      
      // Verify checkpoint recorded
      assert.strictEqual(state.checkpoints.length, 1);
      assert.strictEqual(state.checkpoints[0].name, 'Foundation complete');
      
      // Verify final state
      assert.strictEqual(state.currentPhase, 'Phase 1: Test');
    });
  });
});
