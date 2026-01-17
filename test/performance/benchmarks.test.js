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
