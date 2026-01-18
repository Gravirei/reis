# Plan: 4-2-2 - Performance Benchmarks

## Objective
Establish performance baselines for all REIS v2.0 utilities and commands, test with large plans, profile memory usage, and implement regression detection.

## Context
Phase 4 Wave 1 complete (249 tests passing). All utilities operational with no performance testing yet. Need to establish baseline metrics and ensure REIS v2.0 meets performance requirements before production release.

**Performance targets from REQUIREMENTS.md:**
- Config load: <50ms
- STATE.md update: <100ms
- Git operations: acceptable
- Wave parsing: <200ms for large plans
- Visualization render: <10ms per chart

**Target:** Add 12-15 performance benchmark tests

## Dependencies
- Wave 1 complete (all utilities available for benchmarking)

## Wave Assignment
**Wave 2, Task 2** (parallel with 4-2-1 and 4-2-3)

## Tasks

<task type="auto">
<name>Create performance benchmark suite with baseline targets</name>
<files>test/performance/benchmarks.test.js, test/performance/benchmark-utils.js</files>
<action>
Create comprehensive performance benchmark suite to measure and validate REIS v2.0 performance.

**Step 1: Create test/performance/benchmark-utils.js**

Utility functions for consistent performance measurement:

```javascript
/**
 * Performance Benchmark Utilities
 * High-precision timing and performance validation
 */

/**
 * Measure execution time of async function with multiple iterations
 * @param {Function} fn - Async function to measure
 * @param {number} iterations - Number of times to run (default: 10)
 * @param {Function} setup - Optional setup function run before each iteration
 * @param {Function} teardown - Optional teardown function run after each iteration
 * @returns {Object} Performance metrics (avg, min, max, median, p95)
 */
async function measureTime(fn, iterations = 10, setup = null, teardown = null) {
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    // Setup
    if (setup) await setup();
    
    // Measure
    const start = process.hrtime.bigint();
    await fn();
    const end = process.hrtime.bigint();
    
    const durationMs = Number(end - start) / 1_000_000; // Convert to ms
    times.push(durationMs);
    
    // Teardown
    if (teardown) await teardown();
    
    // Small delay to prevent CPU throttling
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  // Calculate statistics
  times.sort((a, b) => a - b);
  const sum = times.reduce((a, b) => a + b, 0);
  
  return {
    avg: sum / times.length,
    min: times[0],
    max: times[times.length - 1],
    median: times[Math.floor(times.length / 2)],
    p95: times[Math.floor(times.length * 0.95)],
    all: times
  };
}

/**
 * Measure memory usage during function execution
 * @param {Function} fn - Function to measure
 * @returns {Object} Memory usage metrics
 */
async function measureMemory(fn) {
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  const before = process.memoryUsage();
  await fn();
  const after = process.memoryUsage();
  
  return {
    heapUsed: (after.heapUsed - before.heapUsed) / 1024 / 1024, // MB
    heapTotal: (after.heapTotal - before.heapTotal) / 1024 / 1024, // MB
    external: (after.external - before.external) / 1024 / 1024, // MB
    rss: (after.rss - before.rss) / 1024 / 1024 // MB
  };
}

/**
 * Assert performance target met
 * @param {Object} result - Result from measureTime()
 * @param {number} targetMs - Target time in milliseconds
 * @param {string} description - Test description
 * @param {string} metric - Which metric to check (avg, p95, max)
 */
function assertPerformance(result, targetMs, description, metric = 'avg') {
  const actual = result[metric];
  const pass = actual <= targetMs;
  const status = pass ? '✓' : '✗';
  
  console.log(`  ${status} ${description}: ${actual.toFixed(2)}ms (target: ${targetMs}ms, metric: ${metric})`);
  
  if (!pass) {
    throw new Error(
      `Performance regression: ${description} ${metric}=${actual.toFixed(2)}ms exceeds target ${targetMs}ms`
    );
  }
}

/**
 * Assert memory usage is acceptable
 * @param {Object} result - Result from measureMemory()
 * @param {number} targetMB - Target memory in MB
 * @param {string} description - Test description
 */
function assertMemory(result, targetMB, description) {
  const actual = result.heapUsed;
  const pass = actual <= targetMB;
  const status = pass ? '✓' : '✗';
  
  console.log(`  ${status} ${description}: ${actual.toFixed(2)}MB (target: ${targetMB}MB)`);
  
  if (!pass) {
    throw new Error(
      `Memory regression: ${description} used ${actual.toFixed(2)}MB exceeds target ${targetMB}MB`
    );
  }
}

/**
 * Create performance report
 * @param {Object} benchmarks - Map of benchmark name to results
 * @returns {string} Formatted report
 */
function generateReport(benchmarks) {
  let report = '\n=== Performance Benchmark Report ===\n\n';
  
  Object.entries(benchmarks).forEach(([name, result]) => {
    report += `${name}:\n`;
    report += `  Average: ${result.avg.toFixed(2)}ms\n`;
    report += `  Median:  ${result.median.toFixed(2)}ms\n`;
    report += `  P95:     ${result.p95.toFixed(2)}ms\n`;
    report += `  Min:     ${result.min.toFixed(2)}ms\n`;
    report += `  Max:     ${result.max.toFixed(2)}ms\n`;
    report += `\n`;
  });
  
  return report;
}

module.exports = {
  measureTime,
  measureMemory,
  assertPerformance,
  assertMemory,
  generateReport
};
```

**Step 2: Create test/performance/benchmarks.test.js**

Comprehensive performance benchmark suite:

```javascript
/**
 * Performance Benchmark Suite
 * Establishes baseline performance metrics for REIS v2.0
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const { measureTime, measureMemory, assertPerformance, assertMemory, generateReport } = require('./benchmark-utils');
const { loadConfig, saveConfig, mergeConfigs } = require('../../lib/utils/config');
const StateManager = require('../../lib/utils/state-manager');
const { getGitStatus, createCommit, createCheckpoint } = require('../../lib/utils/git-integration');
const WaveExecutor = require('../../lib/utils/wave-executor');
const { validatePlan } = require('../../lib/utils/plan-validator');
const { MetricsTracker } = require('../../lib/utils/metrics-tracker');
const { createBarChart, createProgressBar, createTimeline } = require('../../lib/utils/visualizer');

describe('Performance Benchmarks', function() {
  // Extended timeout for performance tests
  this.timeout(60000);
  
  let testRoot;
  let originalCwd;
  const benchmarkResults = {};

  before(() => {
    console.log('\n=== Starting Performance Benchmark Suite ===\n');
  });

  after(() => {
    console.log(generateReport(benchmarkResults));
  });

  beforeEach(() => {
    testRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'reis-perf-'));
    originalCwd = process.cwd();
    process.chdir(testRoot);
    
    // Initialize git repo
    execSync('git init', { stdio: 'pipe' });
    execSync('git config user.email "perf@test.com"', { stdio: 'pipe' });
    execSync('git config user.name "Perf Test"', { stdio: 'pipe' });
    
    // Create structure
    fs.mkdirSync('.planning', { recursive: true });
    fs.writeFileSync('README.md', '# Perf Test\n', 'utf8');
    execSync('git add .', { stdio: 'pipe' });
    execSync('git commit -m "Initial"', { stdio: 'pipe' });
  });

  afterEach(() => {
    process.chdir(originalCwd);
    if (fs.existsSync(testRoot)) {
      fs.rmSync(testRoot, { recursive: true, force: true });
    }
  });

  describe('Config System Performance', () => {
    it('should load default config in <50ms', async () => {
      const result = await measureTime(async () => {
        const config = loadConfig();
      }, 20);
      
      benchmarkResults['Config: Load default'] = result;
      assertPerformance(result, 50, 'Default config loading', 'avg');
    });

    it('should load and merge complex config in <100ms', async () => {
      // Create complex config
      const complexConfig = {
        waveSize: 'large',
        autoCommit: true,
        checkpointInterval: 2,
        git: { enabled: true, autoTag: true },
        metrics: { enabled: true, trackPerformance: true },
        visualization: { colors: true, animations: false },
        customField1: 'value1',
        customField2: { nested: { deep: { value: 'test' } } }
      };
      fs.writeFileSync('reis.config.js', `module.exports = ${JSON.stringify(complexConfig, null, 2)};`, 'utf8');
      
      const result = await measureTime(async () => {
        const config = loadConfig();
      }, 20);
      
      benchmarkResults['Config: Load complex'] = result;
      assertPerformance(result, 100, 'Complex config loading', 'avg');
    });
  });

  describe('STATE.md Performance', () => {
    it('should read STATE.md in <20ms', async () => {
      const stateManager = new StateManager(testRoot);
      stateManager.saveState();
      
      const result = await measureTime(async () => {
        const state = stateManager.loadState();
      }, 50);
      
      benchmarkResults['STATE: Read'] = result;
      assertPerformance(result, 20, 'STATE.md read', 'avg');
    });

    it('should update STATE.md in <50ms', async () => {
      const stateManager = new StateManager(testRoot);
      
      const result = await measureTime(async () => {
        stateManager.state.currentPhase = `Phase ${Math.random()}`;
        stateManager.saveState();
      }, 20);
      
      benchmarkResults['STATE: Update'] = result;
      assertPerformance(result, 50, 'STATE.md update', 'avg');
    });

    it('should handle 100 sequential wave additions in <2s', async () => {
      const stateManager = new StateManager(testRoot);
      
      const result = await measureTime(async () => {
        for (let i = 0; i < 100; i++) {
          stateManager.addCompletedWave(`Wave ${i}`, 'commit-' + i);
          stateManager.saveState();
        }
      }, 1); // Only run once (already doing 100 iterations internally)
      
      benchmarkResults['STATE: 100 sequential updates'] = result;
      assertPerformance(result, 2000, 'STATE.md 100 updates', 'avg');
    });
  });

  describe('Git Operations Performance', () => {
    it('should check git status in <100ms', async () => {
      const result = await measureTime(async () => {
        const status = getGitStatus(testRoot);
      }, 20);
      
      benchmarkResults['Git: Status check'] = result;
      assertPerformance(result, 100, 'Git status check', 'avg');
    });

    it('should create commit in <200ms', async () => {
      const result = await measureTime(
        async () => {
          const commit = createCommit('Test commit', testRoot);
        },
        10,
        // Setup: Make a change before each commit
        () => {
          fs.appendFileSync('README.md', `\nLine ${Date.now()}\n`, 'utf8');
          execSync('git add .', { stdio: 'pipe' });
        }
      );
      
      benchmarkResults['Git: Create commit'] = result;
      assertPerformance(result, 200, 'Git commit creation', 'avg');
    });

    it('should create checkpoint (commit + tag) in <300ms', async () => {
      const result = await measureTime(
        async () => {
          const checkpoint = createCheckpoint(`checkpoint-${Date.now()}`, 'Test checkpoint', testRoot);
        },
        10,
        // Setup: Make a change before each checkpoint
        () => {
          fs.appendFileSync('README.md', `\nCheckpoint ${Date.now()}\n`, 'utf8');
          execSync('git add .', { stdio: 'pipe' });
        }
      );
      
      benchmarkResults['Git: Create checkpoint'] = result;
      assertPerformance(result, 300, 'Git checkpoint creation', 'avg');
    });
  });

  describe('Wave Execution Performance', () => {
    it('should parse PLAN.md with 10 waves in <100ms', async () => {
      // Create PLAN with 10 waves
      let plan = '# Test Plan\n\n';
      for (let i = 1; i <= 10; i++) {
        plan += `## Wave ${i}: Test Wave\nSize: medium\n\n### Tasks\n- Task 1\n- Task 2\n- Task 3\n\n`;
      }
      fs.writeFileSync('.planning/TEST.PLAN.md', plan, 'utf8');
      
      const result = await measureTime(async () => {
        const executor = new WaveExecutor('.planning/TEST.PLAN.md', testRoot);
        const waves = executor.waves;
      }, 20);
      
      benchmarkResults['Wave: Parse 10 waves'] = result;
      assertPerformance(result, 100, 'PLAN.md parsing (10 waves)', 'avg');
    });

    it('should parse large PLAN.md with 50 waves in <200ms', async () => {
      // Create large PLAN with 50 waves
      let plan = '# Large Test Plan\n\n';
      for (let i = 1; i <= 50; i++) {
        plan += `## Wave ${i}: Test Wave ${i}\nSize: medium\nDependencies: ${i > 1 ? `Wave ${i-1}` : 'none'}\n\n`;
        plan += `### Tasks\n`;
        for (let t = 1; t <= 5; t++) {
          plan += `- Task ${t}: Do something important\n`;
        }
        plan += `\n`;
      }
      fs.writeFileSync('.planning/LARGE.PLAN.md', plan, 'utf8');
      
      const result = await measureTime(async () => {
        const executor = new WaveExecutor('.planning/LARGE.PLAN.md', testRoot);
        const waves = executor.waves;
      }, 10);
      
      benchmarkResults['Wave: Parse 50 waves'] = result;
      assertPerformance(result, 200, 'Large PLAN.md parsing (50 waves)', 'avg');
    });
  });

  describe('Metrics Tracking Performance', () => {
    it('should record wave execution in <10ms', async () => {
      const tracker = new MetricsTracker(testRoot);
      
      const result = await measureTime(async () => {
        tracker.recordWaveExecution({
          name: 'Test Wave',
          duration: 10,
          status: 'completed',
          commit: 'abc123'
        });
      }, 50);
      
      benchmarkResults['Metrics: Record execution'] = result;
      assertPerformance(result, 10, 'Metrics recording', 'avg');
    });

    it('should load and parse metrics with 100 events in <50ms', async () => {
      const tracker = new MetricsTracker(testRoot);
      
      // Pre-populate with 100 events
      for (let i = 0; i < 100; i++) {
        tracker.recordWaveExecution({
          name: `Wave ${i}`,
          duration: 5 + Math.floor(Math.random() * 10),
          status: i % 10 === 0 ? 'failed' : 'completed',
          commit: `commit-${i}`
        });
      }
      
      const result = await measureTime(async () => {
        const newTracker = new MetricsTracker(testRoot);
        const summary = newTracker.getMetricsSummary();
      }, 20);
      
      benchmarkResults['Metrics: Load 100 events'] = result;
      assertPerformance(result, 50, 'Metrics loading (100 events)', 'avg');
    });

    it('should generate metrics report in <100ms', async () => {
      const tracker = new MetricsTracker(testRoot);
      
      // Add diverse data
      for (let i = 0; i < 50; i++) {
        tracker.recordWaveExecution({
          name: `Wave ${i}`,
          duration: 5 + Math.floor(Math.random() * 15),
          status: i % 8 === 0 ? 'failed' : 'completed',
          commit: `commit-${i}`
        });
      }
      
      const result = await measureTime(async () => {
        const summary = tracker.getMetricsSummary();
        const trends = tracker.getHistoricalTrends(30);
      }, 20);
      
      benchmarkResults['Metrics: Generate report'] = result;
      assertPerformance(result, 100, 'Metrics report generation', 'avg');
    });
  });

  describe('Plan Validation Performance', () => {
    it('should validate small plan (3 waves) in <200ms', async () => {
      const plan = `# Small Plan\n\n## Wave 1\nSize: small\n\n### Tasks\n- Task 1\n- Task 2\n\n## Wave 2\nSize: medium\n\n### Tasks\n- Task 1\n- Task 2\n- Task 3\n\n## Wave 3\nSize: small\n\n### Tasks\n- Task 1\n`;
      fs.writeFileSync('.planning/SMALL.PLAN.md', plan, 'utf8');
      
      const result = await measureTime(async () => {
        const validation = validatePlan('.planning/SMALL.PLAN.md');
      }, 20);
      
      benchmarkResults['Validation: Small plan'] = result;
      assertPerformance(result, 200, 'Small plan validation (3 waves)', 'avg');
    });

    it('should validate large plan (20 waves) in <500ms', async () => {
      let plan = '# Large Plan\n\n';
      for (let i = 1; i <= 20; i++) {
        plan += `## Wave ${i}: Wave ${i}\nSize: medium\nDependencies: ${i > 1 ? `Wave ${i-1}` : 'none'}\n\n### Tasks\n`;
        for (let t = 1; t <= 5; t++) {
          plan += `- Task ${t}\n`;
        }
        plan += `\n`;
      }
      fs.writeFileSync('.planning/LARGE.PLAN.md', plan, 'utf8');
      
      const result = await measureTime(async () => {
        const validation = validatePlan('.planning/LARGE.PLAN.md');
      }, 10);
      
      benchmarkResults['Validation: Large plan'] = result;
      assertPerformance(result, 500, 'Large plan validation (20 waves)', 'avg');
    });
  });

  describe('Visualization Performance', () => {
    it('should create bar chart in <10ms', async () => {
      const data = [
        { label: 'Wave 1', value: 45 },
        { label: 'Wave 2', value: 32 },
        { label: 'Wave 3', value: 58 },
        { label: 'Wave 4', value: 21 },
        { label: 'Wave 5', value: 67 }
      ];
      
      const result = await measureTime(async () => {
        const chart = createBarChart(data, { width: 50 });
      }, 100);
      
      benchmarkResults['Visualizer: Bar chart'] = result;
      assertPerformance(result, 10, 'Bar chart rendering', 'avg');
    });

    it('should create progress bar in <5ms', async () => {
      const result = await measureTime(async () => {
        const bar = createProgressBar(7, 10, { width: 40 });
      }, 100);
      
      benchmarkResults['Visualizer: Progress bar'] = result;
      assertPerformance(result, 5, 'Progress bar rendering', 'avg');
    });

    it('should create timeline in <10ms', async () => {
      const events = [
        { date: '2024-01-18', label: 'Phase 1 Start', status: 'completed' },
        { date: '2024-01-19', label: 'Phase 1 Complete', status: 'completed' },
        { date: '2024-01-20', label: 'Phase 2 Start', status: 'in-progress' }
      ];
      
      const result = await measureTime(async () => {
        const timeline = createTimeline(events, { width: 60 });
      }, 100);
      
      benchmarkResults['Visualizer: Timeline'] = result;
      assertPerformance(result, 10, 'Timeline rendering', 'avg');
    });
  });

  describe('Memory Usage', () => {
    it('should use <5MB memory for StateManager operations', async () => {
      const memResult = await measureMemory(async () => {
        for (let i = 0; i < 100; i++) {
          const stateManager = new StateManager(testRoot);
          stateManager.state.currentPhase = `Phase ${i}`;
          stateManager.saveState();
          stateManager.loadState();
        }
      });
      
      assertMemory(memResult, 5, 'StateManager operations');
    });

    it('should use <10MB memory for large plan parsing', async () => {
      // Create very large plan (200 waves)
      let plan = '# Huge Plan\n\n';
      for (let i = 1; i <= 200; i++) {
        plan += `## Wave ${i}\nSize: medium\n\n### Tasks\n`;
        for (let t = 1; t <= 5; t++) {
          plan += `- Task ${t}: ${`x`.repeat(100)}\n`;
        }
        plan += `\n`;
      }
      fs.writeFileSync('.planning/HUGE.PLAN.md', plan, 'utf8');
      
      const memResult = await measureMemory(async () => {
        const executor = new WaveExecutor('.planning/HUGE.PLAN.md', testRoot);
        const waves = executor.waves;
      });
      
      assertMemory(memResult, 10, 'Large plan parsing (200 waves)');
    });
  });
});
```

**Coverage:**
- Config system: 2 benchmarks
- STATE.md operations: 3 benchmarks
- Git operations: 3 benchmarks
- Wave execution: 2 benchmarks
- Metrics tracking: 3 benchmarks
- Plan validation: 2 benchmarks
- Visualization: 3 benchmarks
- Memory usage: 2 benchmarks
- **Total: 20 benchmark tests**

**All targets aligned with REQUIREMENTS.md specifications.**
</action>
<verify>
npm test -- test/performance/benchmarks.test.js

# Should show:
# - 20 benchmark tests passing
# - Performance report printed with all metrics
# - All targets met (no regressions)
# - Total test count: 249 + 20 = 269 tests
</verify>
<done>
- test/performance/benchmark-utils.js created with timing and memory utilities
- test/performance/benchmarks.test.js created with 20 comprehensive benchmarks
- All performance targets met:
  - Config load: <50ms ✓
  - STATE update: <50ms ✓
  - Git operations: <300ms ✓
  - Wave parsing: <200ms for 50 waves ✓
  - Visualization: <10ms per chart ✓
- Memory usage within acceptable limits
- Performance report generation working
- All benchmarks pass
- Baseline metrics established for regression detection
</done>
</task>

## Success Criteria
- 20 performance benchmark tests passing
- All performance targets met per REQUIREMENTS.md
- Baseline metrics established for future regression detection
- Memory usage validated for large operations
- Performance report generated and verified

## Verification
```bash
npm test -- test/performance/benchmarks.test.js
npm test  # All 269 tests should pass
```
