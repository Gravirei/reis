/**
 * REIS v2.0 Git Integration
 * Auto-commit, branch management, and rollback support
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Check if directory is a git repository
 */
function isGitRepo(projectRoot = process.cwd()) {
  try {
    execSync('git rev-parse --git-dir', { 
      cwd: projectRoot,
      stdio: 'pipe'
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get current git status
 */
function getGitStatus(projectRoot = process.cwd()) {
  if (!isGitRepo(projectRoot)) {
    return null;
  }

  try {
    const status = execSync('git status --porcelain', {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: 'pipe'
    });

    return {
      clean: status.trim() === '',
      hasChanges: status.trim() !== '',
      changes: status.trim().split('\n').filter(line => line.length > 0)
    };
  } catch (error) {
    return null;
  }
}

/**
 * Get current branch name
 */
function getCurrentBranch(projectRoot = process.cwd()) {
  if (!isGitRepo(projectRoot)) {
    return null;
  }

  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: 'pipe'
    }).trim();
    return branch;
  } catch (error) {
    return null;
  }
}

/**
 * Get current commit hash
 */
function getCurrentCommit(projectRoot = process.cwd()) {
  if (!isGitRepo(projectRoot)) {
    return null;
  }

  try {
    const commit = execSync('git rev-parse HEAD', {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: 'pipe'
    }).trim();
    return commit;
  } catch (error) {
    return null;
  }
}

/**
 * Get short commit hash (7 characters)
 */
function getShortCommit(projectRoot = process.cwd()) {
  const commit = getCurrentCommit(projectRoot);
  return commit ? commit.substring(0, 7) : null;
}

/**
 * Check if working tree is clean
 */
function isWorkingTreeClean(projectRoot = process.cwd()) {
  const status = getGitStatus(projectRoot);
  return status ? status.clean : false;
}

/**
 * Create a structured commit
 * @param {string} phase - Current phase
 * @param {string} waveName - Wave name
 * @param {string} summary - Commit summary
 * @param {Object} options - Additional options
 */
function createStructuredCommit(phase, waveName, summary, options = {}) {
  const {
    projectRoot = process.cwd(),
    prefix = '[REIS v2.0]',
    details = [],
    testStatus = 'pending'
  } = options;

  if (!isGitRepo(projectRoot)) {
    throw new Error('Not a git repository');
  }

  // Check if there are changes to commit
  const status = getGitStatus(projectRoot);
  if (!status || status.clean) {
    console.log('No changes to commit');
    return null;
  }

  // Build commit message
  let message = `${prefix} ${summary}\n\n`;
  
  if (phase) {
    message += `Phase: ${phase}\n`;
  }
  
  if (waveName) {
    message += `Wave: ${waveName}\n`;
  }
  
  if (details.length > 0) {
    message += `\nChanges:\n`;
    details.forEach(detail => {
      message += `- ${detail}\n`;
    });
  }
  
  if (testStatus) {
    message += `\nTests: ${testStatus}\n`;
  }

  try {
    // Stage all changes
    execSync('git add -A', {
      cwd: projectRoot,
      stdio: 'pipe'
    });

    // Create commit
    execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, {
      cwd: projectRoot,
      stdio: 'pipe'
    });

    const commitHash = getCurrentCommit(projectRoot);
    const shortHash = getShortCommit(projectRoot);

    console.log(`✓ Created commit: ${shortHash}`);
    
    return {
      hash: commitHash,
      shortHash: shortHash,
      message: message
    };
  } catch (error) {
    throw new Error(`Failed to create commit: ${error.message}`);
  }
}

/**
 * Create a wave completion commit
 */
function commitWaveCompletion(waveName, phase, options = {}) {
  const summary = `Complete ${waveName}`;
  return createStructuredCommit(phase, waveName, summary, options);
}

/**
 * Create a checkpoint commit
 */
function commitCheckpoint(checkpointName, phase, options = {}) {
  const summary = `Checkpoint: ${checkpointName}`;
  return createStructuredCommit(phase, null, summary, {
    ...options,
    prefix: '[REIS Checkpoint]'
  });
}

/**
 * Create a git tag for milestone
 */
function createMilestoneTag(milestone, message, projectRoot = process.cwd()) {
  if (!isGitRepo(projectRoot)) {
    throw new Error('Not a git repository');
  }

  try {
    const tagName = milestone.replace(/\s+/g, '-').toLowerCase();
    execSync(`git tag -a "${tagName}" -m "${message}"`, {
      cwd: projectRoot,
      stdio: 'pipe'
    });

    console.log(`✓ Created tag: ${tagName}`);
    return tagName;
  } catch (error) {
    throw new Error(`Failed to create tag: ${error.message}`);
  }
}

/**
 * Create or switch to a branch
 */
function ensureBranch(branchName, projectRoot = process.cwd()) {
  if (!isGitRepo(projectRoot)) {
    throw new Error('Not a git repository');
  }

  try {
    const currentBranch = getCurrentBranch(projectRoot);
    
    if (currentBranch === branchName) {
      console.log(`Already on branch: ${branchName}`);
      return branchName;
    }

    // Check if branch exists
    try {
      execSync(`git rev-parse --verify ${branchName}`, {
        cwd: projectRoot,
        stdio: 'pipe'
      });
      
      // Branch exists, switch to it
      execSync(`git checkout ${branchName}`, {
        cwd: projectRoot,
        stdio: 'pipe'
      });
      console.log(`✓ Switched to branch: ${branchName}`);
    } catch (error) {
      // Branch doesn't exist, create it
      execSync(`git checkout -b ${branchName}`, {
        cwd: projectRoot,
        stdio: 'pipe'
      });
      console.log(`✓ Created and switched to branch: ${branchName}`);
    }

    return branchName;
  } catch (error) {
    throw new Error(`Failed to ensure branch: ${error.message}`);
  }
}

/**
 * Get list of commits for a specific branch
 */
function getCommitHistory(limit = 10, projectRoot = process.cwd()) {
  if (!isGitRepo(projectRoot)) {
    return [];
  }

  try {
    const log = execSync(`git log -${limit} --pretty=format:"%h|%s|%ai"`, {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: 'pipe'
    });

    return log.trim().split('\n').map(line => {
      const [hash, subject, date] = line.split('|');
      return { hash, subject, date };
    });
  } catch (error) {
    return [];
  }
}

/**
 * Get diff between two commits
 */
function getCommitDiff(fromCommit, toCommit = 'HEAD', projectRoot = process.cwd()) {
  if (!isGitRepo(projectRoot)) {
    return null;
  }

  try {
    const diff = execSync(`git diff --stat ${fromCommit}..${toCommit}`, {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: 'pipe'
    });

    return diff.trim();
  } catch (error) {
    return null;
  }
}

/**
 * Reset to a specific commit (rollback)
 */
function rollbackToCommit(commitHash, mode = 'mixed', projectRoot = process.cwd()) {
  if (!isGitRepo(projectRoot)) {
    throw new Error('Not a git repository');
  }

  const validModes = ['soft', 'mixed', 'hard'];
  if (!validModes.includes(mode)) {
    throw new Error(`Invalid mode: ${mode}. Must be one of: ${validModes.join(', ')}`);
  }

  try {
    execSync(`git reset --${mode} ${commitHash}`, {
      cwd: projectRoot,
      stdio: 'pipe'
    });

    console.log(`✓ Rolled back to commit: ${commitHash} (mode: ${mode})`);
    return true;
  } catch (error) {
    throw new Error(`Failed to rollback: ${error.message}`);
  }
}

/**
 * Stash current changes
 */
function stashChanges(message = 'REIS auto-stash', projectRoot = process.cwd()) {
  if (!isGitRepo(projectRoot)) {
    throw new Error('Not a git repository');
  }

  const status = getGitStatus(projectRoot);
  if (!status || status.clean) {
    console.log('No changes to stash');
    return null;
  }

  try {
    execSync(`git stash push -m "${message}"`, {
      cwd: projectRoot,
      stdio: 'pipe'
    });

    console.log('✓ Changes stashed');
    return message;
  } catch (error) {
    throw new Error(`Failed to stash changes: ${error.message}`);
  }
}

/**
 * Pop stashed changes
 */
function popStash(projectRoot = process.cwd()) {
  if (!isGitRepo(projectRoot)) {
    throw new Error('Not a git repository');
  }

  try {
    execSync('git stash pop', {
      cwd: projectRoot,
      stdio: 'pipe'
    });

    console.log('✓ Stashed changes restored');
    return true;
  } catch (error) {
    throw new Error(`Failed to pop stash: ${error.message}`);
  }
}

/**
 * Get git configuration info
 */
function getGitInfo(projectRoot = process.cwd()) {
  if (!isGitRepo(projectRoot)) {
    return null;
  }

  return {
    isRepo: true,
    branch: getCurrentBranch(projectRoot),
    commit: getCurrentCommit(projectRoot),
    shortCommit: getShortCommit(projectRoot),
    status: getGitStatus(projectRoot),
    clean: isWorkingTreeClean(projectRoot)
  };
}

module.exports = {
  isGitRepo,
  getGitStatus,
  getCurrentBranch,
  getCurrentCommit,
  getShortCommit,
  isWorkingTreeClean,
  createStructuredCommit,
  commitWaveCompletion,
  commitCheckpoint,
  createMilestoneTag,
  ensureBranch,
  getCommitHistory,
  getCommitDiff,
  rollbackToCommit,
  stashChanges,
  popStash,
  getGitInfo
};
