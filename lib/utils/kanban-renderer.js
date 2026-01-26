/**
 * REIS Kanban Board Renderer
 * Renders ASCII kanban board with progress bars and multiple styles
 */

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

// Box drawing characters
const BOX = {
  topLeft: '┌', topRight: '┐', bottomLeft: '└', bottomRight: '┘',
  horizontal: '─', vertical: '│',
  teeDown: '┬', teeUp: '┴', teeRight: '├', teeLeft: '┤', cross: '┼'
};

// Progress bar characters
const PROGRESS = {
  filled: '■',
  empty: '░'
};

// Status icons
const ICONS = {
  active: '◉',
  waiting: '○',
  complete: '✓',
  failed: '✗',
  current: '▶',
  parallel: '⫴'
};

// Column widths (adjusted to match approved design)
const WIDTHS = {
  phases: 14,
  inProgress: 14,
  cycleLabel: 14,
  cycleProgress: 30,
  completed: 18
};

// Parallel execution state (for wave display)
let parallelWaveState = {
  enabled: false,
  maxConcurrent: 4,
  runningWaves: [],      // [{id, progress, name}]
  waitingWaves: [],      // [{id, dependsOn}]
  completedWaves: [],    // [{id, duration}]
  dependencies: new Map() // waveId -> [dependencyIds]
};

/**
 * Render progress bar with centered percentage
 * @param {number} percent - 0-100 percentage, or -1/null for not started
 * @param {number} width - Total width including brackets (default 16)
 * @returns {string} Formatted progress bar like [■■░░ 45%  ░░░░]
 */
function renderProgressBar(percent, width = 16) {
  // Handle special cases: not started
  if (percent === null || percent === undefined || percent < 0) {
    const innerWidth = width - 2; // subtract brackets
    const dash = '  -  ';
    const padding = Math.floor((innerWidth - dash.length) / 2);
    const remaining = innerWidth - padding - dash.length;
    return `[${PROGRESS.empty.repeat(padding)}${dash}${PROGRESS.empty.repeat(remaining)}]`;
  }
  
  percent = Math.min(100, Math.max(0, Math.round(percent)));
  const innerWidth = width - 2; // subtract brackets
  
  // Format percentage string (always 4-5 chars centered)
  const percentStr = percent === 100 ? '100%' : `${percent}%`.padStart(3) + ' ';
  const percentWidth = percentStr.length;
  
  // Calculate bar sections around the percentage
  const barWidth = innerWidth - percentWidth;
  const leftBarWidth = Math.floor(barWidth / 2);
  const rightBarWidth = barWidth - leftBarWidth;
  
  // Calculate filled portions based on total bar characters
  const totalBarChars = leftBarWidth + rightBarWidth;
  const filledTotal = Math.round((percent / 100) * totalBarChars);
  const filledLeft = Math.min(filledTotal, leftBarWidth);
  const filledRight = Math.max(0, filledTotal - leftBarWidth);
  
  // Build the bar
  const leftBar = PROGRESS.filled.repeat(filledLeft) + PROGRESS.empty.repeat(leftBarWidth - filledLeft);
  const rightBar = PROGRESS.filled.repeat(filledRight) + PROGRESS.empty.repeat(rightBarWidth - filledRight);
  
  return `[${leftBar}${percentStr}${rightBar}]`;
}

/**
 * KanbanBoard class - Main renderer
 */
class KanbanBoard {
  constructor(options = {}) {
    this.style = options.style || 'full';
    this.noColor = options.noColor || false;
    this.state = null;
    this.cycleState = null;
    this.executorStatus = { active: 0, total: 0 };
  }

  /**
   * Format the ALL PHASES column
   * @param {Array} phases - Array of phase objects {id, name, status}
   * @returns {Array<string>} Array of formatted lines
   */
  formatPhasesColumn(phases) {
    const lines = [];
    const width = WIDTHS.phases - 2; // minus borders
    
    if (!phases || phases.length === 0) {
      // Return empty column
      return Array(9).fill(' '.repeat(width));
    }
    
    // Group phases into rows of 4
    for (let i = 0; i < phases.length; i += 4) {
      const row = phases.slice(i, i + 4)
        .map(p => `P${p.id}`)
        .join(' ');
      lines.push(row.padEnd(width));
    }
    
    // Pad to minimum height
    while (lines.length < 9) {
      lines.push(' '.repeat(width));
    }
    
    return lines.slice(0, 9);
  }

  /**
   * Format the IN PROGRESS column (matches approved design)
   * Shows: Phase header, wave list with tree structure, tasks with status
   * @param {Object} currentPhase - {id, name, waves: [{id, status, tasks}], currentWave, totalWaves}
   * @returns {Array<string>} Array of formatted lines
   */
  formatInProgressColumn(currentPhase) {
    const lines = [];
    const width = WIDTHS.inProgress - 2;
    
    // IDLE STATE: No active phase
    if (!currentPhase) {
      // Check if all phases are done
      const allDone = this.state?.allPhasesComplete;
      if (allDone) {
        lines.push(' '.repeat(width));
        lines.push(' ✓ All     '.slice(0, width).padEnd(width));
        lines.push(' phases    '.slice(0, width).padEnd(width));
        lines.push(' done!     '.slice(0, width).padEnd(width));
      } else {
        lines.push(' '.repeat(width));
        lines.push('  No active'.slice(0, width).padEnd(width));
        lines.push('  phase    '.slice(0, width).padEnd(width));
        lines.push(' '.repeat(width));
        lines.push(' Run:      '.slice(0, width).padEnd(width));
        lines.push(' reis cycle'.slice(0, width).padEnd(width));
      }
      while (lines.length < 9) {
        lines.push(' '.repeat(width));
      }
      return lines.slice(0, 9);
    }
    
    // ACTIVE STATE: Show phase and wave structure
    // Header: current phase
    const phaseLine = `${ICONS.current} P${currentPhase.id} ${currentPhase.name || ''}`;
    lines.push(phaseLine.slice(0, width).padEnd(width));
    lines.push(' '.repeat(width));
    
    // Wave list with tree structure
    const waves = currentPhase.waves || [];
    const currentWaveNum = currentPhase.currentWave || currentPhase.wave || 1;
    const totalWaves = currentPhase.totalWaves || waves.length || 1;
    
    // Show wave status list
    for (let w = 1; w <= totalWaves && lines.length < 6; w++) {
      const waveData = waves[w - 1] || {};
      let waveIcon = ICONS.waiting;
      if (w < currentWaveNum || waveData.status === 'complete') {
        waveIcon = ICONS.complete;
      } else if (w === currentWaveNum || waveData.status === 'active') {
        waveIcon = ICONS.active;
      }
      const waveLine = `Wave ${w}/${totalWaves} ${waveIcon}`;
      lines.push(waveLine.slice(0, width).padEnd(width));
      
      // Show tasks under current wave with tree structure
      if (w === currentWaveNum && currentPhase.tasks && currentPhase.tasks.length > 0) {
        currentPhase.tasks.forEach((task, idx) => {
          if (lines.length >= 8) return;
          
          // Tree structure prefix
          const isLast = idx === currentPhase.tasks.length - 1;
          const prefix = isLast ? ' └' : ' ├';
          
          // Task icon
          let taskIcon = ICONS.waiting;
          if (task.status === 'complete' || task.progress === 100) {
            taskIcon = ICONS.complete;
          } else if (task.status === 'active' || task.status === 'running') {
            taskIcon = ICONS.active;
          } else if (task.status === 'failed') {
            taskIcon = ICONS.failed;
          }
          
          const taskLine = `${prefix} ${task.id} ${taskIcon}`;
          lines.push(taskLine.slice(0, width).padEnd(width));
        });
      }
    }
    
    // Pad to minimum height
    while (lines.length < 9) {
      lines.push(' '.repeat(width));
    }
    
    return lines.slice(0, 9);
  }

  /**
   * Format IN PROGRESS column for parallel wave execution
   * Shows multiple waves running simultaneously with progress
   * @param {Object} currentPhase - Current phase data
   * @param {Object} parallelState - Parallel execution state
   * @returns {Array<string>} Array of formatted lines
   */
  formatParallelInProgressColumn(currentPhase, parallelState) {
    const lines = [];
    const width = WIDTHS.inProgress - 2;
    
    if (!currentPhase || !parallelState?.enabled) {
      return this.formatInProgressColumn(currentPhase);
    }
    
    // Header: current phase
    const phaseLine = `${ICONS.current} P${currentPhase.id} ${currentPhase.name || ''}`;
    lines.push(phaseLine.slice(0, width).padEnd(width));
    lines.push(' '.repeat(width));
    
    // Parallel indicator
    const runningCount = parallelState.runningWaves?.length || 0;
    const maxConcurrent = parallelState.maxConcurrent || 4;
    const parallelLine = `${ICONS.parallel} Parallel (${runningCount}/${maxConcurrent})`;
    lines.push(parallelLine.slice(0, width).padEnd(width));
    
    // Show running waves with mini progress
    if (parallelState.runningWaves && parallelState.runningWaves.length > 0) {
      parallelState.runningWaves.slice(0, 4).forEach((wave, idx) => {
        const isLast = idx === Math.min(parallelState.runningWaves.length, 4) - 1;
        const prefix = isLast ? ' └' : ' ├';
        const progress = wave.progress || 0;
        const miniBar = progress >= 100 ? '██' : progress >= 50 ? '█░' : '░░';
        const waveLine = `${prefix} W${wave.number || wave.id} ${miniBar} ${ICONS.active}`;
        lines.push(waveLine.slice(0, width).padEnd(width));
      });
    }
    
    // Pad to minimum height
    while (lines.length < 9) {
      lines.push(' '.repeat(width));
    }
    
    return lines.slice(0, 9);
  }

  /**
   * Render parallel lanes visualization
   * Shows wave boxes side by side with progress
   * @param {Array} runningWaves - Currently running waves
   * @param {number} maxConcurrent - Max concurrent waves
   * @returns {Array<string>} Array of formatted lines for lanes display
   */
  renderParallelLanes(runningWaves, maxConcurrent = 4) {
    const lines = [];
    const laneWidth = 10;
    const waves = runningWaves || [];
    const displayCount = Math.min(waves.length, maxConcurrent);
    
    if (displayCount === 0) {
      return ['  No waves running'];
    }
    
    // Top border of boxes
    let topLine = '  ';
    for (let i = 0; i < displayCount; i++) {
      topLine += BOX.topLeft + BOX.horizontal.repeat(laneWidth - 2) + BOX.topRight;
      if (i < displayCount - 1) topLine += ' ';
    }
    lines.push(topLine);
    
    // Wave IDs row
    let idLine = '  ';
    for (let i = 0; i < displayCount; i++) {
      const wave = waves[i];
      const waveId = `W${wave.number || wave.id || i + 1}`.padEnd(laneWidth - 2).slice(0, laneWidth - 2);
      idLine += BOX.vertical + waveId + BOX.vertical;
      if (i < displayCount - 1) idLine += ' ';
    }
    lines.push(idLine);
    
    // Progress row
    let progressLine = '  ';
    for (let i = 0; i < displayCount; i++) {
      const wave = waves[i];
      const progress = wave.progress || 0;
      const icon = progress >= 100 ? ICONS.complete : ICONS.active;
      const pct = `${icon} ${progress}%`.padEnd(laneWidth - 2).slice(0, laneWidth - 2);
      progressLine += BOX.vertical + pct + BOX.vertical;
      if (i < displayCount - 1) progressLine += ' ';
    }
    lines.push(progressLine);
    
    // Name row (truncated)
    let nameLine = '  ';
    for (let i = 0; i < displayCount; i++) {
      const wave = waves[i];
      const name = (wave.name || 'wave').slice(0, laneWidth - 2).padEnd(laneWidth - 2);
      nameLine += BOX.vertical + name + BOX.vertical;
      if (i < displayCount - 1) nameLine += ' ';
    }
    lines.push(nameLine);
    
    // Bottom border
    let bottomLine = '  ';
    for (let i = 0; i < displayCount; i++) {
      bottomLine += BOX.bottomLeft + BOX.horizontal.repeat(laneWidth - 2) + BOX.bottomRight;
      if (i < displayCount - 1) bottomLine += ' ';
    }
    lines.push(bottomLine);
    
    return lines;
  }

  /**
   * Render dependency information
   * Shows which waves depend on which
   * @param {Map} dependencies - Map of waveId -> dependency wave IDs
   * @param {Set|Array} completedWaves - Set of completed wave IDs
   * @returns {Array<string>} Formatted dependency lines
   */
  renderDependencyInfo(dependencies, completedWaves) {
    const lines = [];
    const completed = completedWaves instanceof Set ? completedWaves : new Set(completedWaves || []);
    
    if (!dependencies || dependencies.size === 0) {
      return ['  No dependencies'];
    }
    
    lines.push('  Dependencies:');
    
    for (const [waveId, deps] of dependencies) {
      if (deps && deps.length > 0) {
        const depStatus = deps.map(d => {
          const isComplete = completed.has(d);
          return isComplete ? `${d} ${ICONS.complete}` : d;
        }).join(', ');
        
        const allDepsComplete = deps.every(d => completed.has(d));
        const statusIcon = allDepsComplete ? ICONS.complete : ICONS.waiting;
        
        lines.push(`    ${waveId} → ${depStatus} ${statusIcon}`);
      }
    }
    
    return lines;
  }

  /**
   * Render wave progress bar (individual wave)
   * @param {Object} wave - Wave object with id, progress, status
   * @returns {string} Formatted progress line
   */
  renderWaveProgress(wave) {
    const progress = wave.progress || 0;
    const bar = renderProgressBar(progress, 12);
    const status = wave.status || 'running';
    
    let icon = ICONS.active;
    if (status === 'complete' || progress >= 100) {
      icon = ICONS.complete;
    } else if (status === 'failed') {
      icon = ICONS.failed;
    } else if (status === 'waiting') {
      icon = ICONS.waiting;
    }
    
    const waveId = wave.id || `Wave ${wave.number}`;
    return `  ${waveId}: ${bar} ${icon}`;
  }

  /**
   * Format stage progress with bar and status icon
   * @param {number} percent - Progress percentage
   * @param {string} status - Status string
   * @param {number} width - Column width
   * @returns {string} Formatted progress line
   */
  formatStageProgress(percent, status, width) {
    const bar = renderProgressBar(percent);
    let statusIcon = '';
    if (status === 'complete') {
      statusIcon = ` ${ICONS.complete}`;
    } else if (status === 'active') {
      statusIcon = ` ${ICONS.active}`;
    } else if (status === 'failed') {
      statusIcon = ` ${ICONS.failed}`;
    }
    const suffix = typeof status === 'string' && !['complete', 'active', 'failed'].includes(status) ? ` ${status}` : '';
    return `${bar}${statusIcon}${suffix}`.slice(0, width).padEnd(width);
  }

  /**
   * Format the CYCLE column (matches approved design)
   * Shows: Stage name, progress bar with subagent name, running/waiting tasks under Execute
   * @param {Object} cycleState - {stage, stages: {planning, execute, verify, debug}, runningTasks, waitingTasks}
   * @returns {Array<Array<string>>} Array of [label, progress] pairs
   */
  formatCycleColumn(cycleState) {
    const labelWidth = WIDTHS.cycleLabel - 2;
    const progressWidth = WIDTHS.cycleProgress - 2;
    const lines = [];
    
    const stageConfig = [
      { name: 'Planning', subagent: 'planner' },
      { name: 'Execute', subagent: 'executor' },
      { name: 'Verify', subagent: 'verifier' },
      { name: 'Debug', subagent: 'debugger' }
    ];
    
    const stageData = cycleState?.stages || {};
    const runningTasks = cycleState?.runningTasks || [];
    const waitingTasks = cycleState?.waitingTasks || [];
    
    stageConfig.forEach((stageInfo) => {
      const stageName = stageInfo.name.toLowerCase();
      const data = stageData[stageName] || {};
      const percent = data.progress !== undefined ? data.progress : -1;
      const status = data.status || '';
      
      // Build progress line with subagent name
      const bar = renderProgressBar(percent, 16);
      let statusStr = '';
      if (status === 'complete') {
        statusStr = ` ${ICONS.complete} ${stageInfo.subagent}`;
      } else if (status === 'active') {
        statusStr = ` ${ICONS.active} ${stageInfo.subagent}`;
      } else if (status === 'failed') {
        statusStr = ` ${ICONS.failed} ${stageInfo.subagent}`;
      } else if (percent < 0) {
        statusStr = ` ${stageInfo.subagent}`;
      } else {
        statusStr = ` ${stageInfo.subagent}`;
      }
      
      const progressLine = `${bar}${statusStr}`.slice(0, progressWidth).padEnd(progressWidth);
      lines.push([stageInfo.name.padEnd(labelWidth), progressLine]);
      
      // Show running and waiting tasks under Execute stage
      if (stageInfo.name === 'Execute' && status === 'active') {
        // Show parallel indicator and running count
        if (runningTasks.length > 0 || waitingTasks.length > 0) {
          const totalTasks = runningTasks.length + waitingTasks.length;
          const summaryLabel = `${ICONS.parallel}${runningTasks.length} of ${totalTasks}`.padEnd(labelWidth);
          const summaryProgress = `(${waitingTasks.length} waiting)`.padEnd(progressWidth);
          lines.push([summaryLabel, summaryProgress]);
        }
        
        // Show running tasks
        if (runningTasks.length > 0) {
          lines.push(['Running:'.padEnd(labelWidth), ' '.repeat(progressWidth)]);
          runningTasks.forEach((task, idx) => {
            if (lines.length >= 8) return;
            const prefix = idx === runningTasks.length - 1 && waitingTasks.length === 0 ? ' └' : ' ├';
            const taskLabel = `${prefix} ${task.id}`.padEnd(labelWidth);
            const taskBar = renderProgressBar(task.progress || 0, 16);
            const taskStatus = task.status === 'complete' ? ` ${ICONS.complete}` : ` ${ICONS.active}`;
            lines.push([taskLabel, `${taskBar}${taskStatus}`.slice(0, progressWidth).padEnd(progressWidth)]);
          });
        }
        
        // Show waiting tasks
        if (waitingTasks.length > 0 && lines.length < 8) {
          lines.push(['Waiting:'.padEnd(labelWidth), ' '.repeat(progressWidth)]);
          const waitList = waitingTasks.map(t => `${t.id} → ${t.dependsOn}`).join(', ');
          lines.push([` └ ${waitingTasks.map(t => t.id).join(', ')}`.slice(0, labelWidth).padEnd(labelWidth), 
                      waitList.slice(0, progressWidth).padEnd(progressWidth)]);
        }
      }
    });
    
    // Pad to minimum height
    while (lines.length < 9) {
      lines.push([' '.repeat(labelWidth), ' '.repeat(progressWidth)]);
    }
    
    return lines.slice(0, 9);
  }

  /**
   * Format the COMPLETED column (matches approved design)
   * Shows completed cycles or "No cycles completed" for idle state
   * @param {Array} completedCycles - [{id, phase, status}]
   * @returns {Array<string>} Array of formatted lines
   */
  formatCompletedColumn(completedCycles) {
    const lines = [];
    const width = WIDTHS.completed - 2;
    
    if (!completedCycles || completedCycles.length === 0) {
      // Idle state: No cycles completed
      lines.push(' '.repeat(width));
      lines.push(' '.repeat(width));
      lines.push('  No cycles '.slice(0, width).padEnd(width));
      lines.push('  completed '.slice(0, width).padEnd(width));
    } else {
      // Show completed cycles
      completedCycles.forEach(cycle => {
        if (lines.length >= 8) return;
        const cycleId = cycle.id !== undefined ? cycle.id : cycle.phase;
        const phaseId = cycle.phase !== undefined ? cycle.phase : cycle.id;
        const icon = cycle.status === 'failed' ? ICONS.failed : ICONS.complete;
        const line = `Cycle-${cycleId} (P${phaseId}) ${icon}`;
        lines.push(line.slice(0, width).padEnd(width));
      });
    }
    
    // Pad to minimum height
    while (lines.length < 9) {
      lines.push(' '.repeat(width));
    }
    
    return lines.slice(0, 9);
  }

  /**
   * Render full kanban board with all columns (matches approved design)
   * @returns {string} Complete ASCII board
   */
  renderFull() {
    const lines = [];
    
    // Get column data
    const phasesCol = this.formatPhasesColumn(this.state?.phases || []);
    const inProgressCol = this.formatInProgressColumn(this.state?.currentPhase);
    const cycleCol = this.formatCycleColumn(this.cycleState);
    const completedCol = this.formatCompletedColumn(this.state?.completedCycles || []);
    
    // Header row
    lines.push(
      BOX.topLeft + 
      BOX.horizontal.repeat(WIDTHS.phases - 1) + BOX.teeDown +
      BOX.horizontal.repeat(WIDTHS.inProgress - 1) + BOX.teeDown +
      BOX.horizontal.repeat(WIDTHS.cycleLabel + WIDTHS.cycleProgress - 1) + BOX.teeDown +
      BOX.horizontal.repeat(WIDTHS.completed - 1) + BOX.topRight
    );
    
    // Column headers
    const headers = [
      ' ALL PHASES '.padEnd(WIDTHS.phases - 1),
      ' IN PROGRESS'.padEnd(WIDTHS.inProgress - 1),
      '              CYCLE               '.padEnd(WIDTHS.cycleLabel + WIDTHS.cycleProgress - 1),
      '   COMPLETED    '.padEnd(WIDTHS.completed - 1)
    ];
    lines.push(BOX.vertical + headers.join(BOX.vertical) + BOX.vertical);
    
    // Header separator with sub-header for CYCLE
    lines.push(
      BOX.teeRight + 
      BOX.horizontal.repeat(WIDTHS.phases - 1) + BOX.cross +
      BOX.horizontal.repeat(WIDTHS.inProgress - 1) + BOX.cross +
      BOX.horizontal.repeat(WIDTHS.cycleLabel - 1) + BOX.teeDown +
      BOX.horizontal.repeat(WIDTHS.cycleProgress - 1) + BOX.cross +
      BOX.horizontal.repeat(WIDTHS.completed - 1) + BOX.teeLeft
    );
    
    // Data rows (9 rows to match approved design)
    for (let i = 0; i < 9; i++) {
      const cycleData = cycleCol[i] || [' '.repeat(WIDTHS.cycleLabel - 2), ' '.repeat(WIDTHS.cycleProgress - 2)];
      const row = [
        ' ' + (phasesCol[i] || ' '.repeat(WIDTHS.phases - 2)),
        ' ' + (inProgressCol[i] || ' '.repeat(WIDTHS.inProgress - 2)),
        ' ' + cycleData[0],
        ' ' + cycleData[1],
        ' ' + (completedCol[i] || ' '.repeat(WIDTHS.completed - 2))
      ];
      lines.push(BOX.vertical + row.join(BOX.vertical) + BOX.vertical);
    }
    
    // Footer
    lines.push(
      BOX.bottomLeft + 
      BOX.horizontal.repeat(WIDTHS.phases - 1) + BOX.teeUp +
      BOX.horizontal.repeat(WIDTHS.inProgress - 1) + BOX.teeUp +
      BOX.horizontal.repeat(WIDTHS.cycleLabel - 1) + BOX.teeUp +
      BOX.horizontal.repeat(WIDTHS.cycleProgress - 1) + BOX.teeUp +
      BOX.horizontal.repeat(WIDTHS.completed - 1) + BOX.bottomRight
    );
    
    return lines.join('\n');
  }

  /**
   * Render compact single-line summary
   * @returns {string} Single line like: "P1 Setup [■■░░ 38%] Execute ⫴2/4 | Completed: 0"
   */
  renderCompact() {
    const phase = this.state?.currentPhase;
    const phaseName = phase ? `P${phase.id} ${phase.name || ''}`.trim() : 'No active phase';
    
    // Current stage and progress
    const stages = this.cycleState?.stages || {};
    let currentStage = 'Idle';
    let progress = -1;
    
    for (const [name, data] of Object.entries(stages)) {
      if (data.status === 'active' || (data.progress > 0 && data.progress < 100)) {
        currentStage = name.charAt(0).toUpperCase() + name.slice(1);
        progress = data.progress !== undefined ? data.progress : 0;
        break;
      }
    }
    
    const progressBar = renderProgressBar(progress, 12);
    
    // Executor status
    const execStatus = this.executorStatus.total > 0 
      ? ` ${ICONS.parallel}${this.executorStatus.active}/${this.executorStatus.total}` 
      : '';
    
    // Completed count
    const completedCount = this.state?.completedCycles?.length || 0;
    
    // Build the compact line with box
    const content = `${phaseName} ${progressBar} ${currentStage}${execStatus} | Completed: ${completedCount}`;
    const boxWidth = content.length + 4;
    
    const lines = [
      BOX.topLeft + BOX.horizontal.repeat(boxWidth) + BOX.topRight,
      BOX.vertical + '  ' + content + '  ' + BOX.vertical,
      BOX.bottomLeft + BOX.horizontal.repeat(boxWidth) + BOX.bottomRight
    ];
    
    return lines.join('\n');
  }

  /**
   * Render minimal text-only status
   * @returns {string} Just status text like: "▶ P1 Setup │ Execute [■■░░ 38%] ⫴2/4 │ Cycles: 1 done"
   */
  renderMinimal() {
    const phase = this.state?.currentPhase;
    const phaseName = phase ? `${ICONS.current} P${phase.id} ${phase.name || ''}`.trim() : 'Idle';
    
    // Current stage and progress
    const stages = this.cycleState?.stages || {};
    let currentStage = '';
    let progress = -1;
    
    for (const [name, data] of Object.entries(stages)) {
      if (data.status === 'active' || (data.progress > 0 && data.progress < 100)) {
        currentStage = name.charAt(0).toUpperCase() + name.slice(1);
        progress = data.progress !== undefined ? data.progress : 0;
        break;
      }
    }
    
    // Executor status
    const execStatus = this.executorStatus.total > 0 
      ? ` ${ICONS.parallel}${this.executorStatus.active}/${this.executorStatus.total}` 
      : '';
    
    // Completed count
    const completedCount = this.state?.completedCycles?.length || 0;
    
    if (!currentStage) {
      return `${phaseName} │ Cycles: ${completedCount} done`;
    }
    
    const progressBar = renderProgressBar(progress, 14);
    const separator = BOX.horizontal.repeat(60);
    
    return `${phaseName} │ ${currentStage} ${progressBar}${execStatus} │ Cycles: ${completedCount} done\n${separator}`;
  }

  /**
   * Render kanban board in configured style
   * @returns {string} Rendered board
   */
  render() {
    switch (this.style) {
      case 'compact':
        return this.renderCompact();
      case 'minimal':
        return this.renderMinimal();
      case 'full':
      default:
        return this.renderFull();
    }
  }

  /**
   * Load state from cycle-state-manager and state-manager
   */
  loadState() {
    // Load cycle state
    try {
      const cycleStateManager = require('./cycle-state-manager');
      this.cycleState = cycleStateManager.loadState();
    } catch (e) {
      this.cycleState = null;
    }
    
    // Initialize state object
    this.state = this.state || {};
    
    // Load phases from ROADMAP.md
    try {
      const roadmapPath = path.join(process.cwd(), '.planning', 'ROADMAP.md');
      if (fs.existsSync(roadmapPath)) {
        const content = fs.readFileSync(roadmapPath, 'utf8');
        // Extract phases (simple regex for Phase N patterns)
        const phaseMatches = content.match(/Phase\s+(\d+)/gi) || [];
        const phaseIds = [...new Set(phaseMatches.map(m => parseInt(m.match(/\d+/)[0])))];
        this.state.phases = phaseIds.sort((a, b) => a - b).map(id => ({ id }));
      }
    } catch (e) {
      // ROADMAP loading is optional
    }
    
    // Get current phase from cycle state
    if (this.cycleState?.phase !== undefined) {
      this.state.currentPhase = {
        id: this.cycleState.phase,
        name: this.cycleState.planPath?.split('/').pop()?.replace('.PLAN.md', '') || '',
        tasks: []
      };
    }
    
    // Load completed cycles from cycle state
    if (this.cycleState?.completedPhases) {
      this.state.completedCycles = this.cycleState.completedPhases.map((p, i) => ({
        id: i,
        phase: typeof p === 'object' ? p.phase : p
      }));
    }
    
    // Apply any stored executor status
    if (module.exports._executorStatus) {
      this.executorStatus = module.exports._executorStatus;
    }
  }
}

/**
 * Show kanban board (main entry point for commands)
 * @param {Object} options - {style, noKanban, forceShow}
 * @returns {boolean} Whether kanban was shown
 */
function showKanbanBoard(options = {}) {
  // Check if kanban should be shown
  if (options.noKanban) {
    return false;
  }
  
  // Load config
  let config = {};
  try {
    const { loadConfig } = require('./config');
    config = loadConfig() || {};
  } catch (e) {
    // Config loading is optional
  }
  
  // Check if enabled (default true)
  const kanbanConfig = config.kanban || {};
  if (kanbanConfig.enabled === false && !options.forceShow) {
    return false;
  }
  
  // Create and render board
  const style = options.style || kanbanConfig.style || 'full';
  const board = new KanbanBoard({ style, noColor: options.noColor });
  board.loadState();
  
  console.log('');
  console.log(board.render());
  console.log('');
  
  return true;
}

/**
 * Update executor status for parallel tracking
 * @param {number} active - Active executor count
 * @param {number} total - Total executor count
 */
function updateExecutorStatus(active, total) {
  // Store in module-level state for next render
  module.exports._executorStatus = { active, total };
}

/**
 * Update parallel wave state for kanban display
 * @param {Object} state - Parallel wave state
 * @param {boolean} state.enabled - Whether parallel execution is enabled
 * @param {number} state.maxConcurrent - Max concurrent waves
 * @param {Array} state.runningWaves - Currently running waves [{id, progress, name, number}]
 * @param {Array} state.waitingWaves - Waiting waves [{id, dependsOn}]
 * @param {Array} state.completedWaves - Completed waves [{id, duration}]
 * @param {Map|Object} state.dependencies - Wave dependencies map
 */
function updateParallelWaveState(state) {
  if (!state) {
    parallelWaveState = {
      enabled: false,
      maxConcurrent: 4,
      runningWaves: [],
      waitingWaves: [],
      completedWaves: [],
      dependencies: new Map()
    };
    return;
  }
  
  parallelWaveState = {
    enabled: state.enabled ?? parallelWaveState.enabled,
    maxConcurrent: state.maxConcurrent ?? parallelWaveState.maxConcurrent,
    runningWaves: state.runningWaves ?? parallelWaveState.runningWaves,
    waitingWaves: state.waitingWaves ?? parallelWaveState.waitingWaves,
    completedWaves: state.completedWaves ?? parallelWaveState.completedWaves,
    dependencies: state.dependencies instanceof Map 
      ? state.dependencies 
      : new Map(Object.entries(state.dependencies || {}))
  };
  
  // Also update executor status for backward compatibility
  module.exports._executorStatus = {
    active: parallelWaveState.runningWaves.length,
    total: parallelWaveState.runningWaves.length + 
           parallelWaveState.waitingWaves.length + 
           parallelWaveState.completedWaves.length
  };
}

/**
 * Get current parallel wave state
 * @returns {Object} Current parallel wave state
 */
function getParallelWaveState() {
  return { ...parallelWaveState };
}

/**
 * Render standalone parallel execution display
 * For use outside of main kanban board
 * @param {Object} options - Display options
 * @returns {string} Formatted parallel execution display
 */
function renderParallelExecutionDisplay(options = {}) {
  const board = new KanbanBoard(options);
  const lines = [];
  
  const state = parallelWaveState;
  if (!state.enabled) {
    return '';
  }
  
  // Header
  lines.push('');
  lines.push(BOX.topLeft + BOX.horizontal.repeat(50) + BOX.topRight);
  lines.push(BOX.vertical + '  Parallel Wave Execution'.padEnd(50) + BOX.vertical);
  lines.push(BOX.teeRight + BOX.horizontal.repeat(50) + BOX.teeLeft);
  
  // Running waves section
  const runningCount = state.runningWaves.length;
  const maxConcurrent = state.maxConcurrent;
  lines.push(BOX.vertical + `  ${ICONS.parallel} Active Lanes: ${runningCount}/${maxConcurrent}`.padEnd(50) + BOX.vertical);
  lines.push(BOX.vertical + ' '.repeat(50) + BOX.vertical);
  
  // Parallel lanes visualization
  if (runningCount > 0) {
    const laneLines = board.renderParallelLanes(state.runningWaves, maxConcurrent);
    laneLines.forEach(line => {
      lines.push(BOX.vertical + line.padEnd(50) + BOX.vertical);
    });
  } else {
    lines.push(BOX.vertical + '  No waves currently running'.padEnd(50) + BOX.vertical);
  }
  
  lines.push(BOX.vertical + ' '.repeat(50) + BOX.vertical);
  
  // Dependencies section
  if (state.dependencies && state.dependencies.size > 0) {
    const completedIds = new Set(state.completedWaves.map(w => w.id));
    const depLines = board.renderDependencyInfo(state.dependencies, completedIds);
    depLines.forEach(line => {
      lines.push(BOX.vertical + line.padEnd(50) + BOX.vertical);
    });
  }
  
  // Completed waves
  if (state.completedWaves.length > 0) {
    lines.push(BOX.vertical + ' '.repeat(50) + BOX.vertical);
    lines.push(BOX.vertical + '  Completed Waves:'.padEnd(50) + BOX.vertical);
    state.completedWaves.slice(-3).forEach(wave => {
      const duration = wave.duration ? ` (${(wave.duration / 1000).toFixed(1)}s)` : '';
      const line = `    ${wave.id} ${ICONS.complete}${duration}`;
      lines.push(BOX.vertical + line.padEnd(50) + BOX.vertical);
    });
  }
  
  // Footer
  lines.push(BOX.bottomLeft + BOX.horizontal.repeat(50) + BOX.bottomRight);
  lines.push('');
  
  return lines.join('\n');
}

/**
 * Check if kanban should be shown based on config
 * @param {Object} options - Override options
 * @returns {boolean} Whether kanban should show
 */
function shouldShowKanban(options = {}) {
  if (options.noKanban) {
    return false;
  }
  if (options.forceShow) {
    return true;
  }
  
  try {
    const { loadConfig } = require('./config');
    const config = loadConfig() || {};
    const kanbanConfig = config.kanban || {};
    return kanbanConfig.enabled !== false;
  } catch (e) {
    return true; // Default to showing
  }
}

/**
 * Get current kanban state (for testing/debugging)
 * @returns {Object} Current state object
 */
function getKanbanState() {
  const board = new KanbanBoard();
  board.loadState();
  return {
    state: board.state,
    cycleState: board.cycleState,
    executorStatus: board.executorStatus
  };
}

// Export everything
module.exports = {
  KanbanBoard,
  BOX,
  PROGRESS,
  ICONS,
  WIDTHS,
  renderProgressBar,
  showKanbanBoard,
  updateExecutorStatus,
  updateParallelWaveState,
  getParallelWaveState,
  renderParallelExecutionDisplay,
  shouldShowKanban,
  getKanbanState
};
