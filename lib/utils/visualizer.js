/**
 * Visualizer Utility for REIS v2.0
 * Provides ASCII chart rendering, progress bars, and timeline visualization
 */

const chalk = require('chalk');

/**
 * Create a horizontal bar chart
 * @param {Array<{label: string, value: number}>} data - Chart data
 * @param {Object} options - Chart options
 * @param {number} [options.width=50] - Width of the bars in characters
 * @param {boolean} [options.showValues=true] - Show numeric values
 * @param {number} [options.maxValue] - Maximum value for scaling (auto-detected if not provided)
 * @param {boolean} [options.colors=true] - Enable color coding
 * @param {string} [options.barChar='█'] - Character to use for bars
 * @returns {string} Formatted bar chart
 */
function createBarChart(data, options = {}) {
  const {
    width = 50,
    showValues = true,
    maxValue = null,
    colors = true,
    barChar = '█'
  } = options;

  if (!data || data.length === 0) {
    return 'No data to display';
  }

  const max = maxValue || Math.max(...data.map(d => d.value));
  if (max === 0) {
    return data.map(d => `${d.label}  (no data)`).join('\n');
  }

  // Find the longest label for alignment
  const maxLabelLength = Math.max(...data.map(d => d.label.length));

  const lines = data.map(item => {
    const barLength = Math.round((item.value / max) * width);
    const bar = barChar.repeat(barLength);
    const paddedLabel = item.label.padEnd(maxLabelLength);
    
    // Color code based on value relative to max
    let coloredBar = bar;
    if (colors) {
      const percentage = item.value / max;
      if (percentage >= 0.7) {
        coloredBar = chalk.green(bar);
      } else if (percentage >= 0.4) {
        coloredBar = chalk.yellow(bar);
      } else {
        coloredBar = chalk.red(bar);
      }
    }

    const valueText = showValues ? ` ${item.value}` : '';
    return `${paddedLabel}  ${coloredBar}${valueText}`;
  });

  return lines.join('\n');
}

/**
 * Create a timeline visualization
 * @param {Array<{timestamp: Date|string, label: string, status: string}>} events - Timeline events
 * @param {Object} options - Timeline options
 * @param {number} [options.width=60] - Maximum width in characters
 * @param {boolean} [options.showDates=true] - Show date/time stamps
 * @param {string} [options.groupBy] - Group events by 'day', 'hour', etc.
 * @param {boolean} [options.colors=true] - Enable color coding
 * @returns {string} Formatted timeline
 */
function createTimeline(events, options = {}) {
  const {
    width = 60,
    showDates = true,
    groupBy = null,
    colors = true
  } = options;

  if (!events || events.length === 0) {
    return 'No events to display';
  }

  const lines = events.map(event => {
    const timestamp = event.timestamp instanceof Date 
      ? event.timestamp 
      : new Date(event.timestamp);
    
    const dateStr = showDates ? formatTimestamp(timestamp) : '';
    const statusIcon = colorizeStatus(event.status, colors);
    const label = truncateText(event.label, width - dateStr.length - 5);
    
    return `${dateStr} ${statusIcon} ${label}`;
  });

  return lines.join('\n');
}

/**
 * Create a progress bar
 * @param {number} current - Current progress value
 * @param {number} total - Total value
 * @param {Object} options - Progress bar options
 * @param {number} [options.width=40] - Width of the progress bar
 * @param {boolean} [options.showPercent=true] - Show percentage
 * @param {string} [options.style='bar'] - Style: 'bar', 'blocks', 'dots'
 * @param {boolean} [options.colors=true] - Enable color coding
 * @param {number} [options.eta] - Estimated time to completion in ms
 * @returns {string} Formatted progress bar
 */
function createProgressBar(current, total, options = {}) {
  const {
    width = 40,
    showPercent = true,
    style = 'bar',
    colors = true,
    eta = null
  } = options;

  if (total === 0) {
    return '[No progress data]';
  }

  const percentage = Math.min(Math.max((current / total) * 100, 0), 100);
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;

  let filledChar, emptyChar;
  switch (style) {
    case 'blocks':
      filledChar = '▓';
      emptyChar = '░';
      break;
    case 'dots':
      filledChar = '●';
      emptyChar = '○';
      break;
    default: // 'bar'
      filledChar = '█';
      emptyChar = '░';
  }

  const bar = filledChar.repeat(filled) + emptyChar.repeat(empty);
  const coloredBar = colors ? chalk.cyan(bar) : bar;
  
  const percentText = showPercent ? ` ${percentage.toFixed(0)}%` : '';
  const ratioText = ` (${current}/${total})`;
  const etaText = eta ? ` ETA: ${formatDuration(eta)}` : '';

  return `[${coloredBar}]${percentText}${ratioText}${etaText}`;
}

/**
 * Create a distribution chart (histogram)
 * @param {Array<number>} data - Array of numeric values
 * @param {Object} options - Distribution options
 * @param {number} [options.bins=10] - Number of bins/buckets
 * @param {number} [options.width=50] - Width of the bars
 * @param {boolean} [options.showStats=true] - Show statistics (mean, median, etc.)
 * @param {boolean} [options.colors=true] - Enable color coding
 * @returns {string} Formatted distribution chart
 */
function createDistribution(data, options = {}) {
  const {
    bins = 10,
    width = 50,
    showStats = true,
    colors = true
  } = options;

  if (!data || data.length === 0) {
    return 'No data to display';
  }

  const stats = calculateStats(data);
  const min = stats.min;
  const max = stats.max;
  const range = max - min;
  const binSize = range / bins;

  // Create bins
  const binCounts = new Array(bins).fill(0);
  data.forEach(value => {
    let binIndex = Math.floor((value - min) / binSize);
    if (binIndex >= bins) binIndex = bins - 1; // Handle max value
    binCounts[binIndex]++;
  });

  // Create chart data
  const chartData = binCounts.map((count, i) => {
    const binStart = min + (i * binSize);
    const binEnd = binStart + binSize;
    return {
      label: `${binStart.toFixed(1)}-${binEnd.toFixed(1)}`,
      value: count
    };
  });

  let result = createBarChart(chartData, { width, showValues: true, colors, barChar: '▓' });

  if (showStats) {
    result += '\n\nStatistics:';
    result += `\n  Mean:   ${stats.mean.toFixed(2)}`;
    result += `\n  Median: ${stats.median.toFixed(2)}`;
    result += `\n  StdDev: ${stats.stdDev.toFixed(2)}`;
    result += `\n  Min:    ${stats.min.toFixed(2)}`;
    result += `\n  Max:    ${stats.max.toFixed(2)}`;
  }

  return result;
}

/**
 * Create a formatted text table
 * @param {Array<string>} headers - Column headers
 * @param {Array<Array<any>>} rows - Table rows
 * @param {Object} options - Table options
 * @param {Array<string>} [options.alignments] - Column alignments: 'left', 'right', 'center'
 * @param {boolean} [options.borders=true] - Show borders
 * @param {Array<number>} [options.columnWidths] - Fixed column widths
 * @param {boolean} [options.colors=true] - Enable color coding for headers
 * @returns {string} Formatted table
 */
function createTable(headers, rows, options = {}) {
  const {
    alignments = [],
    borders = true,
    columnWidths = null,
    colors = true
  } = options;

  if (!headers || headers.length === 0) {
    return 'No table headers provided';
  }

  // Calculate column widths
  const colWidths = columnWidths || headers.map((header, i) => {
    const headerWidth = header.length;
    const maxRowWidth = rows.reduce((max, row) => {
      const cellValue = String(row[i] || '');
      return Math.max(max, cellValue.length);
    }, 0);
    return Math.max(headerWidth, maxRowWidth);
  });

  // Format cell with alignment
  const formatCell = (value, width, align = 'left') => {
    const str = String(value || '');
    if (align === 'right') {
      return str.padStart(width);
    } else if (align === 'center') {
      const totalPad = width - str.length;
      const leftPad = Math.floor(totalPad / 2);
      const rightPad = totalPad - leftPad;
      return ' '.repeat(leftPad) + str + ' '.repeat(rightPad);
    }
    return str.padEnd(width);
  };

  // Create separator line
  const separator = borders
    ? '─' + colWidths.map(w => '─'.repeat(w + 2)).join('┼') + '─'
    : '';

  // Format header
  const headerRow = headers.map((h, i) => 
    formatCell(h, colWidths[i], alignments[i] || 'left')
  ).join(borders ? ' │ ' : '  ');
  
  const coloredHeader = colors ? chalk.bold.cyan(headerRow) : headerRow;

  // Format rows
  const formattedRows = rows.map(row =>
    row.map((cell, i) => formatCell(cell, colWidths[i], alignments[i] || 'left'))
      .join(borders ? ' │ ' : '  ')
  );

  // Assemble table
  const lines = [];
  if (borders) lines.push(separator);
  lines.push(coloredHeader);
  if (borders) lines.push(separator);
  lines.push(...formattedRows);
  if (borders) lines.push(separator);

  return lines.join('\n');
}

/**
 * Format duration in milliseconds to human-readable string
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration (e.g., "2h 15m", "45s")
 */
function formatDuration(ms) {
  if (ms < 0) return '0s';
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  return `${seconds}s`;
}

/**
 * Format timestamp to consistent string
 * @param {Date} date - Date object
 * @param {string} [format='datetime'] - Format type: 'datetime', 'date', 'time'
 * @returns {string} Formatted timestamp
 */
function formatTimestamp(date, format = 'datetime') {
  if (!(date instanceof Date) || isNaN(date)) {
    return 'Invalid Date';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  switch (format) {
    case 'date':
      return `${year}-${month}-${day}`;
    case 'time':
      return `${hours}:${minutes}:${seconds}`;
    default: // 'datetime'
      return `${year}-${month}-${day} ${hours}:${minutes}`;
  }
}

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) {
    return text || '';
  }
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Apply color to status indicators
 * @param {string} status - Status string (success, failure, pending, etc.)
 * @param {boolean} [colors=true] - Enable colors
 * @returns {string} Colored status icon
 */
function colorizeStatus(status, colors = true) {
  const statusLower = (status || '').toLowerCase();
  
  let icon, color;
  if (statusLower.includes('success') || statusLower.includes('complete') || statusLower === 'done') {
    icon = '✓';
    color = chalk.green;
  } else if (statusLower.includes('fail') || statusLower.includes('error')) {
    icon = '✗';
    color = chalk.red;
  } else if (statusLower.includes('progress') || statusLower.includes('running')) {
    icon = '⧗';
    color = chalk.yellow;
  } else if (statusLower.includes('pending') || statusLower.includes('waiting')) {
    icon = '○';
    color = chalk.gray;
  } else if (statusLower.includes('warning')) {
    icon = '⚠';
    color = chalk.yellow;
  } else {
    icon = '●';
    color = chalk.blue;
  }

  return colors ? color(icon) : icon;
}

/**
 * Calculate statistical values for an array of numbers
 * @param {Array<number>} values - Array of numeric values
 * @returns {Object} Statistics object with mean, median, stdDev, min, max
 */
function calculateStats(values) {
  if (!values || values.length === 0) {
    return { mean: 0, median: 0, stdDev: 0, min: 0, max: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((acc, val) => acc + val, 0);
  const mean = sum / values.length;

  // Median
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];

  // Standard deviation
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((acc, val) => acc + val, 0) / values.length;
  const stdDev = Math.sqrt(avgSquaredDiff);

  return {
    mean,
    median,
    stdDev,
    min: sorted[0],
    max: sorted[sorted.length - 1]
  };
}

/**
 * Count total nodes in a tree
 * @param {Object} treeData - Tree data with branches
 * @returns {number} Total number of nodes
 */
function countNodes(treeData) {
  if (!treeData || !treeData.branches) return 0;
  
  let count = 0;
  const countBranches = (branches) => {
    branches.forEach(branch => {
      count++;
      if (branch.children && branch.children.length > 0) {
        countBranches(branch.children);
      }
    });
  };
  
  countBranches(treeData.branches);
  return count;
}

/**
 * Render decision tree to terminal with enhanced features
 * @param {Object} treeData - Parsed tree structure
 * @param {Object} options - Rendering options
 * @param {number} [options.depth] - Maximum depth to display
 * @param {boolean} [options.expandAll=true] - Show all branches
 * @param {boolean} [options.collapseAll=false] - Collapse all branches
 * @param {boolean} [options.showMetadata=true] - Show metadata badges
 * @param {boolean} [options.evaluateConditions=false] - Filter by conditions
 * @param {Object} [options.context={}] - Context for condition evaluation
 * @param {boolean} [options.noColor=false] - Disable colors (accessibility)
 * @param {boolean} [options.highContrast=false] - High contrast mode (accessibility)
 * @param {boolean} [options.asciiOnly=false] - Use ASCII characters only (accessibility)
 * @returns {string} Formatted tree for terminal display
 */
function renderDecisionTree(treeData, options = {}) {
  let {
    depth = null,
    expandAll = null,
    collapseAll = false,
    showMetadata = true,
    evaluateConditions = false,
    context = {},
    noColor = false,
    highContrast = false,
    asciiOnly = false
  } = options;

  // Auto-collapse logic for large trees (>20 nodes)
  const nodeCount = countNodes(treeData);
  
  if (depth === null && expandAll === null && !collapseAll) {
    if (nodeCount > 20) {
      // Large tree: auto-collapse to depth 2
      depth = 2;
      expandAll = false;
    } else {
      // Small tree: expand all
      depth = Infinity;
      expandAll = true;
    }
  } else {
    // Apply defaults if not specified
    if (depth === null) depth = Infinity;
    if (expandAll === null) expandAll = !collapseAll;
  }

  if (!treeData || !treeData.root) {
    return noColor ? 'Invalid tree data' : chalk.red('Invalid tree data');
  }

  // Get accessibility configuration
  const a11y = require('./accessibility-config');
  const accessibilityConfig = { noColor, highContrast, asciiOnly };
  const chars = a11y.getBoxChars(accessibilityConfig);
  const icons = a11y.getStatusIcons(accessibilityConfig);

  const lines = [];
  
  // Tree header with accessibility support
  lines.push('');
  const headerText = `Decision Tree: ${treeData.name}`;
  const rootText = treeData.root;
  
  if (noColor) {
    lines.push(headerText);
    lines.push(rootText);
  } else if (highContrast) {
    lines.push(chalk.bold.cyan(headerText));
    lines.push(chalk.bold.white(rootText));
  } else {
    lines.push(chalk.bold.cyan(headerText));
    lines.push(chalk.bold(rootText));
  }
  lines.push('');

  // Render branches
  const renderBranch = (branch, level, isLast, prefix) => {
    // Check depth limit
    if (level > depth) return;

    // Evaluate conditions if needed
    if (evaluateConditions && branch.condition && branch.condition !== 'ELSE') {
      const parser = require('./decision-tree-parser');
      if (!parser.evaluateCondition(branch.condition, context)) {
        return; // Skip this branch
      }
    }

    // Branch connector with accessibility support
    const connector = isLast ? chars.lastBranch : chars.branch;
    const continueLine = isLast ? chars.space : chars.verticalLine + ' ';
    
    // Branch text
    let text = branch.text;
    
    // Add outcome if present
    if (branch.outcome) {
      const arrow = asciiOnly ? ' -> ' : ' → ';
      if (noColor) {
        text += arrow + branch.outcome;
      } else {
        text += chalk.gray(arrow) + chalk.italic(branch.outcome);
      }
    }

    // Add metadata badges with accessibility support
    if (showMetadata && branch.metadata) {
      const badges = [];
      
      if (branch.metadata.recommended) {
        const badge = noColor 
          ? '[RECOMMENDED]' 
          : (highContrast ? chalk.bold.green(' ★ RECOMMENDED ') : chalk.bgGreen.black(' ★ RECOMMENDED '));
        badges.push(badge);
      }
      if (branch.metadata.weight) {
        const badge = noColor 
          ? `[WEIGHT: ${branch.metadata.weight}]` 
          : (highContrast ? chalk.bold.yellow(` WEIGHT: ${branch.metadata.weight} `) : chalk.bgYellow.black(` WEIGHT: ${branch.metadata.weight} `));
        badges.push(badge);
      }
      if (branch.metadata.priority) {
        const priorityText = ` ${branch.metadata.priority.toUpperCase()} `;
        let badge;
        if (noColor) {
          badge = `[PRIORITY: ${branch.metadata.priority.toUpperCase()}]`;
        } else if (highContrast) {
          const priorityColors = {
            high: chalk.bold.red,
            medium: chalk.bold.yellow,
            low: chalk.bold.green
          };
          const colorFn = priorityColors[branch.metadata.priority] || chalk.bold.white;
          badge = colorFn(priorityText);
        } else {
          const priorityColors = {
            high: chalk.bgRed.white,
            medium: chalk.bgYellow.black,
            low: chalk.bgGreen.black
          };
          const colorFn = priorityColors[branch.metadata.priority] || chalk.bgGray.white;
          badge = colorFn(priorityText);
        }
        badges.push(badge);
      }
      if (branch.metadata.risk) {
        const riskText = ` RISK: ${branch.metadata.risk.toUpperCase()} `;
        let badge;
        if (noColor) {
          badge = `[RISK: ${branch.metadata.risk.toUpperCase()}]`;
        } else if (highContrast) {
          const riskColors = {
            high: chalk.bold.red,
            medium: chalk.bold.yellow,
            low: chalk.bold.green
          };
          const colorFn = riskColors[branch.metadata.risk] || chalk.bold.white;
          badge = colorFn(riskText);
        } else {
          const riskColors = {
            high: chalk.bgRed.white,
            medium: chalk.bgYellow.black,
            low: chalk.bgGreen.black
          };
          const colorFn = riskColors[branch.metadata.risk] || chalk.bgGray.white;
          badge = colorFn(riskText);
        }
        badges.push(badge);
      }
      
      if (badges.length > 0) {
        text += ' ' + badges.join(' ');
      }
    }

    // Add condition indicator
    if (branch.condition && branch.condition !== 'ELSE') {
      const condText = `[IF: ${branch.condition}] `;
      text = noColor ? condText + text : chalk.dim.italic(condText) + text;
    } else if (branch.condition === 'ELSE') {
      const elseText = '[ELSE] ';
      text = noColor ? elseText + text : chalk.dim.italic(elseText) + text;
    }

    // Add the line with accessibility support
    const connectorText = noColor ? connector : chalk.gray(connector);
    lines.push(prefix + connectorText + ' ' + text);

    // Handle children
    if (branch.children && branch.children.length > 0) {
      const shouldExpand = expandAll && !collapseAll;
      
      if (shouldExpand && level < depth) {
        branch.children.forEach((child, i) => {
          const childIsLast = i === branch.children.length - 1;
          const childPrefix = prefix + chalk.gray(continueLine) + ' ';
          renderBranch(child, level + 1, childIsLast, childPrefix);
        });
      } else if (branch.children.length > 0) {
        // Show collapse indicator
        const collapseIndicator = noColor ? '[...]' : chalk.dim('[...]');
        const continueLineText = noColor ? continueLine : chalk.gray(continueLine);
        lines.push(prefix + continueLineText + ' ' + collapseIndicator);
      }
    }
  };

  // Render all top-level branches
  if (treeData.branches && treeData.branches.length > 0) {
    treeData.branches.forEach((branch, i) => {
      const isLast = i === treeData.branches.length - 1;
      renderBranch(branch, 1, isLast, '  ');
    });
  }

  lines.push('');
  return lines.join('\n');
}

/**
 * Render tree in compact inline format
 * @param {Object} treeData - Parsed tree structure
 * @returns {string} Compact one-line summary
 */
function renderTreeInline(treeData) {
  if (!treeData || !treeData.branches) {
    return '';
  }

  const options = treeData.branches.map(b => {
    let text = b.text;
    if (b.metadata && b.metadata.recommended) {
      text = '★ ' + text;
    }
    return text;
  });

  return chalk.cyan(treeData.name) + ': ' + options.join(', ');
}

/**
 * Render a single branch with proper styling
 * @param {Object} branch - Branch object
 * @param {number} level - Nesting level
 * @param {Object} options - Rendering options
 * @returns {string} Formatted branch
 */
function renderTreeBranch(branch, level, options = {}) {
  const { showMetadata = true, indent = '  ' } = options;
  
  const prefix = indent.repeat(level);
  let text = branch.text;

  // Add metadata
  if (showMetadata && branch.metadata) {
    if (branch.metadata.recommended) {
      text = chalk.green('★ ') + text;
    }
    if (branch.metadata.weight) {
      text += chalk.yellow(` [${branch.metadata.weight}]`);
    }
  }

  // Add outcome
  if (branch.outcome) {
    text += chalk.gray(' → ') + chalk.italic(branch.outcome);
  }

  return prefix + text;
}

module.exports = {
  createBarChart,
  createTimeline,
  createProgressBar,
  createDistribution,
  createTable,
  formatDuration,
  formatTimestamp,
  truncateText,
  colorizeStatus,
  calculateStats,
  renderDecisionTree,
  renderTreeInline,
  renderTreeBranch
};
