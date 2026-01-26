/**
 * Integration tests for Gate-Cycle Integration
 */

const assert = require('assert');
const path = require('path');

describe('Gate-Cycle Integration', function() {
  this.timeout(30000); // Gates can take time

  describe('Cycle Orchestrator Gate Phase', function() {
    const { runCycle } = require('../../lib/utils/cycle-orchestrator');
    
    it('should have executeGateStep function', function() {
      // The function is internal, but we can check the module loads
      assert.ok(runCycle, 'runCycle should be exported');
    });
  });

  describe('State Manager Gate Tracking', function() {
    const stateManager = require('../../lib/utils/cycle-state-manager');
    
    it('should export setGateResult function', function() {
      assert.ok(typeof stateManager.setGateResult === 'function');
    });

    it('should export getGateResult function', function() {
      assert.ok(typeof stateManager.getGateResult === 'function');
    });

    it('should export clearGateResult function', function() {
      assert.ok(typeof stateManager.clearGateResult === 'function');
    });

    it('should store and retrieve gate results', function() {
      // Initialize state first (required for gate result storage)
      stateManager.saveState({
        phase: 'test-phase',
        planPath: 'test-plan.md',
        currentState: 'GATING',
        attempts: 0,
        maxAttempts: 3
      });
      
      const mockResult = {
        passed: true,
        hasWarnings: false,
        results: [],
        summary: { total: 2, passed: 2, failed: 0 }
      };
      
      stateManager.setGateResult(mockResult);
      const retrieved = stateManager.getGateResult();
      
      assert.ok(retrieved, 'Should retrieve gate result');
      assert.strictEqual(retrieved.passed, true);
      assert.ok(retrieved.timestamp, 'Should have timestamp');
      
      stateManager.clearGateResult();
      const cleared = stateManager.getGateResult();
      assert.strictEqual(cleared, null, 'Should be null after clearing');
      
      // Clean up test state
      stateManager.clearState();
    });
  });

  describe('Gate Command Exports', function() {
    const gate = require('../../lib/commands/gate');
    
    it('should export runAllGates', function() {
      assert.ok(typeof gate.runAllGates === 'function');
    });

    it('should export runCategoryGates', function() {
      assert.ok(typeof gate.runCategoryGates === 'function');
    });

    it('should export runGatesForCycle', function() {
      assert.ok(typeof gate.runGatesForCycle === 'function');
    });

    it('should export createGateRunner', function() {
      assert.ok(typeof gate.createGateRunner === 'function');
    });

    it('should export mergeConfig', function() {
      assert.ok(typeof gate.mergeConfig === 'function');
    });

    it('should export DEFAULT_GATE_CONFIG', function() {
      assert.ok(gate.DEFAULT_GATE_CONFIG);
      assert.ok(gate.DEFAULT_GATE_CONFIG.security);
      assert.ok(gate.DEFAULT_GATE_CONFIG.quality);
    });
  });

  describe('Config Validation', function() {
    const { validateGateCycleConfig } = require('../../lib/utils/config');
    
    it('should validate valid config', function() {
      const config = {
        gates: {
          enabled: true,
          runOn: ['cycle', 'verify'],
          blockOnFail: true,
          timeout: 30000
        }
      };
      
      const result = validateGateCycleConfig(config);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    it('should reject invalid runOn type', function() {
      const config = {
        gates: {
          runOn: 'cycle' // Should be array
        }
      };
      
      const result = validateGateCycleConfig(config);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('runOn')));
    });

    it('should warn on unknown runOn values', function() {
      const config = {
        gates: {
          runOn: ['cycle', 'unknown']
        }
      };
      
      const result = validateGateCycleConfig(config);
      assert.ok(result.warnings.some(w => w.includes('unknown')));
    });

    it('should reject invalid blockOnFail type', function() {
      const config = {
        gates: {
          blockOnFail: 'yes' // Should be boolean
        }
      };
      
      const result = validateGateCycleConfig(config);
      assert.strictEqual(result.valid, false);
    });

    it('should reject negative timeout', function() {
      const config = {
        gates: {
          timeout: -1000
        }
      };
      
      const result = validateGateCycleConfig(config);
      assert.strictEqual(result.valid, false);
    });
  });

  describe('Cycle UI Gate Display', function() {
    const cycleUI = require('../../lib/utils/cycle-ui');
    
    it('should include GATING in CYCLE_PHASES', function() {
      assert.ok(cycleUI.CYCLE_PHASES.includes('GATING'));
    });

    it('should return correct icon for GATING phase', function() {
      const icon = cycleUI.getPhaseIcon('GATING');
      assert.strictEqual(icon, '🛡️');
    });

    it('should have displayGateStatus function', function() {
      assert.ok(typeof cycleUI.displayGateStatus === 'function');
    });

    it('should format gate status correctly', function() {
      const result = {
        passed: true,
        hasWarnings: false,
        summary: { passed: 2, failed: 0, warning: 0 }
      };
      
      const display = cycleUI.displayGateStatus(result);
      assert.ok(display.includes('✅'));
      assert.ok(display.includes('Passed'));
    });

    it('should format failed gate status correctly', function() {
      const result = {
        passed: false,
        hasWarnings: false,
        summary: { passed: 1, failed: 2, warning: 0 }
      };
      
      const display = cycleUI.displayGateStatus(result);
      assert.ok(display.includes('❌'));
      assert.ok(display.includes('Failed'));
    });

    it('should format warning gate status correctly', function() {
      const result = {
        passed: false,
        hasWarnings: true,
        summary: { passed: 1, failed: 0, warning: 1 }
      };
      
      const display = cycleUI.displayGateStatus(result);
      assert.ok(display.includes('⚠️'));
    });

    it('should return empty string for null result', function() {
      const display = cycleUI.displayGateStatus(null);
      assert.strictEqual(display, '');
    });
  });
});
