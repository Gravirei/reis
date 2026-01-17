/**
 * Tests for REIS v2.0 Wave Executor
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { WaveExecutor, Wave } = require('../../lib/utils/wave-executor');

describe('WaveExecutor', () => {
  const testRoot = path.join(__dirname, '../tmp_test_waves');
  
  beforeEach(() => {
    // Clean up and create test directory
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

  describe('Wave class', () => {
    it('should create a wave with correct properties', () => {
      const wave = new Wave(1, 'Test Wave', 'medium', ['task1', 'task2']);
      assert.strictEqual(wave.id, 1);
      assert.strictEqual(wave.name, 'Test Wave');
      assert.strictEqual(wave.size, 'medium');
      assert.strictEqual(wave.tasks.length, 2);
      assert.strictEqual(wave.status, 'pending');
    });

    it('should track wave lifecycle', () => {
      const wave = new Wave(1, 'Test Wave', 'small', ['task1']);
      
      wave.start();
      assert.strictEqual(wave.status, 'in_progress');
      assert.ok(wave.startTime);
      
      wave.complete('abc123');
      assert.strictEqual(wave.status, 'completed');
      assert.ok(wave.endTime);
      assert.strictEqual(wave.commit, 'abc123');
    });

    it('should calculate duration', (done) => {
      const wave = new Wave(1, 'Test Wave', 'small', ['task1']);
      
      wave.start();
      setTimeout(() => {
        wave.complete();
        const duration = wave.getDuration();
        assert.ok(duration >= 0);
        done();
      }, 100);
    });
  });

  describe('parsePlan', () => {
    it('should parse waves from PLAN.md', () => {
      const planContent = `# Project Plan

## Wave 1: Setup Infrastructure (Size: small)
- Initialize project
- Setup git
- Create config

## Wave 2: Core Features (Size: medium)
- Implement feature A
- Implement feature B
- Add tests
- Update docs

## Wave 3: Polish (Size: large)
- Review code
- Fix bugs
- Optimize performance
`;
      
      fs.writeFileSync(path.join(testRoot, '.planning', 'PLAN.md'), planContent, 'utf8');
      
      const executor = new WaveExecutor(testRoot);
      const waves = executor.parsePlan();
      
      assert.strictEqual(waves.length, 3);
      assert.strictEqual(waves[0].name, 'Wave 1: Setup Infrastructure');
      assert.strictEqual(waves[0].size, 'small');
      assert.strictEqual(waves[0].tasks.length, 3);
      
      assert.strictEqual(waves[1].name, 'Wave 2: Core Features');
      assert.strictEqual(waves[1].size, 'medium');
      assert.strictEqual(waves[1].tasks.length, 4);
      
      assert.strictEqual(waves[2].name, 'Wave 3: Polish');
      assert.strictEqual(waves[2].size, 'large');
      assert.strictEqual(waves[2].tasks.length, 3);
    });

    it('should handle waves without explicit size', () => {
      const planContent = `# Plan

## Wave 1: Test Wave
- Task 1
- Task 2
`;
      
      fs.writeFileSync(path.join(testRoot, '.planning', 'PLAN.md'), planContent, 'utf8');
      
      const executor = new WaveExecutor(testRoot);
      const waves = executor.parsePlan();
      
      assert.strictEqual(waves.length, 1);
      assert.strictEqual(waves[0].size, 'medium'); // default size
    });

    it('should throw error if PLAN.md not found', () => {
      const executor = new WaveExecutor(testRoot);
      assert.throws(() => executor.parsePlan(), /PLAN\.md not found/);
    });

    it('should throw error if no waves found', () => {
      const planContent = `# Plan\n\nJust some text, no waves`;
      fs.writeFileSync(path.join(testRoot, '.planning', 'PLAN.md'), planContent, 'utf8');
      
      const executor = new WaveExecutor(testRoot);
      assert.throws(() => executor.parsePlan(), /No waves found/);
    });
  });

  describe('wave execution', () => {
    beforeEach(() => {
      const planContent = `# Plan

## Wave 1: First Wave (Size: small)
- Task 1
- Task 2

## Wave 2: Second Wave (Size: medium)
- Task 3
- Task 4
- Task 5
`;
      fs.writeFileSync(path.join(testRoot, '.planning', 'PLAN.md'), planContent, 'utf8');
    });

    it('should start next wave', () => {
      const executor = new WaveExecutor(testRoot);
      executor.parsePlan();
      
      const wave = executor.startNextWave();
      assert.ok(wave);
      assert.strictEqual(wave.status, 'in_progress');
      assert.strictEqual(executor.currentWaveIndex, 0);
    });

    it('should get current wave', () => {
      const executor = new WaveExecutor(testRoot);
      executor.parsePlan();
      executor.startNextWave();
      
      const current = executor.getCurrentWave();
      assert.ok(current);
      assert.strictEqual(current.name, 'Wave 1: First Wave');
    });

    it('should complete current wave', () => {
      const executor = new WaveExecutor(testRoot);
      executor.parsePlan();
      executor.startNextWave();
      
      const result = executor.completeCurrentWave();
      assert.ok(result.wave);
      assert.strictEqual(result.wave.status, 'completed');
    });

    it('should fail current wave', () => {
      const executor = new WaveExecutor(testRoot);
      executor.parsePlan();
      executor.startNextWave();
      
      const wave = executor.failCurrentWave('Test error');
      assert.strictEqual(wave.status, 'failed');
      assert.strictEqual(wave.error, 'Test error');
    });

    it('should execute multiple waves', () => {
      const executor = new WaveExecutor(testRoot);
      executor.parsePlan();
      
      executor.startNextWave();
      executor.completeCurrentWave();
      
      executor.startNextWave();
      const current = executor.getCurrentWave();
      assert.strictEqual(current.name, 'Wave 2: Second Wave');
    });
  });

  describe('summary and reporting', () => {
    beforeEach(() => {
      const planContent = `# Plan

## Wave 1: Wave One (Size: small)
- Task 1

## Wave 2: Wave Two (Size: medium)
- Task 2
`;
      fs.writeFileSync(path.join(testRoot, '.planning', 'PLAN.md'), planContent, 'utf8');
    });

    it('should generate summary', () => {
      const executor = new WaveExecutor(testRoot);
      executor.parsePlan();
      
      const summary = executor.getSummary();
      assert.strictEqual(summary.total, 2);
      assert.strictEqual(summary.completed, 0);
      assert.strictEqual(summary.pending, 2);
    });

    it('should generate plan summary', () => {
      const executor = new WaveExecutor(testRoot);
      executor.parsePlan();
      
      const summary = executor.generatePlanSummary();
      assert.strictEqual(summary.totalWaves, 2);
      assert.ok(summary.totalEstimatedMinutes > 0);
      assert.strictEqual(summary.waves.length, 2);
    });

    it('should generate execution report', () => {
      const executor = new WaveExecutor(testRoot);
      executor.parsePlan();
      executor.startNextWave();
      executor.completeCurrentWave();
      
      const report = executor.generateReport();
      assert.ok(report.summary);
      assert.ok(report.waves);
      assert.strictEqual(report.summary.completed, 1);
    });
  });
});
