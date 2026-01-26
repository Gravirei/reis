const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { loadConfig } = require('../utils/config.js');
const StateManager = require('../utils/state-manager.js');
const { MetricsTracker } = require('../utils/metrics-tracker.js');
const { DependencyParser } = require('../utils/dependency-parser.js');
const { ParallelWaveScheduler } = require('../utils/parallel-wave-scheduler.js');

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

/**
 * Display wave dependency graph
 * @param {Object} options - Display options
 */
async function displayDependencies(options = {}) {
  const format = options.format || 'ascii';
  
  if (!options.compact) {
    console.log(chalk.bold('\n╔════════════════════════════════════════════════════════════╗'));
    console.log(chalk.bold('║                Wave Dependency Graph                       ║'));
    console.log(chalk.bold('╚════════════════════════════════════════════════════════════╝\n'));
  } else {
    console.log(chalk.bold('\nWave Dependency Graph\n'));
  }
  
  // Find plan file
  const planPath = findCurrentPlanPath();
  if (!planPath) {
    console.log(chalk.yellow('  No plan file found. Run "reis plan" first.'));
    return;
  }
  
  try {
    const parser = new DependencyParser();
    const parsed = parser.parseFile(planPath);
    
    if (!parsed.waves || parsed.waves.length === 0) {
      console.log(chalk.gray('  No waves found in plan'));
      return;
    }
    
    if (format === 'mermaid') {
      // Generate Mermaid diagram
      console.log(chalk.cyan('Mermaid Diagram:\n'));
      console.log('```mermaid');
      console.log('graph LR');
      
      parsed.waves.forEach(wave => {
        const waveId = `W${wave.number}`;
        const label = wave.name ? `${waveId}["${wave.name}"]` : waveId;
        console.log(`    ${label}`);
        
        if (wave.dependencies && wave.dependencies.length > 0) {
          wave.dependencies.forEach(dep => {
            const depNum = dep.match(/\d+/)?.[0] || dep;
            console.log(`    W${depNum} --> ${waveId}`);
          });
        }
      });
      
      console.log('```\n');
    } else {
      // ASCII visualization
      console.log(chalk.white('  Wave Dependency Graph:\n'));
      
      // Group waves by their dependency depth
      const depthMap = calculateWaveDepths(parsed.waves);
      const maxDepth = Math.max(...Array.from(depthMap.values()));
      
      // Find parallel groups at each depth
      const depthGroups = new Map();
      for (const [waveId, depth] of depthMap) {
        if (!depthGroups.has(depth)) {
          depthGroups.set(depth, []);
        }
        depthGroups.get(depth).push(waveId);
      }
      
      // Draw ASCII graph
      let prevGroupWaves = [];
      for (let d = 0; d <= maxDepth; d++) {
        const wavesAtDepth = depthGroups.get(d) || [];
        
        if (wavesAtDepth.length > 0) {
          // Draw waves at this depth
          const waveStr = wavesAtDepth.map(w => {
            const wave = parsed.waves.find(pw => pw.id === w);
            return wave ? `${w}` : w;
          }).join(' ─┬─ ');
          
          // Draw connection lines
          if (prevGroupWaves.length > 0 && d > 0) {
            const connector = wavesAtDepth.length > 1 ? '─┼─' : '─→ ';
            console.log(chalk.gray(`       │`));
            console.log(chalk.gray(`       ▼`));
          }
          
          console.log(chalk.green(`  ${waveStr}`));
          prevGroupWaves = wavesAtDepth;
        }
      }
      
      // Show parallel execution groups
      console.log(chalk.gray('\n  ' + '─'.repeat(50)));
      console.log(chalk.cyan('\n  Parallel Execution Groups:'));
      
      for (let d = 0; d <= maxDepth; d++) {
        const wavesAtDepth = depthGroups.get(d) || [];
        if (wavesAtDepth.length > 0) {
          const groupLabel = wavesAtDepth.length > 1 ? '(parallel)' : '(sequential)';
          console.log(chalk.white(`    Batch ${d + 1}: [${wavesAtDepth.join(', ')}] ${groupLabel}`));
        }
      }
    }
    
  } catch (error) {
    console.log(chalk.yellow(`  Could not parse dependencies: ${error.message}`));
  }
}

/**
 * Display estimated execution timeline
 * @param {Object} options - Display options
 */
async function displayTimeline(options = {}) {
  if (!options.compact) {
    console.log(chalk.bold('\n╔════════════════════════════════════════════════════════════╗'));
    console.log(chalk.bold('║              Estimated Execution Timeline                  ║'));
    console.log(chalk.bold('╚════════════════════════════════════════════════════════════╝\n'));
  } else {
    console.log(chalk.bold('\nEstimated Execution Timeline\n'));
  }
  
  const planPath = findCurrentPlanPath();
  if (!planPath) {
    console.log(chalk.yellow('  No plan file found. Run "reis plan" first.'));
    return;
  }
  
  try {
    const parser = new DependencyParser();
    const parsed = parser.parseFile(planPath);
    const graph = parser.buildGraph(parsed);
    
    if (!parsed.waves || parsed.waves.length === 0) {
      console.log(chalk.gray('  No waves found in plan'));
      return;
    }
    
    // Create scheduler to get execution batches
    const scheduler = new ParallelWaveScheduler({ maxConcurrent: 4 });
    scheduler.initialize(graph);
    
    const batches = [];
    let batchNum = 0;
    
    while (!scheduler.isComplete()) {
      const batch = scheduler.getNextBatch();
      if (batch.length === 0) break;
      
      batchNum++;
      batches.push({ number: batchNum, waves: batch });
      
      batch.forEach(waveId => {
        scheduler.startWave(waveId);
        scheduler.completeWave(waveId);
      });
    }
    
    // Calculate time estimates
    let sequentialTime = 0;
    let parallelTime = 0;
    let currentTime = 0;
    
    console.log(chalk.cyan('  Timeline (estimated):\n'));
    console.log(chalk.gray('  Time     Batch    Waves'));
    console.log(chalk.gray('  ' + '─'.repeat(50)));
    
    batches.forEach(batch => {
      const waveDetails = batch.waves.map(waveId => {
        const wave = parsed.waves.find(w => w.id === waveId);
        const size = wave?.size || 'medium';
        const timeEstimate = size === 'small' ? 2 : size === 'large' ? 10 : 5;
        sequentialTime += timeEstimate;
        return { id: waveId, time: timeEstimate };
      });
      
      const batchTime = Math.max(...waveDetails.map(w => w.time));
      const startTime = currentTime;
      const endTime = currentTime + batchTime;
      
      // ASCII timeline bar
      const barStart = Math.floor(startTime / 2);
      const barLength = Math.max(1, Math.floor(batchTime / 2));
      const bar = ' '.repeat(barStart) + '█'.repeat(barLength);
      
      const waveList = batch.waves.join(', ');
      console.log(chalk.white(`  ${startTime.toString().padStart(2)}m-${endTime.toString().padStart(2)}m  `) + 
                  chalk.green(`B${batch.number}`.padEnd(8)) + 
                  chalk.white(waveList));
      console.log(chalk.blue(`         ${bar}`));
      
      currentTime = endTime;
      parallelTime += batchTime;
    });
    
    // Summary
    const savings = sequentialTime > 0 ? Math.round((1 - parallelTime / sequentialTime) * 100) : 0;
    console.log(chalk.gray('\n  ' + '─'.repeat(50)));
    console.log(chalk.cyan('\n  Summary:'));
    console.log(chalk.white(`    Total waves: ${parsed.waves.length}`));
    console.log(chalk.white(`    Execution batches: ${batches.length}`));
    console.log(chalk.white(`    Sequential time: ~${sequentialTime} min`));
    console.log(chalk.white(`    Parallel time:   ~${parallelTime} min`));
    console.log(chalk.green(`    Time savings:    ${savings}% faster`));
    
  } catch (error) {
    console.log(chalk.yellow(`  Could not generate timeline: ${error.message}`));
  }
}

/**
 * Calculate wave depths for graph visualization
 */
function calculateWaveDepths(waves) {
  const depthMap = new Map();
  const depMap = new Map();
  
  // Build dependency map
  waves.forEach(wave => {
    depMap.set(wave.id, wave.dependencies || []);
  });
  
  // Calculate depth for each wave (BFS)
  const queue = waves.filter(w => !w.dependencies || w.dependencies.length === 0)
                     .map(w => ({ id: w.id, depth: 0 }));
  
  // Initialize root waves
  queue.forEach(item => depthMap.set(item.id, 0));
  
  // Process waves with dependencies
  let maxIterations = waves.length * 2;
  while (queue.length > 0 && maxIterations-- > 0) {
    const { id, depth } = queue.shift();
    depthMap.set(id, Math.max(depthMap.get(id) || 0, depth));
    
    // Find waves that depend on this one
    waves.forEach(wave => {
      if (wave.dependencies?.includes(id)) {
        const newDepth = depth + 1;
        if (!depthMap.has(wave.id) || depthMap.get(wave.id) < newDepth) {
          depthMap.set(wave.id, newDepth);
          queue.push({ id: wave.id, depth: newDepth });
        }
      }
    });
  }
  
  // Handle any remaining waves without calculated depth
  waves.forEach(wave => {
    if (!depthMap.has(wave.id)) {
      depthMap.set(wave.id, 0);
    }
  });
  
  return depthMap;
}

/**
 * Find current plan path
 */
function findCurrentPlanPath() {
  const planningDir = path.join(process.cwd(), '.planning');
  
  if (!fs.existsSync(planningDir)) {
    return null;
  }
  
  // Look for plan files
  const files = fs.readdirSync(planningDir);
  
  // Try phase-N.PLAN.md pattern
  const planFile = files.find(f => f.match(/phase-\d+\.PLAN\.md/i));
  if (planFile) {
    return path.join(planningDir, planFile);
  }
  
  // Try subdirectories
  for (const file of files) {
    const fullPath = path.join(planningDir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      const subFiles = fs.readdirSync(fullPath);
      const subPlan = subFiles.find(f => f.endsWith('.PLAN.md'));
      if (subPlan) {
        return path.join(fullPath, subPlan);
      }
    }
  }
  
  return null;
}

async function visualizeCommand(args = []) {
  const options = { type: 'progress', watch: false, compact: false, noColor: false, format: 'ascii' };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--type' && args[i + 1]) { options.type = args[++i]; }
    else if (args[i] === '--watch') { options.watch = true; }
    else if (args[i] === '--compact') { options.compact = true; }
    else if (args[i] === '--no-color') { options.noColor = true; chalk.level = 0; }
    else if (args[i] === '--dependencies') { options.type = 'dependencies'; }
    else if (args[i] === '--timeline') { options.type = 'timeline'; }
    else if (args[i] === '--format' && args[i + 1]) { options.format = args[++i]; }
  }
  const validTypes = ['progress', 'waves', 'roadmap', 'metrics', 'dependencies', 'timeline'];
  if (!validTypes.includes(options.type)) {
    console.error(chalk.red(`Invalid type: ${options.type}`));
    console.log(`Valid types: ${validTypes.join(', ')}`);
    process.exit(1);
  }
  
  // Handle new visualization types
  if (options.type === 'dependencies') {
    await displayDependencies(options);
    return;
  }
  if (options.type === 'timeline') {
    await displayTimeline(options);
    return;
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
