const chalk = require('chalk');
const { loadConfig } = require('../utils/config.js');
const StateManager = require('../utils/state-manager.js');
const { MetricsTracker } = require('../utils/metrics-tracker.js');

const visualizer = {
  createProgressBar(current, total, options = {}) {
    const width = options.width || 40;
    const percent = Math.round((current / total) * 100);
    const filled = Math.round((current / total) * width);
    const bar = '█'.repeat(filled) + '░'.repeat(width - filled);
    return options.showPercent !== false ? `[${bar}] ${percent}% (${current}/${total})` : `[${bar}]`;
  },
  formatDuration(ms) {
    if (!ms || ms < 0) return '0s';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }
};

function colorizeStatus(status) {
  if (!status) return chalk.gray('unknown');
  const s = status.toLowerCase();
  if (s.includes('complete') || s === 'success') return chalk.green(status.toUpperCase());
  if (s === 'failed') return chalk.red(status.toUpperCase());
  if (s.includes('progress')) return chalk.yellow(status.toUpperCase());
  return chalk.gray(status.toUpperCase());
}

async function displayProgress(state, metrics, options) {
  if (!options.compact) {
    console.log(chalk.bold('\n╔════════════════════════════════════════════════════════════╗'));
    console.log(chalk.bold('║              REIS v2.0 - Project Progress                  ║'));
    console.log(chalk.bold('╚════════════════════════════════════════════════════════════╝\n'));
  } else {
    console.log(chalk.bold('\nREIS v2.0 - Project Progress\n'));
  }
  if (state.currentPhase) console.log(chalk.cyan.bold(`Phase ${state.currentPhase}`));
  if (state.currentWave) {
    const wave = state.currentWave;
    console.log(chalk.blue(`\nCurrent Wave: ${wave.id || 'Unknown'}`));
    console.log(`Status: ${colorizeStatus(wave.status || 'unknown')}`);
    if (wave.completedTasks !== undefined && wave.totalTasks !== undefined) {
      console.log(`Progress: ${visualizer.createProgressBar(wave.completedTasks, wave.totalTasks, { width: 40 })}`);
    }
    if (wave.startTime) {
      const elapsed = Date.now() - new Date(wave.startTime).getTime();
      console.log(`Time Elapsed: ${visualizer.formatDuration(elapsed)}`);
    }
  }
  if (state.nextSteps && state.nextSteps.length > 0) {
    console.log(chalk.green.bold('\nNext Steps:'));
    state.nextSteps.forEach(step => console.log(`  → ${step}`));
  }
  if (metrics && Object.keys(metrics).length > 0) {
    console.log(chalk.magenta.bold('\nMetrics:'));
    if (metrics.totalWaves !== undefined) {
      console.log(`  Waves Completed: ${metrics.successfulWaves || 0}/${metrics.totalWaves}`);
    }
    if (metrics.successRate !== undefined) {
      console.log(`  Success Rate: ${Math.round(metrics.successRate * 100)}%`);
    }
  }
}

async function displayWaves(state, metrics, options) {
  if (!options.compact) {
    console.log(chalk.bold('\n╔════════════════════════════════════════════════════════════╗'));
    console.log(chalk.bold('║                    Wave Overview                           ║'));
    console.log(chalk.bold('╚════════════════════════════════════════════════════════════╝\n'));
  } else {
    console.log(chalk.bold('\nWave Overview\n'));
  }
  if (!state.waves || state.waves.length === 0) {
    console.log(chalk.gray('  No waves found'));
    return;
  }
  state.waves.forEach(wave => {
    const icon = wave.status === 'complete' ? chalk.green('✓') :
                 wave.status === 'failed' ? chalk.red('✗') :
                 wave.status === 'in_progress' ? chalk.yellow('⧗') : chalk.gray('○');
    const taskInfo = wave.totalTasks ? ` (${wave.completedTasks || 0}/${wave.totalTasks} tasks)` : '';
    console.log(`  ${icon} Wave ${wave.id || wave.number}${taskInfo}`);
  });
}

async function displayRoadmap(state, metrics, options) {
  if (!options.compact) {
    console.log(chalk.bold('\n╔════════════════════════════════════════════════════════════╗'));
    console.log(chalk.bold('║                   Project Roadmap                          ║'));
    console.log(chalk.bold('╚════════════════════════════════════════════════════════════╝\n'));
  } else {
    console.log(chalk.bold('\nProject Roadmap\n'));
  }
  if (state.phases && state.phases.length > 0) {
    state.phases.forEach(phase => {
      const progress = phase.totalWaves ? 
        visualizer.createProgressBar(phase.completedWaves || 0, phase.totalWaves, { width: 30 }) : 'N/A';
      console.log(chalk.cyan.bold(`\nPhase ${phase.number}: ${phase.name || 'Unnamed'}`));
      console.log(`  Progress: ${progress}`);
      if (phase.status) console.log(`  Status: ${colorizeStatus(phase.status)}`);
    });
  } else {
    if (state.currentPhase) {
      console.log(chalk.cyan.bold(`Current Phase: ${state.currentPhase}`));
    } else {
      console.log(chalk.gray('  No roadmap information available'));
    }
  }
}

async function displayMetrics(state, metrics, options) {
  if (!options.compact) {
    console.log(chalk.bold('\n╔════════════════════════════════════════════════════════════╗'));
    console.log(chalk.bold('║                   Metrics Dashboard                        ║'));
    console.log(chalk.bold('╚════════════════════════════════════════════════════════════╝\n'));
  } else {
    console.log(chalk.bold('\nMetrics Dashboard\n'));
  }
  if (!metrics || Object.keys(metrics).length === 0) {
    console.log(chalk.gray('  No metrics available'));
    return;
  }
  console.log(chalk.cyan.bold('Key Performance Indicators:\n'));
  if (metrics.successRate !== undefined) console.log(`  Success Rate: ${Math.round(metrics.successRate * 100)}%`);
  if (metrics.totalWaves !== undefined) console.log(`  Waves Completed: ${metrics.successfulWaves || 0}/${metrics.totalWaves}`);
  if (metrics.averageDuration !== undefined) console.log(`  Avg Wave Duration: ${metrics.averageDuration}m`);
}

async function render(type, options) {
  try {
    const config = await loadConfig();
    const projectRoot = config.projectRoot || process.cwd();
    const stateManager = new StateManager(projectRoot);
    const metricsTracker = new MetricsTracker(projectRoot);
    const state = await stateManager.getState();
    let metrics = {};
    try {
      metrics = metricsTracker.getMetricsSummary();
    } catch (err) {}
    switch (type) {
      case 'progress': await displayProgress(state, metrics, options); break;
      case 'waves': await displayWaves(state, metrics, options); break;
      case 'roadmap': await displayRoadmap(state, metrics, options); break;
      case 'metrics': await displayMetrics(state, metrics, options); break;
      default: await displayProgress(state, metrics, options);
    }
  } catch (error) {
    console.error(options.noColor ? `Error: ${error.message}` : chalk.red(`Error: ${error.message}`));
    if (error.message.includes('STATE.md not found')) {
      console.log('\nHint: Run ' + chalk.cyan('reis execute-plan') + ' to start execution and create state.');
    }
  }
}

async function visualizeCommand(args = []) {
  const options = { type: 'progress', watch: false, compact: false, noColor: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--type' && args[i + 1]) { options.type = args[++i]; }
    else if (args[i] === '--watch') { options.watch = true; }
    else if (args[i] === '--compact') { options.compact = true; }
    else if (args[i] === '--no-color') { options.noColor = true; chalk.level = 0; }
  }
  const validTypes = ['progress', 'waves', 'roadmap', 'metrics'];
  if (!validTypes.includes(options.type)) {
    console.error(chalk.red(`Invalid type: ${options.type}`));
    console.log(`Valid types: ${validTypes.join(', ')}`);
    process.exit(1);
  }
  if (options.watch) {
    console.log(chalk.gray('Watch mode enabled. Press Ctrl+C to exit.\n'));
    let intervalId;
    process.on('SIGINT', () => {
      if (intervalId) clearInterval(intervalId);
      console.log(chalk.gray('\n\nExiting watch mode...'));
      process.exit(0);
    });
    await render(options.type, options);
    console.log(chalk.gray(`\nLast updated: ${new Date().toLocaleTimeString()}`));
    intervalId = setInterval(async () => {
      console.clear();
      await render(options.type, options);
      console.log(chalk.gray(`\nLast updated: ${new Date().toLocaleTimeString()}`));
    }, 5000);
  } else {
    await render(options.type, options);
  }
}

module.exports = visualizeCommand;
