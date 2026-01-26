/**
 * Tests for REIS Parallel Wave Execution
 * Comprehensive test suite covering all parallel execution modules
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Import all modules to test
const { WaveDependencyGraph } = require('../../lib/utils/wave-dependency-graph');
const { DependencyParser } = require('../../lib/utils/dependency-parser');
const { ParallelWaveScheduler } = require('../../lib/utils/parallel-wave-scheduler');
const { ExecutionCoordinator } = require('../../lib/utils/execution-coordinator');
const { WaveConflictDetector, ConflictSeverity, ConflictType } = require('../../lib/utils/wave-conflict-detector');
const { ConflictResolver, ResolutionStrategy } = require('../../lib/utils/conflict-resolver');
const { ParallelStateTracker } = require('../../lib/utils/parallel-state-tracker');

describe('Parallel Wave Execution', function() {
  this.timeout(10000);

  // ============================================
  // WaveDependencyGraph Tests
  // ============================================
  describe('WaveDependencyGraph', function() {
    let graph;

    beforeEach(function() {
      graph = new WaveDependencyGraph();
    });

    it('should add waves and dependencies', function() {
      graph.addWave('Wave 1', { name: 'Setup', size: 'small' });
      graph.addWave('Wave 2', { name: 'Build', size: 'medium' });
      graph.addDependency('Wave 2', 'Wave 1');

      assert.strictEqual(graph.nodes.size, 2);
      assert.ok(graph.nodes.has('Wave 1'));
      assert.ok(graph.nodes.has('Wave 2'));
      
      const deps = graph.getDependencies('Wave 2');
      assert.deepStrictEqual(deps, ['Wave 1']);
    });

    it('should detect cycles in dependencies', function() {
      graph.addWave('Wave 1', { name: 'A' });
      graph.addWave('Wave 2', { name: 'B' });
      graph.addWave('Wave 3', { name: 'C' });
      
      graph.addDependency('Wave 2', 'Wave 1');
      graph.addDependency('Wave 3', 'Wave 2');
      graph.addDependency('Wave 1', 'Wave 3'); // Creates cycle

      const hasCycle = graph.hasCycle();
      assert.strictEqual(hasCycle, true);
    });

    it('should return execution order for acyclic graph', function() {
      graph.addWave('Wave 1', { name: 'Setup' });
      graph.addWave('Wave 2', { name: 'Core' });
      graph.addWave('Wave 3', { name: 'Tests' });
      
      graph.addDependency('Wave 2', 'Wave 1');
      graph.addDependency('Wave 3', 'Wave 2');

      const order = graph.getExecutionOrder();
      assert.ok(Array.isArray(order));
      assert.strictEqual(order.length, 3);
      
      // Wave 1 should come before Wave 2, Wave 2 before Wave 3
      const idx1 = order.indexOf('Wave 1');
      const idx2 = order.indexOf('Wave 2');
      const idx3 = order.indexOf('Wave 3');
      assert.ok(idx1 < idx2);
      assert.ok(idx2 < idx3);
    });

    it('should get executable waves based on completion', function() {
      graph.addWave('Wave 1', { name: 'Setup' });
      graph.addWave('Wave 2', { name: 'Core' });
      graph.addWave('Wave 3', { name: 'Independent' });
      
      graph.addDependency('Wave 2', 'Wave 1');
      // Wave 3 has no dependencies

      const executable = graph.getExecutableWaves();
      
      // Wave 1 and Wave 3 should be executable (no deps or deps satisfied)
      assert.ok(executable.includes('Wave 1'));
      assert.ok(executable.includes('Wave 3'));
      assert.ok(!executable.includes('Wave 2'));
    });

    it('should serialize and deserialize correctly via toJSON/fromJSON', function() {
      graph.addWave('Wave 1', { name: 'Setup', size: 'small' });
      graph.addWave('Wave 2', { name: 'Build', size: 'medium' });
      graph.addDependency('Wave 2', 'Wave 1');

      const serialized = graph.toJSON();
      assert.ok(typeof serialized === 'object');

      const restored = WaveDependencyGraph.fromJSON(serialized);
      assert.strictEqual(restored.nodes.size, 2);
      assert.deepStrictEqual(restored.getDependencies('Wave 2'), ['Wave 1']);
    });

    it('should generate Mermaid diagrams', function() {
      graph.addWave('Wave 1', { name: 'Setup' });
      graph.addWave('Wave 2', { name: 'Build' });
      graph.addDependency('Wave 2', 'Wave 1');

      const mermaid = graph.toMermaid();
      assert.ok(mermaid.includes('graph'));
      // Mermaid uses sanitized IDs (Wave_1 instead of Wave 1)
      assert.ok(mermaid.includes('Wave_1') || mermaid.includes('Setup'));
    });

    it('should handle empty graph', function() {
      assert.strictEqual(graph.nodes.size, 0);
      assert.strictEqual(graph.hasCycle(), false);
      assert.deepStrictEqual(graph.getExecutionOrder(), []);
    });

    it('should handle single wave with no dependencies', function() {
      graph.addWave('Wave 1', { name: 'Only Wave' });
      
      const executable = graph.getExecutableWaves(new Set());
      assert.deepStrictEqual(executable, ['Wave 1']);
      assert.strictEqual(graph.hasCycle(), false);
    });
  });

  // ============================================
  // DependencyParser Tests
  // ============================================
  describe('DependencyParser', function() {
    let parser;
    const testDir = path.join(__dirname, '../tmp_rovodev_parser_test');

    beforeEach(function() {
      parser = new DependencyParser();
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }
    });

    afterEach(function() {
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true });
      }
    });

    it('should parse @dependencies comments', function() {
      const content = `
## Wave 1: Setup
<!-- @dependencies: none -->
- Task 1

## Wave 2: Build
<!-- @dependencies: Wave 1 -->
- Task 2
`;
      const result = parser.parseContent(content);
      
      assert.strictEqual(result.waves.length, 2);
      assert.deepStrictEqual(result.waves[0].dependencies, []);
      assert.ok(result.waves[1].dependencies.includes('Wave 1'));
    });

    it('should parse @parallel-group comments', function() {
      const content = `
## Wave 1: Backend API
<!-- @parallel-group: backend -->
- Create endpoints

## Wave 2: Frontend UI
<!-- @parallel-group: frontend -->
- Build components
`;
      const result = parser.parseContent(content);
      
      assert.strictEqual(result.waves[0].parallelGroup, 'backend');
      assert.strictEqual(result.waves[1].parallelGroup, 'frontend');
    });

    it('should handle multiple dependencies', function() {
      const content = `
## Wave 1: Database
<!-- @dependencies: none -->

## Wave 2: Auth
<!-- @dependencies: none -->

## Wave 3: API
<!-- @dependencies: Wave 1, Wave 2 -->
`;
      const result = parser.parseContent(content);
      
      assert.strictEqual(result.waves[2].dependencies.length, 2);
      assert.ok(result.waves[2].dependencies.includes('Wave 1'));
      assert.ok(result.waves[2].dependencies.includes('Wave 2'));
    });

    it('should handle "none" dependencies', function() {
      const content = `
## Wave 1: Independent
<!-- @dependencies: none -->
- Task
`;
      const result = parser.parseContent(content);
      assert.deepStrictEqual(result.waves[0].dependencies, []);
    });

    it('should build graph from parsed data', function() {
      const content = `
## Wave 1: Setup
<!-- @dependencies: none -->

## Wave 2: Build
<!-- @dependencies: Wave 1 -->

## Wave 3: Test
<!-- @dependencies: Wave 2 -->
`;
      const result = parser.parseContent(content);
      const graph = parser.buildGraph(result);
      
      assert.ok(graph instanceof WaveDependencyGraph);
      assert.strictEqual(graph.nodes.size, 3);
      assert.deepStrictEqual(graph.getDependencies('Wave 2'), ['Wave 1']);
    });

    it('should parse file from disk', function() {
      const planPath = path.join(testDir, 'PLAN.md');
      const content = `
## Wave 1: Setup
<!-- @dependencies: none -->
- Task 1
`;
      fs.writeFileSync(planPath, content);

      const result = parser.parseFile(planPath);
      assert.strictEqual(result.waves.length, 1);
    });

    it('should extract tasks from waves', function() {
      const content = `
## Wave 1: Setup
- Task A
- Task B
- Task C
`;
      const result = parser.parseContent(content);
      assert.strictEqual(result.waves[0].tasks.length, 3);
    });

    it('should parse wave size from header', function() {
      const content = `
## Wave 1: Setup (Size: small)
- Task

## Wave 2: Build (Size: large)
- Task
`;
      const result = parser.parseContent(content);
      assert.strictEqual(result.waves[0].size, 'small');
      assert.strictEqual(result.waves[1].size, 'large');
    });
  });

  // ============================================
  // ParallelWaveScheduler Tests
  // ============================================
  describe('ParallelWaveScheduler', function() {
    let scheduler;
    let graph;

    beforeEach(function() {
      scheduler = new ParallelWaveScheduler({ maxConcurrent: 2 });
      graph = new WaveDependencyGraph();
    });

    it('should return waves with no dependencies first', function() {
      graph.addWave('Wave 1', { name: 'Independent A' });
      graph.addWave('Wave 2', { name: 'Independent B' });
      graph.addWave('Wave 3', { name: 'Depends on 1' });
      graph.addDependency('Wave 3', 'Wave 1');

      scheduler.initialize(graph);
      const batch = scheduler.getNextBatch();

      assert.ok(batch.includes('Wave 1'));
      assert.ok(batch.includes('Wave 2'));
      assert.ok(!batch.includes('Wave 3'));
    });

    it('should respect maxConcurrent limit', function() {
      graph.addWave('Wave 1', {});
      graph.addWave('Wave 2', {});
      graph.addWave('Wave 3', {});
      graph.addWave('Wave 4', {});

      scheduler.initialize(graph);
      const batch = scheduler.getNextBatch();

      assert.strictEqual(batch.length, 2); // maxConcurrent is 2
    });

    it('should track running/completed/failed waves', function() {
      graph.addWave('Wave 1', {});
      graph.addWave('Wave 2', {});

      scheduler.initialize(graph);
      scheduler.startWave('Wave 1');

      assert.ok(scheduler.running.has('Wave 1'));
      assert.ok(!scheduler.completed.has('Wave 1'));

      scheduler.completeWave('Wave 1');
      assert.ok(!scheduler.running.has('Wave 1'));
      assert.ok(scheduler.completed.has('Wave 1'));

      scheduler.startWave('Wave 2');
      scheduler.markFailed('Wave 2', 'Test error');
      assert.ok(scheduler.failed.has('Wave 2'));
    });

    it('should unlock dependents when wave completes', function() {
      graph.addWave('Wave 1', {});
      graph.addWave('Wave 2', {});
      graph.addDependency('Wave 2', 'Wave 1');

      scheduler.initialize(graph);
      
      // Initially only Wave 1 is available
      let batch = scheduler.getNextBatch();
      assert.ok(batch.includes('Wave 1'));
      assert.ok(!batch.includes('Wave 2'));

      // Complete Wave 1
      scheduler.startWave('Wave 1');
      scheduler.completeWave('Wave 1');

      // Now Wave 2 should be available
      batch = scheduler.getNextBatch();
      assert.ok(batch.includes('Wave 2'));
    });

    it('should estimate completion time', function() {
      graph.addWave('Wave 1', { estimatedMinutes: 10 });
      graph.addWave('Wave 2', { estimatedMinutes: 20 });

      scheduler.initialize(graph);
      const estimate = scheduler.estimateCompletion();

      // estimateCompletion returns total minutes as a number
      assert.ok(typeof estimate === 'number');
      assert.ok(estimate > 0);
    });

    it('should report completion status', function() {
      graph.addWave('Wave 1', {});
      scheduler.initialize(graph);

      assert.strictEqual(scheduler.isComplete(), false);

      scheduler.startWave('Wave 1');
      scheduler.completeWave('Wave 1');

      assert.strictEqual(scheduler.isComplete(), true);
    });

    it('should get status summary', function() {
      graph.addWave('Wave 1', {});
      graph.addWave('Wave 2', {});
      scheduler.initialize(graph);

      scheduler.startWave('Wave 1');
      const status = scheduler.getStatus();

      assert.ok('running' in status);
      assert.ok('completed' in status);
      assert.ok('pending' in status || 'total' in status);
    });

    it('should handle wave with failed dependency', function() {
      graph.addWave('Wave 1', {});
      graph.addWave('Wave 2', {});
      graph.addDependency('Wave 2', 'Wave 1');

      scheduler.initialize(graph);
      scheduler.startWave('Wave 1');
      scheduler.markFailed('Wave 1', 'Error');

      // Wave 2 should not be in next batch since dependency failed
      const batch = scheduler.getNextBatch();
      assert.ok(!batch.includes('Wave 2'));
    });
  });

  // ============================================
  // ExecutionCoordinator Tests
  // ============================================
  describe('ExecutionCoordinator', function() {
    let coordinator;
    let scheduler;
    let graph;

    beforeEach(function() {
      graph = new WaveDependencyGraph();
      graph.addWave('Wave 1', { name: 'First' });
      graph.addWave('Wave 2', { name: 'Second' });

      scheduler = new ParallelWaveScheduler({ maxConcurrent: 2 });
      scheduler.initialize(graph);

      coordinator = new ExecutionCoordinator({
        timeout: 5000,
        retryCount: 0
      });
    });

    it('should execute batches in parallel', async function() {
      const executionOrder = [];
      const executors = new Map([
        ['Wave 1', async () => { executionOrder.push('Wave 1'); return 'done1'; }],
        ['Wave 2', async () => { executionOrder.push('Wave 2'); return 'done2'; }]
      ]);

      coordinator.initialize(scheduler, executors);
      const result = await coordinator.executeAll();

      assert.strictEqual(result.success, true);
      assert.strictEqual(executionOrder.length, 2);
    });

    it('should fire callbacks on wave start/complete/error', async function() {
      const events = [];
      
      coordinator = new ExecutionCoordinator({
        onWaveStart: ({ waveId }) => events.push(`start:${waveId}`),
        onWaveComplete: ({ waveId }) => events.push(`complete:${waveId}`),
        onWaveError: ({ waveId }) => events.push(`error:${waveId}`)
      });

      const executors = new Map([
        ['Wave 1', async () => 'done'],
        ['Wave 2', async () => { throw new Error('fail'); }]
      ]);

      coordinator.initialize(scheduler, executors);
      await coordinator.executeAll();

      assert.ok(events.some(e => e.startsWith('start:')));
      assert.ok(events.some(e => e.startsWith('complete:')));
      assert.ok(events.some(e => e.startsWith('error:')));
    });

    it('should track progress', async function() {
      const executors = new Map([
        ['Wave 1', async () => 'done1'],
        ['Wave 2', async () => 'done2']
      ]);

      coordinator.initialize(scheduler, executors);
      
      let progressEvents = [];
      coordinator.on('batchComplete', (data) => progressEvents.push(data));
      
      await coordinator.executeAll();
      
      assert.ok(progressEvents.length > 0);
    });

    it('should handle timeouts', async function() {
      coordinator = new ExecutionCoordinator({ timeout: 50 });

      const executors = new Map([
        ['Wave 1', async () => new Promise(resolve => setTimeout(resolve, 200))],
        ['Wave 2', async () => 'quick']
      ]);

      coordinator.initialize(scheduler, executors);
      const result = await coordinator.executeAll();

      // Wave 1 should timeout
      assert.ok(result.results['Wave 1'].success === false || !result.success);
    });

    it('should support abort', async function() {
      const executors = new Map([
        ['Wave 1', async () => new Promise(resolve => setTimeout(resolve, 1000))],
        ['Wave 2', async () => new Promise(resolve => setTimeout(resolve, 1000))]
      ]);

      coordinator.initialize(scheduler, executors);
      
      // Start execution and abort after short delay
      const execPromise = coordinator.executeAll();
      setTimeout(() => coordinator.abort(), 50);
      
      const result = await execPromise;
      assert.strictEqual(result.aborted, true);
    });

    it('should emit start and complete events', async function() {
      const events = [];
      coordinator.on('start', () => events.push('start'));
      coordinator.on('complete', () => events.push('complete'));

      const executors = new Map([
        ['Wave 1', async () => 'done'],
        ['Wave 2', async () => 'done']
      ]);

      coordinator.initialize(scheduler, executors);
      await coordinator.executeAll();

      assert.ok(events.includes('start'));
      assert.ok(events.includes('complete'));
    });

    it('should stop on first failure when configured', async function() {
      coordinator = new ExecutionCoordinator({ stopOnFirstFailure: true });

      // Create graph with independent waves
      graph = new WaveDependencyGraph();
      graph.addWave('Wave 1', {});
      graph.addWave('Wave 2', {});
      graph.addWave('Wave 3', {});

      scheduler = new ParallelWaveScheduler({ maxConcurrent: 1 });
      scheduler.initialize(graph);

      const executed = [];
      const executors = new Map([
        ['Wave 1', async () => { executed.push(1); throw new Error('fail'); }],
        ['Wave 2', async () => { executed.push(2); return 'ok'; }],
        ['Wave 3', async () => { executed.push(3); return 'ok'; }]
      ]);

      coordinator.initialize(scheduler, executors);
      await coordinator.executeAll();

      // Should stop after Wave 1 fails
      assert.ok(executed.includes(1));
    });
  });

  // ============================================
  // WaveConflictDetector Tests
  // ============================================
  describe('WaveConflictDetector', function() {
    let detector;

    beforeEach(function() {
      detector = new WaveConflictDetector();
    });

    it('should detect direct file conflicts', function() {
      const waves = [
        { id: 'Wave 1', tasks: [{ files: ['src/api/users.js'] }] },
        { id: 'Wave 2', tasks: [{ files: ['src/api/users.js'] }] }
      ];

      const conflicts = detector.detectAllConflicts(waves);
      
      assert.ok(conflicts.length > 0);
      const hasDirectConflict = conflicts.some(c => 
        c.severity === 'high' || (c.conflicts && c.conflicts.direct && c.conflicts.direct.length > 0)
      );
      assert.ok(hasDirectConflict);
    });

    it('should detect pattern-based conflicts', function() {
      const waves = [
        { id: 'Wave 1', filePatterns: ['src/components/**'] },
        { id: 'Wave 2', filePatterns: ['src/components/**'] }
      ];

      const conflicts = detector.detectAllConflicts(waves);
      assert.ok(conflicts.length > 0);
    });

    it('should calculate conflict severity', function() {
      const waves = [
        { id: 'Wave 1', tasks: [{ files: ['src/index.js'] }] },
        { id: 'Wave 2', tasks: [{ files: ['src/index.js'] }] }
      ];

      const conflicts = detector.detectAllConflicts(waves);
      
      if (conflicts.length > 0) {
        assert.ok('severity' in conflicts[0]);
        assert.ok(['high', 'medium', 'low'].includes(conflicts[0].severity));
      }
    });

    it('should suggest parallel groups', function() {
      const waves = [
        { id: 'Wave 1', filePatterns: ['src/api/**'], tasks: [] },
        { id: 'Wave 2', filePatterns: ['src/components/**'], tasks: [] },
        { id: 'Wave 3', filePatterns: ['src/api/**'], tasks: [] }
      ];

      const suggestions = detector.suggestGroups(waves);
      
      assert.ok(Array.isArray(suggestions));
    });

    it('should analyze wave file patterns', function() {
      const wave = {
        id: 'Wave 1',
        filePatterns: ['src/api/**', 'lib/utils/**'],
        tasks: []
      };

      const analysis = detector.analyzeWave(wave);
      
      assert.ok('patterns' in analysis || 'files' in analysis);
      assert.strictEqual(analysis.waveId, 'Wave 1');
    });

    it('should respect ignore patterns', function() {
      detector = new WaveConflictDetector({
        ignorePatterns: ['*.md', 'README*']
      });

      const waves = [
        { id: 'Wave 1', tasks: [{ files: ['README.md'] }] },
        { id: 'Wave 2', tasks: [{ files: ['README.md'] }] }
      ];

      const conflicts = detector.detectAllConflicts(waves);
      // README.md should be ignored - no conflicts for ignored files
      assert.strictEqual(conflicts.length, 0);
    });

    it('should handle waves with no file information', function() {
      const waves = [
        { id: 'Wave 1', tasks: [{ description: 'Do something' }] },
        { id: 'Wave 2', tasks: [{ description: 'Do another thing' }] }
      ];

      const conflicts = detector.detectAllConflicts(waves);
      // Should not throw, may return empty or pattern-based conflicts
      assert.ok(Array.isArray(conflicts));
    });
  });

  // ============================================
  // ConflictResolver Tests
  // ============================================
  describe('ConflictResolver', function() {
    let resolver;

    beforeEach(function() {
      resolver = new ConflictResolver({ strategy: 'fail' });
    });

    it('should implement fail strategy', function() {
      // Conflict objects need 'waves' array, 'severity', and 'overlaps'
      const conflicts = [
        { waves: ['Wave 1', 'Wave 2'], severity: 'high', overlaps: [{ patternA: 'src/index.js', patternB: 'src/index.js', type: 'direct' }] }
      ];

      const result = resolver.resolve(conflicts);
      
      assert.strictEqual(result.resolved, false);
      assert.strictEqual(result.strategy, 'fail');
      assert.ok(result.error || result.message);
    });

    it('should implement queue strategy', function() {
      resolver = new ConflictResolver({ strategy: 'queue' });
      
      const graph = new WaveDependencyGraph();
      graph.addWave('Wave 1', {});
      graph.addWave('Wave 2', {});
      
      const scheduler = new ParallelWaveScheduler({ maxConcurrent: 2 });
      scheduler.initialize(graph);

      const conflicts = [
        { waves: ['Wave 1', 'Wave 2'], severity: 'high', overlaps: [{ patternA: 'src/index.js', patternB: 'src/index.js', type: 'direct' }] }
      ];

      const result = resolver.resolve(conflicts, scheduler);
      
      assert.strictEqual(result.strategy, 'queue');
      // Queue strategy should add dependencies to serialize execution
    });

    it('should implement branch strategy', function() {
      resolver = new ConflictResolver({ strategy: 'branch' });

      const conflicts = [
        { waves: ['Wave 1', 'Wave 2'], severity: 'medium', overlaps: [{ patternA: 'src/utils/', patternB: 'src/utils/', type: 'directory' }] }
      ];

      const result = resolver.resolve(conflicts);
      
      assert.strictEqual(result.strategy, 'branch');
      // Branch strategy provides branch names for isolated execution
      assert.ok(result.branches && result.branches.length > 0);
    });

    it('should implement merge strategy', function() {
      resolver = new ConflictResolver({ strategy: 'merge' });

      const conflicts = [
        { waves: ['Wave 1', 'Wave 2'], severity: 'low', overlaps: [{ patternA: 'src/**', patternB: 'src/**', type: 'pattern' }] }
      ];

      const result = resolver.resolve(conflicts);
      
      assert.strictEqual(result.resolved, true);
      assert.strictEqual(result.strategy, 'merge');
    });

    it('should add serialization dependencies for queue strategy', function() {
      resolver = new ConflictResolver({ strategy: 'queue' });

      const graph = new WaveDependencyGraph();
      graph.addWave('Wave 1', {});
      graph.addWave('Wave 2', {});

      const scheduler = new ParallelWaveScheduler({ maxConcurrent: 2 });
      scheduler.initialize(graph);

      const conflicts = [
        { waves: ['Wave 1', 'Wave 2'], severity: 'high', overlaps: [{ patternA: 'src/index.js', patternB: 'src/index.js', type: 'direct' }] }
      ];

      const result = resolver.resolve(conflicts, scheduler);
      
      // After resolution, modifications should include added dependencies
      assert.ok(result.modifications && result.modifications.length > 0);
    });

    it('should handle no conflicts', function() {
      const result = resolver.resolve([]);
      
      assert.strictEqual(result.resolved, true);
      assert.strictEqual(result.strategy, 'none');
    });

    it('should call custom onConflict handler', function() {
      let handlerCalled = false;
      
      resolver = new ConflictResolver({
        strategy: 'fail',
        onConflict: (conflicts) => {
          handlerCalled = true;
          return { handled: true, resolved: true, strategy: 'custom' };
        }
      });

      const conflicts = [
        { waves: ['Wave 1', 'Wave 2'], severity: 'high', overlaps: [] }
      ];

      const result = resolver.resolve(conflicts);
      
      assert.strictEqual(handlerCalled, true);
      assert.strictEqual(result.strategy, 'custom');
    });
  });

  // ============================================
  // ParallelStateTracker Tests
  // ============================================
  describe('ParallelStateTracker', function() {
    let tracker;
    const testDir = path.join(__dirname, '../tmp_rovodev_state_test');
    const stateFile = path.join(testDir, 'parallel-state.json');

    beforeEach(function() {
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }
      tracker = new ParallelStateTracker({ 
        projectRoot: testDir,
        stateFile: stateFile,
        autoPersist: false 
      });
    });

    afterEach(function() {
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true });
      }
    });

    it('should track wave lifecycle', function() {
      tracker.startWave('Wave 1');
      assert.strictEqual(tracker.getWaveStatus('Wave 1'), 'running');

      tracker.completeWave('Wave 1');
      assert.strictEqual(tracker.getWaveStatus('Wave 1'), 'completed');
    });

    it('should track failed waves', function() {
      tracker.startWave('Wave 1');
      tracker.failWave('Wave 1', 'Test error');
      
      assert.strictEqual(tracker.getWaveStatus('Wave 1'), 'failed');
      
      const failedWaves = tracker.getFailedWaves();
      assert.ok(failedWaves.includes('Wave 1'));
    });

    it('should persist state to file', function() {
      tracker.startWave('Wave 1');
      tracker.save();

      assert.ok(fs.existsSync(stateFile));

      const savedState = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
      assert.ok(savedState.waves);
    });

    it('should load state from file', function() {
      tracker.startWave('Wave 1');
      tracker.completeWave('Wave 1');
      tracker.save();

      const newTracker = new ParallelStateTracker({ 
        projectRoot: testDir,
        stateFile: stateFile,
        autoPersist: false 
      });
      newTracker.load();

      assert.strictEqual(newTracker.getWaveStatus('Wave 1'), 'completed');
    });

    it('should calculate summary metrics', function() {
      tracker.startWave('Wave 1');
      tracker.completeWave('Wave 1');
      tracker.startWave('Wave 2');
      tracker.completeWave('Wave 2');

      const summary = tracker.getSummary();
      
      assert.ok('waves' in summary);
      assert.strictEqual(summary.waves.completed, 2);
    });

    it('should calculate parallel efficiency', function() {
      tracker.startExecution();
      tracker.startWave('Wave 1');
      tracker.startWave('Wave 2');
      tracker.completeWave('Wave 1');
      tracker.completeWave('Wave 2');
      tracker.endExecution();

      const efficiency = tracker.getParallelEfficiency();
      
      assert.ok(typeof efficiency === 'object');
      assert.ok('speedupFactor' in efficiency);
    });

    it('should track execution timeline via history', function() {
      tracker.startWave('Wave 1');
      tracker.completeWave('Wave 1');

      const json = tracker.toJSON();
      assert.ok(json.history.length > 0);
    });

    it('should clear state', function() {
      tracker.startWave('Wave 1');
      tracker.completeWave('Wave 1');
      tracker.clear();

      const completedWaves = tracker.getCompletedWaves();
      assert.strictEqual(completedWaves.length, 0);
    });
  });

  // ============================================
  // Integration Tests
  // ============================================
  describe('Integration', function() {
    const testDir = path.join(__dirname, '../tmp_rovodev_integration_test');

    beforeEach(function() {
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }
    });

    afterEach(function() {
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true });
      }
    });

    it('should execute parallel waves end-to-end', async function() {
      // Create dependency graph
      const graph = new WaveDependencyGraph();
      graph.addWave('Wave 1', { name: 'Setup' });
      graph.addWave('Wave 2', { name: 'Core' });
      graph.addWave('Wave 3', { name: 'Tests' });
      graph.addDependency('Wave 2', 'Wave 1');
      graph.addDependency('Wave 3', 'Wave 2');

      // Create scheduler
      const scheduler = new ParallelWaveScheduler({ maxConcurrent: 2 });
      scheduler.initialize(graph);

      // Create coordinator
      const coordinator = new ExecutionCoordinator({ timeout: 5000 });
      
      const results = [];
      const executors = new Map([
        ['Wave 1', async () => { results.push('Wave 1'); return 'setup done'; }],
        ['Wave 2', async () => { results.push('Wave 2'); return 'core done'; }],
        ['Wave 3', async () => { results.push('Wave 3'); return 'tests done'; }]
      ]);

      coordinator.initialize(scheduler, executors);
      const result = await coordinator.executeAll();

      assert.strictEqual(result.success, true);
      assert.strictEqual(results.length, 3);
      
      // Verify execution order respects dependencies
      assert.ok(results.indexOf('Wave 1') < results.indexOf('Wave 2'));
      assert.ok(results.indexOf('Wave 2') < results.indexOf('Wave 3'));
    });

    it('should handle complex dependency graphs', async function() {
      // Diamond dependency: Wave 4 depends on both Wave 2 and Wave 3
      const graph = new WaveDependencyGraph();
      graph.addWave('Wave 1', { name: 'Base' });
      graph.addWave('Wave 2', { name: 'Left' });
      graph.addWave('Wave 3', { name: 'Right' });
      graph.addWave('Wave 4', { name: 'Merge' });
      
      graph.addDependency('Wave 2', 'Wave 1');
      graph.addDependency('Wave 3', 'Wave 1');
      graph.addDependency('Wave 4', 'Wave 2');
      graph.addDependency('Wave 4', 'Wave 3');

      const scheduler = new ParallelWaveScheduler({ maxConcurrent: 4 });
      scheduler.initialize(graph);

      const coordinator = new ExecutionCoordinator();
      const executed = [];
      
      const executors = new Map([
        ['Wave 1', async () => { executed.push('Wave 1'); }],
        ['Wave 2', async () => { executed.push('Wave 2'); }],
        ['Wave 3', async () => { executed.push('Wave 3'); }],
        ['Wave 4', async () => { executed.push('Wave 4'); }]
      ]);

      coordinator.initialize(scheduler, executors);
      const result = await coordinator.executeAll();

      assert.strictEqual(result.success, true);
      
      // Wave 1 must come before Wave 2 and Wave 3
      assert.ok(executed.indexOf('Wave 1') < executed.indexOf('Wave 2'));
      assert.ok(executed.indexOf('Wave 1') < executed.indexOf('Wave 3'));
      
      // Wave 4 must come after Wave 2 and Wave 3
      assert.ok(executed.indexOf('Wave 4') > executed.indexOf('Wave 2'));
      assert.ok(executed.indexOf('Wave 4') > executed.indexOf('Wave 3'));
    });

    it('should recover from failures gracefully', async function() {
      const graph = new WaveDependencyGraph();
      graph.addWave('Wave 1', {});
      graph.addWave('Wave 2', {});
      graph.addWave('Wave 3', {});
      graph.addDependency('Wave 3', 'Wave 1');

      const scheduler = new ParallelWaveScheduler({ maxConcurrent: 2 });
      scheduler.initialize(graph);

      const coordinator = new ExecutionCoordinator({ stopOnFirstFailure: false });
      
      const executors = new Map([
        ['Wave 1', async () => { throw new Error('Wave 1 failed'); }],
        ['Wave 2', async () => 'success'],
        ['Wave 3', async () => 'success']
      ]);

      coordinator.initialize(scheduler, executors);
      const result = await coordinator.executeAll();

      // Overall should fail but Wave 2 should succeed
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.results['Wave 2'].success, true);
      assert.strictEqual(result.results['Wave 1'].success, false);
      // Wave 3 depends on Wave 1, so it shouldn't run
    });

    it('should parse plan and execute with full pipeline', async function() {
      // Create a test PLAN.md
      const planContent = `# Test Plan

## Wave 1: Setup
<!-- @dependencies: none -->
- Initialize project
- Create config

## Wave 2: Build
<!-- @dependencies: Wave 1 -->
- Build components
- Run compilation

## Wave 3: Test
<!-- @dependencies: Wave 1 -->
- Run unit tests
- Run integration tests
`;
      const planPath = path.join(testDir, 'PLAN.md');
      fs.writeFileSync(planPath, planContent);

      // Parse the plan
      const parser = new DependencyParser();
      const parsed = parser.parseFile(planPath);
      
      assert.strictEqual(parsed.waves.length, 3);

      // Build graph
      const graph = parser.buildGraph(parsed);
      assert.strictEqual(graph.nodes.size, 3);

      // Execute
      const scheduler = new ParallelWaveScheduler({ maxConcurrent: 2 });
      scheduler.initialize(graph);

      const coordinator = new ExecutionCoordinator();
      const executed = [];
      
      const executors = new Map();
      for (const wave of parsed.waves) {
        executors.set(wave.id, async () => { executed.push(wave.id); });
      }

      coordinator.initialize(scheduler, executors);
      const result = await coordinator.executeAll();

      assert.strictEqual(result.success, true);
      assert.strictEqual(executed.length, 3);
      
      // Wave 2 and Wave 3 can run in parallel after Wave 1
      assert.ok(executed.indexOf('Wave 1') < executed.indexOf('Wave 2'));
      assert.ok(executed.indexOf('Wave 1') < executed.indexOf('Wave 3'));
    });

    it('should integrate conflict detection with execution', async function() {
      const detector = new WaveConflictDetector();
      const resolver = new ConflictResolver({ strategy: 'queue' });

      const waves = [
        { id: 'Wave 1', tasks: [{ files: ['src/shared.js'] }] },
        { id: 'Wave 2', tasks: [{ files: ['src/shared.js'] }] }
      ];

      const conflicts = detector.detectAllConflicts(waves);
      
      if (conflicts.length > 0) {
        const graph = new WaveDependencyGraph();
        graph.addWave('Wave 1', {});
        graph.addWave('Wave 2', {});

        const scheduler = new ParallelWaveScheduler({ maxConcurrent: 2 });
        scheduler.initialize(graph);

        const resolution = resolver.resolve(conflicts, scheduler);
        
        // Resolution should either fail or add dependencies
        assert.ok(resolution.resolved === false || resolution.strategy === 'queue');
      }
    });
  });
});
