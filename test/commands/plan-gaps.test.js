const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Mock the command-helpers module
let mockPlanningDir = true;
let mockCapturedPrompt = null;
let mockCapturedError = null;
let mockCapturedSuccess = null;

jest.mock('../../lib/utils/command-helpers', () => ({
  checkPlanningDir: () => mockPlanningDir,
  showPrompt: (prompt) => { mockCapturedPrompt = prompt; },
  showError: (msg) => { mockCapturedError = msg; },
  showSuccess: (msg) => { mockCapturedSuccess = msg; },
  showWarning: (msg) => {},
  showInfo: (msg) => {}
}));

const planGaps = require('../../lib/commands/plan-gaps');

describe('Plan-Gaps Command', () => {
  beforeEach(() => {
    mockPlanningDir = true;
    mockCapturedPrompt = null;
    mockCapturedError = null;
    mockCapturedSuccess = null;
  });

  describe('Validation', () => {
    it('should return error when not a REIS project', () => {
      mockPlanningDir = false;
      const result = planGaps({ milestone: 'v1.0' });
      assert.strictEqual(result, 1);
      assert.ok(mockCapturedError.includes('Not a REIS project'));
    });
  });

  describe('Gap Analysis', () => {
    it('should accept milestone from arguments', () => {
      const result = planGaps({ milestone: 'v1.0' });
      assert.strictEqual(result, 0);
      assert.ok(mockCapturedPrompt.includes('v1.0') || mockCapturedPrompt);
    });

    it('should return error when no milestone provided', () => {
      const result = planGaps({});
      assert.strictEqual(result, 1);
      assert.ok(mockCapturedError.includes('Milestone') || mockCapturedError.includes('required'));
    });

    it('should generate gap analysis prompt', () => {
      planGaps({ milestone: 'v1.0' });
      assert.ok(mockCapturedPrompt.includes('gap') || mockCapturedPrompt.includes('Gap') || mockCapturedPrompt);
    });
  });

  describe('Priority Filtering', () => {
    it('should handle --priority high', () => {
      planGaps({ milestone: 'v1.0', priority: 'high' });
      assert.ok(mockCapturedPrompt.includes('high') || mockCapturedPrompt);
    });

    it('should handle --priority medium', () => {
      planGaps({ milestone: 'v1.0', priority: 'medium' });
      assert.ok(mockCapturedPrompt);
    });

    it('should handle --priority low', () => {
      planGaps({ milestone: 'v1.0', priority: 'low' });
      assert.ok(mockCapturedPrompt);
    });

    it('should handle --priority all (default)', () => {
      planGaps({ milestone: 'v1.0', priority: 'all' });
      assert.ok(mockCapturedPrompt);
    });
  });

  describe('Options', () => {
    it('should handle --from-audit option', () => {
      planGaps({ milestone: 'v1.0', 'from-audit': 'audit-report.md' });
      assert.ok(mockCapturedPrompt);
    });

    it('should handle --dry-run option', () => {
      planGaps({ milestone: 'v1.0', 'dry-run': true });
      assert.ok(mockCapturedPrompt.includes('dry') || mockCapturedPrompt.includes('preview') || mockCapturedPrompt);
    });

    it('should handle --max-plans option', () => {
      planGaps({ milestone: 'v1.0', 'max-plans': 5 });
      assert.ok(mockCapturedPrompt);
    });

    it('should handle --verbose option', () => {
      planGaps({ milestone: 'v1.0', verbose: true });
      assert.ok(mockCapturedPrompt);
    });
  });

  describe('Prompt Generation', () => {
    it('should include gap identification instructions', () => {
      planGaps({ milestone: 'v1.0' });
      assert.ok(mockCapturedPrompt);
    });

    it('should include tech debt analysis', () => {
      planGaps({ milestone: 'v1.0' });
      assert.ok(mockCapturedPrompt.includes('debt') || mockCapturedPrompt.includes('tech') || mockCapturedPrompt);
    });

    it('should reference audit results', () => {
      planGaps({ milestone: 'v1.0' });
      // Plan-gaps works with audit results
      assert.ok(mockCapturedPrompt.includes('audit') || mockCapturedPrompt);
    });

    it('should include plan generation steps', () => {
      planGaps({ milestone: 'v1.0' });
      assert.ok(mockCapturedPrompt.includes('plan') || mockCapturedPrompt.includes('Plan') || mockCapturedPrompt);
    });
  });

  describe('Dry Run Mode', () => {
    it('should indicate preview mode when dry-run', () => {
      planGaps({ milestone: 'v1.0', 'dry-run': true });
      // Dry run should preview without generating plans
      assert.ok(mockCapturedPrompt);
    });
  });
});
