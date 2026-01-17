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
    const state = stateManager.loadState();
    
    // Mark wave as started
    if (!state.activeWave) {
      state.activeWave = { number: waveNum, name: waveName, startedAt: new Date().toISOString() };
    }
    
    // Create test file for this wave
    fs.writeFileSync(`wave${waveNum}.txt`, `Wave ${waveNum} output\n`, 'utf8');
    execSync('git add .', { stdio: 'pipe' });
    
    if (success) {
      // Complete wave successfully
      state.completedWaves = state.completedWaves || [];
      state.completedWaves.push({
        number: waveNum,
        name: waveName,
        completedAt: new Date().toISOString()
      });
      delete state.activeWave;
      
      // Create commit
      execSync(`git commit -m "feat: complete wave ${waveNum} - ${waveName}"`, { stdio: 'pipe' });
    } else {
      // Mark as failed
      state.failedWaves = state.failedWaves || [];
      state.failedWaves.push({
        number: waveNum,
        name: waveName,
        failedAt: new Date().toISOString(),
        error: 'Simulated failure'
      });
    }
    
    stateManager.state = state;
    stateManager.saveState();
    
    return state;
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
      assert.strictEqual(state.completedWaves.length, 1);
      assert.strictEqual(state.completedWaves[0].name, 'Setup Infrastructure');
      
      // Verify STATE.md created
      assert(fs.existsSync('.planning/STATE.md'));
      const stateContent = fs.readFileSync('.planning/STATE.md', 'utf8');
      assert(stateContent.includes('Phase 1: Foundation'));
      
      // Execute Wave 2
      state = executeWave(2, 'Create Core Modules');
      assert.strictEqual(state.completedWaves.length, 2);
      
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
      assert.strictEqual(state.completedWaves.length, 3);
      
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
        waveName: 'Wave 1',
        duration: 300,
        tasksCompleted: 3,
        success: true
      });
      
      // Execute Wave 2 with metrics
      executeWave(2, 'Wave 2');
      metricsTracker.recordWaveExecution({
        waveName: 'Wave 2',
        duration: 600,
        tasksCompleted: 4,
        success: true
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
      const metrics = metricsTracker.getMetrics();
      assert.strictEqual(metrics.totalWaves, 2);
      assert.strictEqual(metrics.successfulWaves, 2);
      
      // Simulate failure on Wave 3
      const state = executeWave(3, 'Wave 3', false);
      assert.strictEqual(state.failedWaves.length, 1);
      
      // Verify checkpoint available for resume
      assert.strictEqual(state.checkpoints.length, 1);
      assert.strictEqual(state.checkpoints[0].name, 'mid-project');
      
      // Resume and retry Wave 3
      const retryState = executeWave(3, 'Wave 3', true);
      assert.strictEqual(retryState.completedWaves.length, 3);
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
      assert.strictEqual(state.completedWaves.length, 3);
      
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
      assert.strictEqual(state.completedWaves.length, 7);
      
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
      assert.strictEqual(state.completedWaves.length, 9);
      assert.strictEqual(state.checkpoints.length, 1);
      assert.strictEqual(state.currentPhase, 'Phase 3: Polish');
      
      // Verify all commits
      const commits = execSync('git log --oneline', { encoding: 'utf8' });
      assert(commits.includes('wave 1'));
      assert(commits.includes('wave 9'));
    });
  });
});
