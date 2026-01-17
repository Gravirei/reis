/**
 * REIS v2.0 State Manager
 * Enhanced STATE.md with wave tracking and checkpoints
 */

const fs = require('fs');
const path = require('path');

/**
 * State structure for REIS v2.0
 */
class StateManager {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.planningDir = path.join(projectRoot, '.planning');
    this.statePath = path.join(this.planningDir, 'STATE.md');
    this.state = this.loadState();
  }

  /**
   * Load current state from STATE.md
   */
  loadState() {
    if (!fs.existsSync(this.statePath)) {
      return this.createInitialState();
    }

    try {
      const content = fs.readFileSync(this.statePath, 'utf8');
      return this.parseState(content);
    } catch (error) {
      console.error('Error loading STATE.md:', error.message);
      return this.createInitialState();
    }
  }

  /**
   * Create initial state structure
   */
  createInitialState() {
    return {
      currentPhase: null,
      activeWave: null,
      waves: {
        current: null,
        completed: [],
        total: 0
      },
      checkpoints: [],
      metrics: {
        totalWaves: 0,
        completedWaves: 0,
        successRate: 0,
        averageDuration: 0
      },
      recentActivity: [],
      nextSteps: [],
      blockers: [],
      notes: []
    };
  }

  /**
   * Parse STATE.md content into structured data
   */
  parseState(content) {
    const state = this.createInitialState();
    const lines = content.split('\n');

    let currentSection = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Parse sections
      if (line.startsWith('## Current Phase')) {
        currentSection = 'phase';
        const nextLine = lines[i + 1]?.trim();
        if (nextLine && nextLine.startsWith('**')) {
          state.currentPhase = nextLine; // Keep the ** markers as is
        }
      } else if (line.startsWith('## Active Wave')) {
        currentSection = 'wave';
      } else if (line.startsWith('## Completed Waves')) {
        currentSection = 'completedWaves';
      } else if (line.startsWith('## Checkpoints')) {
        currentSection = 'checkpoints';
      } else if (line.startsWith('## Recent Activity')) {
        currentSection = 'activity';
      } else if (line.startsWith('## Next Steps')) {
        currentSection = 'nextSteps';
      } else if (line.startsWith('## Blockers')) {
        currentSection = 'blockers';
      } else if (line.startsWith('## Notes')) {
        currentSection = 'notes';
      } else if (line.startsWith('## Metrics')) {
        currentSection = 'metrics';
      }

      // Parse content based on section
      if (currentSection === 'wave' && line.startsWith('**Wave')) {
        state.activeWave = this.parseWaveBlock(lines.slice(i, i + 10));
      } else if (currentSection === 'metrics') {
        if (line.startsWith('- Total waves')) {
          state.metrics.totalWaves = parseInt(line.match(/\d+/)?.[0] || '0');
        } else if (line.startsWith('- Waves completed')) {
          state.metrics.completedWaves = parseInt(line.match(/\d+/)?.[0] || '0');
        }
      }
    }

    return state;
  }

  /**
   * Parse wave block
   */
  parseWaveBlock(lines) {
    const wave = {
      name: null,
      status: null,
      started: null,
      items: 0,
      progress: { completed: 0, total: 0 }
    };

    for (const line of lines) {
      if (line.startsWith('**')) {
        // Extract wave name from **Wave 1: Name**
        const match = line.match(/\*\*(.+?)\*\*/);
        if (match) {
          wave.name = match[1];
        }
      } else if (line.includes('Status:')) {
        wave.status = line.match(/Status: (\w+)/)?.[1] || null;
      } else if (line.includes('Started:')) {
        wave.started = line.match(/Started: (.+)/)?.[1] || null;
      } else if (line.includes('Items:')) {
        wave.items = parseInt(line.match(/(\d+) tasks/)?.[1] || '0');
      } else if (line.includes('Progress:')) {
        const match = line.match(/(\d+)\/(\d+)/);
        if (match) {
          wave.progress.completed = parseInt(match[1]);
          wave.progress.total = parseInt(match[2]);
        }
      }
    }

    return wave;
  }

  /**
   * Save state to STATE.md
   */
  saveState() {
    const content = this.generateStateMarkdown();
    
    // Ensure .planning directory exists
    if (!fs.existsSync(this.planningDir)) {
      fs.mkdirSync(this.planningDir, { recursive: true });
    }

    fs.writeFileSync(this.statePath, content, 'utf8');
  }

  /**
   * Generate STATE.md markdown content
   */
  generateStateMarkdown() {
    const s = this.state;
    const timestamp = new Date().toISOString().split('T')[0];

    let md = `# REIS v2.0 Development State\n\n`;

    // Current Phase
    md += `## Current Phase\n`;
    md += s.currentPhase ? `**${s.currentPhase}**\n\n` : `_Not set_\n\n`;

    // Active Wave
    md += `## Active Wave\n`;
    if (s.activeWave) {
      md += `**${s.activeWave.name}**\n`;
      md += `- Status: ${s.activeWave.status}\n`;
      md += `- Started: ${s.activeWave.started}\n`;
      md += `- Items: ${s.activeWave.items} tasks\n`;
      md += `- Progress: ${s.activeWave.progress.completed}/${s.activeWave.progress.total} complete\n\n`;
    } else {
      md += `_No active wave_\n\n`;
    }

    // Recent Activity
    md += `## Recent Activity\n`;
    if (s.recentActivity.length > 0) {
      s.recentActivity.slice(-10).forEach(activity => {
        md += `- ${activity}\n`;
      });
    } else {
      md += `_No recent activity_\n`;
    }
    md += `\n`;

    // Completed Waves
    md += `## Completed Waves\n`;
    if (s.waves.completed.length > 0) {
      s.waves.completed.forEach(wave => {
        md += `- **${wave.name}** (${wave.completed || 'completed'})\n`;
        if (wave.commit) {
          md += `  - Commit: \`${wave.commit}\`\n`;
        }
      });
    } else {
      md += `_None yet_\n`;
    }
    md += `\n`;

    // Checkpoints
    md += `## Checkpoints\n`;
    if (s.checkpoints.length > 0) {
      s.checkpoints.slice(-5).forEach(cp => {
        md += `- **${cp.name}** (${cp.timestamp})\n`;
        if (cp.commit) md += `  - Commit: \`${cp.commit}\`\n`;
        if (cp.wave) md += `  - Wave: ${cp.wave}\n`;
      });
    } else {
      md += `_None yet_\n`;
    }
    md += `\n`;

    // Next Steps
    md += `## Next Steps\n`;
    if (s.nextSteps.length > 0) {
      s.nextSteps.forEach((step, i) => {
        md += `${i + 1}. ${step}\n`;
      });
    } else {
      md += `_None defined_\n`;
    }
    md += `\n`;

    // Blockers
    md += `## Blockers\n`;
    if (s.blockers.length > 0) {
      s.blockers.forEach(blocker => {
        md += `- ${blocker}\n`;
      });
    } else {
      md += `_None_\n`;
    }
    md += `\n`;

    // Notes
    md += `## Notes\n`;
    if (s.notes.length > 0) {
      s.notes.forEach(note => {
        md += `- ${note}\n`;
      });
    } else {
      md += `_None_\n`;
    }
    md += `\n`;

    // Metrics
    md += `## Metrics\n`;
    md += `- Total waves planned: ${s.metrics.totalWaves}\n`;
    md += `- Waves completed: ${s.metrics.completedWaves}\n`;
    md += `- Success rate: ${s.metrics.successRate}%\n`;
    md += `- Average wave duration: ${s.metrics.averageDuration || 'N/A'}\n`;

    return md;
  }

  /**
   * Start a new wave
   */
  startWave(waveName, items = 0) {
    this.state.activeWave = {
      name: waveName,
      status: 'IN_PROGRESS',
      started: new Date().toISOString().split('T')[0],
      items: items,
      progress: { completed: 0, total: items }
    };

    this.addActivity(`Started wave: ${waveName}`);
    this.saveState();
  }

  /**
   * Complete current wave
   */
  completeWave(commitHash = null) {
    if (!this.state.activeWave) {
      throw new Error('No active wave to complete');
    }

    const wave = {
      name: this.state.activeWave.name,
      completed: new Date().toISOString().split('T')[0],
      commit: commitHash,
      duration: this.calculateDuration(this.state.activeWave.started)
    };

    this.state.waves.completed.push(wave);
    this.state.metrics.completedWaves++;
    this.state.activeWave = null;

    this.addActivity(`Completed wave: ${wave.name}`);
    this.updateMetrics();
    this.saveState();

    return wave;
  }

  /**
   * Create a checkpoint
   */
  createCheckpoint(name, commitHash = null) {
    const checkpoint = {
      name: name,
      timestamp: new Date().toISOString(),
      commit: commitHash,
      wave: this.state.activeWave?.name || null
    };

    this.state.checkpoints.push(checkpoint);
    
    // Keep only last N checkpoints
    if (this.state.checkpoints.length > 10) {
      this.state.checkpoints = this.state.checkpoints.slice(-10);
    }

    this.addActivity(`Checkpoint created: ${name}`);
    this.saveState();

    return checkpoint;
  }

  /**
   * Update wave progress
   */
  updateWaveProgress(completed) {
    if (!this.state.activeWave) {
      throw new Error('No active wave to update');
    }

    this.state.activeWave.progress.completed = completed;
    this.saveState();
  }

  /**
   * Add activity entry
   */
  addActivity(message) {
    const timestamp = new Date().toISOString().split('T')[0] + ' ' + 
                     new Date().toTimeString().split(' ')[0].slice(0, 5);
    this.state.recentActivity.push(`${timestamp}: ${message}`);
    
    // Keep only last 20 activities
    if (this.state.recentActivity.length > 20) {
      this.state.recentActivity = this.state.recentActivity.slice(-20);
    }
  }

  /**
   * Calculate duration between two dates
   */
  calculateDuration(startDate) {
    const start = new Date(startDate);
    const end = new Date();
    const diffMs = end - start;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 24) {
      return `${Math.floor(diffHours / 24)}d ${diffHours % 24}h`;
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMins}m`;
    } else {
      return `${diffMins}m`;
    }
  }

  /**
   * Update metrics
   */
  updateMetrics() {
    const completed = this.state.waves.completed;
    if (completed.length > 0) {
      const total = completed.length;
      this.state.metrics.successRate = Math.round((total / this.state.metrics.totalWaves) * 100);
    }
  }

  /**
   * Set next steps
   */
  setNextSteps(steps) {
    this.state.nextSteps = steps;
    this.saveState();
  }

  /**
   * Add blocker
   */
  addBlocker(blocker) {
    this.state.blockers.push(blocker);
    this.saveState();
  }

  /**
   * Remove blocker
   */
  removeBlocker(blocker) {
    this.state.blockers = this.state.blockers.filter(b => b !== blocker);
    this.saveState();
  }

  /**
   * Add note
   */
  addNote(note) {
    this.state.notes.push(note);
    this.saveState();
  }
}

module.exports = StateManager;
