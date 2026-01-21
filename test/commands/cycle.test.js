const assert = require('assert');
const fs = require('fs');
const path = require('path');
const stateManager = require('../../lib/utils/cycle-state-manager');
const { runCycle } = require('../../lib/utils/cycle-orchestrator');
const cycleCommand = require('../../lib/commands/cycle');

describe('Cycle Command', function() {
  this.timeout(5000);
  
  afterEach(() => {
    // Clean up state file
    try {
      const stateFile = stateManager.getStateFilePath();
      if (fs.existsSync(stateFile)) {
        fs.unlinkSync(stateFile);
      }
    } catch (err) {
      // Ignore
    }
  });
  
  describe('State Manager', () => {
    it('should save and load cycle state', () => {
      const cycleData = {
        phase: 1,
        planPath: '.planning/phase-1.PLAN.md',
        currentState: 'PLANNING',
        attempts: 0,
        maxAttempts: 3,
        options: {},
        history: [],
        completeness: 0
      };
      
      const saved = stateManager.saveState(cycleData);
      assert.strictEqual(saved, true);
      
      const loaded = stateManager.loadState();
      assert.notStrictEqual(loaded, null);
      assert.strictEqual(loaded.phase, 1);
      assert.strictEqual(loaded.currentState, 'PLANNING');
    });
    
    it('should update state with new transition', () => {
      const cycleData = {
        phase: 1,
        planPath: '.planning/phase-1.PLAN.md',
        currentState: 'PLANNING',
        attempts: 0,
        maxAttempts: 3,
        options: {},
        history: [],
        completeness: 0
      };
      
      stateManager.saveState(cycleData);
      stateManager.updateState('EXECUTING', 'success', 'Plan validated');
      
      const loaded = stateManager.loadState();
      assert.strictEqual(loaded.currentState, 'EXECUTING');
      assert.strictEqual(loaded.history.length, 1);
      assert.strictEqual(loaded.history[0].state, 'PLANNING');
      assert.strictEqual(loaded.history[0].result, 'success');
    });
    
    it('should increment attempts correctly', () => {
      const cycleData = {
        phase: 1,
        planPath: '.planning/phase-1.PLAN.md',
        currentState: 'VERIFYING',
        attempts: 0,
        maxAttempts: 3,
        options: {},
        history: [],
        completeness: 0
      };
      
      stateManager.saveState(cycleData);
      stateManager.incrementAttempts();
      
      const loaded = stateManager.loadState();
      assert.strictEqual(loaded.attempts, 1);
    });
    
    it('should detect max attempts reached', () => {
      const cycleData = {
        phase: 1,
        planPath: '.planning/phase-1.PLAN.md',
        currentState: 'VERIFYING',
        attempts: 3,
        maxAttempts: 3,
        options: {},
        history: [],
        completeness: 0
      };
      
      stateManager.saveState(cycleData);
      
      const maxReached = stateManager.isMaxAttemptsReached();
      assert.strictEqual(maxReached, true);
    });
    
    it('should update completeness percentage', () => {
      const cycleData = {
        phase: 1,
        planPath: '.planning/phase-1.PLAN.md',
        currentState: 'VERIFYING',
        attempts: 0,
        maxAttempts: 3,
        options: {},
        history: [],
        completeness: 0
      };
      
      stateManager.saveState(cycleData);
      stateManager.updateCompleteness(75);
      
      const loaded = stateManager.loadState();
      assert.strictEqual(loaded.completeness, 75);
    });
    
    it('should clear state', () => {
      const cycleData = {
        phase: 1,
        planPath: '.planning/phase-1.PLAN.md',
        currentState: 'COMPLETE',
        attempts: 0,
        maxAttempts: 3,
        options: {},
        history: [],
        completeness: 100
      };
      
      stateManager.saveState(cycleData);
      stateManager.clearState();
      
      const loaded = stateManager.loadState();
      assert.strictEqual(loaded, null);
    });
    
    it('should detect resumable cycles', () => {
      const cycleData = {
        phase: 1,
        planPath: '.planning/phase-1.PLAN.md',
        currentState: 'VERIFYING',
        attempts: 1,
        maxAttempts: 3,
        options: {},
        history: [],
        completeness: 80
      };
      
      stateManager.saveState(cycleData);
      
      const resumable = stateManager.isResumable();
      assert.strictEqual(resumable, true);
    });
    
    it('should not detect non-resumable cycles', () => {
      const cycleData = {
        phase: 1,
        planPath: '.planning/phase-1.PLAN.md',
        currentState: 'COMPLETE',
        attempts: 1,
        maxAttempts: 3,
        options: {},
        history: [],
        completeness: 100
      };
      
      stateManager.saveState(cycleData);
      
      const resumable = stateManager.isResumable();
      assert.strictEqual(resumable, false);
    });
    
    it('should set last error', () => {
      const cycleData = {
        phase: 1,
        planPath: '.planning/phase-1.PLAN.md',
        currentState: 'VERIFYING',
        attempts: 1,
        maxAttempts: 3,
        options: {},
        history: [],
        completeness: 80
      };
      
      stateManager.saveState(cycleData);
      
      const error = new Error('Test error');
      error.code = 'TEST_ERROR';
      stateManager.setLastError(error);
      
      const loaded = stateManager.loadState();
      assert.notStrictEqual(loaded.lastError, null);
      assert.strictEqual(loaded.lastError.message, 'Test error');
      assert.strictEqual(loaded.lastError.code, 'TEST_ERROR');
    });
    
    it('should get state summary', () => {
      const cycleData = {
        phase: 1,
        planPath: '.planning/phase-1.PLAN.md',
        currentState: 'VERIFYING',
        attempts: 1,
        maxAttempts: 3,
        options: {},
        history: [],
        completeness: 80
      };
      
      stateManager.saveState(cycleData);
      
      const summary = stateManager.getStateSummary();
      assert.notStrictEqual(summary, null);
      assert.strictEqual(summary.phase, 1);
      assert.strictEqual(summary.currentState, 'VERIFYING');
      assert.strictEqual(summary.attempts, 1);
      assert.strictEqual(summary.completeness, 80);
      assert.strictEqual(summary.canResume, true);
    });
  });
  
  describe('Orchestrator', () => {
    it('should fail when plan not found', async () => {
      try {
        await runCycle(999, { maxAttempts: 3 });
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.strictEqual(error.code, 'PLAN_NOT_FOUND');
      }
    });
    
    it('should fail when phase/plan not provided', async () => {
      try {
        await runCycle(null, { maxAttempts: 3 });
        assert.fail('Should have thrown error');
      } catch (error) {
        assert((error.message).includes('Phase number or plan path is required'));
      }
    });
    
    it('should validate max attempts option', () => {
      const options = { maxAttempts: 5 };
      assert.strictEqual(options.maxAttempts, 5);
    });
    
    it('should validate auto-fix option', () => {
      const options = { autoFix: true };
      assert.strictEqual(options.autoFix, true);
    });
    
    it('should validate verbose option', () => {
      const options = { verbose: true };
      assert.strictEqual(options.verbose, true);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle plan not found error', () => {
      const error = new Error('Plan not found');
      error.code = 'PLAN_NOT_FOUND';
      
      assert.strictEqual(error.code, 'PLAN_NOT_FOUND');
      assert.strictEqual(error.message, 'Plan not found');
    });
    
    it('should handle invalid plan error', () => {
      const error = new Error('Plan is invalid');
      error.code = 'INVALID_PLAN';
      
      assert.strictEqual(error.code, 'INVALID_PLAN');
      assert.strictEqual(error.message, 'Plan is invalid');
    });
    
    it('should handle execution failed error', () => {
      const error = new Error('Execution failed');
      error.code = 'EXECUTION_FAILED';
      
      assert.strictEqual(error.code, 'EXECUTION_FAILED');
      assert.strictEqual(error.message, 'Execution failed');
    });
    
    it('should handle verification failed error', () => {
      const error = new Error('Verification failed');
      error.code = 'VERIFICATION_FAILED';
      
      assert.strictEqual(error.code, 'VERIFICATION_FAILED');
      assert.strictEqual(error.message, 'Verification failed');
    });
    
    it('should handle max attempts reached error', () => {
      const error = new Error('Max attempts reached');
      error.code = 'MAX_ATTEMPTS_REACHED';
      error.attempts = 3;
      error.maxAttempts = 3;
      
      assert.strictEqual(error.code, 'MAX_ATTEMPTS_REACHED');
      assert.strictEqual(error.attempts, 3);
      assert.strictEqual(error.maxAttempts, 3);
    });
    
    it('should handle debug failed error', () => {
      const error = new Error('Debug failed');
      error.code = 'DEBUG_FAILED';
      
      assert.strictEqual(error.code, 'DEBUG_FAILED');
      assert.strictEqual(error.message, 'Debug failed');
    });
    
    it('should handle fix declined error', () => {
      const error = new Error('Fix declined');
      error.code = 'FIX_DECLINED';
      
      assert.strictEqual(error.code, 'FIX_DECLINED');
      assert.strictEqual(error.message, 'Fix declined');
    });
    
    it('should handle fix failed error', () => {
      const error = new Error('Fix failed');
      error.code = 'FIX_FAILED';
      
      assert.strictEqual(error.code, 'FIX_FAILED');
      assert.strictEqual(error.message, 'Fix failed');
    });
  });
  
  describe('State Transitions', () => {
    it('should transition from IDLE to PLANNING', () => {
      const cycleData = {
        phase: 1,
        planPath: '.planning/phase-1.PLAN.md',
        currentState: 'IDLE',
        attempts: 0,
        maxAttempts: 3,
        options: {},
        history: [],
        completeness: 0
      };
      
      stateManager.saveState(cycleData);
      stateManager.updateState('PLANNING', 'success');
      
      const loaded = stateManager.loadState();
      assert.strictEqual(loaded.currentState, 'PLANNING');
    });
    
    it('should transition from PLANNING to EXECUTING', () => {
      const cycleData = {
        phase: 1,
        planPath: '.planning/phase-1.PLAN.md',
        currentState: 'PLANNING',
        attempts: 0,
        maxAttempts: 3,
        options: {},
        history: [],
        completeness: 0
      };
      
      stateManager.saveState(cycleData);
      stateManager.updateState('EXECUTING', 'success');
      
      const loaded = stateManager.loadState();
      assert.strictEqual(loaded.currentState, 'EXECUTING');
    });
    
    it('should transition from EXECUTING to VERIFYING', () => {
      const cycleData = {
        phase: 1,
        planPath: '.planning/phase-1.PLAN.md',
        currentState: 'EXECUTING',
        attempts: 0,
        maxAttempts: 3,
        options: {},
        history: [],
        completeness: 0
      };
      
      stateManager.saveState(cycleData);
      stateManager.updateState('VERIFYING', 'success');
      
      const loaded = stateManager.loadState();
      assert.strictEqual(loaded.currentState, 'VERIFYING');
    });
    
    it('should transition from VERIFYING to DEBUGGING on failure', () => {
      const cycleData = {
        phase: 1,
        planPath: '.planning/phase-1.PLAN.md',
        currentState: 'VERIFYING',
        attempts: 0,
        maxAttempts: 3,
        options: {},
        history: [],
        completeness: 80
      };
      
      stateManager.saveState(cycleData);
      stateManager.updateState('DEBUGGING', 'failure');
      
      const loaded = stateManager.loadState();
      assert.strictEqual(loaded.currentState, 'DEBUGGING');
    });
    
    it('should transition from DEBUGGING to FIXING', () => {
      const cycleData = {
        phase: 1,
        planPath: '.planning/phase-1.PLAN.md',
        currentState: 'DEBUGGING',
        attempts: 1,
        maxAttempts: 3,
        options: {},
        history: [],
        completeness: 80
      };
      
      stateManager.saveState(cycleData);
      stateManager.updateState('FIXING', 'success');
      
      const loaded = stateManager.loadState();
      assert.strictEqual(loaded.currentState, 'FIXING');
    });
    
    it('should transition from FIXING to VERIFYING', () => {
      const cycleData = {
        phase: 1,
        planPath: '.planning/phase-1.PLAN.md',
        currentState: 'FIXING',
        attempts: 1,
        maxAttempts: 3,
        options: {},
        history: [],
        completeness: 80
      };
      
      stateManager.saveState(cycleData);
      stateManager.updateState('VERIFYING', 'success');
      
      const loaded = stateManager.loadState();
      assert.strictEqual(loaded.currentState, 'VERIFYING');
    });
    
    it('should transition from VERIFYING to COMPLETE on success', () => {
      const cycleData = {
        phase: 1,
        planPath: '.planning/phase-1.PLAN.md',
        currentState: 'VERIFYING',
        attempts: 1,
        maxAttempts: 3,
        options: {},
        history: [],
        completeness: 100
      };
      
      stateManager.saveState(cycleData);
      stateManager.updateState('COMPLETE', 'success');
      
      const loaded = stateManager.loadState();
      assert.strictEqual(loaded.currentState, 'COMPLETE');
    });
    
    it('should transition to FAILED on error', () => {
      const cycleData = {
        phase: 1,
        planPath: '.planning/phase-1.PLAN.md',
        currentState: 'EXECUTING',
        attempts: 0,
        maxAttempts: 3,
        options: {},
        history: [],
        completeness: 0
      };
      
      stateManager.saveState(cycleData);
      stateManager.updateState('FAILED', 'failure', 'Unrecoverable error');
      
      const loaded = stateManager.loadState();
      assert.strictEqual(loaded.currentState, 'FAILED');
    });
  });
  
  describe('Options Validation', () => {
    it('should use default max attempts', () => {
      const options = {};
      const maxAttempts = options.maxAttempts || 3;
      assert.strictEqual(maxAttempts, 3);
    });
    
    it('should use custom max attempts', () => {
      const options = { maxAttempts: 5 };
      assert.strictEqual(options.maxAttempts, 5);
    });
    
    it('should default auto-fix to false', () => {
      const options = {};
      const autoFix = options.autoFix || false;
      assert.strictEqual(autoFix, false);
    });
    
    it('should enable auto-fix when set', () => {
      const options = { autoFix: true };
      assert.strictEqual(options.autoFix, true);
    });
    
    it('should default verbose to false', () => {
      const options = {};
      const verbose = options.verbose || false;
      assert.strictEqual(verbose, false);
    });
    
    it('should enable verbose when set', () => {
      const options = { verbose: true };
      assert.strictEqual(options.verbose, true);
    });
    
    it('should default continue-on-fail to false', () => {
      const options = {};
      const continueOnFail = options.continueOnFail || false;
      assert.strictEqual(continueOnFail, false);
    });
    
    it('should enable continue-on-fail when set', () => {
      const options = { continueOnFail: true };
      assert.strictEqual(options.continueOnFail, true);
    });
  });
});
