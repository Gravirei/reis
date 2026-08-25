const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Mock the command-helpers module
jest.mock('../../lib/utils/command-helpers', () => {
  const originalHelpers = jest.requireActual('../../lib/utils/command-helpers');
  return {
    ...originalHelpers,
    checkPlanningDir: () => mockPlanningDir,
    showPrompt: (prompt) => { mockCapturedPrompt = prompt; },
    showError: (msg) => { mockCapturedError = msg; },
    showSuccess: (msg) => {},
    showWarning: (msg) => {}
  };
});

let mockPlanningDir = true;
let mockCapturedPrompt = null;
let mockCapturedError = null;

const quick = require('../../lib/commands/quick');

describe('Quick Command', () => {
  beforeEach(() => {
    mockPlanningDir = true;
    mockCapturedPrompt = null;
    mockCapturedError = null;
  });

  describe('Validation', () => {
    it('should return error when not a REIS project', () => {
      mockPlanningDir = false;
      const result = quick({ _: ['test task'] });
      assert.strictEqual(result, 1);
      assert.strictEqual(mockCapturedError, 'Not a REIS project. Run "reis new" or "reis map" first.');
    });

    it('should return error when no task description provided', () => {
      const result = quick({ _: [] });
      assert.strictEqual(result, 1);
      assert.strictEqual(mockCapturedError, 'Task description is required.');
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
      assert.ok(mockCapturedPrompt.includes('Fix the bug'));
    });

    it('should accept task from --task option', () => {
      const result = quick({ _: [], task: 'Add new feature' });
      assert.strictEqual(result, 0);
      assert.ok(mockCapturedPrompt.includes('Add new feature'));
    });

    it('should generate prompt with task description', () => {
      quick({ _: ['Update README'] });
      assert.ok(mockCapturedPrompt.includes('Update README'));
      assert.ok(mockCapturedPrompt.includes('Quick Task Execution'));
    });
  });

  describe('Options', () => {
    it('should handle --no-commit flag', () => {
      quick({ _: ['Test task'], 'no-commit': true });
      assert.ok(mockCapturedPrompt.includes('Skip git commit'));
    });

    it('should handle --verify flag', () => {
      quick({ _: ['Test task'], verify: true });
      assert.ok(mockCapturedPrompt.includes('Verify the change works'));
      assert.ok(mockCapturedPrompt.includes('Tests pass'));
    });

    it('should handle --verbose flag', () => {
      quick({ _: ['Test task'], verbose: true });
      assert.ok(mockCapturedPrompt.includes('Verbose Mode'));
      assert.ok(mockCapturedPrompt.includes('Files modified'));
    });

    it('should handle multiple flags together', () => {
      quick({ _: ['Test task'], 'no-commit': true, verify: true, verbose: true });
      assert.ok(mockCapturedPrompt.includes('Skip git commit'));
      assert.ok(mockCapturedPrompt.includes('Verify the change works'));
      assert.ok(mockCapturedPrompt.includes('Verbose Mode'));
    });
  });

  describe('Prompt Generation', () => {
    it('should include minimal ceremony instructions', () => {
      quick({ _: ['Test task'] });
      assert.ok(mockCapturedPrompt.includes('Minimal Changes'));
      assert.ok(mockCapturedPrompt.includes('Skip Research'));
      assert.ok(mockCapturedPrompt.includes('Direct Implementation'));
    });

    it('should include quality checks', () => {
      quick({ _: ['Test task'] });
      assert.ok(mockCapturedPrompt.includes('Quality Checks'));
      assert.ok(mockCapturedPrompt.includes('Changes are minimal'));
    });

    it('should include commit message format', () => {
      quick({ _: ['Test task'] });
      assert.ok(mockCapturedPrompt.includes('Commit Message Format'));
      assert.ok(mockCapturedPrompt.includes('<type>(<scope>)'));
    });
  });
});
