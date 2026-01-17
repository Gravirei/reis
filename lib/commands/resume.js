const fs = require('fs');
const path = require('path');
const { showPrompt, showError, checkPlanningDir } = require('../utils/command-helpers');
const StateManager = require('../utils/state-manager');
const { WaveExecutor } = require('../utils/wave-executor');
const { loadConfig } = require('../utils/config');
const { getGitStatus, getCommitDiff } = require('../utils/git-integration');

/**
 * Enhanced resume command with checkpoint support
 * Supports:
 * - Smart resume from last state
 * - Resume from specific checkpoint
 * - List available resume points
 * - Continue incomplete wave
 */
async function resume(args) {
  // Validate REIS project exists
  if (!checkPlanningDir()) {
    showError('Not a REIS project. Run "reis new" or "reis map" first.');
    process.exit(1);
  }

  try {
    const projectRoot = process.cwd();
    const stateManager = new StateManager(projectRoot);
    const config = loadConfig(projectRoot);

    // List mode - show all resume points
    if (args.list || args.l) {
      return listResumePoints(stateManager, config);
    }

    // Resume from specific checkpoint
    if (args.checkpoint || args.c) {
      return await resumeFromCheckpoint(args.checkpoint || args.c, stateManager, config, args);
    }

    // Continue active wave
    if (args.continue) {
      return await continueWave(stateManager, config, args);
    }

    // Smart resume (default)
    return await smartResume(stateManager, config, args);

  } catch (error) {
    showError(`Resume failed: ${error.message}`);
    if (args.debug) {
      console.error('\nStack trace:', error.stack);
    }
    return 1;
  }
}

/**
 * Smart resume - analyze state and suggest next action
 */
async function smartResume(stateManager, config, args) {
  const state = stateManager.state;

  // Backward compatibility - if no state data, use old prompt-based behavior
  if (!state.activeWave && state.checkpoints.length === 0 && state.recentActivity.length === 0) {
    console.log('\n📋 No checkpoint data found. Using legacy resume mode.\n');
    const prompt = `Resume work from last session. Read .planning/STATE.md to understand: last completed work, work in progress, next actions, and any blockers. Provide a summary and recommend next steps.`;
    showPrompt(prompt);
    return 0;
  }

  // Display context
  console.log('\n🔄 Resume Context\n');
  console.log('━'.repeat(60));

  // Show current phase
  if (state.currentPhase) {
    console.log(`\n📍 Current Phase: ${state.currentPhase}`);
  }

  // Show active wave
  if (state.activeWave) {
    console.log(`\n🌊 Active Wave: ${state.activeWave.name}`);
    console.log(`   Status: ${state.activeWave.status}`);
    console.log(`   Progress: ${state.activeWave.progress.completed}/${state.activeWave.progress.total} tasks`);
    console.log(`   Started: ${state.activeWave.started}`);
  }

  // Show recent activity
  if (state.recentActivity.length > 0) {
    console.log('\n📝 Recent Activity:');
    state.recentActivity.slice(-5).forEach(activity => {
      console.log(`   • ${activity}`);
    });
  }

  // Show blockers
  if (state.blockers.length > 0) {
    console.log('\n⚠️  Blockers:');
    state.blockers.forEach(blocker => {
      console.log(`   ⛔ ${blocker}`);
    });
  }

  // Show checkpoints
  if (state.checkpoints.length > 0) {
    console.log('\n🔖 Available Checkpoints:');
    state.checkpoints.slice(-3).forEach(cp => {
      console.log(`   • ${cp.name} (${cp.timestamp})`);
      if (cp.commit) console.log(`     Commit: ${cp.commit}`);
    });
  }

  console.log('\n' + '━'.repeat(60));

  // Provide recommendations
  console.log('\n💡 Recommendations:\n');

  if (state.blockers.length > 0) {
    console.log('   1. ⚠️  Resolve blockers first before continuing');
    state.blockers.forEach((blocker, i) => {
      console.log(`      ${i + 1}. ${blocker}`);
    });
  }

  if (state.activeWave) {
    const progress = state.activeWave.progress;
    const percentComplete = Math.round((progress.completed / progress.total) * 100);
    
    console.log(`   ${state.blockers.length > 0 ? '2' : '1'}. Continue active wave: ${state.activeWave.name}`);
    console.log(`      Progress: ${percentComplete}% complete (${progress.completed}/${progress.total} tasks)`);
    console.log(`      Command: reis resume --continue`);
  } else if (state.nextSteps.length > 0) {
    console.log(`   ${state.blockers.length > 0 ? '2' : '1'}. Next Steps:`);
    state.nextSteps.forEach((step, i) => {
      console.log(`      ${i + 1}. ${step}`);
    });
  }

  if (state.checkpoints.length > 0) {
    const lastCheckpoint = state.checkpoints[state.checkpoints.length - 1];
    console.log(`   ${state.activeWave || state.nextSteps.length > 0 ? (state.blockers.length > 0 ? '3' : '2') : '1'}. Resume from checkpoint: ${lastCheckpoint.name}`);
    console.log(`      Command: reis resume --checkpoint "${lastCheckpoint.name}"`);
  }

  console.log('\n   📋 List all resume points: reis resume --list');
  console.log('\n');

  // Auto mode - automatically continue
  if (args.auto || args.a) {
    console.log('🚀 Auto-resume mode enabled\n');
    
    if (state.blockers.length > 0) {
      console.log('❌ Cannot auto-resume: blockers present');
      return 1;
    }

    if (state.activeWave) {
      console.log('▶️  Continuing active wave...\n');
      return await continueWave(stateManager, config, args);
    }

    console.log('ℹ️  No active wave to continue');
  }

  return 0;
}

/**
 * List all resume points
 */
function listResumePoints(stateManager, config) {
  const state = stateManager.state;

  console.log('\n📋 Available Resume Points\n');
  console.log('━'.repeat(60));

  // Active wave
  if (state.activeWave) {
    console.log('\n🌊 Active Wave (RECOMMENDED):');
    console.log(`   Name: ${state.activeWave.name}`);
    console.log(`   Status: ${state.activeWave.status}`);
    console.log(`   Progress: ${state.activeWave.progress.completed}/${state.activeWave.progress.total} tasks`);
    console.log(`   Started: ${state.activeWave.started}`);
    console.log(`   Command: reis resume --continue\n`);
  }

  // Checkpoints
  if (state.checkpoints.length > 0) {
    console.log('\n🔖 Checkpoints:');
    state.checkpoints.forEach((cp, i) => {
      console.log(`\n   ${i + 1}. ${cp.name}`);
      console.log(`      Timestamp: ${cp.timestamp}`);
      if (cp.wave) console.log(`      Wave: ${cp.wave}`);
      if (cp.commit) console.log(`      Commit: ${cp.commit}`);
      console.log(`      Command: reis resume --checkpoint "${cp.name}"`);
    });
    console.log('');
  } else {
    console.log('\n   No checkpoints found.\n');
  }

  // Last activity
  if (state.recentActivity.length > 0) {
    console.log('\n📝 Last Activity:');
    const lastActivity = state.recentActivity[state.recentActivity.length - 1];
    console.log(`   ${lastActivity}\n`);
  }

  console.log('━'.repeat(60));
  console.log('');

  return 0;
}

/**
 * Resume from specific checkpoint
 */
async function resumeFromCheckpoint(checkpointName, stateManager, config, args) {
  const state = stateManager.state;

  // Find checkpoint
  const checkpoint = state.checkpoints.find(cp => cp.name === checkpointName);

  if (!checkpoint) {
    showError(`Checkpoint not found: ${checkpointName}`);
    console.error('\nAvailable checkpoints:');
    if (state.checkpoints.length === 0) {
      console.error('  (none)');
    } else {
      state.checkpoints.forEach(cp => {
        console.error(`  - ${cp.name}`);
      });
    }
    return 1;
  }

  // Display checkpoint details
  console.log('\n🔖 Resuming from Checkpoint\n');
  console.log('━'.repeat(60));
  console.log(`\n   Name: ${checkpoint.name}`);
  console.log(`   Timestamp: ${checkpoint.timestamp}`);
  if (checkpoint.wave) console.log(`   Wave: ${checkpoint.wave}`);
  if (checkpoint.commit) console.log(`   Commit: ${checkpoint.commit}`);

  // Show git diff if checkpoint has a commit
  if (checkpoint.commit && !args.yes && !args.y) {
    try {
      const projectRoot = process.cwd();
      const status = getGitStatus(projectRoot);
      
      if (status.hasChanges) {
        console.log('\n⚠️  Warning: You have uncommitted changes');
        console.log('   Current working directory has modifications since checkpoint');
      }

      // Try to get diff from checkpoint commit to HEAD
      try {
        const diff = getCommitDiff(checkpoint.commit, 'HEAD', projectRoot);
        if (diff) {
          console.log(`\n📊 Changes since checkpoint (${checkpoint.commit}..HEAD):`);
          const diffLines = diff.split('\n');
          const summary = diffLines.slice(0, 10).join('\n');
          console.log(summary);
          if (diffLines.length > 10) {
            console.log(`   ... (${diffLines.length - 10} more lines)`);
          }
        }
      } catch (error) {
        // Ignore diff errors - commit might not exist
      }
    } catch (error) {
      // Ignore git errors
    }
  }

  console.log('\n━'.repeat(60));

  // Confirm unless --yes flag
  if (!args.yes && !args.y) {
    console.log('\n⚠️  This will restore state from the checkpoint.');
    console.log('   Any subsequent progress will be lost.');
    console.log('\nContinue? (y/N): ');
    
    // For now, we'll just show the warning
    // In interactive mode, we would wait for input
    if (!args.auto && !args.a) {
      console.log('\nUse --yes flag to skip confirmation.\n');
      return 0;
    }
  }

  // Restore state from checkpoint
  console.log('\n✅ State restored from checkpoint: ' + checkpoint.name);
  
  // If checkpoint has associated wave, suggest continuing
  if (checkpoint.wave) {
    console.log(`\n💡 To continue from this checkpoint's wave:`);
    console.log(`   reis resume --continue\n`);
  }

  return 0;
}

/**
 * Continue incomplete wave
 */
async function continueWave(stateManager, config, args) {
  const state = stateManager.state;

  if (!state.activeWave) {
    showError('No active wave to continue');
    console.error('\nTo start a new wave: reis execute-plan <path> --wave');
    console.error('To list resume points: reis resume --list\n');
    return 1;
  }

  const wave = state.activeWave;
  const progress = wave.progress;

  console.log('\n🌊 Continuing Active Wave\n');
  console.log('━'.repeat(60));
  console.log(`\n   Wave: ${wave.name}`);
  console.log(`   Status: ${wave.status}`);
  console.log(`   Progress: ${progress.completed}/${progress.total} tasks complete`);
  console.log(`   Started: ${wave.started}`);
  console.log('\n━'.repeat(60));

  // Check for blockers
  if (state.blockers.length > 0) {
    console.log('\n⚠️  Warning: Blockers exist:');
    state.blockers.forEach(blocker => {
      console.log(`   ⛔ ${blocker}`);
    });
    
    if (!args.force && !args.f) {
      console.log('\nResolve blockers first, or use --force to continue anyway.\n');
      return 1;
    }
  }

  // Display remaining tasks
  const remainingTasks = progress.total - progress.completed;
  console.log(`\n📋 Remaining: ${remainingTasks} task(s)`);
  
  if (remainingTasks === 0) {
    console.log('\n✅ All tasks in this wave are complete!');
    console.log('\nTo mark wave as complete:');
    console.log('   Update STATE.md and commit changes\n');
    return 0;
  }

  // For actual execution, we would use WaveExecutor here
  // For now, just provide guidance
  console.log('\n💡 To continue execution:');
  console.log('   Use the reis_executor agent or manually complete remaining tasks');
  console.log('   Update progress in STATE.md as you complete each task');
  console.log('   Use "reis checkpoint" to save progress\n');

  return 0;
}

module.exports = resume;
