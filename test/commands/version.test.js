const assert = require('assert');

// Capture console output
let consoleOutput = [];
const originalLog = console.log;

describe('Version Command', () => {
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

  const version = require('../../lib/commands/version');

  describe('Output', () => {
    it('should display version number', () => {
      version({});
      const output = consoleOutput.join('\n');
      // Version format should be X.Y.Z
      assert.ok(/\d+\.\d+\.\d+/.test(output));
    });

    it('should display REIS name', () => {
      version({});
      const output = consoleOutput.join('\n');
      assert.ok(output.includes('REIS') || output.includes('reis'));
    });

    it('should return 0 on success', () => {
      const result = version({});
      assert.strictEqual(result, 0);
    });
  });
});
