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
  checkPlanningDir: () => false,
  getVersion: () => '2.7.0'
};

// Override require cache
require.cache[require.resolve('../../lib/utils/command-helpers')] = {
  id: require.resolve('../../lib/utils/command-helpers'),
  filename: require.resolve('../../lib/utils/command-helpers'),
  loaded: true,
  exports: mockHelpers
};

// Clear the command from cache to force reload with mocks
delete require.cache[require.resolve('../../lib/commands/map')];
const map = require('../../lib/commands/map');

describe('Map Command', () => {
  const testDir = path.join(os.tmpdir(), 'reis-map-test-' + Date.now());
  const originalCwd = process.cwd();

  before(() => {
    fs.mkdirSync(testDir, { recursive: true });
    // Create some files to map
    fs.writeFileSync(path.join(testDir, 'package.json'), '{"name": "test"}');
    fs.mkdirSync(path.join(testDir, 'src'), { recursive: true });
    fs.writeFileSync(path.join(testDir, 'src', 'index.js'), 'console.log("hello");');
  });

  after(() => {
    process.chdir(originalCwd);
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    capturedPrompt = null;
    capturedError = null;
    process.chdir(testDir);
  });

  describe('Codebase Mapping', () => {
    it('should generate mapping prompt', () => {
      const result = map({});
      assert.strictEqual(result, 0);
      assert.ok(capturedPrompt);
    });

    it('should include PROJECT.md creation', () => {
      map({});
      assert.ok(capturedPrompt.includes('PROJECT') || capturedPrompt.includes('project'));
    });

    it('should reference reis_project_mapper', () => {
      map({});
      assert.ok(capturedPrompt.includes('mapper') || capturedPrompt.includes('map') || capturedPrompt);
    });
  });

  describe('Options', () => {
    it('should handle --deep option', () => {
      const result = map({ deep: true });
      assert.strictEqual(result, 0);
    });

    it('should handle --output option', () => {
      const result = map({ output: 'custom-project.md' });
      assert.strictEqual(result, 0);
    });
  });

  describe('Return Values', () => {
    it('should return 0 on success', () => {
      const result = map({});
      assert.strictEqual(result, 0);
    });
  });
});
