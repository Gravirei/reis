/**
 * Gate Reporter - Beautiful CLI reports for quality gates
 * @module lib/utils/gate-reporter
 */

const chalk = require('chalk');

/**
 * Gate Reporter - generates formatted reports for gate results
 */
class GateReporter {
  /**
   * Create a gate reporter
   * @param {Object} options - Reporter options
   */
  constructor(options = {}) {
    this.format = options.format || 'ascii'; // 'ascii' | 'json' | 'markdown'
    this.verbose = options.verbose || false;
    this.colors = options.colors !== false;
    this.width = options.width || 75;
  }

  /**
   * Get status icon
   * @param {string} status - Status string
   * @returns {string}
   */
  getStatusIcon(status) {
    const icons = {
      passed: '✅',
      warning: '⚠️',
      failed: '❌',
      skipped: '⏭️',
      error: '💥',
      pending: '⏳',
      running: '◉'
    };
    return icons[status] || '❓';
  }

  /**
   * Get colored status text
   * @param {string} status - Status string
   * @returns {string}
   */
  getStatusText(status) {
    if (!this.colors) return status.toUpperCase();

    const statusColors = {
      passed: chalk.green,
      warning: chalk.yellow,
      failed: chalk.red,
      skipped: chalk.gray,
      error: chalk.red.bold,
      pending: chalk.blue,
      running: chalk.cyan
    };

    const colorFn = statusColors[status] || chalk.white;
    return colorFn(status.toUpperCase());
  }

  /**
   * Get overall status
   * @param {Object} summary - Summary object
   * @returns {string}
   */
  getOverallStatus(summary) {
    if (summary.failed > 0 || summary.error > 0) {
      return 'failed';
    } else if (summary.warning > 0) {
      return 'warning';
    }
    return 'passed';
  }

  /**
   * Generate report from results
   * @param {Array} results - Array of GateResult objects
   * @param {Object} summary - Summary object
   * @returns {string}
   */
  generateReport(results, summary) {
    switch (this.format) {
      case 'json':
        return this.generateJsonReport(results, summary);
      case 'markdown':
        return this.generateMarkdownReport(results, summary);
      case 'ascii':
      default:
        return this.generateAsciiReport(results, summary);
    }
  }

  /**
   * Generate ASCII box report
   * @param {Array} results - Array of GateResult objects
   * @param {Object} summary - Summary object
   * @returns {string}
   */
  generateAsciiReport(results, summary) {
    const w = this.width;
    const lines = [];

    // Helper for horizontal lines
    const topLine = '┌' + '─'.repeat(w - 2) + '┐';
    const midLine = '├' + '─'.repeat(w - 2) + '┤';
    const botLine = '└' + '─'.repeat(w - 2) + '┘';
    const emptyLine = '│' + ' '.repeat(w - 2) + '│';

    // Helper to pad line
    const padLine = (content, padChar = ' ') => {
      const stripped = this.stripAnsi(content);
      const padding = w - 2 - stripped.length;
      if (padding < 0) {
        return '│ ' + content.slice(0, w - 4) + ' │';
      }
      return '│ ' + content + padChar.repeat(padding - 1) + '│';
    };

    // Header
    lines.push(topLine);
    const title = '🛡️  QUALITY GATE REPORT';
    lines.push(padLine(title));
    lines.push(midLine);
    lines.push(emptyLine);

    // Group results by category
    const byCategory = {};
    for (const result of results) {
      if (!byCategory[result.category]) {
        byCategory[result.category] = [];
      }
      byCategory[result.category].push(result);
    }

    // Render each category
    for (const [category, categoryResults] of Object.entries(byCategory)) {
      const categoryStatus = this.getCategoryStatus(categoryResults);
      const categoryName = category.toUpperCase();
      const statusText = this.getStatusText(categoryStatus);
      const statusIcon = this.getStatusIcon(categoryStatus);

      // Category header with status aligned right
      const headerLeft = `  ${categoryName}`;
      const headerRight = `${statusIcon} ${statusText}`;
      const headerSpacing = w - 4 - this.stripAnsi(headerLeft).length - this.stripAnsi(headerRight).length;
      lines.push('│ ' + headerLeft + ' '.repeat(Math.max(1, headerSpacing)) + headerRight + ' │');

      // Category checks
      for (const result of categoryResults) {
        const icon = this.getStatusIcon(result.status);
        const checkName = result.gateName || result.name || 'Check';
        const message = result.message || '';
        
        // Truncate message if too long
        const maxMsgLen = w - 12 - checkName.length;
        const displayMsg = message.length > maxMsgLen 
          ? message.slice(0, maxMsgLen - 3) + '...'
          : message;

        lines.push(padLine(`  ├─ ${checkName}    ${icon} ${displayMsg}`));

        // Show details in verbose mode
        if (this.verbose && result.details && result.details.length > 0) {
          for (const detail of result.details.slice(0, 3)) {
            const detailStr = typeof detail === 'object' 
              ? `${detail.name || detail.file || 'Item'}: ${detail.message || detail.status || ''}`
              : String(detail);
            const truncDetail = detailStr.length > w - 16 
              ? detailStr.slice(0, w - 19) + '...'
              : detailStr;
            lines.push(padLine(`  │    ${chalk.gray(truncDetail)}`));
          }
        }
      }

      lines.push(emptyLine);
    }

    // Summary line
    lines.push(padLine('─'.repeat(w - 4)));
    
    const overallStatus = this.getOverallStatus(summary);
    const overallIcon = this.getStatusIcon(overallStatus);
    const overallText = overallStatus === 'passed' 
      ? (summary.warning > 0 ? 'PASSED WITH WARNINGS' : 'ALL GATES PASSED')
      : (overallStatus === 'warning' ? 'PASSED WITH WARNINGS' : 'GATES FAILED');
    
    lines.push(padLine(`  Overall: ${overallIcon}  ${this.getStatusText(overallStatus)} - ${overallText}`));
    
    const statsLine = `  Gate checks: ${summary.passed} passed, ${summary.warning} warning, ${summary.failed} failed, ${summary.skipped} skipped`;
    lines.push(padLine(statsLine));
    
    if (summary.duration) {
      const durationSec = (summary.duration / 1000).toFixed(2);
      lines.push(padLine(`  Duration: ${durationSec}s`));
    }
    
    lines.push(emptyLine);
    lines.push(botLine);

    return lines.join('\n');
  }

  /**
   * Generate JSON report
   * @param {Array} results - Array of GateResult objects
   * @param {Object} summary - Summary object
   * @returns {string}
   */
  generateJsonReport(results, summary) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        ...summary,
        overallStatus: this.getOverallStatus(summary)
      },
      results: results.map(r => r.toJSON ? r.toJSON() : r)
    }, null, 2);
  }

  /**
   * Generate Markdown report
   * @param {Array} results - Array of GateResult objects
   * @param {Object} summary - Summary object
   * @returns {string}
   */
  generateMarkdownReport(results, summary) {
    const lines = [];

    lines.push('# 🛡️ Quality Gate Report');
    lines.push('');
    lines.push(`**Generated:** ${new Date().toISOString()}`);
    lines.push('');

    // Summary table
    lines.push('## Summary');
    lines.push('');
    lines.push('| Metric | Value |');
    lines.push('|--------|-------|');
    lines.push(`| Overall Status | ${this.getStatusIcon(this.getOverallStatus(summary))} ${this.getOverallStatus(summary).toUpperCase()} |`);
    lines.push(`| Passed | ${summary.passed} |`);
    lines.push(`| Warnings | ${summary.warning} |`);
    lines.push(`| Failed | ${summary.failed} |`);
    lines.push(`| Skipped | ${summary.skipped} |`);
    if (summary.duration) {
      lines.push(`| Duration | ${(summary.duration / 1000).toFixed(2)}s |`);
    }
    lines.push('');

    // Group by category
    const byCategory = {};
    for (const result of results) {
      if (!byCategory[result.category]) {
        byCategory[result.category] = [];
      }
      byCategory[result.category].push(result);
    }

    // Each category
    for (const [category, categoryResults] of Object.entries(byCategory)) {
      const categoryStatus = this.getCategoryStatus(categoryResults);
      lines.push(`## ${this.getStatusIcon(categoryStatus)} ${category.charAt(0).toUpperCase() + category.slice(1)}`);
      lines.push('');
      lines.push('| Check | Status | Message |');
      lines.push('|-------|--------|---------|');

      for (const result of categoryResults) {
        const icon = this.getStatusIcon(result.status);
        const name = result.gateName || result.name || 'Check';
        const message = (result.message || '').replace(/\|/g, '\\|');
        lines.push(`| ${name} | ${icon} ${result.status} | ${message} |`);
      }
      lines.push('');

      // Details
      if (this.verbose) {
        for (const result of categoryResults) {
          if (result.details && result.details.length > 0) {
            lines.push(`### ${result.gateName || result.name} Details`);
            lines.push('');
            lines.push('```');
            for (const detail of result.details) {
              lines.push(typeof detail === 'object' ? JSON.stringify(detail) : String(detail));
            }
            lines.push('```');
            lines.push('');
          }
        }
      }
    }

    return lines.join('\n');
  }

  /**
   * Get category status from results
   * @param {Array} results - Category results
   * @returns {string}
   */
  getCategoryStatus(results) {
    if (results.some(r => r.status === 'failed' || r.status === 'error')) {
      return 'failed';
    }
    if (results.some(r => r.status === 'warning')) {
      return 'warning';
    }
    if (results.every(r => r.status === 'skipped')) {
      return 'skipped';
    }
    return 'passed';
  }

  /**
   * Strip ANSI codes from string
   * @param {string} str - String with potential ANSI codes
   * @returns {string}
   */
  stripAnsi(str) {
    return str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
  }

  /**
   * Print report to console
   * @param {string} report - Report string
   */
  print(report) {
    console.log(report);
  }

  /**
   * Generate and print report
   * @param {Array} results - Array of GateResult objects
   * @param {Object} summary - Summary object
   */
  printReport(results, summary) {
    const report = this.generateReport(results, summary);
    this.print(report);
  }
}

module.exports = { GateReporter };
