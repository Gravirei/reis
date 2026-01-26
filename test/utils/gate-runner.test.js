/**
 * Tests for Quality Gates
 */

const assert = require('assert');
const path = require('path');

// Import gate modules
const { GateRunner, GateResult, BaseGate } = require('../../lib/utils/gate-runner');
const { GateReporter } = require('../../lib/utils/gate-reporter');
const { SecurityGate } = require('../../lib/utils/gates/security-gate');
const { QualityGate } = require('../../lib/utils/gates/quality-gate');
const { PerformanceGate } = require('../../lib/utils/gates/performance-gate');
const { AccessibilityGate } = require('../../lib/utils/gates/accessibility-gate');

describe('Quality Gates', function() {
  this.timeout(30000); // Gates can take time

  describe('GateResult', function() {
    it('should create a pending result', function() {
      const result = new GateResult('test-gate', 'test');
      assert.strictEqual(result.status, 'pending');
      assert.strictEqual(result.gateName, 'test-gate');
      assert.strictEqual(result.category, 'test');
    });

    it('should mark result as passed', function() {
      const result = new GateResult('test', 'test');
      result.pass('All checks passed', [{ check: 'test', status: 'ok' }]);
      assert.strictEqual(result.status, 'passed');
      assert.strictEqual(result.message, 'All checks passed');
      assert.strictEqual(result.details.length, 1);
    });

    it('should mark result as warning', function() {
      const result = new GateResult('test', 'test');
      result.warn('Some warnings found');
      assert.strictEqual(result.status, 'warning');
    });

    it('should mark result as failed', function() {
      const result = new GateResult('test', 'test');
      result.fail('Checks failed', [{ error: 'test error' }]);
      assert.strictEqual(result.status, 'failed');
      assert.strictEqual(result.details.length, 1);
    });

    it('should mark result as skipped', function() {
      const result = new GateResult('test', 'test');
      result.skip('Not configured');
      assert.strictEqual(result.status, 'skipped');
    });

    it('should mark result as error', function() {
      const result = new GateResult('test', 'test');
      result.error('Execution failed', new Error('test error'));
      assert.strictEqual(result.status, 'error');
      assert.strictEqual(result.error, 'test error');
    });

    it('should convert to JSON', function() {
      const result = new GateResult('test', 'security');
      result.pass('OK');
      const json = result.toJSON();
      assert.strictEqual(json.gateName, 'test');
      assert.strictEqual(json.category, 'security');
      assert.strictEqual(json.status, 'passed');
    });
  });

  describe('BaseGate', function() {
    it('should create a gate with name and category', function() {
      const gate = new BaseGate('test-gate', 'test-category', { enabled: true });
      assert.strictEqual(gate.name, 'test-gate');
      assert.strictEqual(gate.category, 'test-category');
      assert.strictEqual(gate.isEnabled(), true);
    });

    it('should respect enabled config', function() {
      const disabledGate = new BaseGate('test', 'test', { enabled: false });
      assert.strictEqual(disabledGate.isEnabled(), false);
    });

    it('should throw on run() if not implemented', async function() {
      const gate = new BaseGate('test', 'test');
      try {
        await gate.run();
        assert.fail('Should have thrown');
      } catch (e) {
        assert.ok(e.message.includes('must be implemented'));
      }
    });

    it('should return gate info', function() {
      const gate = new BaseGate('test', 'test', { setting: 'value' });
      const info = gate.getInfo();
      assert.strictEqual(info.name, 'test');
      assert.strictEqual(info.category, 'test');
      assert.strictEqual(info.config.setting, 'value');
    });
  });

  describe('GateRunner', function() {
    it('should create a runner with config', function() {
      const runner = new GateRunner({ timeout: 5000 });
      assert.strictEqual(runner.timeout, 5000);
      assert.strictEqual(runner.gates.size, 0);
    });

    it('should register and unregister gates', function() {
      const runner = new GateRunner();
      const gate = new BaseGate('test', 'test');
      
      runner.registerGate('test', gate);
      assert.strictEqual(runner.gates.size, 1);
      assert.strictEqual(runner.getGate('test'), gate);
      
      runner.unregisterGate('test');
      assert.strictEqual(runner.gates.size, 0);
    });

    it('should reject non-BaseGate instances', function() {
      const runner = new GateRunner();
      try {
        runner.registerGate('test', { run: () => {} });
        assert.fail('Should have thrown');
      } catch (e) {
        assert.ok(e.message.includes('must extend BaseGate'));
      }
    });

    it('should run a custom gate', async function() {
      class TestGate extends BaseGate {
        async run() {
          const result = new GateResult(this.name, this.category);
          result.pass('Test passed');
          return result;
        }
      }

      const runner = new GateRunner();
      runner.registerGate('test', new TestGate('test', 'test'));
      
      const results = await runner.runAll();
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].status, 'passed');
    });

    it('should skip disabled gates', async function() {
      class TestGate extends BaseGate {
        async run() {
          const result = new GateResult(this.name, this.category);
          result.pass('Test passed');
          return result;
        }
      }

      const runner = new GateRunner();
      runner.registerGate('test', new TestGate('test', 'test', { enabled: false }));
      
      const results = await runner.runAll();
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].status, 'skipped');
    });

    it('should calculate summary correctly', async function() {
      class PassGate extends BaseGate {
        async run() {
          const result = new GateResult(this.name, this.category);
          result.pass('OK');
          return result;
        }
      }
      class WarnGate extends BaseGate {
        async run() {
          const result = new GateResult(this.name, this.category);
          result.warn('Warning');
          return result;
        }
      }

      const runner = new GateRunner();
      runner.registerGate('pass', new PassGate('pass', 'test'));
      runner.registerGate('warn', new WarnGate('warn', 'test'));
      
      await runner.runAll();
      const summary = runner.getSummary();
      
      assert.strictEqual(summary.total, 2);
      assert.strictEqual(summary.passed, 1);
      assert.strictEqual(summary.warning, 1);
      assert.strictEqual(summary.hasPassed, true);
      assert.strictEqual(summary.hasWarnings, true);
    });

    it('should handle gate timeout', async function() {
      class SlowGate extends BaseGate {
        async run() {
          await new Promise(resolve => setTimeout(resolve, 5000));
          const result = new GateResult(this.name, this.category);
          result.pass('OK');
          return result;
        }
      }

      const runner = new GateRunner({ timeout: 100 });
      runner.registerGate('slow', new SlowGate('slow', 'test'));
      
      const results = await runner.runAll();
      assert.strictEqual(results[0].status, 'error');
      assert.ok(results[0].message.includes('timed out'));
    });

    it('should run gates by category', async function() {
      class TestGate extends BaseGate {
        async run() {
          const result = new GateResult(this.name, this.category);
          result.pass('OK');
          return result;
        }
      }

      const runner = new GateRunner();
      runner.registerGate('sec1', new TestGate('sec1', 'security'));
      runner.registerGate('qual1', new TestGate('qual1', 'quality'));
      
      const results = await runner.runCategory('security');
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].category, 'security');
    });

    it('should emit events', async function() {
      class TestGate extends BaseGate {
        async run() {
          const result = new GateResult(this.name, this.category);
          result.pass('OK');
          return result;
        }
      }

      const runner = new GateRunner();
      runner.registerGate('test', new TestGate('test', 'test'));
      
      const events = [];
      runner.on('gate:start', (data) => events.push({ type: 'start', data }));
      runner.on('gate:complete', (data) => events.push({ type: 'complete', data }));
      
      await runner.runAll();
      
      assert.strictEqual(events.length, 2);
      assert.strictEqual(events[0].type, 'start');
      assert.strictEqual(events[1].type, 'complete');
    });
  });

  describe('GateReporter', function() {
    it('should create reporter with default options', function() {
      const reporter = new GateReporter();
      assert.strictEqual(reporter.format, 'ascii');
      assert.strictEqual(reporter.verbose, false);
    });

    it('should get status icons', function() {
      const reporter = new GateReporter();
      assert.strictEqual(reporter.getStatusIcon('passed'), '✅');
      assert.strictEqual(reporter.getStatusIcon('failed'), '❌');
      assert.strictEqual(reporter.getStatusIcon('warning'), '⚠️');
      assert.strictEqual(reporter.getStatusIcon('skipped'), '⏭️');
    });

    it('should generate ASCII report', function() {
      const reporter = new GateReporter({ format: 'ascii' });
      const results = [
        { gateName: 'test', category: 'security', status: 'passed', message: 'OK', details: [] }
      ];
      const summary = { total: 1, passed: 1, warning: 0, failed: 0, skipped: 0 };
      
      const report = reporter.generateReport(results, summary);
      assert.ok(report.includes('QUALITY GATE REPORT'));
      assert.ok(report.includes('SECURITY'));
    });

    it('should generate JSON report', function() {
      const reporter = new GateReporter({ format: 'json' });
      const results = [
        { gateName: 'test', category: 'security', status: 'passed', message: 'OK', details: [], toJSON: function() { return this; } }
      ];
      const summary = { total: 1, passed: 1, warning: 0, failed: 0, skipped: 0 };
      
      const report = reporter.generateReport(results, summary);
      const parsed = JSON.parse(report);
      assert.strictEqual(parsed.results.length, 1);
      assert.ok(parsed.summary);
    });

    it('should generate Markdown report', function() {
      const reporter = new GateReporter({ format: 'markdown' });
      const results = [
        { gateName: 'test', category: 'security', status: 'passed', message: 'OK', details: [] }
      ];
      const summary = { total: 1, passed: 1, warning: 0, failed: 0, skipped: 0 };
      
      const report = reporter.generateReport(results, summary);
      assert.ok(report.includes('# 🛡️ Quality Gate Report'));
      assert.ok(report.includes('| Check | Status | Message |'));
    });

    it('should calculate overall status', function() {
      const reporter = new GateReporter();
      
      assert.strictEqual(reporter.getOverallStatus({ failed: 1 }), 'failed');
      assert.strictEqual(reporter.getOverallStatus({ error: 1 }), 'failed');
      assert.strictEqual(reporter.getOverallStatus({ warning: 1 }), 'warning');
      assert.strictEqual(reporter.getOverallStatus({ passed: 1 }), 'passed');
    });
  });

  describe('SecurityGate', function() {
    it('should create security gate', function() {
      const gate = new SecurityGate({ enabled: true });
      assert.strictEqual(gate.name, 'security');
      assert.strictEqual(gate.category, 'security');
    });

    it('should run security checks', async function() {
      const gate = new SecurityGate({
        vulnerabilities: { enabled: true },
        secrets: { enabled: true },
        licenses: { enabled: true }
      });
      
      const result = await gate.run();
      assert.ok(['passed', 'warning', 'failed'].includes(result.status));
      assert.ok(result.details.length > 0);
    });

    it('should skip disabled checks', async function() {
      const gate = new SecurityGate({
        vulnerabilities: { enabled: false },
        secrets: { enabled: false },
        licenses: { enabled: false }
      });
      
      const result = await gate.run();
      assert.strictEqual(result.status, 'passed');
      assert.ok(result.details.every(d => d.status === 'skipped'));
    });
  });

  describe('QualityGate', function() {
    it('should create quality gate', function() {
      const gate = new QualityGate({ enabled: true });
      assert.strictEqual(gate.name, 'quality');
      assert.strictEqual(gate.category, 'quality');
    });

    it('should run quality checks', async function() {
      const gate = new QualityGate({
        coverage: { enabled: false },
        lint: { enabled: true },
        complexity: { enabled: false },
        documentation: { enabled: false }
      });
      
      const result = await gate.run();
      assert.ok(['passed', 'warning', 'failed', 'skipped'].includes(result.status));
    });
  });

  describe('PerformanceGate', function() {
    it('should create performance gate', function() {
      const gate = new PerformanceGate({ enabled: true });
      assert.strictEqual(gate.name, 'performance');
      assert.strictEqual(gate.category, 'performance');
    });

    it('should parse size strings', function() {
      const gate = new PerformanceGate();
      assert.strictEqual(gate.parseSize('100b'), 100);
      assert.strictEqual(gate.parseSize('1kb'), 1024);
      assert.strictEqual(gate.parseSize('1mb'), 1024 * 1024);
    });

    it('should format sizes', function() {
      const gate = new PerformanceGate();
      assert.strictEqual(gate.formatSize(100), '100 B');
      assert.strictEqual(gate.formatSize(1024), '1.0 KB');
      assert.strictEqual(gate.formatSize(1024 * 1024), '1.0 MB');
    });
  });

  describe('AccessibilityGate', function() {
    it('should create accessibility gate', function() {
      const gate = new AccessibilityGate({ enabled: true, wcagLevel: 'AA' });
      assert.strictEqual(gate.name, 'accessibility');
      assert.strictEqual(gate.category, 'accessibility');
      assert.strictEqual(gate.wcagLevel, 'AA');
    });
  });

  describe('Gate Command Integration', function() {
    it('should load gate command module', function() {
      const { gateCommand, mergeConfig, DEFAULT_GATE_CONFIG } = require('../../lib/commands/gate');
      assert.ok(typeof gateCommand === 'function');
      assert.ok(typeof mergeConfig === 'function');
      assert.ok(DEFAULT_GATE_CONFIG.security);
      assert.ok(DEFAULT_GATE_CONFIG.quality);
    });

    it('should merge config with defaults', function() {
      const { mergeConfig } = require('../../lib/commands/gate');
      
      const merged = mergeConfig({
        security: { enabled: false },
        quality: { coverage: { minimum: 90 } }
      });
      
      assert.strictEqual(merged.security.enabled, false);
      assert.strictEqual(merged.quality.coverage.minimum, 90);
      assert.strictEqual(merged.quality.lint.enabled, true); // Default preserved
    });
  });
});
