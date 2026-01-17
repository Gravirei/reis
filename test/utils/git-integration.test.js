/**
 * Tests for REIS v2.0 Git Integration
 */

const assert = require('assert');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const {
  isGitRepo,
  getGitStatus,
  getCurrentBranch,
  isWorkingTreeClean,
  getGitInfo
} = require('../../lib/utils/git-integration');

describe('Git Integration', () => {
  const testRoot = path.join(__dirname, '../tmp_test_git');
  
  beforeEach(() => {
    // Clean up and create test directory
    if (fs.existsSync(testRoot)) {
      fs.rmSync(testRoot, { recursive: true });
    }
    fs.mkdirSync(testRoot, { recursive: true });
    
    // Initialize git repo
    execSync('git init', { cwd: testRoot, stdio: 'pipe' });
    execSync('git config user.email "test@example.com"', { cwd: testRoot, stdio: 'pipe' });
    execSync('git config user.name "Test User"', { cwd: testRoot, stdio: 'pipe' });
    
    // Create initial commit
    fs.writeFileSync(path.join(testRoot, 'README.md'), '# Test\n', 'utf8');
    execSync('git add .', { cwd: testRoot, stdio: 'pipe' });
    execSync('git commit -m "Initial commit"', { cwd: testRoot, stdio: 'pipe' });
  });

  afterEach(() => {
    // Clean up
    if (fs.existsSync(testRoot)) {
      fs.rmSync(testRoot, { recursive: true });
    }
  });

  describe('isGitRepo', () => {
    it('should detect git repository', () => {
      assert.strictEqual(isGitRepo(testRoot), true);
    });

    it('should return false for non-git directory', () => {
      const nonGitDir = path.join(testRoot, 'subdir');
      fs.mkdirSync(nonGitDir);
      assert.strictEqual(isGitRepo(nonGitDir), false);
    });
  });

  describe('getGitStatus', () => {
    it('should return clean status for clean tree', () => {
      const status = getGitStatus(testRoot);
      assert.ok(status);
      assert.strictEqual(status.clean, true);
      assert.strictEqual(status.hasChanges, false);
    });

    it('should detect changes', () => {
      fs.writeFileSync(path.join(testRoot, 'new-file.txt'), 'content', 'utf8');
      const status = getGitStatus(testRoot);
      assert.ok(status);
      assert.strictEqual(status.clean, false);
      assert.strictEqual(status.hasChanges, true);
      assert.ok(status.changes.length > 0);
    });
  });

  describe('getCurrentBranch', () => {
    it('should return current branch name', () => {
      const branch = getCurrentBranch(testRoot);
      assert.ok(branch);
      // Could be 'main' or 'master' depending on git config
      assert.ok(branch === 'main' || branch === 'master');
    });
  });

  describe('isWorkingTreeClean', () => {
    it('should return true for clean tree', () => {
      assert.strictEqual(isWorkingTreeClean(testRoot), true);
    });

    it('should return false when there are changes', () => {
      fs.writeFileSync(path.join(testRoot, 'changes.txt'), 'new', 'utf8');
      assert.strictEqual(isWorkingTreeClean(testRoot), false);
    });
  });

  describe('getGitInfo', () => {
    it('should return comprehensive git info', () => {
      const info = getGitInfo(testRoot);
      assert.ok(info);
      assert.strictEqual(info.isRepo, true);
      assert.ok(info.branch);
      assert.ok(info.commit);
      assert.ok(info.shortCommit);
      assert.strictEqual(info.clean, true);
    });
  });
});
