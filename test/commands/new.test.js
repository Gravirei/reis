const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Mock the command-helpers module
let mockCapturedPrompt = null;
let mockCapturedError = null;

jest.mock('../../lib/utils/command-helpers', () => ({
  showPrompt: (prompt) => { mockCapturedPrompt = prompt; },
  showError: (msg) => { mockCapturedError = msg; },
  showSuccess: (msg) => {},
  showWarning: (msg) => {},
  showInfo: (msg) => {},
  checkPlanningDir: () => false, // For 'new' command, planning dir shouldn't exist
  getVersion: () => '2.7.0'
}));

// bin/reis.ts registers `.command('new [idea]')` and calls `newCmd({ idea })`,
// so the command reads args.idea only.
const newCommand = require('../../lib/commands/new');

describe('New Command', () => {
  const testDir = path.join(os.tmpdir(), 'reis-new-test-' + Date.now());
  const originalCwd = process.cwd();

  beforeAll(() => {
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterAll(() => {
    process.chdir(originalCwd);
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    mockCapturedPrompt = null;
    mockCapturedError = null;
    process.chdir(testDir);
    // Clean up any .planning directory
    const planningDir = path.join(testDir, '.planning');
    if (fs.existsSync(planningDir)) {
      fs.rmSync(planningDir, { recursive: true, force: true });
    }
  });

  describe('Validation', () => {
    it('should succeed without an idea and prompt to ask for one', () => {
      const result = newCommand({ _: [] });
      assert.strictEqual(result, 0);
      assert.ok(mockCapturedPrompt && mockCapturedPrompt.includes('Ask me about the project idea'));
    });

    it('should accept project idea from --idea (positional [idea] argument)', () => {
      const result = newCommand({ _: [], idea: 'my-project' });
      assert.strictEqual(result, 0);
      assert.ok(mockCapturedPrompt && mockCapturedPrompt.includes('my-project'));
    });

    it('should ignore positional _ array entries (not part of the contract)', () => {
      const result = newCommand({ _: ['my-project'] });
      assert.strictEqual(result, 0);
      // No idea property means generic prompt, even though _[0] is set
      assert.ok(mockCapturedPrompt && !mockCapturedPrompt.includes('my-project'));
    });
  });

  describe('Project Initialization', () => {
    it('should generate a prompt (actual creation is done by AI)', () => {
      newCommand({ idea: 'test-project' });
      assert.ok(mockCapturedPrompt);
    });

    it('should generate project setup prompt mentioning the idea', () => {
      newCommand({ idea: 'my-app' });
      assert.ok(
        mockCapturedPrompt.includes('my-app') &&
        (mockCapturedPrompt.includes('PROJECT.md') || mockCapturedPrompt.includes('.planning'))
      );
    });

    it('should include ROADMAP in setup', () => {
      newCommand({ idea: 'my-app' });
      assert.ok(mockCapturedPrompt.includes('ROADMAP.md'));
    });

    it('should use the generic prompt when no idea is given', () => {
      newCommand({});
      assert.ok(mockCapturedPrompt && !mockCapturedPrompt.includes('for:'));
      assert.ok(mockCapturedPrompt.includes('PROJECT.md'));
    });
  });

  describe('Options', () => {
    it('should handle --description option gracefully (ignored by implementation)', () => {
      const result = newCommand({ idea: 'my-app', description: 'A test application' });
      assert.strictEqual(result, 0);
      assert.ok(mockCapturedPrompt && mockCapturedPrompt.includes('my-app'));
    });

    it('should handle --template option gracefully (ignored by implementation)', () => {
      const result = newCommand({ idea: 'my-app', template: 'react' });
      assert.strictEqual(result, 0);
    });
  });

  describe('Return Values', () => {
    it('should return 0 on success with an idea', () => {
      const result = newCommand({ idea: 'success-project' });
      assert.strictEqual(result, 0);
    });

    it('should return 0 even without an idea (no error path exists)', () => {
      const result = newCommand({});
      assert.strictEqual(result, 0);
      assert.ok(!mockCapturedError);
    });
  });
});
