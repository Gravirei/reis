const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Mock the command-helpers module
let mockPlanningDir = true;
let capturedError = null;

const mockHelpers = {
  showPrompt: (prompt) => {},
  showError: (msg) => { capturedError = msg; },
  showSuccess: (msg) => {},
  showWarning: (msg) => {},
  showInfo: (msg) => {},
  checkPlanningDir: () => mockPlanningDir,
  getVersion: () => '2.7.0'
};

// Mock kanban renderer
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

const progress = require('../../lib/commands/progress');

describe('Progress Command', () => {
  const testDir = path.join(os.tmpdir(), 'reis-progress-test-' + Date.now());
  const planningDir = path.join(testDir, '.planning');
  const originalCwd = process.cwd();

  before(() => {
    fs.mkdirSync(planningDir, { recursive: true });
    // Create mock STATE.md
    fs.writeFileSync(path.join(planningDir, 'STATE.md'), `# Project State

## Current Phase
Phase 2

## Progress
- Phase 1: ✅ Complete
- Phase 2: ⏳ In Progress (60%)
- Phase 3: ⏳ Not Started

## Last Updated
2026-01-26
`);
    // Create mock ROADMAP.md
    fs.writeFileSync(path.join(planningDir, 'ROADMAP.md'), `# Roadmap

## Phase 1: Setup
**Status**: Complete

## Phase 2: Core
**Status**: In Progress

## Phase 3: Testing
**Status**: Not Started
`);
  });

  after(() => {
    process.chdir(originalCwd);
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    mockPlanningDir = true;
    capturedError = null;
    process.chdir(testDir);
  });

  describe('Validation', () => {
    it('should return error when not a REIS project', () => {
      mockPlanningDir = false;
      const result = progress({});
      assert.strictEqual(result, 1);
      assert.ok(capturedError && capturedError.includes('Not a REIS project'));
    });
  });

  describe('Progress Display', () => {
    it('should return 0 on success', () => {
      const result = progress({});
      assert.strictEqual(result, 0);
    });

    it('should handle --verbose option', () => {
      const result = progress({ verbose: true });
      assert.strictEqual(result, 0);
    });

    it('should handle --json option', () => {
      const result = progress({ json: true });
      assert.strictEqual(result, 0);
    });
  });

  describe('Return Values', () => {
    it('should return 0 on success', () => {
      const result = progress({});
      assert.strictEqual(result, 0);
    });

    it('should return 1 when not a REIS project', () => {
      mockPlanningDir = false;
      const result = progress({});
      assert.strictEqual(result, 1);
    });
  });
});
