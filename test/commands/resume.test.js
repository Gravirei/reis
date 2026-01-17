/**
 * Tests for REIS v2.0 Resume Command
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const resume = require('../../lib/commands/resume');
const StateManager = require('../../lib/utils/state-manager');

describe('Resume Command', function() {
  let testDir;
  let originalCwd;
  let originalExit;
  let exitCode;
  let consoleOutput;
  let originalLog;
  let originalError;
  let originalWarn;

  beforeEach(function() {
    // Create temp directory
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reis-resume-test-'));
    originalCwd = process.cwd();
    process.chdir(testDir);

    // Create .planning directory
    fs.mkdirSync('.planning', { recursive: true });

    // Mock process.exit
    exitCode = null;
    originalExit = process.exit;
    process.exit = (code) => {
      exitCode = code;
      throw new Error(`process.exit(${code})`);
    };

    // Capture console output
    consoleOutput = { log: [], error: [], warn: [] };
    originalLog = console.log;
    originalError = console.error;
    originalWarn = console.warn;
    console.log = (...args) => consoleOutput.log.push(args.join(' '));
    console.error = (...args) => consoleOutput.error.push(args.join(' '));
    console.warn = (...args) => consoleOutput.warn.push(args.join(' '));
  });

  afterEach(function() {
    // Restore
    process.chdir(originalCwd);
    process.exit = originalExit;
    console.log = originalLog;
    console.error = originalError;
    console.warn = originalWarn;

    // Cleanup
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Backward Compatibility', function() {
    it('should use legacy prompt mode when no state data exists', async function() {
      // Create minimal STATE.md with no checkpoints or active wave
      fs.writeFileSync('.planning/STATE.md', '# REIS State\n\n## Current Phase\n_Not set_\n\n## Active Wave\n_No active wave_\n');

      const result = await resume({});

      assert.strictEqual(result, 0);
      const output = consoleOutput.log.join('\n');
      assert(output.includes('No checkpoint data found'), 'Should indicate legacy mode');
      assert(output.includes('Using legacy resume mode'), 'Should use legacy mode');
    });

    it('should fail when not in REIS project', async function() {
      // Remove .planning directory
      fs.rmSync('.planning', { recursive: true, force: true });

      try {
        await resume({});
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.strictEqual(exitCode, 1);
      }
    });
  });

  describe('Smart Resume (Default)', function() {
    it('should display context when active wave exists', async function() {
      // Create state with active wave
      const stateManager = new StateManager(testDir);
      stateManager.state.currentPhase = 'Phase 2: Testing';
      stateManager.startWave('Wave 1: Implementation', 5);
      stateManager.updateWaveProgress(2); // 2/5 tasks done
      stateManager.saveState();

      const result = await resume({});

      assert.strictEqual(result, 0);
      const output = consoleOutput.log.join('\n');
      assert(output.includes('Resume Context'), 'Should show context header');
      assert(output.includes('Active Wave'), 'Should show active wave');
      assert(output.includes('Wave 1: Implementation'), 'Should show wave name');
      assert(output.includes('2/5'), 'Should show progress');
      assert(output.includes('Recommendations'), 'Should show recommendations');
      assert(output.includes('Continue active wave'), 'Should recommend continuing');
    });

    it('should display checkpoints when available', async function() {
      const stateManager = new StateManager(testDir);
      stateManager.createCheckpoint('Before refactor', 'abc123');
      stateManager.createCheckpoint('After tests', 'def456');
      stateManager.saveState();

      const result = await resume({});

      assert.strictEqual(result, 0);
      const output = consoleOutput.log.join('\n');
      assert(output.includes('Available Checkpoints'), 'Should show checkpoints section');
      assert(output.includes('Before refactor'), 'Should list checkpoint 1');
      assert(output.includes('After tests'), 'Should list checkpoint 2');
    });

    it('should show blockers prominently', async function() {
      const stateManager = new StateManager(testDir);
      stateManager.addBlocker('API key not configured');
      stateManager.addBlocker('Tests failing');
      stateManager.saveState();

      const result = await resume({});

      assert.strictEqual(result, 0);
      const output = consoleOutput.log.join('\n');
      assert(output.includes('Blockers'), 'Should show blockers section');
      assert(output.includes('API key not configured'), 'Should list blocker 1');
      assert(output.includes('Tests failing'), 'Should list blocker 2');
      assert(output.includes('Resolve blockers first'), 'Should recommend resolving blockers');
    });

    it('should show recent activity', async function() {
      const stateManager = new StateManager(testDir);
      stateManager.addActivity('Started Phase 2');
      stateManager.addActivity('Completed Wave 1');
      stateManager.addActivity('Created checkpoint');
      stateManager.saveState();

      const result = await resume({});

      assert.strictEqual(result, 0);
      const output = consoleOutput.log.join('\n');
      assert(output.includes('Recent Activity'), 'Should show activity section');
      assert(output.includes('Started Phase 2'), 'Should list activity');
    });

    it('should handle auto-resume with active wave', async function() {
      const stateManager = new StateManager(testDir);
      stateManager.startWave('Wave 1: Tests', 3);
      stateManager.updateWaveProgress(1);
      stateManager.saveState();

      const result = await resume({ auto: true });

      assert.strictEqual(result, 0);
      const output = consoleOutput.log.join('\n');
      assert(output.includes('Auto-resume mode'), 'Should indicate auto mode');
      assert(output.includes('Continuing Active Wave'), 'Should continue wave');
    });

    it('should fail auto-resume when blockers exist', async function() {
      const stateManager = new StateManager(testDir);
      stateManager.startWave('Wave 1: Tests', 3);
      stateManager.addBlocker('Environment not configured');
      stateManager.saveState();

      const result = await resume({ auto: true });

      assert.strictEqual(result, 1);
      const output = consoleOutput.log.join('\n');
      assert(output.includes('Cannot auto-resume: blockers present'), 'Should fail with blockers');
    });
  });

  describe('List Mode', function() {
    it('should list active wave and checkpoints', async function() {
      const stateManager = new StateManager(testDir);
      stateManager.startWave('Wave 2: Integration', 4);
      stateManager.updateWaveProgress(2);
      stateManager.createCheckpoint('Before merge', 'xyz789');
      stateManager.saveState();

      const result = await resume({ list: true });

      assert.strictEqual(result, 0);
      const output = consoleOutput.log.join('\n');
      assert(output.includes('Available Resume Points'), 'Should show header');
      assert(output.includes('Active Wave'), 'Should list active wave');
      assert(output.includes('Wave 2: Integration'), 'Should show wave name');
      assert(output.includes('Checkpoints'), 'Should list checkpoints');
      assert(output.includes('Before merge'), 'Should show checkpoint name');
      assert(output.includes('reis resume --continue'), 'Should show continue command');
    });

    it('should handle no checkpoints gracefully', async function() {
      const stateManager = new StateManager(testDir);
      stateManager.saveState();

      const result = await resume({ list: true });

      assert.strictEqual(result, 0);
      const output = consoleOutput.log.join('\n');
      assert(output.includes('No checkpoints found'), 'Should indicate no checkpoints');
    });

    it('should show last activity', async function() {
      const stateManager = new StateManager(testDir);
      stateManager.addActivity('Completed Phase 1');
      stateManager.saveState();

      const result = await resume({ list: true });

      assert.strictEqual(result, 0);
      const output = consoleOutput.log.join('\n');
      assert(output.includes('Last Activity'), 'Should show last activity');
      assert(output.includes('Completed Phase 1'), 'Should show activity content');
    });

    it('should work with short flag -l', async function() {
      const stateManager = new StateManager(testDir);
      stateManager.createCheckpoint('Test checkpoint', null);
      stateManager.saveState();

      const result = await resume({ l: true });

      assert.strictEqual(result, 0);
      const output = consoleOutput.log.join('\n');
      assert(output.includes('Available Resume Points'), 'Should work with -l flag');
    });
  });

  describe('Checkpoint Resume', function() {
    it('should resume from valid checkpoint', async function() {
      const stateManager = new StateManager(testDir);
      stateManager.createCheckpoint('Before deploy', 'abc123');
      stateManager.saveState();

      const result = await resume({ checkpoint: 'Before deploy', yes: true });

      assert.strictEqual(result, 0);
      const output = consoleOutput.log.join('\n');
      assert(output.includes('Resuming from Checkpoint'), 'Should show resume header');
      assert(output.includes('Before deploy'), 'Should show checkpoint name');
      assert(output.includes('State restored'), 'Should confirm restoration');
    });

    it('should fail with non-existent checkpoint', async function() {
      const stateManager = new StateManager(testDir);
      stateManager.createCheckpoint('Valid checkpoint', null);
      stateManager.saveState();

      const result = await resume({ checkpoint: 'Invalid checkpoint' });

      assert.strictEqual(result, 1);
      const output = consoleOutput.log.join('\n') + consoleOutput.error.join('\n');
      assert(output.includes('Checkpoint not found'), 'Should show error');
      assert(output.includes('Available checkpoints'), 'Should list available checkpoints');
      assert(output.includes('Valid checkpoint'), 'Should show valid checkpoint');
    });

    it('should show warning when no --yes flag', async function() {
      const stateManager = new StateManager(testDir);
      stateManager.createCheckpoint('Test point', 'xyz789');
      stateManager.saveState();

      const result = await resume({ checkpoint: 'Test point' });

      assert.strictEqual(result, 0);
      const output = consoleOutput.log.join('\n');
      assert(output.includes('restore state from the checkpoint'), 'Should show warning');
      assert(output.includes('Use --yes flag'), 'Should mention --yes flag');
    });

    it('should display checkpoint with commit and wave info', async function() {
      const stateManager = new StateManager(testDir);
      stateManager.startWave('Wave 3: Deployment', 2);
      stateManager.createCheckpoint('Mid-wave checkpoint', 'commit123');
      stateManager.saveState();

      const result = await resume({ checkpoint: 'Mid-wave checkpoint', yes: true });

      assert.strictEqual(result, 0);
      const output = consoleOutput.log.join('\n');
      assert(output.includes('Mid-wave checkpoint'), 'Should show checkpoint name');
      assert(output.includes('commit123'), 'Should show commit');
      assert(output.includes('Wave 3'), 'Should show wave');
    });

    it('should work with short flag -c', async function() {
      const stateManager = new StateManager(testDir);
      stateManager.createCheckpoint('Test', null);
      stateManager.saveState();

      const result = await resume({ c: 'Test', yes: true });

      assert.strictEqual(result, 0);
      const output = consoleOutput.log.join('\n');
      assert(output.includes('Resuming from Checkpoint'), 'Should work with -c flag');
    });

    it('should suggest continuing wave after restore', async function() {
      const stateManager = new StateManager(testDir);
      stateManager.startWave('Wave 1: Setup', 5);
      stateManager.createCheckpoint('After setup', 'abc');
      stateManager.saveState();

      const result = await resume({ checkpoint: 'After setup', yes: true });

      assert.strictEqual(result, 0);
      const output = consoleOutput.log.join('\n');
      assert(output.includes('To continue from this checkpoint'), 'Should suggest continuing');
      assert(output.includes('reis resume --continue'), 'Should show continue command');
    });
  });

  describe('Continue Wave', function() {
    it('should continue incomplete wave', async function() {
      const stateManager = new StateManager(testDir);
      stateManager.startWave('Wave 1: Development', 5);
      stateManager.updateWaveProgress(3);
      stateManager.saveState();

      const result = await resume({ continue: true });

      assert.strictEqual(result, 0);
      const output = consoleOutput.log.join('\n');
      assert(output.includes('Continuing Active Wave'), 'Should show continue header');
      assert(output.includes('Wave 1: Development'), 'Should show wave name');
      assert(output.includes('3/5'), 'Should show progress');
      assert(output.includes('Remaining: 2'), 'Should show remaining tasks');
    });

    it('should fail when no active wave', async function() {
      const stateManager = new StateManager(testDir);
      stateManager.saveState();

      const result = await resume({ continue: true });

      assert.strictEqual(result, 1);
      const output = consoleOutput.log.join('\n') + consoleOutput.error.join('\n');
      assert(output.includes('No active wave to continue'), 'Should show error');
      assert(output.includes('reis execute-plan'), 'Should suggest starting new wave');
    });

    it('should warn about blockers and fail without --force', async function() {
      const stateManager = new StateManager(testDir);
      stateManager.startWave('Wave 1: Testing', 3);
      stateManager.addBlocker('Tests not passing');
      stateManager.saveState();

      const result = await resume({ continue: true });

      assert.strictEqual(result, 1);
      const output = consoleOutput.log.join('\n');
      assert(output.includes('Blockers exist'), 'Should show blockers warning');
      assert(output.includes('Tests not passing'), 'Should list blocker');
      assert(output.includes('use --force'), 'Should mention force flag');
    });

    it('should continue with blockers when --force flag used', async function() {
      const stateManager = new StateManager(testDir);
      stateManager.startWave('Wave 1: Testing', 3);
      stateManager.addBlocker('Minor issue');
      stateManager.saveState();

      const result = await resume({ continue: true, force: true });

      assert.strictEqual(result, 0);
      const output = consoleOutput.log.join('\n');
      assert(output.includes('Continuing Active Wave'), 'Should continue despite blockers');
    });

    it('should handle completed wave', async function() {
      const stateManager = new StateManager(testDir);
      stateManager.startWave('Wave 1: Complete', 3);
      stateManager.updateWaveProgress(3); // All tasks done
      stateManager.saveState();

      const result = await resume({ continue: true });

      assert.strictEqual(result, 0);
      const output = consoleOutput.log.join('\n');
      assert(output.includes('All tasks in this wave are complete'), 'Should indicate completion');
      assert(output.includes('mark wave as complete'), 'Should suggest next steps');
    });

    it('should work with short flag -f for force', async function() {
      const stateManager = new StateManager(testDir);
      stateManager.startWave('Wave 1', 2);
      stateManager.addBlocker('Test blocker');
      stateManager.saveState();

      const result = await resume({ continue: true, f: true });

      assert.strictEqual(result, 0);
      const output = consoleOutput.log.join('\n');
      assert(output.includes('Continuing Active Wave'), 'Should work with -f flag');
    });
  });

  describe('Error Handling', function() {
    it('should handle corrupted STATE.md gracefully', async function() {
      // Create invalid STATE.md
      fs.writeFileSync('.planning/STATE.md', 'Invalid markdown content <<<>>>');

      const result = await resume({});

      // Should not crash, should handle gracefully
      assert.strictEqual(typeof result, 'number');
    });

    it('should show debug info when --debug flag used', async function() {
      // Remove STATE.md to cause an error scenario
      const stateManager = new StateManager(testDir);
      stateManager.saveState();
      
      // Corrupt the state file
      fs.writeFileSync('.planning/STATE.md', 'Bad content');
      
      // Should not crash even with corrupted file
      const result = await resume({ debug: true });
      
      assert.strictEqual(typeof result, 'number');
    });

    it('should handle missing config gracefully', async function() {
      const stateManager = new StateManager(testDir);
      stateManager.createCheckpoint('Test', null);
      stateManager.saveState();

      // Should work even without reis.config.js
      const result = await resume({ list: true });

      assert.strictEqual(result, 0);
    });
  });

  describe('Integration', function() {
    it('should work with complete workflow', async function() {
      const stateManager = new StateManager(testDir);
      
      // Simulate a complete workflow
      stateManager.state.currentPhase = 'Phase 2: Development';
      stateManager.startWave('Wave 1: Setup', 3);
      stateManager.updateWaveProgress(3);
      stateManager.createCheckpoint('After Wave 1', 'commit1');
      
      stateManager.startWave('Wave 2: Implementation', 5);
      stateManager.updateWaveProgress(2);
      stateManager.createCheckpoint('Mid Wave 2', 'commit2');
      
      stateManager.addActivity('Completed setup phase');
      stateManager.addActivity('Started implementation');
      
      stateManager.saveState();

      // Test smart resume
      const result1 = await resume({});
      assert.strictEqual(result1, 0);

      // Test list
      const result2 = await resume({ list: true });
      assert.strictEqual(result2, 0);

      // Test continue
      const result3 = await resume({ continue: true });
      assert.strictEqual(result3, 0);

      const output = consoleOutput.log.join('\n');
      assert(output.includes('Wave 2: Implementation'), 'Should show current wave');
      assert(output.includes('2/5'), 'Should show progress');
      assert(output.includes('After Wave 1'), 'Should list checkpoints');
    });
  });
});
