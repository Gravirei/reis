const assert = require('assert');

// Capture console output
let consoleOutput = [];
const originalLog = console.log;

describe('Help Command', () => {
  before(() => {
    console.log = (...args) => {
      consoleOutput.push(args.join(' '));
    };
  });

  after(() => {
    console.log = originalLog;
  });

  beforeEach(() => {
    consoleOutput = [];
  });

  const help = require('../../lib/commands/help');

  describe('Output', () => {
    it('should display REIS banner', () => {
      help({});
      const output = consoleOutput.join('\n');
      assert.ok(output.includes('REIS') || output.includes('reis'));
    });

    it('should display command categories', () => {
      help({});
      const output = consoleOutput.join('\n');
      assert.ok(output.includes('Project') || output.includes('project'));
    });

    it('should display core commands', () => {
      help({});
      const output = consoleOutput.join('\n');
      assert.ok(output.includes('new') || output.includes('map'));
    });

    it('should display cycle command', () => {
      help({});
      const output = consoleOutput.join('\n');
      assert.ok(output.includes('cycle'));
    });

    it('should display quick & milestone commands (v2.7)', () => {
      help({});
      const output = consoleOutput.join('\n');
      assert.ok(output.includes('quick') || output.includes('audit'));
    });

    it('should return 0 on success', () => {
      const result = help({});
      assert.strictEqual(result, 0);
    });
  });
});
