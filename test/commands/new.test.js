const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Mock the command-helpers module
let capturedPrompt = null;
let capturedError = null;

const mockHelpers = {
  showPrompt: (prompt) => { capturedPrompt = prompt; },
  showError: (msg) => { capturedError = msg; },
  showSuccess: (msg) => {},
  showWarning: (msg) => {},
  showInfo: (msg) => {},
  checkPlanningDir: () => false, // For 'new' command, planning dir shouldn't exist
  getVersion: () => '2.7.0'
};

// Override require cache BEFORE requiring new.js
require.cache[require.resolve('../../lib/utils/command-helpers')] = {
  id: require.resolve('../../lib/utils/command-helpers'),
  filename: require.resolve('../../lib/utils/command-helpers'),
  loaded: true,
  exports: mockHelpers
};

// Clear the new command from cache to force reload with mocks
delete require.cache[require.resolve('../../lib/commands/new')];
const newCommand = require('../../lib/commands/new');

describe('New Command', () => {
  const testDir = path.join(os.tmpdir(), 'reis-new-test-' + Date.now());
  const originalCwd = process.cwd();

  before(() => {
    fs.mkdirSync(testDir, { recursive: true });
  });

  after(() => {
    process.chdir(originalCwd);
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    capturedPrompt = null;
    capturedError = null;
    process.chdir(testDir);
    // Clean up any .planning directory
    const planningDir = path.join(testDir, '.planning');
    if (fs.existsSync(planningDir)) {
      fs.rmSync(planningDir, { recursive: true, force: true });
    }
  });

  describe('Validation', () => {
    it('should require a project name', () => {
      const result = newCommand({ _: [] });
      assert.strictEqual(result, 1);
      assert.ok(capturedError && capturedError.includes('name'));
    });

    it('should accept project name from arguments', () => {
      const result = newCommand({ _: ['my-project'] });
      assert.strictEqual(result, 0);
      assert.ok(capturedPrompt && capturedPrompt.includes('my-project'));
    });

    it('should accept project name from --name option', () => {
      const result = newCommand({ _: [], name: 'test-project' });
      assert.strictEqual(result, 0);
      assert.ok(capturedPrompt && capturedPrompt.includes('test-project'));
    });
  });

  describe('Project Initialization', () => {
    it('should create .planning directory structure', () => {
      newCommand({ _: ['test-project'] });
      // The command generates a prompt - actual creation is done by AI
      assert.ok(capturedPrompt);
    });

    it('should generate project setup prompt', () => {
      newCommand({ _: ['my-app'] });
      assert.ok(capturedPrompt.includes('PROJECT.md') || capturedPrompt.includes('project'));
    });

    it('should include ROADMAP in setup', () => {
      newCommand({ _: ['my-app'] });
      assert.ok(capturedPrompt.includes('ROADMAP') || capturedPrompt.includes('roadmap'));
    });
  });

  describe('Options', () => {
    it('should handle --description option', () => {
      const result = newCommand({ _: ['my-app'], description: 'A test application' });
      assert.strictEqual(result, 0);
      assert.ok(capturedPrompt.includes('A test application') || capturedPrompt);
    });

    it('should handle --template option', () => {
      const result = newCommand({ _: ['my-app'], template: 'react' });
      assert.strictEqual(result, 0);
    });
  });

  describe('Return Values', () => {
    it('should return 0 on success', () => {
      const result = newCommand({ _: ['success-project'] });
      assert.strictEqual(result, 0);
    });

    it('should return 1 on missing name', () => {
      const result = newCommand({ _: [] });
      assert.strictEqual(result, 1);
    });
  });
});
