/**
 * REIS v2.0 Wave Executor
 * Parse PLAN.md into waves and execute them sequentially
 */

const fs = require('fs');
const path = require('path');
const StateManager = require('./state-manager');
const { loadConfig, getWaveSize } = require('./config');
const { commitWaveCompletion, isGitRepo, getGitStatus } = require('./git-integration');

/**
 * Wave structure
 */
class Wave {
  constructor(id, name, size, tasks = []) {
    this.id = id;
    this.name = name;
    this.size = size; // 'small' | 'medium' | 'large'
    this.tasks = tasks;
    this.status = 'pending'; // 'pending' | 'in_progress' | 'completed' | 'failed'
    this.startTime = null;
    this.endTime = null;
    this.commit = null;
  }

  start() {
    this.status = 'in_progress';
    this.startTime = new Date();
  }

  complete(commitHash = null) {
    this.status = 'completed';
    this.endTime = new Date();
    this.commit = commitHash;
  }

  fail(error) {
    this.status = 'failed';
    this.endTime = new Date();
    this.error = error;
  }

  getDuration() {
    if (!this.startTime || !this.endTime) return null;
    const diffMs = this.endTime - this.startTime;
    return Math.round(diffMs / 1000 / 60); // minutes
  }
}

/**
 * Wave Executor
 */
class WaveExecutor {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.planningDir = path.join(projectRoot, '.planning');
    this.planPath = path.join(this.planningDir, 'PLAN.md');
    
    this.config = loadConfig(projectRoot);
    this.stateManager = new StateManager(projectRoot);
    
    this.waves = [];
    this.currentWaveIndex = -1;
  }

  /**
   * Parse PLAN.md into waves
   */
  parsePlan() {
    if (!fs.existsSync(this.planPath)) {
      throw new Error(`PLAN.md not found at ${this.planPath}`);
    }

    const content = fs.readFileSync(this.planPath, 'utf8');
    const waves = this.extractWaves(content);

    if (waves.length === 0) {
      throw new Error('No waves found in PLAN.md');
    }

    this.waves = waves;
    return waves;
  }

  /**
   * Extract waves from PLAN.md content
   */
  extractWaves(content) {
    const waves = [];
    const lines = content.split('\n');
    
    let currentWave = null;
    let waveId = 0;
    let inWaveSection = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Detect wave markers
      // Format: ## Wave 1: Description (Size: small/medium/large)
      // Or: ### Wave 1: Description
      const waveMatch = line.match(/^#{2,3}\s+Wave\s+(\d+):?\s+(.+?)(\s+\(Size:\s*(small|medium|large)\))?$/i);
      
      if (waveMatch) {
        // Save previous wave
        if (currentWave) {
          waves.push(currentWave);
        }

        // Create new wave
        const waveNumber = parseInt(waveMatch[1]);
        const waveName = waveMatch[2].trim();
        const waveSize = waveMatch[4] || this.config.waves.defaultSize;

        currentWave = new Wave(waveId++, `Wave ${waveNumber}: ${waveName}`, waveSize, []);
        inWaveSection = true;
        continue;
      }

      // Extract tasks from wave section
      if (inWaveSection && currentWave) {
        // Task formats:
        // - [ ] Task description
        // - Task description
        // 1. Task description
        const taskMatch = line.match(/^[-*]\s+(\[[ x]\]\s+)?(.+)$/) || 
                         line.match(/^\d+\.\s+(.+)$/);
        
        if (taskMatch) {
          const taskText = taskMatch[2] || taskMatch[1];
          if (taskText && taskText.trim().length > 0) {
            currentWave.tasks.push(taskText.trim());
          }
        }

        // Check if wave section ended (new heading or empty line after tasks)
        if (line.startsWith('##') && !line.match(/Wave\s+\d+/i)) {
          inWaveSection = false;
        }
      }
    }

    // Add last wave
    if (currentWave) {
      waves.push(currentWave);
    }

    // Validate waves against size limits
    this.validateWaves(waves);

    return waves;
  }

  /**
   * Validate waves against configured size limits
   */
  validateWaves(waves) {
    for (const wave of waves) {
      const sizeConfig = getWaveSize(this.config, wave.size);
      
      if (wave.tasks.length > sizeConfig.maxTasks) {
        console.warn(
          `Warning: ${wave.name} has ${wave.tasks.length} tasks, ` +
          `which exceeds the ${wave.size} wave limit of ${sizeConfig.maxTasks} tasks`
        );
      }
    }
  }

  /**
   * Get wave summary
   */
  getSummary() {
    const total = this.waves.length;
    const completed = this.waves.filter(w => w.status === 'completed').length;
    const inProgress = this.waves.filter(w => w.status === 'in_progress').length;
    const failed = this.waves.filter(w => w.status === 'failed').length;

    return {
      total,
      completed,
      inProgress,
      failed,
      pending: total - completed - inProgress - failed,
      progress: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }

  /**
   * Get current wave
   */
  getCurrentWave() {
    if (this.currentWaveIndex < 0 || this.currentWaveIndex >= this.waves.length) {
      return null;
    }
    return this.waves[this.currentWaveIndex];
  }

  /**
   * Get next wave
   */
  getNextWave() {
    const nextIndex = this.currentWaveIndex + 1;
    if (nextIndex >= this.waves.length) {
      return null;
    }
    return this.waves[nextIndex];
  }

  /**
   * Start next wave
   */
  startNextWave() {
    const nextWave = this.getNextWave();
    
    if (!nextWave) {
      throw new Error('No more waves to execute');
    }

    this.currentWaveIndex++;
    nextWave.start();

    // Update state manager
    this.stateManager.startWave(nextWave.name, nextWave.tasks.length);

    return nextWave;
  }

  /**
   * Complete current wave
   */
  completeCurrentWave(options = {}) {
    const currentWave = this.getCurrentWave();
    
    if (!currentWave) {
      throw new Error('No active wave to complete');
    }

    if (currentWave.status !== 'in_progress') {
      throw new Error(`Wave is not in progress: ${currentWave.status}`);
    }

    // Auto-commit if enabled
    let commitHash = null;
    if (this.config.git.autoCommit && isGitRepo(this.projectRoot)) {
      try {
        const phase = this.stateManager.state.currentPhase || 'Development';
        const commit = commitWaveCompletion(
          currentWave.name,
          phase,
          {
            projectRoot: this.projectRoot,
            prefix: this.config.git.commitMessagePrefix,
            details: options.changes || [],
            testStatus: options.testStatus || 'pending'
          }
        );
        
        if (commit) {
          commitHash = commit.shortHash;
        }
      } catch (error) {
        console.warn(`Warning: Auto-commit failed: ${error.message}`);
      }
    }

    // Complete wave
    currentWave.complete(commitHash);

    // Update state manager
    this.stateManager.completeWave(commitHash);

    // Create checkpoint if enabled
    if (this.config.waves.autoCheckpoint) {
      this.stateManager.createCheckpoint(
        `After ${currentWave.name}`,
        commitHash
      );
    }

    return {
      wave: currentWave,
      duration: currentWave.getDuration(),
      commit: commitHash
    };
  }

  /**
   * Fail current wave
   */
  failCurrentWave(error) {
    const currentWave = this.getCurrentWave();
    
    if (!currentWave) {
      throw new Error('No active wave to fail');
    }

    currentWave.fail(error);
    this.stateManager.addActivity(`Wave failed: ${currentWave.name} - ${error}`);
    this.stateManager.addBlocker(`Wave ${currentWave.id} failed: ${error}`);

    return currentWave;
  }

  /**
   * Resume from checkpoint
   */
  resumeFromCheckpoint(checkpointIndex = -1) {
    // Find the wave to resume from based on checkpoint
    // For now, just resume from the last incomplete wave
    for (let i = 0; i < this.waves.length; i++) {
      if (this.waves[i].status === 'pending' || this.waves[i].status === 'failed') {
        this.currentWaveIndex = i - 1;
        return this.waves[i];
      }
    }

    return null;
  }

  /**
   * Generate execution plan summary
   */
  generatePlanSummary() {
    const summary = {
      totalWaves: this.waves.length,
      waves: this.waves.map(w => ({
        id: w.id,
        name: w.name,
        size: w.size,
        taskCount: w.tasks.length,
        status: w.status,
        estimatedMinutes: getWaveSize(this.config, w.size).estimatedMinutes
      })),
      totalEstimatedMinutes: this.waves.reduce((sum, w) => {
        return sum + getWaveSize(this.config, w.size).estimatedMinutes;
      }, 0)
    };

    return summary;
  }

  /**
   * Check for deviations from plan
   */
  detectDeviations() {
    const deviations = [];

    for (const wave of this.waves) {
      if (wave.status === 'completed') {
        const sizeConfig = getWaveSize(this.config, wave.size);
        const duration = wave.getDuration();

        // Check if duration exceeded estimate
        if (duration && duration > sizeConfig.estimatedMinutes * 1.5) {
          deviations.push({
            wave: wave.name,
            type: 'duration_exceeded',
            expected: sizeConfig.estimatedMinutes,
            actual: duration
          });
        }

        // Check if tasks exceeded limit
        if (wave.tasks.length > sizeConfig.maxTasks) {
          deviations.push({
            wave: wave.name,
            type: 'task_count_exceeded',
            expected: sizeConfig.maxTasks,
            actual: wave.tasks.length
          });
        }
      }
    }

    return deviations;
  }

  /**
   * Export wave execution report
   */
  generateReport() {
    const summary = this.getSummary();
    const deviations = this.detectDeviations();

    const report = {
      summary,
      waves: this.waves.map(w => ({
        name: w.name,
        size: w.size,
        status: w.status,
        tasks: w.tasks.length,
        duration: w.getDuration(),
        commit: w.commit
      })),
      deviations,
      totalDuration: this.waves
        .filter(w => w.getDuration())
        .reduce((sum, w) => sum + w.getDuration(), 0)
    };

    return report;
  }
}

module.exports = { WaveExecutor, Wave };
