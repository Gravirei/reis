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
  calculateStats
};
