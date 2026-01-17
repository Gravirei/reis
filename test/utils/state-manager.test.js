/**
 * Tests for REIS v2.0 State Manager
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const StateManager = require('../../lib/utils/state-manager');

describe('StateManager', () => {
  const testRoot = path.join(__dirname, '../tmp_test_state');
  
  beforeEach(() => {
    // Clean up test directory
    if (fs.existsSync(testRoot)) {
      fs.rmSync(testRoot, { recursive: true });
    }
    fs.mkdirSync(testRoot, { recursive: true });
    fs.mkdirSync(path.join(testRoot, '.planning'), { recursive: true });
  });

  afterEach(() => {
    // Clean up
    if (fs.existsSync(testRoot)) {
      fs.rmSync(testRoot, { recursive: true });
    }
  });

  describe('initialization', () => {
    it('should create initial state when no STATE.md exists', () => {
      const sm = new StateManager(testRoot);
      assert.ok(sm.state);
      assert.strictEqual(sm.state.currentPhase, null);
      assert.strictEqual(sm.state.activeWave, null);
    });

    it('should load existing STATE.md', () => {
      const statePath = path.join(testRoot, '.planning', 'STATE.md');
      const content = `# REIS v2.0 Development State

## Current Phase
**Phase 1: Foundation**

## Active Wave
**Wave 1: Core Infrastructure**
- Status: IN_PROGRESS
- Started: 2026-01-18
- Items: 4 tasks
- Progress: 2/4 complete

## Metrics
- Total waves planned: 8
- Waves completed: 0
`;
      fs.writeFileSync(statePath, content, 'utf8');

      const sm = new StateManager(testRoot);
      assert.strictEqual(sm.state.currentPhase, '**Phase 1: Foundation**');
      assert.ok(sm.state.activeWave);
      assert.strictEqual(sm.state.activeWave.name, 'Core Infrastructure');
      assert.strictEqual(sm.state.activeWave.status, 'IN_PROGRESS');
    });
  });

  describe('wave management', () => {
    it('should start a new wave', () => {
      const sm = new StateManager(testRoot);
      sm.startWave('Wave 1: Test Wave', 5);
      
      assert.ok(sm.state.activeWave);
      assert.strictEqual(sm.state.activeWave.name, 'Wave 1: Test Wave');
      assert.strictEqual(sm.state.activeWave.status, 'IN_PROGRESS');
      assert.strictEqual(sm.state.activeWave.items, 5);
      assert.strictEqual(sm.state.activeWave.progress.total, 5);
    });

    it('should complete a wave', () => {
      const sm = new StateManager(testRoot);
      sm.startWave('Wave 1: Test Wave', 5);
      const wave = sm.completeWave('abc123');
      
      assert.strictEqual(sm.state.activeWave, null);
      assert.strictEqual(sm.state.waves.completed.length, 1);
      assert.strictEqual(wave.name, 'Wave 1: Test Wave');
      assert.strictEqual(wave.commit, 'abc123');
      assert.strictEqual(sm.state.metrics.completedWaves, 1);
    });

    it('should throw error when completing without active wave', () => {
      const sm = new StateManager(testRoot);
      assert.throws(() => sm.completeWave(), /No active wave/);
    });

    it('should update wave progress', () => {
      const sm = new StateManager(testRoot);
      sm.startWave('Wave 1: Test Wave', 5);
      sm.updateWaveProgress(3);
      
      assert.strictEqual(sm.state.activeWave.progress.completed, 3);
    });
  });

  describe('checkpoint management', () => {
    it('should create checkpoint', () => {
      const sm = new StateManager(testRoot);
      const cp = sm.createCheckpoint('Test Checkpoint', 'commit123');
      
      assert.ok(cp);
      assert.strictEqual(cp.name, 'Test Checkpoint');
      assert.strictEqual(cp.commit, 'commit123');
      assert.strictEqual(sm.state.checkpoints.length, 1);
    });

    it('should limit checkpoint history to 10', () => {
      const sm = new StateManager(testRoot);
      
      for (let i = 0; i < 15; i++) {
        sm.createCheckpoint(`Checkpoint ${i}`);
      }
      
      assert.strictEqual(sm.state.checkpoints.length, 10);
      assert.strictEqual(sm.state.checkpoints[0].name, 'Checkpoint 5');
    });
  });

  describe('activity tracking', () => {
    it('should add activity entries', () => {
      const sm = new StateManager(testRoot);
      sm.addActivity('Test activity');
      
      assert.strictEqual(sm.state.recentActivity.length, 1);
      assert.ok(sm.state.recentActivity[0].includes('Test activity'));
    });

    it('should limit activity history to 20', () => {
      const sm = new StateManager(testRoot);
      
      for (let i = 0; i < 25; i++) {
        sm.addActivity(`Activity ${i}`);
      }
      
      assert.strictEqual(sm.state.recentActivity.length, 20);
    });
  });

  describe('state persistence', () => {
    it('should save and reload state', () => {
      const sm1 = new StateManager(testRoot);
      sm1.startWave('Wave 1: Test', 3);
      sm1.createCheckpoint('CP1', 'commit1');
      sm1.saveState();
      
      const sm2 = new StateManager(testRoot);
      assert.ok(sm2.state.activeWave);
      assert.strictEqual(sm2.state.activeWave.name, 'Wave 1: Test');
      assert.strictEqual(sm2.state.checkpoints.length, 1);
    });
  });
});
