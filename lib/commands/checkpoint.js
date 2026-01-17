/**
 * REIS v2.0 Checkpoint Command
 * Manual checkpoint creation, listing, and management
 */

const StateManager = require('../utils/state-manager');
const GitIntegration = require('../utils/git-integration');
const { loadConfig } = require('../utils/config');
const fs = require('fs');
const path = require('path');

/**
 * Format relative time
 */
function getRelativeTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
}

/**
 * Generate checkpoint name from timestamp
 */
function generateCheckpointName() {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toTimeString().split(' ')[0].replace(/:/g, '');
  return `checkpoint-${date}-${time}`;
}

/**
 * Validate checkpoint name
 */
function isValidCheckpointName(name) {
  // Allow alphanumeric, dash, underscore
  return /^[a-zA-Z0-9_-]+$/.test(name);
}

/**
 * Create a checkpoint
 */
async function createCheckpoint(options = {}) {
  const projectRoot = process.cwd();
  const planningDir = path.join(projectRoot, '.planning');

  // Validate REIS project
  if (!fs.existsSync(planningDir)) {
    console.error('❌ Error: Not a REIS project. No .planning/ directory found.');
    console.error('   Initialize a REIS project first with: reis new');
    process.exit(1);
  }

  // Generate or validate name
  let checkpointName = options.name || generateCheckpointName();
  
  if (!isValidCheckpointName(checkpointName)) {
    console.error('❌ Error: Invalid checkpoint name. Use only alphanumeric characters, dashes, and underscores.');
    process.exit(1);
  }

  // Load state to check for duplicates
  const stateManager = new StateManager(projectRoot);
  const existingCheckpoint = stateManager.state.checkpoints.find(cp => cp.name === checkpointName);
  
  if (existingCheckpoint) {
    console.error(`❌ Error: Checkpoint '${checkpointName}' already exists.`);
    console.error('   Choose a different name or use: reis checkpoint list');
    process.exit(1);
  }

  // Load config
  let config = {};
  try {
    config = loadConfig(projectRoot);
  } catch (error) {
    // Config is optional, continue with defaults
    config = { git: { autoCommit: false } };
  }

  // Determine if we should create git commit
  let shouldCommit = false;
  const isGitRepo = GitIntegration.isGitRepo(projectRoot);
  
  if (isGitRepo) {
    const gitStatus = GitIntegration.getGitStatus(projectRoot);
    const hasChanges = gitStatus && gitStatus.hasChanges;
    
    if (hasChanges) {
      if (options.commit) {
        shouldCommit = true;
      } else if (options.noCommit) {
        shouldCommit = false;
      } else if (config.git && config.git.autoCommit) {
        shouldCommit = true;
      }
    }
  }

  // Create git commit if needed
  let commitHash = null;
  if (shouldCommit) {
    try {
      const commitMessage = options.message || `Checkpoint: ${checkpointName}`;
      const result = GitIntegration.commitCheckpoint(
        checkpointName,
        stateManager.state.currentPhase,
        {
          projectRoot,
          details: [commitMessage]
        }
      );
      
      if (result) {
        commitHash = result.hash;
        console.log(`✓ Git commit created: ${result.shortHash}`);
      }
    } catch (error) {
      console.warn(`⚠️  Warning: Git commit failed: ${error.message}`);
      console.warn('   Checkpoint will be created without git commit.');
    }
  }

  // Create checkpoint in STATE.md
  const checkpoint = stateManager.createCheckpoint(checkpointName, commitHash);

  // Display success message
  console.log(`\n✓ Checkpoint created successfully!\n`);
  console.log(`  Name:      ${checkpoint.name}`);
  console.log(`  Timestamp: ${checkpoint.timestamp}`);
  if (checkpoint.commit) {
    console.log(`  Commit:    ${checkpoint.commit.substring(0, 7)}`);
  }
  if (checkpoint.wave) {
    console.log(`  Wave:      ${checkpoint.wave}`);
  }
  console.log('');
}

/**
 * List all checkpoints
 */
async function listCheckpoints(options = {}) {
  const projectRoot = process.cwd();
  const planningDir = path.join(projectRoot, '.planning');

  // Validate REIS project
  if (!fs.existsSync(planningDir)) {
    console.error('❌ Error: Not a REIS project. No .planning/ directory found.');
    process.exit(1);
  }

  // Load state
  const stateManager = new StateManager(projectRoot);
  const checkpoints = stateManager.state.checkpoints;

  if (checkpoints.length === 0) {
    console.log('No checkpoints yet. Create one with: reis checkpoint create');
    return;
  }

  // Display checkpoints table
  console.log(`\n📍 Checkpoints (${checkpoints.length} found)\n`);
  console.log('NAME                          TIMESTAMP             COMMIT   WAVE');
  console.log('─'.repeat(80));

  checkpoints.forEach(cp => {
    const name = cp.name.padEnd(28);
    const timestamp = getRelativeTime(cp.timestamp).padEnd(20);
    const commit = cp.commit ? cp.commit.substring(0, 7) : '       ';
    const wave = cp.wave || '';
    
    console.log(`${name}  ${timestamp}  ${commit}  ${wave}`);
  });

  console.log('');
}

/**
 * Show checkpoint details
 */
async function showCheckpoint(name, options = {}) {
  const projectRoot = process.cwd();
  const planningDir = path.join(projectRoot, '.planning');

  // Validate REIS project
  if (!fs.existsSync(planningDir)) {
    console.error('❌ Error: Not a REIS project. No .planning/ directory found.');
    process.exit(1);
  }

  if (!name) {
    console.error('❌ Error: Checkpoint name required.');
    console.error('   Usage: reis checkpoint show <name>');
    process.exit(1);
  }

  // Load state
  const stateManager = new StateManager(projectRoot);
  const checkpoint = stateManager.state.checkpoints.find(cp => cp.name === name);

  if (!checkpoint) {
    console.error(`❌ Error: Checkpoint '${name}' not found.`);
    console.error('   Use: reis checkpoint list');
    process.exit(1);
  }

  // Display checkpoint details
  console.log(`\n📍 Checkpoint: ${checkpoint.name}\n`);
  console.log(`Timestamp:   ${checkpoint.timestamp}`);
  console.log(`             (${getRelativeTime(checkpoint.timestamp)})`);
  
  if (checkpoint.commit) {
    console.log(`\nGit Commit:  ${checkpoint.commit}`);
    
    // Try to get commit message
    if (GitIntegration.isGitRepo(projectRoot)) {
      try {
        const { execSync } = require('child_process');
        const message = execSync(`git log -1 --format=%s ${checkpoint.commit}`, {
          cwd: projectRoot,
          encoding: 'utf8',
          stdio: 'pipe'
        }).trim();
        console.log(`Message:     ${message}`);
        
        // Get diff stats
        const stats = execSync(`git show --stat --format="" ${checkpoint.commit}`, {
          cwd: projectRoot,
          encoding: 'utf8',
          stdio: 'pipe'
        }).trim();
        
        if (stats) {
          console.log(`\nChanges:`);
          stats.split('\n').forEach(line => {
            if (line.trim()) {
              console.log(`  ${line}`);
            }
          });
        }
      } catch (error) {
        // Silently fail if git command fails
      }
    }
  }
  
  if (checkpoint.wave) {
    console.log(`\nWave:        ${checkpoint.wave}`);
  }
  
  console.log('');
}

/**
 * Delete a checkpoint
 */
async function deleteCheckpoint(name, options = {}) {
  const projectRoot = process.cwd();
  const planningDir = path.join(projectRoot, '.planning');

  // Validate REIS project
  if (!fs.existsSync(planningDir)) {
    console.error('❌ Error: Not a REIS project. No .planning/ directory found.');
    process.exit(1);
  }

  if (!name) {
    console.error('❌ Error: Checkpoint name required.');
    console.error('   Usage: reis checkpoint delete <name>');
    process.exit(1);
  }

  // Load state
  const stateManager = new StateManager(projectRoot);
  const checkpointIndex = stateManager.state.checkpoints.findIndex(cp => cp.name === name);

  if (checkpointIndex === -1) {
    console.error(`❌ Error: Checkpoint '${name}' not found.`);
    console.error('   Use: reis checkpoint list');
    process.exit(1);
  }

  // Remove checkpoint
  stateManager.state.checkpoints.splice(checkpointIndex, 1);
  stateManager.saveState();

  console.log(`✓ Checkpoint '${name}' deleted.`);
}

/**
 * Main checkpoint command handler
 */
async function checkpoint(options = {}) {
  const subcommand = options.subcommand || 'list';
  const name = options.name;

  try {
    switch (subcommand) {
      case 'create':
        await createCheckpoint({ ...options, name });
        break;
      
      case 'list':
        await listCheckpoints(options);
        break;
      
      case 'show':
        await showCheckpoint(name, options);
        break;
      
      case 'delete':
        await deleteCheckpoint(name, options);
        break;
      
      default:
        // If no subcommand or invalid, default to list
        await listCheckpoints(options);
        break;
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = checkpoint;
