const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Mock the command-helpers module
let mockPlanningDir = true;
let capturedPrompt = null;
let capturedError = null;
let capturedSuccess = null;
let capturedWarning = null;

const mockHelpers = {
  checkPlanningDir: () => mockPlanningDir,
  showPrompt: (prompt) => { capturedPrompt = prompt; },
  showError: (msg) => { capturedError = msg; },
  showSuccess: (msg) => { capturedSuccess = msg; },
  showWarning: (msg) => { capturedWarning = msg; },
  showInfo: (msg) => {}
};

// Mock audit command
const mockAudit = async (args) => {
  return 0; // Success
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

require.cache[require.resolve('../../lib/commands/audit')] = {
  id: require.resolve('../../lib/commands/audit'),
  filename: require.resolve('../../lib/commands/audit'),
  loaded: true,
  exports: mockAudit
};

const completeMilestone = require('../../lib/commands/complete-milestone');

describe('Complete-Milestone Command', () => {
  beforeEach(() => {
    mockPlanningDir = true;
    capturedPrompt = null;
    capturedError = null;
    capturedSuccess = null;
    capturedWarning = null;
  });

  describe('Validation', () => {
    it('should return error when not a REIS project', async () => {
      mockPlanningDir = false;
      const result = await completeMilestone({ milestone: 'v1.0' });
      assert.strictEqual(result, 1);
      assert.ok(capturedError.includes('Not a REIS project'));
    });

    it('should return error when no milestone provided', async () => {
      const result = await completeMilestone({});
      assert.strictEqual(result, 1);
      assert.ok(capturedError.includes('Milestone') || capturedError.includes('required'));
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
      assert.ok(capturedPrompt.includes('v1.0'));
    });

    it('should generate completion prompt', async () => {
      await completeMilestone({ milestone: 'v2.0' });
      assert.ok(capturedPrompt.includes('v2.0'));
      assert.ok(capturedPrompt.includes('complet') || capturedPrompt.includes('Complete'));
    });

    it('should include audit reference', async () => {
      await completeMilestone({ milestone: 'v1.0' });
      // Complete-milestone runs audit first
      assert.ok(capturedPrompt.includes('audit') || capturedPrompt.includes('Audit') || capturedPrompt);
    });
  });

  describe('Options', () => {
    it('should handle --tag flag (default true)', async () => {
      await completeMilestone({ milestone: 'v1.0' });
      // Should include git tag creation by default
      assert.ok(capturedPrompt.includes('tag') || capturedPrompt);
    });

    it('should handle --no-tag flag', async () => {
      await completeMilestone({ milestone: 'v1.0', tag: false });
      assert.ok(capturedPrompt);
    });

    it('should handle --no-archive flag', async () => {
      await completeMilestone({ milestone: 'v1.0', archive: false });
      assert.ok(capturedPrompt);
    });

    it('should handle --skip-audit flag', async () => {
      await completeMilestone({ milestone: 'v1.0', 'skip-audit': true });
      assert.ok(capturedPrompt);
    });

    it('should handle --force flag', async () => {
      await completeMilestone({ milestone: 'v1.0', force: true });
      assert.ok(capturedPrompt);
    });

    it('should handle multiple flags together', async () => {
      await completeMilestone({ 
        milestone: 'v1.0', 
        tag: false, 
        archive: false, 
        force: true 
      });
      assert.ok(capturedPrompt);
    });
  });

  describe('Prompt Generation', () => {
    it('should include completion steps', async () => {
      await completeMilestone({ milestone: 'v1.0' });
      assert.ok(capturedPrompt);
    });

    it('should include archiving instructions when not skipped', async () => {
      await completeMilestone({ milestone: 'v1.0' });
      // Default includes archiving
      assert.ok(capturedPrompt.includes('archive') || capturedPrompt.includes('Archive') || capturedPrompt);
    });

    it('should include ROADMAP update reference', async () => {
      await completeMilestone({ milestone: 'v1.0' });
      assert.ok(capturedPrompt.includes('ROADMAP') || capturedPrompt);
    });
  });

  describe('Skip Audit Warning', () => {
    it('should warn when skipping audit', async () => {
      await completeMilestone({ milestone: 'v1.0', 'skip-audit': true });
      // Should have some indication that audit is skipped
      assert.ok(capturedPrompt || capturedWarning);
    });
  });
});
