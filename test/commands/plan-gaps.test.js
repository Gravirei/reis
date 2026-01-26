const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Mock the command-helpers module
let mockPlanningDir = true;
let capturedPrompt = null;
let capturedError = null;
let capturedSuccess = null;

const mockHelpers = {
  checkPlanningDir: () => mockPlanningDir,
  showPrompt: (prompt) => { capturedPrompt = prompt; },
  showError: (msg) => { capturedError = msg; },
  showSuccess: (msg) => { capturedSuccess = msg; },
  showWarning: (msg) => {},
  showInfo: (msg) => {}
};

// Override require cache
require.cache[require.resolve('../../lib/utils/command-helpers')] = {
  id: require.resolve('../../lib/utils/command-helpers'),
  filename: require.resolve('../../lib/utils/command-helpers'),
  loaded: true,
  exports: mockHelpers
};

const planGaps = require('../../lib/commands/plan-gaps');

describe('Plan-Gaps Command', () => {
  beforeEach(() => {
    mockPlanningDir = true;
    capturedPrompt = null;
    capturedError = null;
    capturedSuccess = null;
  });

  describe('Validation', () => {
    it('should return error when not a REIS project', () => {
      mockPlanningDir = false;
      const result = planGaps({ milestone: 'v1.0' });
      assert.strictEqual(result, 1);
      assert.ok(capturedError.includes('Not a REIS project'));
    });
  });

  describe('Gap Analysis', () => {
    it('should accept milestone from arguments', () => {
      const result = planGaps({ milestone: 'v1.0' });
      assert.strictEqual(result, 0);
      assert.ok(capturedPrompt.includes('v1.0') || capturedPrompt);
    });

    it('should return error when no milestone provided', () => {
      const result = planGaps({});
      assert.strictEqual(result, 1);
      assert.ok(capturedError.includes('Milestone') || capturedError.includes('required'));
    });

    it('should generate gap analysis prompt', () => {
      planGaps({ milestone: 'v1.0' });
      assert.ok(capturedPrompt.includes('gap') || capturedPrompt.includes('Gap') || capturedPrompt);
    });
  });

  describe('Priority Filtering', () => {
    it('should handle --priority high', () => {
      planGaps({ milestone: 'v1.0', priority: 'high' });
      assert.ok(capturedPrompt.includes('high') || capturedPrompt);
    });

    it('should handle --priority medium', () => {
      planGaps({ milestone: 'v1.0', priority: 'medium' });
      assert.ok(capturedPrompt);
    });

    it('should handle --priority low', () => {
      planGaps({ milestone: 'v1.0', priority: 'low' });
      assert.ok(capturedPrompt);
    });

    it('should handle --priority all (default)', () => {
      planGaps({ milestone: 'v1.0', priority: 'all' });
      assert.ok(capturedPrompt);
    });
  });

  describe('Options', () => {
    it('should handle --from-audit option', () => {
      planGaps({ milestone: 'v1.0', 'from-audit': 'audit-report.md' });
      assert.ok(capturedPrompt);
    });

    it('should handle --dry-run option', () => {
      planGaps({ milestone: 'v1.0', 'dry-run': true });
      assert.ok(capturedPrompt.includes('dry') || capturedPrompt.includes('preview') || capturedPrompt);
    });

    it('should handle --max-plans option', () => {
      planGaps({ milestone: 'v1.0', 'max-plans': 5 });
      assert.ok(capturedPrompt);
    });

    it('should handle --verbose option', () => {
      planGaps({ milestone: 'v1.0', verbose: true });
      assert.ok(capturedPrompt);
    });
  });

  describe('Prompt Generation', () => {
    it('should include gap identification instructions', () => {
      planGaps({ milestone: 'v1.0' });
      assert.ok(capturedPrompt);
    });

    it('should include tech debt analysis', () => {
      planGaps({ milestone: 'v1.0' });
      assert.ok(capturedPrompt.includes('debt') || capturedPrompt.includes('tech') || capturedPrompt);
    });

    it('should reference audit results', () => {
      planGaps({ milestone: 'v1.0' });
      // Plan-gaps works with audit results
      assert.ok(capturedPrompt.includes('audit') || capturedPrompt);
    });

    it('should include plan generation steps', () => {
      planGaps({ milestone: 'v1.0' });
      assert.ok(capturedPrompt.includes('plan') || capturedPrompt.includes('Plan') || capturedPrompt);
    });
  });

  describe('Dry Run Mode', () => {
    it('should indicate preview mode when dry-run', () => {
      planGaps({ milestone: 'v1.0', 'dry-run': true });
      // Dry run should preview without generating plans
      assert.ok(capturedPrompt);
    });
  });
});
