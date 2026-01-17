const assert = require('assert');
const visualizeCommand = require('../../lib/commands/visualize.js');
const StateManager = require('../../lib/utils/state-manager.js');
const { MetricsTracker } = require('../../lib/utils/metrics-tracker.js');
const config = require('../../lib/utils/config.js');

describe('visualize command', () => {
  let originalLog, originalError, originalClear, originalExit;
  let originalGetState, originalGetMetricsSummary, originalLoadConfig;
  let consoleOutput, exitCode;

  beforeEach(() => {
    consoleOutput = { log: [], error: [], clear: [] };
    originalLog = console.log;
    originalError = console.error;
    originalClear = console.clear;
    originalExit = process.exit;
    originalGetState = StateManager.prototype.getState;
    originalGetMetricsSummary = MetricsTracker.prototype.getMetricsSummary;
    originalLoadConfig = config.loadConfig;
    
    console.log = (...args) => consoleOutput.log.push(args.join(' '));
    console.error = (...args) => consoleOutput.error.push(args.join(' '));
    console.clear = () => consoleOutput.clear.push('cleared');
    exitCode = null;
    process.exit = (code) => { exitCode = code; throw new Error('process.exit called'); };
    
    // Mock loadConfig to return a default config
    config.loadConfig = async () => ({ projectRoot: process.cwd() });
  });

  afterEach(() => {
    console.log = originalLog;
    console.error = originalError;
    console.clear = originalClear;
    process.exit = originalExit;
    if (originalGetState) StateManager.prototype.getState = originalGetState;
    if (originalGetMetricsSummary) MetricsTracker.prototype.getMetricsSummary = originalGetMetricsSummary;
    if (originalLoadConfig) config.loadConfig = originalLoadConfig;
  });

  describe('basic functionality', () => {
    it('should display progress visualization by default', async () => {
      StateManager.prototype.getState = async function() {
        return { currentPhase: 'Phase 1', currentWave: { id: 'wave-1', status: 'in_progress', completedTasks: 3, totalTasks: 5 } };
      };
      MetricsTracker.prototype.getMetricsSummary = function() { return {}; };
      await visualizeCommand([]);
      const output = consoleOutput.log.join('\n');
      assert(output.includes('Project Progress'));
      assert(output.includes('Phase 1'));
    });

    it('should display waves with --type waves', async () => {
      StateManager.prototype.getState = async function() {
        return { waves: [{ id: 'wave-1', status: 'complete', totalTasks: 5, completedTasks: 5 }] };
      };
      MetricsTracker.prototype.getMetricsSummary = function() { return {}; };
      await visualizeCommand(['--type', 'waves']);
      const output = consoleOutput.log.join('\n');
      assert(output.includes('Wave Overview'));
    });

    it('should display roadmap with --type roadmap', async () => {
      StateManager.prototype.getState = async function() {
        return { phases: [{ number: 1, name: 'Foundation', totalWaves: 3, completedWaves: 3 }] };
      };
      MetricsTracker.prototype.getMetricsSummary = function() { return {}; };
      await visualizeCommand(['--type', 'roadmap']);
      const output = consoleOutput.log.join('\n');
      assert(output.includes('Project Roadmap'));
    });

    it('should display metrics with --type metrics', async () => {
      StateManager.prototype.getState = async function() { return {}; };
      MetricsTracker.prototype.getMetricsSummary = function() {
        return { totalWaves: 3, successfulWaves: 2, successRate: 0.67 };
      };
      await visualizeCommand(['--type', 'metrics']);
      const output = consoleOutput.log.join('\n');
      assert(output.includes('Metrics Dashboard'));
    });
  });

  describe('options', () => {
    it('should support --compact flag', async () => {
      StateManager.prototype.getState = async function() { return { currentPhase: 'Phase 1' }; };
      MetricsTracker.prototype.getMetricsSummary = function() { return {}; };
      await visualizeCommand(['--compact']);
      const output = consoleOutput.log.join('\n');
      assert(!output.includes('╔═══'));
    });

    it('should reject invalid type', async () => {
      try { await visualizeCommand(['--type', 'invalid']); } catch (e) {}
      const errorOutput = consoleOutput.error.join('\n');
      assert(errorOutput.includes('Invalid type'));
      assert.strictEqual(exitCode, 1);
    });
  });

  describe('data display', () => {
    it('should show progress bar', async () => {
      StateManager.prototype.getState = async function() {
        return { currentWave: { id: 'wave-1', completedTasks: 6, totalTasks: 10 } };
      };
      MetricsTracker.prototype.getMetricsSummary = function() { return {}; };
      await visualizeCommand([]);
      const output = consoleOutput.log.join('\n');
      assert(output.includes('60%'));
    });

    it('should display next steps', async () => {
      StateManager.prototype.getState = async function() {
        return { nextSteps: ['Task 1', 'Task 2'] };
      };
      MetricsTracker.prototype.getMetricsSummary = function() { return {}; };
      await visualizeCommand([]);
      const output = consoleOutput.log.join('\n');
      assert(output.includes('Task 1'));
    });
  });

  describe('error handling', () => {
    it('should handle missing STATE.md', async () => {
      StateManager.prototype.getState = async function() { throw new Error('STATE.md not found'); };
      MetricsTracker.prototype.getMetricsSummary = function() { return {}; };
      await visualizeCommand([]);
      const errorOutput = consoleOutput.error.join('\n');
      assert(errorOutput.includes('STATE.md not found'));
    });

    it('should handle empty waves', async () => {
      StateManager.prototype.getState = async function() { return { waves: [] }; };
      MetricsTracker.prototype.getMetricsSummary = function() { return {}; };
      await visualizeCommand(['--type', 'waves']);
      const output = consoleOutput.log.join('\n');
      assert(output.includes('No waves found'));
    });
  });
});
