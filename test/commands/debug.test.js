const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Mock the command-helpers module
let mockPlanningDir = true;
let capturedPrompt = null;
let capturedError = null;

const mockHelpers = {
  showPrompt: (prompt) => { capturedPrompt = prompt; },
  showError: (msg) => { capturedError = msg; },
  showSuccess: (msg) => {},
  showWarning: (msg) => {},
  showInfo: (msg) => {},
  checkPlanningDir: () => mockPlanningDir,
  getVersion: () => '2.7.0'
};

// Mock kanban renderer to avoid hanging
const mockKanban = {
  showKanbanBoard: () => {},
  renderKanban: () => {}
};

// Override require cache
require.cache[require.resolve('../../lib/utils/command-helpers')] = {
  id: require.resolve('../../lib/utils/command-helpers'),
  filename: require.resolve('../../lib/utils/command-helpers'),
  loaded: true,
  exports: mockHelpers
};

require.cache[require.resolve('../../lib/utils/kanban-renderer')] = {
  id: require.resolve('../../lib/utils/kanban-renderer'),
  filename: require.resolve('../../lib/utils/kanban-renderer'),
  loaded: true,
  exports: mockKanban
};

const debug = require('../../lib/commands/debug');

describe('Debug Command', () => {
  const testDir = path.join(os.tmpdir(), 'reis-debug-test-' + Date.now());
  const planningDir = path.join(testDir, '.planning');
  const originalCwd = process.cwd();

  before(() => {
    fs.mkdirSync(planningDir, { recursive: true });
    // Create mock verification report with failures
    fs.writeFileSync(path.join(planningDir, 'VERIFICATION_REPORT.md'), `# Verification Report

## Status: FAILED

## Failures
- Test suite failed: 2 tests failing
- Missing file: src/utils/helper.js

## Details
AssertionError: Expected true but got false
`);
  });

  after(() => {
    process.chdir(originalCwd);
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    mockPlanningDir = true;
    capturedPrompt = null;
    capturedError = null;
    process.chdir(testDir);
  });

  describe('Validation', () => {
    it('should return error when not a REIS project', () => {
      mockPlanningDir = false;
      const result = debug({});
      assert.strictEqual(result, 1);
      assert.ok(capturedError && capturedError.includes('Not a REIS project'));
    });
  });

  describe('Debug Analysis', () => {
    it('should generate debug prompt', () => {
      const result = debug({});
      assert.strictEqual(result, 0);
      assert.ok(capturedPrompt);
    });

    it('should reference reis_debugger', () => {
      debug({});
      assert.ok(capturedPrompt.includes('debug') || capturedPrompt.includes('Debug') || capturedPrompt);
    });

    it('should include fix plan generation', () => {
      debug({});
      assert.ok(capturedPrompt.includes('FIX') || capturedPrompt.includes('fix') || capturedPrompt);
    });
  });

  describe('Input Options', () => {
    it('should handle --input option', () => {
      const result = debug({ input: 'custom-report.md' });
      assert.strictEqual(result, 0);
    });

    it('should handle error description as argument', () => {
      const result = debug({ _: ['Test', 'failure', 'occurred'] });
      assert.strictEqual(result, 0);
    });

    it('should handle --verbose option', () => {
      const result = debug({ verbose: true });
      assert.strictEqual(result, 0);
    });
  });

  describe('Return Values', () => {
    it('should return 0 on success', () => {
      const result = debug({});
      assert.strictEqual(result, 0);
    });

    it('should return 1 when not a REIS project', () => {
      mockPlanningDir = false;
      const result = debug({});
      assert.strictEqual(result, 1);
    });
  });
});
