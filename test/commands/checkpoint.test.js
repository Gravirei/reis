/**
 * Tests for checkpoint command
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const checkpoint = require('../../lib/commands/checkpoint');
const StateManager = require('../../lib/utils/state-manager');

describe('Checkpoint Command', function() {
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
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reis-checkpoint-test-'));
    originalCwd = process.cwd();
    process.chdir(testDir);

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

  describe('Create Checkpoint', function() {
    it('should create checkpoint with custom name', async function() {
      // Setup REIS project
      const planningDir = path.join(testDir, '.planning');
      fs.mkdirSync(planningDir, { recursive: true });
      
      const stateManager = new StateManager(testDir);
      stateManager.saveState();

      // Create checkpoint
      await checkpoint({ subcommand: 'create', name: 'test-checkpoint' });

      // Verify checkpoint was created
      const updatedState = new StateManager(testDir);
      const cp = updatedState.state.checkpoints.find(c => c.name === 'test-checkpoint');
      
      assert.ok(cp, 'Checkpoint should exist');
      assert.strictEqual(cp.name, 'test-checkpoint');
      assert.ok(cp.timestamp, 'Checkpoint should have timestamp');
      assert.ok(consoleOutput.log.some(msg => msg.includes('Checkpoint created successfully')));
    });

    it('should create checkpoint with auto-generated name', async function() {
      // Setup REIS project
      const planningDir = path.join(testDir, '.planning');
      fs.mkdirSync(planningDir, { recursive: true });
      
      const stateManager = new StateManager(testDir);
      stateManager.saveState();

      // Create checkpoint without name
      await checkpoint({ subcommand: 'create' });

      // Verify checkpoint was created with auto-generated name
      const updatedState = new StateManager(testDir);
      assert.ok(updatedState.state.checkpoints.length > 0);
      
      const cp = updatedState.state.checkpoints[0];
      assert.ok(cp.name.startsWith('checkpoint-'));
      assert.ok(consoleOutput.log.some(msg => msg.includes('Checkpoint created successfully')));
    });

    it('should fail when not in REIS project', async function() {
      // Don't create .planning directory
      
      try {
        await checkpoint({ subcommand: 'create', name: 'test' });
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.strictEqual(exitCode, 1);
        assert.ok(consoleOutput.error.some(msg => msg.includes('Not a REIS project')));
      }
    });

    it('should prevent duplicate checkpoint names', async function() {
      // Setup REIS project
      const planningDir = path.join(testDir, '.planning');
      fs.mkdirSync(planningDir, { recursive: true });
      
      const stateManager = new StateManager(testDir);
      stateManager.createCheckpoint('existing-checkpoint');

      // Try to create checkpoint with same name
      try {
        await checkpoint({ subcommand: 'create', name: 'existing-checkpoint' });
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.strictEqual(exitCode, 1);
        assert.ok(consoleOutput.error.some(msg => msg.includes('already exists')));
      }
    });

    it('should reject invalid checkpoint names', async function() {
      // Setup REIS project
      const planningDir = path.join(testDir, '.planning');
      fs.mkdirSync(planningDir, { recursive: true });
      
      const stateManager = new StateManager(testDir);
      stateManager.saveState();

      // Try invalid name with special characters
      try {
        await checkpoint({ subcommand: 'create', name: 'test@checkpoint!' });
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.strictEqual(exitCode, 1);
        assert.ok(consoleOutput.error.some(msg => msg.includes('Invalid checkpoint name')));
      }
    });

    it('should create checkpoint with git commit when --commit flag', async function() {
      // Setup REIS project
      const planningDir = path.join(testDir, '.planning');
      fs.mkdirSync(planningDir, { recursive: true });
      
      const stateManager = new StateManager(testDir);
      stateManager.saveState();

      // Initialize git repo
      execSync('git init', { cwd: testDir, stdio: 'pipe' });
      execSync('git config user.email "test@example.com"', { cwd: testDir, stdio: 'pipe' });
      execSync('git config user.name "Test User"', { cwd: testDir, stdio: 'pipe' });
      
      // Create a file and stage it
      fs.writeFileSync(path.join(testDir, 'test.txt'), 'test content');
      execSync('git add .', { cwd: testDir, stdio: 'pipe' });

      // Create checkpoint with git commit
      await checkpoint({ subcommand: 'create', name: 'git-checkpoint', commit: true });

      // Verify checkpoint has commit hash
      const updatedState = new StateManager(testDir);
      const cp = updatedState.state.checkpoints.find(c => c.name === 'git-checkpoint');
      
      assert.ok(cp, 'Checkpoint should exist');
      assert.ok(cp.commit, 'Checkpoint should have commit hash');
      assert.ok(consoleOutput.log.some(msg => msg.includes('Git commit created')));
    });

    it('should skip git commit when --no-commit flag', async function() {
      // Setup REIS project with git
      const planningDir = path.join(testDir, '.planning');
      fs.mkdirSync(planningDir, { recursive: true });
      
      const stateManager = new StateManager(testDir);
      stateManager.saveState();

      // Initialize git repo with changes
      execSync('git init', { cwd: testDir, stdio: 'pipe' });
      execSync('git config user.email "test@example.com"', { cwd: testDir, stdio: 'pipe' });
      execSync('git config user.name "Test User"', { cwd: testDir, stdio: 'pipe' });
      fs.writeFileSync(path.join(testDir, 'test.txt'), 'test content');

      // Create checkpoint with --no-commit
      await checkpoint({ subcommand: 'create', name: 'no-commit-checkpoint', noCommit: true });

      // Verify checkpoint has no commit hash
      const updatedState = new StateManager(testDir);
      const cp = updatedState.state.checkpoints.find(c => c.name === 'no-commit-checkpoint');
      
      assert.ok(cp, 'Checkpoint should exist');
      assert.strictEqual(cp.commit, null, 'Checkpoint should not have commit hash');
    });

    it('should work without git repository', async function() {
      // Setup REIS project without git
      const planningDir = path.join(testDir, '.planning');
      fs.mkdirSync(planningDir, { recursive: true });
      
      const stateManager = new StateManager(testDir);
      stateManager.saveState();

      // Create checkpoint
      await checkpoint({ subcommand: 'create', name: 'no-git-checkpoint' });

      // Verify checkpoint was created
      const updatedState = new StateManager(testDir);
      const cp = updatedState.state.checkpoints.find(c => c.name === 'no-git-checkpoint');
      
      assert.ok(cp, 'Checkpoint should exist');
      assert.strictEqual(cp.commit, null, 'Checkpoint should not have commit hash');
    });

    it('should use custom commit message when provided', async function() {
      // Setup REIS project with git
      const planningDir = path.join(testDir, '.planning');
      fs.mkdirSync(planningDir, { recursive: true });
      
      const stateManager = new StateManager(testDir);
      stateManager.saveState();

      // Initialize git repo
      execSync('git init', { cwd: testDir, stdio: 'pipe' });
      execSync('git config user.email "test@example.com"', { cwd: testDir, stdio: 'pipe' });
      execSync('git config user.name "Test User"', { cwd: testDir, stdio: 'pipe' });
      fs.writeFileSync(path.join(testDir, 'test.txt'), 'test content');
      execSync('git add .', { cwd: testDir, stdio: 'pipe' });

      // Create checkpoint with custom message
      await checkpoint({ 
        subcommand: 'create', 
        name: 'custom-msg-checkpoint', 
        commit: true,
        message: 'Custom checkpoint message'
      });

      // Verify commit was created with custom message
      const commitMsg = execSync('git log -1 --format=%B', { 
        cwd: testDir, 
        encoding: 'utf8',
        stdio: 'pipe'
      }).trim();
      
      assert.ok(commitMsg.includes('Custom checkpoint message'));
    });
  });

  describe('List Checkpoints', function() {
    it('should list all checkpoints', async function() {
      // Setup REIS project with checkpoints
      const planningDir = path.join(testDir, '.planning');
      fs.mkdirSync(planningDir, { recursive: true });
      
      const stateManager = new StateManager(testDir);
      stateManager.createCheckpoint('checkpoint-1');
      stateManager.createCheckpoint('checkpoint-2');
      stateManager.createCheckpoint('checkpoint-3');

      // List checkpoints
      await checkpoint({ subcommand: 'list' });

      // Verify output
      const output = consoleOutput.log.join('\n');
      assert.ok(output.includes('checkpoint-1'));
      assert.ok(output.includes('checkpoint-2'));
      assert.ok(output.includes('checkpoint-3'));
      assert.ok(output.includes('3 found'));
    });

    it('should show message when no checkpoints exist', async function() {
      // Setup REIS project without checkpoints
      const planningDir = path.join(testDir, '.planning');
      fs.mkdirSync(planningDir, { recursive: true });
      
      const stateManager = new StateManager(testDir);
      stateManager.saveState();

      // List checkpoints
      await checkpoint({ subcommand: 'list' });

      // Verify output
      assert.ok(consoleOutput.log.some(msg => msg.includes('No checkpoints yet')));
    });

    it('should default to list when no subcommand', async function() {
      // Setup REIS project with checkpoints
      const planningDir = path.join(testDir, '.planning');
      fs.mkdirSync(planningDir, { recursive: true });
      
      const stateManager = new StateManager(testDir);
      stateManager.createCheckpoint('test-checkpoint');

      // Call without subcommand
      await checkpoint({});

      // Verify list output
      const output = consoleOutput.log.join('\n');
      assert.ok(output.includes('test-checkpoint'));
    });

    it('should fail when not in REIS project', async function() {
      // Don't create .planning directory
      
      try {
        await checkpoint({ subcommand: 'list' });
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.strictEqual(exitCode, 1);
        assert.ok(consoleOutput.error.some(msg => msg.includes('Not a REIS project')));
      }
    });
  });

  describe('Show Checkpoint', function() {
    it('should show checkpoint details', async function() {
      // Setup REIS project with checkpoint
      const planningDir = path.join(testDir, '.planning');
      fs.mkdirSync(planningDir, { recursive: true });
      
      const stateManager = new StateManager(testDir);
      stateManager.createCheckpoint('detail-checkpoint', 'abc123def');

      // Show checkpoint
      await checkpoint({ subcommand: 'show', name: 'detail-checkpoint' });

      // Verify output
      const output = consoleOutput.log.join('\n');
      assert.ok(output.includes('detail-checkpoint'));
      assert.ok(output.includes('abc123def'));
    });

    it('should fail when checkpoint not found', async function() {
      // Setup REIS project
      const planningDir = path.join(testDir, '.planning');
      fs.mkdirSync(planningDir, { recursive: true });
      
      const stateManager = new StateManager(testDir);
      stateManager.saveState();

      // Try to show non-existent checkpoint
      try {
        await checkpoint({ subcommand: 'show', name: 'nonexistent' });
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.strictEqual(exitCode, 1);
        assert.ok(consoleOutput.error.some(msg => msg.includes('not found')));
      }
    });

    it('should fail when name not provided', async function() {
      // Setup REIS project
      const planningDir = path.join(testDir, '.planning');
      fs.mkdirSync(planningDir, { recursive: true });
      
      const stateManager = new StateManager(testDir);
      stateManager.saveState();

      // Try to show without name
      try {
        await checkpoint({ subcommand: 'show' });
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.strictEqual(exitCode, 1);
        assert.ok(consoleOutput.error.some(msg => msg.includes('name required')));
      }
    });

    it('should show git commit details when available', async function() {
      // Setup REIS project with git
      const planningDir = path.join(testDir, '.planning');
      fs.mkdirSync(planningDir, { recursive: true });
      
      const stateManager = new StateManager(testDir);
      
      // Initialize git and create commit
      execSync('git init', { cwd: testDir, stdio: 'pipe' });
      execSync('git config user.email "test@example.com"', { cwd: testDir, stdio: 'pipe' });
      execSync('git config user.name "Test User"', { cwd: testDir, stdio: 'pipe' });
      fs.writeFileSync(path.join(testDir, 'test.txt'), 'test');
      execSync('git add .', { cwd: testDir, stdio: 'pipe' });
      execSync('git commit -m "Test commit"', { cwd: testDir, stdio: 'pipe' });
      
      const commitHash = execSync('git rev-parse HEAD', { 
        cwd: testDir, 
        encoding: 'utf8',
        stdio: 'pipe'
      }).trim();

      // Create checkpoint with commit
      stateManager.createCheckpoint('git-detail-checkpoint', commitHash);

      // Show checkpoint
      await checkpoint({ subcommand: 'show', name: 'git-detail-checkpoint' });

      // Verify git details in output
      const output = consoleOutput.log.join('\n');
      assert.ok(output.includes(commitHash));
      assert.ok(output.includes('Test commit'));
    });
  });

  describe('Delete Checkpoint', function() {
    it('should delete checkpoint', async function() {
      // Setup REIS project with checkpoint
      const planningDir = path.join(testDir, '.planning');
      fs.mkdirSync(planningDir, { recursive: true });
      
      const stateManager = new StateManager(testDir);
      stateManager.createCheckpoint('delete-me');

      // Verify checkpoint exists
      assert.ok(stateManager.state.checkpoints.find(c => c.name === 'delete-me'));

      // Delete checkpoint
      await checkpoint({ subcommand: 'delete', name: 'delete-me' });

      // Verify checkpoint was removed
      const updatedState = new StateManager(testDir);
      assert.ok(!updatedState.state.checkpoints.find(c => c.name === 'delete-me'));
      assert.ok(consoleOutput.log.some(msg => msg.includes('deleted')));
    });

    it('should fail when checkpoint not found', async function() {
      // Setup REIS project
      const planningDir = path.join(testDir, '.planning');
      fs.mkdirSync(planningDir, { recursive: true });
      
      const stateManager = new StateManager(testDir);
      stateManager.saveState();

      // Try to delete non-existent checkpoint
      try {
        await checkpoint({ subcommand: 'delete', name: 'nonexistent' });
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.strictEqual(exitCode, 1);
        assert.ok(consoleOutput.error.some(msg => msg.includes('not found')));
      }
    });

    it('should fail when name not provided', async function() {
      // Setup REIS project
      const planningDir = path.join(testDir, '.planning');
      fs.mkdirSync(planningDir, { recursive: true });
      
      const stateManager = new StateManager(testDir);
      stateManager.saveState();

      // Try to delete without name
      try {
        await checkpoint({ subcommand: 'delete' });
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.strictEqual(exitCode, 1);
        assert.ok(consoleOutput.error.some(msg => msg.includes('name required')));
      }
    });
  });

  describe('Git Integration', function() {
    it('should respect config autoCommit setting', async function() {
      // Setup REIS project with config
      const planningDir = path.join(testDir, '.planning');
      fs.mkdirSync(planningDir, { recursive: true });
      
      // Create config with autoCommit enabled
      const configContent = `module.exports = {
  git: {
    autoCommit: true,
    commitPrefix: '[REIS]'
  }
};`;
      fs.writeFileSync(path.join(testDir, 'reis.config.js'), configContent);
      
      const stateManager = new StateManager(testDir);
      stateManager.saveState();

      // Initialize git repo with changes
      execSync('git init', { cwd: testDir, stdio: 'pipe' });
      execSync('git config user.email "test@example.com"', { cwd: testDir, stdio: 'pipe' });
      execSync('git config user.name "Test User"', { cwd: testDir, stdio: 'pipe' });
      fs.writeFileSync(path.join(testDir, 'test.txt'), 'test content');
      execSync('git add .', { cwd: testDir, stdio: 'pipe' });

      // Create checkpoint (should auto-commit based on config)
      await checkpoint({ subcommand: 'create', name: 'auto-commit-checkpoint' });

      // Verify checkpoint has commit hash
      const updatedState = new StateManager(testDir);
      const cp = updatedState.state.checkpoints.find(c => c.name === 'auto-commit-checkpoint');
      
      assert.ok(cp.commit, 'Checkpoint should have commit hash from auto-commit');
    });

    it('should handle git errors gracefully', async function() {
      // Setup REIS project
      const planningDir = path.join(testDir, '.planning');
      fs.mkdirSync(planningDir, { recursive: true });
      
      const stateManager = new StateManager(testDir);
      stateManager.saveState();

      // Initialize git without user config (will cause commit to fail)
      execSync('git init', { cwd: testDir, stdio: 'pipe' });
      fs.writeFileSync(path.join(testDir, 'test.txt'), 'test content');
      execSync('git add .', { cwd: testDir, stdio: 'pipe' });

      // Create checkpoint with --commit (should warn but not fail)
      await checkpoint({ subcommand: 'create', name: 'error-checkpoint', commit: true });

      // Verify checkpoint was still created
      const updatedState = new StateManager(testDir);
      const cp = updatedState.state.checkpoints.find(c => c.name === 'error-checkpoint');
      
      assert.ok(cp, 'Checkpoint should exist despite git error');
      assert.ok(consoleOutput.warn.length > 0, 'Should have warning about git failure');
    });
  });
});
