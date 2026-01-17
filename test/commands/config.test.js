/**
 * Tests for config command
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const config = require('../../lib/commands/config');

describe('Config Command', () => {
  let testDir;
  let originalCwd;
  let originalConsoleLog;
  let originalConsoleError;
  let consoleOutput;
  let consoleErrors;

  beforeEach(() => {
    // Create temp test directory
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reis-config-test-'));
    originalCwd = process.cwd();
    process.chdir(testDir);

    // Capture console output
    consoleOutput = [];
    consoleErrors = [];
    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    console.log = (...args) => consoleOutput.push(args.join(' '));
    console.error = (...args) => consoleErrors.push(args.join(' '));
  });

  afterEach(() => {
    // Restore console
    console.log = originalConsoleLog;
    console.error = originalConsoleError;

    // Restore cwd
    process.chdir(originalCwd);

    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('show subcommand', () => {
    it('should show default config when no config file exists', async () => {
      await config({ subcommand: 'show' });

      const output = consoleOutput.join('\n');
      assert(output.includes('REIS Configuration'), 'Should show config title');
      assert(output.includes('Waves:'), 'Should show waves section');
      assert(output.includes('Default size: medium'), 'Should show default wave size');
      assert(output.includes('Git:'), 'Should show git section');
      assert(output.includes('using defaults'), 'Should indicate using defaults');
    });

    it('should show custom config when config file exists', async () => {
      // Create custom config
      const configPath = path.join(testDir, 'reis.config.js');
      fs.writeFileSync(configPath, `
        module.exports = {
          waves: { defaultSize: 'large' },
          git: { autoCommit: false }
        };
      `);

      await config({ subcommand: 'show' });

      const output = consoleOutput.join('\n');
      assert(output.includes('Default size: large'), 'Should show custom wave size');
      assert(output.includes('from reis.config.js'), 'Should indicate source is config file');
    });

    it('should output JSON when --json flag is used', async () => {
      await config({ subcommand: 'show', json: true });

      const output = consoleOutput.join('\n');
      const parsed = JSON.parse(output);
      assert(parsed.config, 'Should have config object');
      assert(parsed.source, 'Should have source field');
      assert.strictEqual(parsed.config.waves.defaultSize, 'medium');
    });

    it('should handle config with partial overrides', async () => {
      // Create partial config
      const configPath = path.join(testDir, 'reis.config.js');
      fs.writeFileSync(configPath, `
        module.exports = {
          output: { verbose: true }
        };
      `);

      await config({ subcommand: 'show' });

      const output = consoleOutput.join('\n');
      // Should show merged config (custom + defaults)
      assert(output.includes('Verbose: yes'), 'Should show custom verbose setting');
      assert(output.includes('Show progress: yes'), 'Should show default progress setting');
    });
  });

  describe('init subcommand', () => {
    it('should create config file in current directory', async () => {
      await config({ subcommand: 'init' });

      const configPath = path.join(testDir, 'reis.config.js');
      assert(fs.existsSync(configPath), 'Config file should be created');

      // Verify content is valid JavaScript
      const content = fs.readFileSync(configPath, 'utf8');
      assert(content.includes('module.exports'), 'Should be a valid module');
      assert(content.includes('waves:'), 'Should include waves section');
      assert(content.includes('git:'), 'Should include git section');
    });

    it('should fail if config file already exists without --force', async () => {
      // Create existing config
      const configPath = path.join(testDir, 'reis.config.js');
      fs.writeFileSync(configPath, 'module.exports = {};');

      // Mock process.exit
      let exitCode = null;
      const originalExit = process.exit;
      process.exit = (code) => { exitCode = code; throw new Error('EXIT'); };

      try {
        await config({ subcommand: 'init' });
      } catch (e) {
        // Expected to throw
      }

      process.exit = originalExit;

      assert.strictEqual(exitCode, 1, 'Should exit with code 1');
      const errors = consoleErrors.join('\n');
      assert(errors.includes('already exists'), 'Should show error about existing file');
    });

    it('should overwrite config file with --force flag', async () => {
      // Create existing config
      const configPath = path.join(testDir, 'reis.config.js');
      fs.writeFileSync(configPath, '// OLD CONFIG');

      await config({ subcommand: 'init', force: true });

      const content = fs.readFileSync(configPath, 'utf8');
      assert(!content.includes('OLD CONFIG'), 'Should overwrite old config');
      assert(content.includes('module.exports'), 'Should have new config');
    });

    it('should create well-commented config file', async () => {
      await config({ subcommand: 'init' });

      const configPath = path.join(testDir, 'reis.config.js');
      const content = fs.readFileSync(configPath, 'utf8');

      // Check for comments
      assert(content.includes('/**'), 'Should have JSDoc comments');
      assert(content.includes('Wave execution settings'), 'Should document waves');
      assert(content.includes('Git integration'), 'Should document git');
    });

    it('should show next steps after creating config', async () => {
      await config({ subcommand: 'init' });

      const output = consoleOutput.join('\n');
      assert(output.includes('Next steps'), 'Should show next steps');
      assert(output.includes('reis config validate'), 'Should mention validate command');
      assert(output.includes('reis config show'), 'Should mention show command');
    });
  });

  describe('validate subcommand', () => {
    it('should validate default config when no file exists', async () => {
      await config({ subcommand: 'validate' });

      const output = consoleOutput.join('\n');
      assert(output.includes('✓'), 'Should show success indicator');
      assert(output.includes('valid'), 'Should say config is valid');
    });

    it('should validate correct custom config', async () => {
      // Create valid config
      const configPath = path.join(testDir, 'reis.config.js');
      fs.writeFileSync(configPath, `
        module.exports = {
          waves: {
            defaultSize: 'large',
            autoCheckpoint: true
          },
          git: {
            autoCommit: false
          }
        };
      `);

      await config({ subcommand: 'validate' });

      const output = consoleOutput.join('\n');
      assert(output.includes('✓'), 'Should show success indicator');
      assert(output.includes('valid'), 'Should say config is valid');
    });

    it('should detect invalid wave size', async () => {
      // Create invalid config
      const configPath = path.join(testDir, 'reis.config.js');
      fs.writeFileSync(configPath, `
        module.exports = {
          waves: { defaultSize: 'xlarge' }
        };
      `);

      // Mock process.exit
      let exitCode = null;
      const originalExit = process.exit;
      process.exit = (code) => { exitCode = code; throw new Error('EXIT'); };

      try {
        await config({ subcommand: 'validate' });
      } catch (e) {
        // Expected to throw
      }

      process.exit = originalExit;

      assert.strictEqual(exitCode, 1, 'Should exit with code 1');
      const errors = consoleErrors.join('\n');
      assert(errors.includes('error'), 'Should show error');
      assert(errors.includes('xlarge'), 'Should mention invalid value');
    });

    it('should detect invalid git.autoCommit type', async () => {
      // Create invalid config
      const configPath = path.join(testDir, 'reis.config.js');
      fs.writeFileSync(configPath, `
        module.exports = {
          git: { autoCommit: 'yes' }
        };
      `);

      // Mock process.exit
      let exitCode = null;
      const originalExit = process.exit;
      process.exit = (code) => { exitCode = code; throw new Error('EXIT'); };

      try {
        await config({ subcommand: 'validate' });
      } catch (e) {
        // Expected to throw
      }

      process.exit = originalExit;

      assert.strictEqual(exitCode, 1, 'Should exit with code 1');
      const errors = consoleErrors.join('\n');
      assert(errors.includes('boolean'), 'Should mention boolean type');
    });

    it('should detect syntax errors in config file', async () => {
      // Create config with syntax error
      const configPath = path.join(testDir, 'reis.config.js');
      fs.writeFileSync(configPath, `
        module.exports = {
          waves: { defaultSize: 'medium'
          // Missing closing brace
      `);

      // Mock process.exit
      let exitCode = null;
      const originalExit = process.exit;
      process.exit = (code) => { exitCode = code; throw new Error('EXIT'); };

      try {
        await config({ subcommand: 'validate' });
      } catch (e) {
        // Expected to throw
      }

      process.exit = originalExit;

      assert.strictEqual(exitCode, 1, 'Should exit with code 1');
      const errors = consoleErrors.join('\n');
      assert(errors.includes('syntax errors'), 'Should mention syntax errors');
    });

    it('should detect invalid LLM provider', async () => {
      // Create invalid config
      const configPath = path.join(testDir, 'reis.config.js');
      fs.writeFileSync(configPath, `
        module.exports = {
          llm: { provider: 'invalid-provider' }
        };
      `);

      // Mock process.exit
      let exitCode = null;
      const originalExit = process.exit;
      process.exit = (code) => { exitCode = code; throw new Error('EXIT'); };

      try {
        await config({ subcommand: 'validate' });
      } catch (e) {
        // Expected to throw
      }

      process.exit = originalExit;

      assert.strictEqual(exitCode, 1, 'Should exit with code 1');
      const errors = consoleErrors.join('\n');
      assert(errors.includes('provider'), 'Should mention provider');
    });

    it('should show multiple validation errors', async () => {
      // Create config with multiple errors
      const configPath = path.join(testDir, 'reis.config.js');
      fs.writeFileSync(configPath, `
        module.exports = {
          waves: { defaultSize: 'xlarge' },
          git: { autoCommit: 'yes' },
          state: { maxCheckpoints: -5 }
        };
      `);

      // Mock process.exit
      let exitCode = null;
      const originalExit = process.exit;
      process.exit = (code) => { exitCode = code; throw new Error('EXIT'); };

      try {
        await config({ subcommand: 'validate' });
      } catch (e) {
        // Expected to throw
      }

      process.exit = originalExit;

      const errors = consoleErrors.join('\n');
      // Should show multiple errors
      assert(errors.includes('xlarge') || errors.includes('defaultSize'), 'Should show wave size error');
      assert(errors.includes('boolean'), 'Should show boolean error');
    });
  });

  describe('docs subcommand', () => {
    it('should display documentation', async () => {
      await config({ subcommand: 'docs' });

      const output = consoleOutput.join('\n');
      assert(output.includes('Configuration'), 'Should show documentation title');
      assert(output.includes('Waves'), 'Should document waves');
      assert(output.includes('Git'), 'Should document git');
      assert(output.includes('Examples') || output.includes('examples'), 'Should show examples');
    });

    it('should show all config sections', async () => {
      await config({ subcommand: 'docs' });

      const output = consoleOutput.join('\n');
      assert(output.includes('Waves'), 'Should document waves');
      assert(output.includes('Git'), 'Should document git');
      assert(output.includes('State'), 'Should document state');
      assert(output.includes('LLM'), 'Should document LLM');
      assert(output.includes('Planning'), 'Should document planning');
      assert(output.includes('Output'), 'Should document output');
    });
  });

  describe('edge cases', () => {
    it('should handle unknown subcommand', async () => {
      // Mock process.exit
      let exitCode = null;
      const originalExit = process.exit;
      process.exit = (code) => { exitCode = code; throw new Error('EXIT'); };

      try {
        await config({ subcommand: 'unknown' });
      } catch (e) {
        // Expected to throw
      }

      process.exit = originalExit;

      assert.strictEqual(exitCode, 1, 'Should exit with code 1');
      const errors = consoleErrors.join('\n');
      assert(errors.includes('Unknown subcommand'), 'Should show error about unknown subcommand');
    });

    it('should default to show when no subcommand provided', async () => {
      await config({});

      const output = consoleOutput.join('\n');
      assert(output.includes('REIS Configuration'), 'Should show config');
    });

    it('should use custom path when --path is provided', async () => {
      // Create config in custom location
      const customDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reis-custom-'));
      const customPath = path.join(customDir, 'custom.config.js');
      fs.writeFileSync(customPath, `
        module.exports = {
          waves: { defaultSize: 'large' }
        };
      `);

      await config({ subcommand: 'show', path: customPath });

      const output = consoleOutput.join('\n');
      assert(output.includes('large'), 'Should load from custom path');

      // Cleanup
      fs.rmSync(customDir, { recursive: true, force: true });
    });
  });

  describe('integration with config utility', () => {
    it('should use loadConfig from config utility', async () => {
      // Create config
      const configPath = path.join(testDir, 'reis.config.js');
      fs.writeFileSync(configPath, `
        module.exports = {
          waves: { defaultSize: 'small' }
        };
      `);

      await config({ subcommand: 'show' });

      const output = consoleOutput.join('\n');
      // Should show merged config (utility's job)
      assert(output.includes('small'), 'Should use loadConfig to merge config');
      assert(output.includes('30 min'), 'Should still have default size definitions');
    });

    it('should use validateConfig from config utility', async () => {
      // Create invalid config
      const configPath = path.join(testDir, 'reis.config.js');
      fs.writeFileSync(configPath, `
        module.exports = {
          waves: {
            sizes: {
              small: { maxTasks: -1 }
            }
          }
        };
      `);

      // Mock process.exit
      let exitCode = null;
      const originalExit = process.exit;
      process.exit = (code) => { exitCode = code; throw new Error('EXIT'); };

      try {
        await config({ subcommand: 'validate' });
      } catch (e) {
        // Expected to throw
      }

      process.exit = originalExit;

      assert.strictEqual(exitCode, 1, 'Should detect validation errors from utility');
    });
  });
});
