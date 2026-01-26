const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Mock the command-helpers module
const originalHelpers = require('../../lib/utils/command-helpers');
let mockPlanningDir = true;
let capturedPrompt = null;
let capturedError = null;

// Create mocked version
const mockHelpers = {
  ...originalHelpers,
  checkPlanningDir: () => mockPlanningDir,
  showPrompt: (prompt) => { capturedPrompt = prompt; },
  showError: (msg) => { capturedError = msg; },
  showSuccess: (msg) => {},
  showWarning: (msg) => {}
};

// Override require cache
require.cache[require.resolve('../../lib/utils/command-helpers')] = {
  id: require.resolve('../../lib/utils/command-helpers'),
  filename: require.resolve('../../lib/utils/command-helpers'),
  loaded: true,
  exports: mockHelpers
};

const quick = require('../../lib/commands/quick');

describe('Quick Command', () => {
  beforeEach(() => {
    mockPlanningDir = true;
    capturedPrompt = null;
    capturedError = null;
  });

  describe('Validation', () => {
    it('should return error when not a REIS project', () => {
      mockPlanningDir = false;
      const result = quick({ _: ['test task'] });
      assert.strictEqual(result, 1);
      assert.strictEqual(capturedError, 'Not a REIS project. Run "reis new" or "reis map" first.');
    });

    it('should return error when no task description provided', () => {
      const result = quick({ _: [] });
      assert.strictEqual(result, 1);
      assert.strictEqual(capturedError, 'Task description is required.');
    });

    it('should return error when task is empty string', () => {
      const result = quick({ _: [''] });
      // Empty string join results in empty task
      assert.strictEqual(result, 1);
    });
  });

  describe('Task Execution', () => {
    it('should accept task from positional arguments', () => {
      const result = quick({ _: ['Fix', 'the', 'bug'] });
      assert.strictEqual(result, 0);
      assert.ok(capturedPrompt.includes('Fix the bug'));
    });

    it('should accept task from --task option', () => {
      const result = quick({ _: [], task: 'Add new feature' });
      assert.strictEqual(result, 0);
      assert.ok(capturedPrompt.includes('Add new feature'));
    });

    it('should generate prompt with task description', () => {
      quick({ _: ['Update README'] });
      assert.ok(capturedPrompt.includes('Update README'));
      assert.ok(capturedPrompt.includes('Quick Task Execution'));
    });
  });

  describe('Options', () => {
    it('should handle --no-commit flag', () => {
      quick({ _: ['Test task'], 'no-commit': true });
      assert.ok(capturedPrompt.includes('Skip git commit'));
    });

    it('should handle --verify flag', () => {
      quick({ _: ['Test task'], verify: true });
      assert.ok(capturedPrompt.includes('Verify the change works'));
      assert.ok(capturedPrompt.includes('Tests pass'));
    });

    it('should handle --verbose flag', () => {
      quick({ _: ['Test task'], verbose: true });
      assert.ok(capturedPrompt.includes('Verbose Mode'));
      assert.ok(capturedPrompt.includes('Files modified'));
    });

    it('should handle multiple flags together', () => {
      quick({ _: ['Test task'], 'no-commit': true, verify: true, verbose: true });
      assert.ok(capturedPrompt.includes('Skip git commit'));
      assert.ok(capturedPrompt.includes('Verify the change works'));
      assert.ok(capturedPrompt.includes('Verbose Mode'));
    });
  });

  describe('Prompt Generation', () => {
    it('should include minimal ceremony instructions', () => {
      quick({ _: ['Test task'] });
      assert.ok(capturedPrompt.includes('Minimal Changes'));
      assert.ok(capturedPrompt.includes('Skip Research'));
      assert.ok(capturedPrompt.includes('Direct Implementation'));
    });

    it('should include quality checks', () => {
      quick({ _: ['Test task'] });
      assert.ok(capturedPrompt.includes('Quality Checks'));
      assert.ok(capturedPrompt.includes('Changes are minimal'));
    });

    it('should include commit message format', () => {
      quick({ _: ['Test task'] });
      assert.ok(capturedPrompt.includes('Commit Message Format'));
      assert.ok(capturedPrompt.includes('<type>(<scope>)'));
    });
  });
});
