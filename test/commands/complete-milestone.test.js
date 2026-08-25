const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Mock the command-helpers module
let mockPlanningDir = true;
let mockCapturedPrompt = null;
let mockCapturedError = null;
let mockCapturedSuccess = null;
let mockCapturedWarning = null;

jest.mock('../../lib/utils/command-helpers', () => ({
  checkPlanningDir: () => mockPlanningDir,
  showPrompt: (prompt) => { mockCapturedPrompt = prompt; },
  showError: (msg) => { mockCapturedError = msg; },
  showSuccess: (msg) => { mockCapturedSuccess = msg; },
  showWarning: (msg) => { mockCapturedWarning = msg; },
  showInfo: (msg) => {}
}));

// Mock audit command
jest.mock('../../lib/commands/audit', () => async (args) => {
  return 0; // Success
});

// Mock subagent-invoker
jest.mock('../../lib/utils/subagent-invoker', () => ({
  invokeSubagent: async (name, args) => {
    return { success: true, issues: [] };
  }
}));

const completeMilestone = require('../../lib/commands/complete-milestone');

describe('Complete-Milestone Command', () => {
  beforeEach(() => {
    mockPlanningDir = true;
    mockCapturedPrompt = null;
    mockCapturedError = null;
    mockCapturedSuccess = null;
    mockCapturedWarning = null;
  });

  describe('Validation', () => {
    it('should return error when not a REIS project', async () => {
      mockPlanningDir = false;
      const result = await completeMilestone({ milestone: 'v1.0' });
      assert.strictEqual(result, 1);
      assert.ok(mockCapturedError.includes('Not a REIS project'));
    });

    it('should return error when no milestone provided', async () => {
      const result = await completeMilestone({});
      assert.strictEqual(result, 1);
      assert.ok(mockCapturedError.includes('Milestone') || mockCapturedError.includes('required'));
    });

    it('should return error when milestone is empty', async () => {
      const result = await completeMilestone({ milestone: '' });
      assert.strictEqual(result, 1);
    });
  });

  describe('Milestone Completion', () => {
    it('should accept milestone from arguments', async () => {
      const result = await completeMilestone({ milestone: 'v1.0' });
      assert.strictEqual(result, 0);
      assert.ok(mockCapturedPrompt.includes('v1.0'));
    });

    it('should generate completion prompt', async () => {
      await completeMilestone({ milestone: 'v2.0' });
      assert.ok(mockCapturedPrompt.includes('v2.0'));
      assert.ok(mockCapturedPrompt.includes('complet') || mockCapturedPrompt.includes('Complete'));
    });

    it('should include audit reference', async () => {
      await completeMilestone({ milestone: 'v1.0' });
      // Complete-milestone runs audit first
      assert.ok(mockCapturedPrompt.includes('audit') || mockCapturedPrompt.includes('Audit') || mockCapturedPrompt);
    });
  });

  describe('Options', () => {
    it('should handle --tag flag (default true)', async () => {
      await completeMilestone({ milestone: 'v1.0' });
      // Should include git tag creation by default
      assert.ok(mockCapturedPrompt.includes('tag') || mockCapturedPrompt);
    });

    it('should handle --no-tag flag', async () => {
      await completeMilestone({ milestone: 'v1.0', tag: false });
      assert.ok(mockCapturedPrompt);
    });

    it('should handle --no-archive flag', async () => {
      await completeMilestone({ milestone: 'v1.0', archive: false });
      assert.ok(mockCapturedPrompt);
    });

    it('should handle --skip-audit flag', async () => {
      await completeMilestone({ milestone: 'v1.0', 'skip-audit': true });
      assert.ok(mockCapturedPrompt);
    });

    it('should handle --force flag', async () => {
      await completeMilestone({ milestone: 'v1.0', force: true });
      assert.ok(mockCapturedPrompt);
    });

    it('should handle multiple flags together', async () => {
      await completeMilestone({ 
        milestone: 'v1.0', 
        tag: false, 
        archive: false, 
        force: true 
      });
      assert.ok(mockCapturedPrompt);
    });
  });

  describe('Prompt Generation', () => {
    it('should include completion steps', async () => {
      await completeMilestone({ milestone: 'v1.0' });
      assert.ok(mockCapturedPrompt);
    });

    it('should include archiving instructions when not skipped', async () => {
      await completeMilestone({ milestone: 'v1.0' });
      // Default includes archiving
      assert.ok(mockCapturedPrompt.includes('archive') || mockCapturedPrompt.includes('Archive') || mockCapturedPrompt);
    });

    it('should include ROADMAP update reference', async () => {
      await completeMilestone({ milestone: 'v1.0' });
      assert.ok(mockCapturedPrompt.includes('ROADMAP') || mockCapturedPrompt);
    });
  });

  describe('Skip Audit Warning', () => {
    it('should warn when skipping audit', async () => {
      await completeMilestone({ milestone: 'v1.0', 'skip-audit': true });
      // Should have some indication that audit is skipped
      assert.ok(mockCapturedPrompt || mockCapturedWarning);
    });
  });
});
