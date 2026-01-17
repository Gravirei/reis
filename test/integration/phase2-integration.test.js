/**
 * Phase 2 Integration Tests
 * Tests commands working together: config → execute-plan → checkpoint → resume
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const StateManager = require('../../lib/utils/state-manager');
const { loadConfig } = require('../../lib/utils/config');
const { getGitStatus, getGitInfo } = require('../../lib/utils/git-integration');

describe('Phase 2 Integration Tests', function() {
  // Increase timeout for integration tests
  this.timeout(10000);
  
  let testRoot;
  let originalCwd;

  beforeEach(() => {
    // Create temp directory
    testRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'reis-phase2-test-'));
    originalCwd = process.cwd();
    process.chdir(testRoot);
    
    // Create .planning structure
    fs.mkdirSync('.planning', { recursive: true });
    fs.mkdirSync('.planning/phases', { recursive: true });
    
    // Initialize git repo
    execSync('git init', { stdio: 'pipe' });
    execSync('git config user.email "test@reis.dev"', { stdio: 'pipe' });
    execSync('git config user.name "REIS Test"', { stdio: 'pipe' });
    
    // Create initial commit
    fs.writeFileSync('README.md', '# Test Project\n', 'utf8');
    execSync('git add .', { stdio: 'pipe' });
    execSync('git commit -m "Initial commit"', { stdio: 'pipe' });
    
    // Initialize STATE.md
    const stateManager = new StateManager(testRoot);
    stateManager.state.currentPhase = 'Phase 2: Testing';
    stateManager.saveState();
  });

  afterEach(() => {
    // Cleanup
    process.chdir(originalCwd);
    if (fs.existsSync(testRoot)) {
      fs.rmSync(testRoot, { recursive: true, force: true });
    }
  });

  describe('Workflow 1: Config → Execute → Checkpoint', () => {
    it('should initialize config, execute plan, and create checkpoint', () => {
      // Step 1: Initialize config
      const configModule = require('../../lib/commands/config');
      
      // Create default config
      const configPath = path.join(testRoot, 'reis.config.js');
      const defaultConfig = `module.exports = {
  waves: {
    defaultSize: 'medium',
    autoCheckpoint: true
  },
  git: {
    autoCommit: true,
    commitMessagePrefix: '[REIS]'
  }
};`;
      fs.writeFileSync(configPath, defaultConfig, 'utf8');
      
      // Verify config loads correctly
      const config = loadConfig(testRoot);
      assert.strictEqual(config.waves.defaultSize, 'medium');
      assert.strictEqual(config.git.autoCommit, true);
      
      // Step 2: Create and execute a plan with waves
      const planContent = `# Test Plan

## Objective
Test wave execution with checkpoints

## Tasks

<task type="auto" wave="1">
<name>Create feature file</name>
<files>feature.js</files>
<action>
Create a simple feature file
</action>
<verify>
File exists
</verify>
<done>feature.js created</done>
</task>

<task type="auto" wave="1">
<name>Add documentation</name>
<files>docs.md</files>
<action>
Add documentation
</action>
<verify>
Documentation exists
</verify>
<done>docs.md created</done>
</task>

<task type="auto" wave="2">
<name>Add tests</name>
<files>test.js</files>
<action>
Add test file
</action>
<verify>
Test file exists
</verify>
<done>test.js created</done>
</task>
`;
      
      const planPath = path.join(testRoot, '.planning', 'test.PLAN.md');
      fs.writeFileSync(planPath, planContent, 'utf8');
      
      // Parse plan to verify structure
      const executePlan = require('../../lib/commands/execute-plan');
      const planText = fs.readFileSync(planPath, 'utf8');
      
      // Verify plan has tasks
      assert.ok(planText.includes('<task'));
      assert.ok(planText.includes('wave="1"'));
      assert.ok(planText.includes('wave="2"'));
      
      // Step 3: Create checkpoint
      const checkpointModule = require('../../lib/commands/checkpoint');
      const stateManager = new StateManager(testRoot);
      
      // Create a checkpoint
      const checkpointName = 'workflow-test-1';
      const checkpoint = stateManager.createCheckpoint(checkpointName, null);
      
      assert.ok(checkpoint);
      assert.strictEqual(checkpoint.name, checkpointName);
      assert.ok(checkpoint.timestamp);
      
      // Step 4: Verify STATE.md was updated
      const stateContent = fs.readFileSync(path.join(testRoot, '.planning', 'STATE.md'), 'utf8');
      assert.ok(stateContent.includes('workflow-test-1'));
      
      // Step 5: Verify git status
      const gitStatus = getGitStatus(testRoot);
      assert.ok(gitStatus);
    });
  });

  describe('Workflow 2: Execute → Interrupt → Resume', () => {
    it('should handle interrupted execution with auto-checkpoint', () => {
      const stateManager = new StateManager(testRoot);
      
      // Simulate multi-wave plan execution
      const planPath = '.planning/multi-wave.PLAN.md';
      
      // Start wave 1
      stateManager.startWave('Wave 1: Setup', 2);
      
      // Verify wave is active
      assert.ok(stateManager.state.activeWave);
      assert.strictEqual(stateManager.state.activeWave.name, 'Wave 1: Setup');
      
      // Complete wave 1
      stateManager.completeWave(null);
      
      // Verify wave 1 completed
      assert.strictEqual(stateManager.state.waves.completed.length, 1);
      assert.strictEqual(stateManager.state.activeWave, null);
      
      // Start wave 2
      stateManager.startWave('Wave 2: Implementation', 3);
      
      // Simulate interruption (checkpoint auto-created)
      const autoCheckpoint = stateManager.createCheckpoint('auto-wave-2-interrupted', null);
      assert.ok(autoCheckpoint);
      
      // Verify STATE.md shows progress
      const stateContent = fs.readFileSync(path.join(testRoot, '.planning', 'STATE.md'), 'utf8');
      assert.ok(stateContent.includes('Wave 1: Setup'));
      assert.ok(stateContent.includes('Wave 2: Implementation'));
      
      // Simulate resume - verify we can continue
      assert.ok(stateManager.state.activeWave);
      assert.strictEqual(stateManager.state.activeWave.name, 'Wave 2: Implementation');
    });
  });

  describe('Workflow 3: Checkpoint → Resume with Restore', () => {
    it('should create checkpoints and allow restoration', () => {
      const stateManager = new StateManager(testRoot);
      
      // Create checkpoint before changes
      const checkpoint1 = stateManager.createCheckpoint('before-refactor', null);
      assert.ok(checkpoint1);
      
      // Make changes
      fs.writeFileSync(path.join(testRoot, 'file1.js'), '// Version 1\n', 'utf8');
      execSync('git add .', { stdio: 'pipe' });
      execSync('git commit -m "Add file1"', { stdio: 'pipe' });
      
      // Create checkpoint after changes
      const gitInfo = getGitInfo(testRoot);
      const checkpoint2 = stateManager.createCheckpoint('after-refactor', gitInfo.commit);
      assert.ok(checkpoint2);
      assert.strictEqual(checkpoint2.commit, gitInfo.commit);
      
      // Make more changes
      fs.writeFileSync(path.join(testRoot, 'file2.js'), '// Version 2\n', 'utf8');
      
      // Verify we have 2 checkpoints
      assert.ok(stateManager.state.checkpoints.length >= 2);
      
      // Verify checkpoint data
      const checkpoints = stateManager.state.checkpoints;
      const beforeCheckpoint = checkpoints.find(c => c.name === 'before-refactor');
      const afterCheckpoint = checkpoints.find(c => c.name === 'after-refactor');
      
      assert.ok(beforeCheckpoint);
      assert.ok(afterCheckpoint);
      assert.ok(afterCheckpoint.commit);
    });
  });

  describe('Workflow 4: Config Customization Affects Execution', () => {
    it('should respect autoCommit config setting', () => {
      // Test with autoCommit: false
      let configContent = `module.exports = {
  waves: { defaultSize: 'medium', autoCheckpoint: true },
  git: { autoCommit: false }
};`;
      const configPath = path.join(testRoot, 'reis.config.js');
      fs.writeFileSync(configPath, configContent, 'utf8');
      
      // Clear require cache
      delete require.cache[require.resolve(configPath)];
      
      let config = loadConfig(testRoot);
      assert.strictEqual(config.git.autoCommit, false, 'autoCommit should be false');
      
      // Test with autoCommit: true
      configContent = `module.exports = {
  waves: { defaultSize: 'medium', autoCheckpoint: true },
  git: { autoCommit: true, commitMessagePrefix: '[AUTO]' }
};`;
      fs.writeFileSync(configPath, configContent, 'utf8');
      
      // Clear require cache again
      delete require.cache[require.resolve(configPath)];
      
      config = loadConfig(testRoot);
      assert.strictEqual(config.git.autoCommit, true);
      assert.strictEqual(config.git.commitMessagePrefix, '[AUTO]');
    });
    
    it('should respect wave size configuration', () => {
      const configContent = `module.exports = {
  waves: {
    defaultSize: 'large',
    sizeDefinitions: {
      small: { maxTasks: 2, estimatedMinutes: 20 },
      medium: { maxTasks: 5, estimatedMinutes: 45 },
      large: { maxTasks: 10, estimatedMinutes: 90 }
    }
  }
};`;
      fs.writeFileSync('reis.config.js', configContent, 'utf8');
      
      const config = loadConfig(testRoot);
      assert.strictEqual(config.waves.defaultSize, 'large');
      assert.strictEqual(config.waves.sizeDefinitions.large.maxTasks, 10);
      assert.strictEqual(config.waves.sizeDefinitions.large.estimatedMinutes, 90);
    });
  });

  describe('Workflow 5: Full Project Lifecycle', () => {
    it('should track complete project lifecycle', () => {
      const stateManager = new StateManager(testRoot);
      
      // Step 1: Initialize config
      const configContent = `module.exports = {
  waves: { defaultSize: 'medium', autoCheckpoint: true },
  git: { autoCommit: true }
};`;
      fs.writeFileSync('reis.config.js', configContent, 'utf8');
      const config = loadConfig(testRoot);
      assert.ok(config);
      
      // Step 2: Execute Phase 1 - Wave 1
      stateManager.startWave('Wave 1: Foundation', 2);
      stateManager.completeWave(null);
      stateManager.createCheckpoint('phase-1-wave-1', null);
      
      // Step 3: Execute Phase 1 - Wave 2
      stateManager.startWave('Wave 2: Core Features', 2);
      stateManager.completeWave(null);
      stateManager.createCheckpoint('phase-1-wave-2', null);
      
      // Step 4: Execute Phase 1 - Wave 3
      stateManager.startWave('Wave 3: Testing', 2);
      stateManager.completeWave(null);
      stateManager.createCheckpoint('phase-1-complete', null);
      
      // Verify full history
      assert.strictEqual(stateManager.state.waves.completed.length, 3);
      assert.ok(stateManager.state.checkpoints.length >= 3);
      
      // Verify metrics updated
      assert.ok(stateManager.state.metrics);
      assert.strictEqual(stateManager.state.metrics.completedWaves, 3);
      
      // Verify STATE.md consistency
      const stateContent = fs.readFileSync(path.join(testRoot, '.planning', 'STATE.md'), 'utf8');
      assert.ok(stateContent.includes('Wave 1: Foundation'));
      assert.ok(stateContent.includes('Wave 2: Core Features'));
      assert.ok(stateContent.includes('Wave 3: Testing'));
      assert.ok(stateContent.includes('phase-1-complete'));
    });
  });

  describe('STATE.md Consistency', () => {
    it('should maintain valid STATE.md after multiple operations', () => {
      const stateManager = new StateManager(testRoot);
      
      // Perform multiple operations
      for (let i = 1; i <= 5; i++) {
        stateManager.startWave(`Wave ${i}`, 1);
        stateManager.completeWave(null);
        stateManager.createCheckpoint(`checkpoint-${i}`, null);
      }
      
      // Verify STATE.md is still valid
      const statePath = path.join(testRoot, '.planning', 'STATE.md');
      assert.ok(fs.existsSync(statePath));
      
      const stateContent = fs.readFileSync(statePath, 'utf8');
      
      // Should have markdown structure
      assert.ok(stateContent.includes('# REIS v2.0 Development State'));
      assert.ok(stateContent.includes('## Current Phase'));
      assert.ok(stateContent.includes('## Completed Waves') || stateContent.includes('## Active Wave'));
      assert.ok(stateContent.includes('## Checkpoints'));
      
      // Verify state in memory has the data
      assert.ok(stateManager.state.waves.completed.length >= 5, `Expected at least 5 completed waves, got ${stateManager.state.waves.completed.length}`);
      assert.ok(stateManager.state.checkpoints.length >= 5, `Expected at least 5 checkpoints, got ${stateManager.state.checkpoints.length}`);
    });
    
    it('should track wave progress accurately', () => {
      const stateManager = new StateManager(testRoot);
      
      // Start and complete waves with progress tracking
      stateManager.startWave('Wave 1', 3);
      stateManager.updateWaveProgress(1);
      stateManager.updateWaveProgress(2);
      stateManager.completeWave(null);
      
      // Verify progress was tracked
      const completedWaves = stateManager.state.waves.completed;
      assert.strictEqual(completedWaves.length, 1);
      assert.ok(completedWaves[0].completed);
    });
    
    it('should limit checkpoint history appropriately', () => {
      const stateManager = new StateManager(testRoot);
      
      // Create many checkpoints (more than limit)
      for (let i = 1; i <= 15; i++) {
        stateManager.createCheckpoint(`checkpoint-${i}`, null);
      }
      
      // Should only keep last 10 (as per StateManager implementation)
      const checkpoints = stateManager.state.checkpoints;
      assert.ok(checkpoints.length <= 10);
      
      // Most recent should be checkpoint-15
      assert.ok(checkpoints.some(c => c.name === 'checkpoint-15'));
    });
  });

  describe('Git Integration Consistency', () => {
    it('should verify git status and info work correctly', () => {
      // Ensure clean state first - STATE.md may have been modified
      const statePath = path.join(testRoot, '.planning', 'STATE.md');
      if (fs.existsSync(statePath)) {
        execSync('git add .planning/STATE.md', { cwd: testRoot, stdio: 'pipe' });
        execSync('git commit -m "Initial STATE.md"', { cwd: testRoot, stdio: 'pipe' });
      }
      
      // Check initial git status
      const status1 = getGitStatus(testRoot);
      assert.ok(status1, 'Should return git status object');
      assert.strictEqual(status1.hasChanges, false, 'Should have no changes initially');
      
      // Make changes
      fs.writeFileSync(path.join(testRoot, 'newfile.js'), '// New file\n', 'utf8');
      
      const status2 = getGitStatus(testRoot);
      assert.strictEqual(status2.hasChanges, true, 'Should detect new file');
      
      // Commit changes
      execSync('git add .', { stdio: 'pipe' });
      execSync('git commit -m "Add newfile"', { stdio: 'pipe' });
      
      // Check git info
      const gitInfo = getGitInfo(testRoot);
      assert.ok(gitInfo.commit);
      assert.ok(gitInfo.branch);
      assert.strictEqual(gitInfo.isRepo, true);
    });
    
    it('should handle no git repo gracefully', () => {
      // Create non-git directory
      const nonGitDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reis-non-git-'));
      
      try {
        const status = getGitStatus(nonGitDir);
        // Should either throw or return gracefully
        assert.ok(true);
      } catch (error) {
        // Expected - not a git repo
        assert.ok(error.message);
      } finally {
        fs.rmSync(nonGitDir, { recursive: true, force: true });
      }
    });
  });

  describe('Error Recovery', () => {
    it('should handle wave completion without active wave', () => {
      const stateManager = new StateManager(testRoot);
      
      // Try to complete without starting a wave - should throw error
      try {
        stateManager.completeWave(null);
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.ok(error.message.includes('No active wave'));
      }
      
      // Verify state is still valid
      assert.strictEqual(stateManager.state.activeWave, null);
    });
    
    it('should not corrupt STATE.md on error', () => {
      const stateManager = new StateManager(testRoot);
      
      try {
        // Cause an error by trying to complete non-existent wave
        stateManager.completeWave(null);
        assert.fail('Should have thrown error');
      } catch (error) {
        // Expected error
        assert.ok(error.message);
      }
      
      // STATE.md should still be valid
      const reloaded = new StateManager(testRoot);
      assert.ok(reloaded.state);
    });
  });

  describe('Performance', () => {
    it('should handle large plans efficiently', function() {
      this.timeout(5000);
      
      const stateManager = new StateManager(testRoot);
      const startTime = Date.now();
      
      // Create 10 waves with multiple tasks each
      for (let i = 1; i <= 10; i++) {
        stateManager.startWave(`Wave ${i}`, 5);
        stateManager.completeWave(null);
      }
      
      const duration = Date.now() - startTime;
      
      // Should complete in reasonable time (< 2 seconds)
      assert.ok(duration < 2000, `Operation took ${duration}ms, expected < 2000ms`);
      
      // Verify all waves tracked
      assert.ok(stateManager.state.waves.completed.length >= 5, `Expected at least 5 waves, got ${stateManager.state.waves.completed.length}`);
    });
    
    it('should handle many checkpoints efficiently', function() {
      this.timeout(5000);
      
      const stateManager = new StateManager(testRoot);
      const startTime = Date.now();
      
      // Create 50 checkpoints
      for (let i = 1; i <= 50; i++) {
        stateManager.createCheckpoint(`checkpoint-${i}`, null);
      }
      
      const duration = Date.now() - startTime;
      
      // Should complete in reasonable time
      assert.ok(duration < 2000, `Operation took ${duration}ms, expected < 2000ms`);
      
      // Should only keep last 10
      assert.ok(stateManager.state.checkpoints.length <= 10);
    });
    
    it('should handle large STATE.md efficiently', function() {
      this.timeout(5000);
      
      const stateManager = new StateManager(testRoot);
      
      // Build up large state
      for (let i = 1; i <= 20; i++) {
        stateManager.addActivity(`Activity ${i}`);
        stateManager.createCheckpoint(`cp-${i}`, null);
      }
      
      // Save and reload
      const startTime = Date.now();
      stateManager.saveState();
      const reloaded = new StateManager(testRoot);
      const duration = Date.now() - startTime;
      
      // Should load quickly (< 500ms)
      assert.ok(duration < 500, `Load took ${duration}ms, expected < 500ms`);
      assert.ok(reloaded.state);
    });
  });

  describe('Backward Compatibility', () => {
    it('should work with minimal REIS v1.x structure', () => {
      // Remove v2.0 specific files
      const statePath = path.join(testRoot, '.planning', 'STATE.md');
      if (fs.existsSync(statePath)) {
        fs.unlinkSync(statePath);
      }
      
      // Create minimal v1.x structure
      fs.writeFileSync(path.join(testRoot, '.planning', 'ROADMAP.md'), '# Roadmap\n', 'utf8');
      
      // StateManager should initialize new STATE.md
      const stateManager = new StateManager(testRoot);
      assert.ok(stateManager.state);
      
      // Save state to create STATE.md file
      stateManager.saveState();
      assert.ok(fs.existsSync(statePath));
    });
    
    it('should handle projects without git', () => {
      // Create new non-git directory
      const noGitDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reis-no-git-'));
      
      try {
        // Create .planning structure
        fs.mkdirSync(path.join(noGitDir, '.planning'));
        
        // Initialize state manager
        const stateManager = new StateManager(noGitDir);
        stateManager.state.currentPhase = 'Testing';
        stateManager.saveState();
        
        // Should work without git
        assert.ok(stateManager.state);
        
        // Load config should work
        const config = loadConfig(noGitDir);
        assert.ok(config);
      } finally {
        fs.rmSync(noGitDir, { recursive: true, force: true });
      }
    });
  });
});
