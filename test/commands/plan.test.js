const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Mock the command-helpers module (keep validatePhaseNumber from actual module)
let mockPlanningDir = true;
let mockCapturedPrompt = null;
let mockCapturedError = null;

jest.mock('../../lib/utils/command-helpers', () => {
  const originalHelpers = jest.requireActual('../../lib/utils/command-helpers');
  return {
    ...originalHelpers,
    showPrompt: (prompt) => { mockCapturedPrompt = prompt; },
    showError: (msg) => { mockCapturedError = msg; },
    showSuccess: (msg) => {},
    showWarning: (msg) => {},
    showInfo: (msg) => {},
    checkPlanningDir: () => mockPlanningDir,
    getVersion: () => '2.7.0'
  };
});

// Mock kanban renderer to avoid board rendering during tests
jest.mock('../../lib/utils/kanban-renderer', () => ({
  showKanbanBoard: () => {},
  renderKanban: () => {}
}));

// bin/reis.ts registers `.command('plan [phase]')` and calls
// `planCmd({ phase }, { noKanban })`, so the command reads args.phase.
// Validation errors call process.exit(1), which jest.setup.js intercepts
// by throwing Error('process.exit(1)').
const plan = require('../../lib/commands/plan');

describe('Plan Command', () => {
  const testDir = path.join(os.tmpdir(), 'reis-plan-test-' + Date.now());
  const planningDir = path.join(testDir, '.planning');
  const originalCwd = process.cwd();

  beforeAll(() => {
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

  afterAll(() => {
    process.chdir(originalCwd);
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    mockPlanningDir = true;
    mockCapturedPrompt = null;
    mockCapturedError = null;
    process.chdir(testDir);
  });

  describe('Validation', () => {
    it('should exit(1) when not a REIS project', () => {
      mockPlanningDir = false;
      assert.throws(() => plan({ phase: '1' }), /process\.exit\(1\)/);
      assert.ok(mockCapturedError && mockCapturedError.includes('Not a REIS project'));
    });

    it('should exit(1) when phase is missing', () => {
      assert.throws(() => plan({}), /process\.exit\(1\)/);
      assert.ok(mockCapturedError && mockCapturedError.includes('Phase number is required'));
    });

    it('should exit(1) when phase is not a number', () => {
      assert.throws(() => plan({ phase: 'abc' }), /process\.exit\(1\)/);
    });

    it('should exit(1) when phase is less than 1', () => {
      assert.throws(() => plan({ phase: '0' }), /process\.exit\(1\)/);
    });
  });

  describe('Phase Planning', () => {
    it('should accept phase number from --phase argument', () => {
      const result = plan({ phase: '1' });
      assert.strictEqual(result, 0);
      assert.ok(mockCapturedPrompt);
    });

    it('should include the validated phase in the generated prompt', () => {
      const result = plan({ phase: '2' });
      assert.strictEqual(result, 0);
      assert.ok(mockCapturedPrompt.includes('phase 2'));
    });

    it('should generate planning prompt referencing reis_planner', () => {
      plan({ phase: '1' });
      assert.ok(mockCapturedPrompt.includes('reis_planner'));
    });

    it('should point plans at .planning/phases/<phase>-<name>/', () => {
      plan({ phase: '1' });
      assert.ok(mockCapturedPrompt.includes('.planning/phases/1-'));
    });

    it('should mention decision trees in the prompt', () => {
      plan({ phase: '1' });
      assert.ok(mockCapturedPrompt.includes('decision trees'));
    });
  });

  describe('Options', () => {
    it('should handle --verbose option gracefully (ignored by implementation)', () => {
      const result = plan({ phase: '1' }, { verbose: true });
      assert.strictEqual(result, 0);
    });

    it('should handle --noKanban option without errors', () => {
      const result = plan({ phase: '1' }, { noKanban: true });
      assert.strictEqual(result, 0);
    });
  });

  describe('Return Values', () => {
    it('should return 0 on success', () => {
      const result = plan({ phase: '1' });
      assert.strictEqual(result, 0);
    });

    it('should never return normally when validation fails (exits via process.exit)', () => {
      mockPlanningDir = false;
      assert.throws(() => plan({ phase: '1' }), /process\.exit\(1\)/);
    });
  });
});
