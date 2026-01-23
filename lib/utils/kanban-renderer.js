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

// Column widths
const WIDTHS = {
  phases: 13,
  inProgress: 13,
  cycleLabel: 13,
  cycleProgress: 29,
  completed: 17
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
      return Array(7).fill(' '.repeat(width));
    }
    
    // Group phases into rows of 4
    for (let i = 0; i < phases.length; i += 4) {
      const row = phases.slice(i, i + 4)
        .map(p => `P${p.id}`)
        .join(' ');
      lines.push(row.padEnd(width));
    }
    
    // Pad to minimum height
    while (lines.length < 7) {
      lines.push(' '.repeat(width));
    }
    
    return lines.slice(0, 7);
  }

  /**
   * Format the IN PROGRESS column
   * @param {Object} currentPhase - {id, name, tasks: [{id, name, progress, status}]}
   * @returns {Array<string>} Array of formatted lines
   */
  formatInProgressColumn(currentPhase) {
    const lines = [];
    const width = WIDTHS.inProgress - 2;
    
    if (!currentPhase) {
      return Array(7).fill(' '.repeat(width));
    }
    
    // Header: current phase
    const phaseLine = `${ICONS.current} P${currentPhase.id} ${currentPhase.name || ''}`;
    lines.push(phaseLine.slice(0, width).padEnd(width));
    lines.push(' '.repeat(width)); // spacer
    
    // Tasks
    const tasks = currentPhase.tasks || [];
    tasks.forEach(task => {
      const icon = task.status === 'active' ? ICONS.active : ICONS.waiting;
      const progress = task.progress !== undefined && task.progress !== null ? ` ${task.progress}%` : '';
      const line = ` ${icon} ${task.id}${progress}`;
      lines.push(line.slice(0, width).padEnd(width));
    });
    
    // Pad to minimum height
    while (lines.length < 7) {
      lines.push(' '.repeat(width));
    }
    
    return lines.slice(0, 7);
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
   * Format the CYCLE column (label + progress)
   * @param {Object} cycleState - {stage, stages: {planning, execute, verify, debug}}
   * @returns {Array<Array<string>>} Array of [label, progress] pairs
   */
  formatCycleColumn(cycleState) {
    const labelWidth = WIDTHS.cycleLabel - 2;
    const progressWidth = WIDTHS.cycleProgress - 2;
    const lines = [];
    
    const stages = ['Planning', 'Execute', 'Verify', 'Debug'];
    const stageData = cycleState?.stages || {};
    
    stages.forEach((stage) => {
      const data = stageData[stage.toLowerCase()] || {};
      const percent = data.progress !== undefined ? data.progress : -1;
      const status = data.status || '';
      
      // Label column
      let label = stage;
      
      if (stage === 'Execute' && data.tasks && data.tasks.length > 0) {
        // Show sub-tasks under Execute
        lines.push([label.padEnd(labelWidth), this.formatStageProgress(percent, status, progressWidth)]);
        data.tasks.forEach((task, i) => {
          const prefix = i === data.tasks.length - 1 ? ' └' : ' ├';
          const taskLabel = `${prefix} ${task.id}`;
          lines.push([taskLabel.padEnd(labelWidth), this.formatStageProgress(task.progress, task.status, progressWidth)]);
        });
      } else if (stage === 'Execute' && data.waiting && data.waiting.length > 0) {
        // Show waiting tasks
        lines.push([label.padEnd(labelWidth), this.formatStageProgress(percent, status, progressWidth)]);
        const waitLine = `Waiting:`.padEnd(labelWidth);
        const waitInfo = data.waiting.map(w => `${w.task} → ${w.dep}`).join(', ');
        lines.push([waitLine, waitInfo.slice(0, progressWidth).padEnd(progressWidth)]);
      } else {
        lines.push([label.padEnd(labelWidth), this.formatStageProgress(percent, status, progressWidth)]);
      }
    });
    
    // Pad to minimum height
    while (lines.length < 7) {
      lines.push([' '.repeat(labelWidth), ' '.repeat(progressWidth)]);
    }
    
    return lines.slice(0, 7);
  }

  /**
   * Format the COMPLETED column
   * @param {Array} completedCycles - [{id, phase, status}]
   * @returns {Array<string>} Array of formatted lines
   */
  formatCompletedColumn(completedCycles) {
    const lines = [];
    const width = WIDTHS.completed - 2;
    
    (completedCycles || []).forEach(cycle => {
      const cycleId = cycle.id !== undefined ? cycle.id : cycle.phase;
      const phaseId = cycle.phase !== undefined ? cycle.phase : cycle.id;
      const icon = cycle.status === 'failed' ? ICONS.failed : ICONS.complete;
      const line = `Cycle-${cycleId} (P${phaseId}) ${icon}`;
      lines.push(line.slice(0, width).padEnd(width));
    });
    
    // Pad to minimum height
    while (lines.length < 7) {
      lines.push(' '.repeat(width));
    }
    
    return lines.slice(0, 7);
  }

  /**
   * Render full kanban board with all columns
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
      '             CYCLE              '.padEnd(WIDTHS.cycleLabel + WIDTHS.cycleProgress - 1),
      '   COMPLETED   '.padEnd(WIDTHS.completed - 1)
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
    
    // Data rows (7 rows)
    for (let i = 0; i < 7; i++) {
      const cycleData = cycleCol[i] || [' '.repeat(WIDTHS.cycleLabel - 2), ' '.repeat(WIDTHS.cycleProgress - 2)];
      const row = [
        ' ' + phasesCol[i],
        ' ' + inProgressCol[i],
        ' ' + cycleData[0],
        ' ' + cycleData[1],
        ' ' + completedCol[i]
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
  shouldShowKanban,
  getKanbanState
};
