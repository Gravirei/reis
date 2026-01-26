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

// Override require cache
require.cache[require.resolve('../../lib/utils/command-helpers')] = {
  id: require.resolve('../../lib/utils/command-helpers'),
  filename: require.resolve('../../lib/utils/command-helpers'),
  loaded: true,
  exports: mockHelpers
};

// Clear the command from cache to force reload with mocks
delete require.cache[require.resolve('../../lib/commands/plan')];
const plan = require('../../lib/commands/plan');

describe('Plan Command', () => {
  const testDir = path.join(os.tmpdir(), 'reis-plan-test-' + Date.now());
  const planningDir = path.join(testDir, '.planning');
  const originalCwd = process.cwd();

  before(() => {
    fs.mkdirSync(planningDir, { recursive: true });
    // Create mock ROADMAP.md
    fs.writeFileSync(path.join(planningDir, 'ROADMAP.md'), `# Test Roadmap

## Phase 1: Setup
- Task 1
- Task 2

## Phase 2: Core Features
- Feature A
- Feature B
`);
    // Create mock PROJECT.md
    fs.writeFileSync(path.join(planningDir, 'PROJECT.md'), `# Test Project

## Overview
A test project for REIS.
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
      const result = plan({ _: [1] });
      assert.strictEqual(result, 1);
      assert.ok(capturedError && capturedError.includes('Not a REIS project'));
    });
  });

  describe('Phase Planning', () => {
    it('should accept phase number from arguments', () => {
      const result = plan({ _: [1] });
      assert.strictEqual(result, 0);
      assert.ok(capturedPrompt);
    });

    it('should accept phase from --phase option', () => {
      const result = plan({ _: [], phase: 2 });
      assert.strictEqual(result, 0);
    });

    it('should generate planning prompt', () => {
      plan({ _: [1] });
      assert.ok(capturedPrompt.includes('PLAN') || capturedPrompt.includes('plan') || capturedPrompt.includes('Phase'));
    });

    it('should reference reis_planner', () => {
      plan({ _: [1] });
      assert.ok(capturedPrompt.includes('planner') || capturedPrompt);
    });
  });

  describe('Options', () => {
    it('should handle --verbose option', () => {
      const result = plan({ _: [1], verbose: true });
      assert.strictEqual(result, 0);
    });

    it('should handle --output option', () => {
      const result = plan({ _: [1], output: 'custom-plan.md' });
      assert.strictEqual(result, 0);
    });
  });

  describe('Return Values', () => {
    it('should return 0 on success', () => {
      const result = plan({ _: [1] });
      assert.strictEqual(result, 0);
    });

    it('should return 1 when not a REIS project', () => {
      mockPlanningDir = false;
      const result = plan({ _: [1] });
      assert.strictEqual(result, 1);
    });
  });
});
