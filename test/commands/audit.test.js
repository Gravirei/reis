const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Mock the command-helpers module
let mockPlanningDir = true;
let capturedPrompt = null;
let capturedError = null;
let capturedSuccess = null;
let capturedInfo = null;

const mockHelpers = {
  checkPlanningDir: () => mockPlanningDir,
  showPrompt: (prompt) => { capturedPrompt = prompt; },
  showError: (msg) => { capturedError = msg; },
  showSuccess: (msg) => { capturedSuccess = msg; },
  showWarning: (msg) => {},
  showInfo: (msg) => { capturedInfo = msg; }
};

// Mock subagent-invoker
const mockInvokeSubagent = async (name, args) => {
  return { success: true, issues: [] };
};

// Override require cache
require.cache[require.resolve('../../lib/utils/command-helpers')] = {
  id: require.resolve('../../lib/utils/command-helpers'),
  filename: require.resolve('../../lib/utils/command-helpers'),
  loaded: true,
  exports: mockHelpers
};

require.cache[require.resolve('../../lib/utils/subagent-invoker')] = {
  id: require.resolve('../../lib/utils/subagent-invoker'),
  filename: require.resolve('../../lib/utils/subagent-invoker'),
  loaded: true,
  exports: { invokeSubagent: mockInvokeSubagent }
};

const audit = require('../../lib/commands/audit');

describe('Audit Command', () => {
  const testDir = path.join(os.tmpdir(), 'reis-audit-test-' + Date.now());
  const planningDir = path.join(testDir, '.planning');
  
  before(() => {
    // Create test directory structure
    fs.mkdirSync(planningDir, { recursive: true });
    fs.mkdirSync(path.join(planningDir, 'phases'), { recursive: true });
    fs.mkdirSync(path.join(planningDir, 'audits'), { recursive: true });
    
    // Create mock ROADMAP.md
    fs.writeFileSync(path.join(planningDir, 'ROADMAP.md'), `# Test Roadmap

## Milestone: v1.0

### Phase 1: Setup
**Status**: ✅ Complete

### Phase 2: Core Features  
**Status**: ⏳ In Progress
`);
    
    // Create mock STATE.md
    fs.writeFileSync(path.join(planningDir, 'STATE.md'), `# Project State

## Current Phase
Phase 2

## Completed Phases
- Phase 1
`);
  });
  
  after(() => {
    // Cleanup
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    mockPlanningDir = true;
    capturedPrompt = null;
    capturedError = null;
    capturedSuccess = null;
    capturedInfo = null;
  });

  describe('Validation', () => {
    it('should return error when not a REIS project', async () => {
      mockPlanningDir = false;
      const result = await audit({ milestone: 'v1.0' });
      assert.strictEqual(result, 1);
      assert.ok(capturedError.includes('Not a REIS project'));
    });
  });

  describe('Milestone Audit', () => {
    it('should accept milestone from arguments', async () => {
      const result = await audit({ milestone: 'v1.0' });
      assert.strictEqual(result, 0);
      // Info message should contain the milestone
      assert.ok(capturedInfo && capturedInfo.includes('v1.0'));
    });

    it('should audit all phases when no milestone specified', async () => {
      const result = await audit({});
      assert.strictEqual(result, 0);
      // Should mention auditing all phases
      assert.ok(capturedInfo && capturedInfo.includes('all'));
    });

    it('should return success for valid audit', async () => {
      const result = await audit({ milestone: 'v2.0' });
      assert.strictEqual(result, 0);
    });
  });

  describe('Phase Audit', () => {
    it('should accept --phase option', async () => {
      const result = await audit({ phase: 3 });
      assert.strictEqual(result, 0);
    });

    it('should audit single phase when specified', async () => {
      const result = await audit({ phase: 2 });
      assert.strictEqual(result, 0);
    });
  });

  describe('Options', () => {
    it('should handle --strict flag', async () => {
      const result = await audit({ milestone: 'v1.0', strict: true });
      assert.strictEqual(result, 0);
    });

    it('should handle --output option', async () => {
      const result = await audit({ milestone: 'v1.0', output: 'custom-report.md' });
      assert.strictEqual(result, 0);
    });

    it('should handle --verbose flag', async () => {
      const result = await audit({ milestone: 'v1.0', verbose: true });
      assert.strictEqual(result, 0);
    });
  });

  describe('Return Values', () => {
    it('should return 0 on successful audit', async () => {
      const result = await audit({ milestone: 'v1.0' });
      assert.strictEqual(result, 0);
    });

    it('should return 1 when not a REIS project', async () => {
      mockPlanningDir = false;
      const result = await audit({ milestone: 'v1.0' });
      assert.strictEqual(result, 1);
    });
  });
});
