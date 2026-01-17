/**
 * REIS v2.0 Metrics Tracker
 * Track execution metrics, performance data, and success rates
 */

const fs = require('fs');
const path = require('path');

/**
 * MetricsTracker class - persistent metrics storage and analysis
 */
class MetricsTracker {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.planningDir = path.join(projectRoot, '.planning');
    this.metricsPath = path.join(this.planningDir, 'METRICS.md');
    this.data = this.loadMetrics();
  }

  /**
   * Load metrics from METRICS.md
   */
  loadMetrics() {
    if (!fs.existsSync(this.metricsPath)) {
      return this.createInitialMetrics();
    }

    try {
      const content = fs.readFileSync(this.metricsPath, 'utf8');
      return this.parseMetrics(content);
    } catch (error) {
      console.warn(`Warning: Failed to load metrics: ${error.message}`);
      // Create backup of corrupted file
      if (fs.existsSync(this.metricsPath)) {
        const backupPath = `${this.metricsPath}.backup-${Date.now()}`;
        fs.copyFileSync(this.metricsPath, backupPath);
        console.warn(`Corrupted metrics backed up to: ${backupPath}`);
      }
      return this.createInitialMetrics();
    }
  }

  /**
   * Create initial metrics structure
   */
  createInitialMetrics() {
    return {
      waveExecutions: [],
      checkpoints: [],
      summary: {
        totalWaves: 0,
        successfulWaves: 0,
        failedWaves: 0,
        successRate: 0,
        averageDuration: 0,
        totalExecutionTime: 0,
        lastUpdated: new Date().toISOString()
      }
    };
  }

  /**
   * Parse METRICS.md content into structured data
   */
  parseMetrics(content) {
    const metrics = this.createInitialMetrics();
    const lines = content.split('\n');

    let currentSection = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Parse sections
      if (line.startsWith('## Summary')) {
        currentSection = 'summary';
      } else if (line.startsWith('## Wave Executions')) {
        currentSection = 'waves';
      } else if (line.startsWith('## Checkpoints')) {
        currentSection = 'checkpoints';
      } else if (line.startsWith('## Performance Trends')) {
        currentSection = 'trends';
      }

      // Parse summary section
      if (currentSection === 'summary') {
        if (line.startsWith('- Total waves executed:')) {
          metrics.summary.totalWaves = parseInt(line.match(/\d+/)?.[0] || '0');
        } else if (line.startsWith('- Success rate:')) {
          metrics.summary.successRate = parseFloat(line.match(/[\d.]+/)?.[0] || '0');
        } else if (line.startsWith('- Average wave duration:')) {
          const match = line.match(/(\d+)m/);
          metrics.summary.averageDuration = match ? parseInt(match[1]) : 0;
        } else if (line.startsWith('- Total execution time:')) {
          metrics.summary.totalExecutionTime = this.parseDuration(line);
        } else if (line.startsWith('- Last updated:')) {
          const dateMatch = line.match(/Last updated: (.+)/);
          if (dateMatch) {
            metrics.summary.lastUpdated = dateMatch[1];
          }
        }
      }

      // Parse wave executions
      if (currentSection === 'waves' && line.startsWith('- ')) {
        // Format: - 2026-01-18 10:30 | Wave 1: Foundation | 15m | ✓ | commit:abc123
        const waveMatch = line.match(/- (.+?) \| (.+?) \| (\d+)m \| ([✓✗]) \| (.+)/);
        if (waveMatch) {
          const [, timestamp, name, duration, status, extra] = waveMatch;
          const wave = {
            timestamp,
            name,
            duration: parseInt(duration),
            status: status === '✓' ? 'completed' : 'failed',
            commit: null,
            error: null
          };

          // Parse extra info (commit or error)
          if (extra.startsWith('commit:')) {
            wave.commit = extra.substring(7);
          } else if (extra.startsWith('error:')) {
            wave.error = extra.substring(6);
          }

          metrics.waveExecutions.push(wave);

          // Update counts
          if (wave.status === 'completed') {
            metrics.summary.successfulWaves++;
          } else {
            metrics.summary.failedWaves++;
          }
        }
      }

      // Parse checkpoints
      if (currentSection === 'checkpoints' && line.startsWith('- ')) {
        // Format: - 2026-01-18 11:05 | After Wave 2 | commit:def456
        const cpMatch = line.match(/- (.+?) \| (.+?) \| commit:(.+)/);
        if (cpMatch) {
          metrics.checkpoints.push({
            timestamp: cpMatch[1],
            name: cpMatch[2],
            commit: cpMatch[3]
          });
        }
      }
    }

    return metrics;
  }

  /**
   * Parse duration string (e.g., "18h 5m") to minutes
   */
  parseDuration(text) {
    let totalMinutes = 0;
    const hourMatch = text.match(/(\d+)h/);
    const minMatch = text.match(/(\d+)m/);
    
    if (hourMatch) totalMinutes += parseInt(hourMatch[1]) * 60;
    if (minMatch) totalMinutes += parseInt(minMatch[1]);
    
    return totalMinutes;
  }

  /**
   * Format minutes to human-readable duration
   */
  formatDuration(minutes) {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours < 24) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }

  /**
   * Record wave execution
   */
  recordWaveExecution(waveData) {
    const execution = {
      timestamp: waveData.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 16),
      name: waveData.name,
      size: waveData.size || 'medium',
      duration: waveData.duration || 0,
      status: waveData.status || 'completed',
      taskCount: waveData.taskCount || 0,
      commit: waveData.commit || null,
      error: waveData.error || null,
      phase: waveData.phase || null,
      startTime: waveData.startTime || null,
      endTime: waveData.endTime || null
    };

    this.data.waveExecutions.push(execution);

    // Update summary
    this.data.summary.totalWaves++;
    if (execution.status === 'completed') {
      this.data.summary.successfulWaves++;
    } else {
      this.data.summary.failedWaves++;
    }

    // Recalculate metrics
    this.updateSummary();

    // Trim old data if exceeds limit (keep last 1000 entries)
    if (this.data.waveExecutions.length > 1000) {
      this.data.waveExecutions = this.data.waveExecutions.slice(-1000);
    }

    // Save metrics
    this.saveMetrics();

    return execution;
  }

  /**
   * Record checkpoint creation
   */
  recordCheckpoint(checkpointData) {
    const checkpoint = {
      timestamp: checkpointData.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 16),
      name: checkpointData.name,
      commit: checkpointData.commit || null,
      wave: checkpointData.wave || null
    };

    this.data.checkpoints.push(checkpoint);

    // Trim old checkpoints (keep last 100)
    if (this.data.checkpoints.length > 100) {
      this.data.checkpoints = this.data.checkpoints.slice(-100);
    }

    // Save metrics
    this.saveMetrics();

    return checkpoint;
  }

  /**
   * Update summary statistics
   */
  updateSummary() {
    const executions = this.data.waveExecutions;
    const total = executions.length;

    if (total === 0) {
      this.data.summary.successRate = 0;
      this.data.summary.averageDuration = 0;
      this.data.summary.totalExecutionTime = 0;
    } else {
      // Calculate success rate
      this.data.summary.successRate = 
        Math.round((this.data.summary.successfulWaves / this.data.summary.totalWaves) * 100 * 10) / 10;

      // Calculate average duration
      const totalDuration = executions.reduce((sum, e) => sum + (e.duration || 0), 0);
      this.data.summary.averageDuration = Math.round(totalDuration / total);

      // Calculate total execution time
      this.data.summary.totalExecutionTime = totalDuration;
    }

    this.data.summary.lastUpdated = new Date().toISOString().split('T')[0];
  }

  /**
   * Get metrics summary
   */
  getMetricsSummary() {
    return {
      totalWaves: this.data.summary.totalWaves,
      successfulWaves: this.data.summary.successfulWaves,
      failedWaves: this.data.summary.failedWaves,
      successRate: this.data.summary.successRate,
      averageDuration: this.data.summary.averageDuration,
      totalExecutionTime: this.data.summary.totalExecutionTime,
      lastUpdated: this.data.summary.lastUpdated,
      recentWaves: this.data.waveExecutions.slice(-10),
      recentCheckpoints: this.data.checkpoints.slice(-5)
    };
  }

  /**
   * Get historical trends for a time period
   */
  getHistoricalTrends(days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Filter executions within the time period
    const recentExecutions = this.data.waveExecutions.filter(e => {
      const execDate = new Date(e.timestamp || e.startTime);
      return execDate >= cutoffDate;
    });

    if (recentExecutions.length === 0) {
      return {
        period: `${days}d`,
        totalWaves: 0,
        successRate: 0,
        averageDuration: 0,
        trend: 'stable'
      };
    }

    // Calculate metrics for this period
    const successful = recentExecutions.filter(e => e.status === 'completed').length;
    const successRate = Math.round((successful / recentExecutions.length) * 100 * 10) / 10;
    const totalDuration = recentExecutions.reduce((sum, e) => sum + (e.duration || 0), 0);
    const averageDuration = Math.round(totalDuration / recentExecutions.length);

    // Detect trend (compare first half vs second half)
    const halfPoint = Math.floor(recentExecutions.length / 2);
    const firstHalf = recentExecutions.slice(0, halfPoint);
    const secondHalf = recentExecutions.slice(halfPoint);

    let trend = 'stable';
    if (firstHalf.length > 0 && secondHalf.length > 0) {
      const firstAvg = firstHalf.reduce((sum, e) => sum + (e.duration || 0), 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, e) => sum + (e.duration || 0), 0) / secondHalf.length;
      
      if (secondAvg < firstAvg * 0.9) {
        trend = 'improving';
      } else if (secondAvg > firstAvg * 1.1) {
        trend = 'degrading';
      }
    }

    return {
      period: `${days}d`,
      totalWaves: recentExecutions.length,
      successRate,
      averageDuration,
      totalDuration,
      trend,
      wavesBySiz: this.groupBySize(recentExecutions)
    };
  }

  /**
   * Group executions by wave size
   */
  groupBySize(executions) {
    const bySize = { small: [], medium: [], large: [] };
    
    executions.forEach(e => {
      const size = e.size || 'medium';
      if (bySize[size]) {
        bySize[size].push(e);
      }
    });

    return {
      small: {
        count: bySize.small.length,
        avgDuration: bySize.small.length > 0 
          ? Math.round(bySize.small.reduce((sum, e) => sum + (e.duration || 0), 0) / bySize.small.length)
          : 0
      },
      medium: {
        count: bySize.medium.length,
        avgDuration: bySize.medium.length > 0 
          ? Math.round(bySize.medium.reduce((sum, e) => sum + (e.duration || 0), 0) / bySize.medium.length)
          : 0
      },
      large: {
        count: bySize.large.length,
        avgDuration: bySize.large.length > 0 
          ? Math.round(bySize.large.reduce((sum, e) => sum + (e.duration || 0), 0) / bySize.large.length)
          : 0
      }
    };
  }

  /**
   * Save metrics to METRICS.md
   */
  saveMetrics() {
    const content = this.generateMetricsMarkdown();

    // Ensure .planning directory exists
    if (!fs.existsSync(this.planningDir)) {
      fs.mkdirSync(this.planningDir, { recursive: true });
    }

    fs.writeFileSync(this.metricsPath, content, 'utf8');
  }

  /**
   * Generate METRICS.md content
   */
  generateMetricsMarkdown() {
    const s = this.data.summary;
    let md = `# REIS Execution Metrics\n\n`;

    // Summary section
    md += `## Summary\n`;
    md += `- Total waves executed: ${s.totalWaves}\n`;
    md += `- Success rate: ${s.successRate}%\n`;
    md += `- Average wave duration: ${this.formatDuration(s.averageDuration)}\n`;
    md += `- Total execution time: ${this.formatDuration(s.totalExecutionTime)}\n`;
    md += `- Last updated: ${s.lastUpdated}\n\n`;

    // Wave Executions section
    md += `## Wave Executions\n`;
    if (this.data.waveExecutions.length > 0) {
      // Show most recent 50 executions
      const recentWaves = this.data.waveExecutions.slice(-50);
      recentWaves.forEach(wave => {
        const statusIcon = wave.status === 'completed' ? '✓' : '✗';
        const extra = wave.commit ? `commit:${wave.commit}` : 
                     wave.error ? `error:${wave.error}` : 'no-commit';
        md += `- ${wave.timestamp} | ${wave.name} | ${wave.duration}m | ${statusIcon} | ${extra}\n`;
      });
    } else {
      md += `_No wave executions recorded yet_\n`;
    }
    md += `\n`;

    // Checkpoints section
    md += `## Checkpoints\n`;
    if (this.data.checkpoints.length > 0) {
      // Show most recent 20 checkpoints
      const recentCheckpoints = this.data.checkpoints.slice(-20);
      recentCheckpoints.forEach(cp => {
        md += `- ${cp.timestamp} | ${cp.name} | commit:${cp.commit || 'none'}\n`;
      });
    } else {
      md += `_No checkpoints recorded yet_\n`;
    }
    md += `\n`;

    // Performance Trends section
    md += `## Performance Trends\n`;
    const trends7d = this.getHistoricalTrends(7);
    const trends30d = this.getHistoricalTrends(30);
    
    md += `- Average duration (7d): ${this.formatDuration(trends7d.averageDuration)}\n`;
    md += `- Average duration (30d): ${this.formatDuration(trends30d.averageDuration)}\n`;
    md += `- Success rate (7d): ${trends7d.successRate}%\n`;
    md += `- Success rate (30d): ${trends30d.successRate}%\n`;
    md += `- Performance trend (30d): ${trends30d.trend}\n`;

    return md;
  }

  /**
   * Export metrics as JSON
   */
  exportJSON() {
    return {
      summary: this.data.summary,
      waveExecutions: this.data.waveExecutions,
      checkpoints: this.data.checkpoints,
      trends: {
        sevenDays: this.getHistoricalTrends(7),
        thirtyDays: this.getHistoricalTrends(30),
        ninetyDays: this.getHistoricalTrends(90)
      }
    };
  }
}

module.exports = {
  MetricsTracker,
  // Export helper functions for testing
  createMetricsTracker: (projectRoot) => new MetricsTracker(projectRoot)
};
