/**
 * REIS Parallel State Tracker
 * Tracks state for parallel wave execution with persistence and metrics
 * 
 * @module lib/utils/parallel-state-tracker
 */

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

/**
 * Wave status enum
 * @enum {string}
 */
const WaveStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

/**
 * ParallelStateTracker - Tracks state for concurrent wave execution
 */
class ParallelStateTracker {
  /**
   * Create a new ParallelStateTracker
   * @param {Object} options - Tracker options
   * @param {string} [options.stateFile='.reis/parallel-state.json'] - Path to state file
   * @param {boolean} [options.autoPersist=true] - Auto-save state on changes
   * @param {string} [options.projectRoot=process.cwd()] - Project root directory
   */
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.stateFile = options.stateFile || path.join(this.projectRoot, '.reis', 'parallel-state.json');
    this.autoPersist = options.autoPersist !== false;
    
    // Wave tracking: waveId -> { status, startTime, endTime, error, metadata }
    this.waves = new Map();
    
    // Batch tracking: batchId -> { waveIds, startTime, endTime, status }
    this.batches = new Map();
    this.currentBatchId = 0;
    
    // Execution history for reporting
    this.history = [];
    
    // Overall execution tracking
    this.executionStartTime = null;
    this.executionEndTime = null;
    this.isExecuting = false;
  }

  // ============================================
  // WAVE LIFECYCLE METHODS
  // ============================================

  /**
   * Start tracking a wave
   * @param {string} waveId - Wave identifier
   * @param {Object} [metadata={}] - Additional wave metadata
   */
  startWave(waveId, metadata = {}) {
    const now = Date.now();
    
    this.waves.set(waveId, {
      status: WaveStatus.RUNNING,
      startTime: now,
      endTime: null,
      error: null,
      metadata: {
        ...metadata,
        startedAt: new Date(now).toISOString()
      }
    });

    this._addHistoryEntry('wave_start', {
      waveId,
      timestamp: now,
      metadata
    });

    if (this.autoPersist) {
      this.save();
    }
  }

  /**
   * Mark a wave as completed
   * @param {string} waveId - Wave identifier
   * @param {Object} [result={}] - Completion result/metadata
   */
  completeWave(waveId, result = {}) {
    const wave = this.waves.get(waveId);
    if (!wave) {
      throw new Error(`Wave not found: ${waveId}`);
    }

    const now = Date.now();
    wave.status = WaveStatus.COMPLETED;
    wave.endTime = now;
    wave.metadata = {
      ...wave.metadata,
      ...result,
      completedAt: new Date(now).toISOString()
    };

    this._addHistoryEntry('wave_complete', {
      waveId,
      timestamp: now,
      duration: now - wave.startTime,
      result
    });

    if (this.autoPersist) {
      this.save();
    }
  }

  /**
   * Mark a wave as failed
   * @param {string} waveId - Wave identifier
   * @param {string|Error} error - Error that caused failure
   */
  failWave(waveId, error) {
    const wave = this.waves.get(waveId);
    if (!wave) {
      throw new Error(`Wave not found: ${waveId}`);
    }

    const now = Date.now();
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    wave.status = WaveStatus.FAILED;
    wave.endTime = now;
    wave.error = errorMessage;
    wave.metadata = {
      ...wave.metadata,
      failedAt: new Date(now).toISOString(),
      errorMessage
    };

    this._addHistoryEntry('wave_failed', {
      waveId,
      timestamp: now,
      duration: now - wave.startTime,
      error: errorMessage
    });

    if (this.autoPersist) {
      this.save();
    }
  }

  /**
   * Register a wave as pending (not yet started)
   * @param {string} waveId - Wave identifier
   * @param {Object} [metadata={}] - Wave metadata
   */
  registerWave(waveId, metadata = {}) {
    if (!this.waves.has(waveId)) {
      this.waves.set(waveId, {
        status: WaveStatus.PENDING,
        startTime: null,
        endTime: null,
        error: null,
        metadata
      });
    }
  }

  // ============================================
  // BATCH TRACKING METHODS
  // ============================================

  /**
   * Start a new batch of waves
   * @param {string[]} waveIds - Array of wave IDs in this batch
   * @returns {number} Batch ID
   */
  startBatch(waveIds) {
    const batchId = ++this.currentBatchId;
    const now = Date.now();

    this.batches.set(batchId, {
      waveIds: [...waveIds],
      startTime: now,
      endTime: null,
      status: 'running'
    });

    this._addHistoryEntry('batch_start', {
      batchId,
      waveIds,
      timestamp: now
    });

    // Start all waves in the batch
    for (const waveId of waveIds) {
      if (!this.waves.has(waveId) || this.waves.get(waveId).status === WaveStatus.PENDING) {
        this.startWave(waveId, { batchId });
      }
    }

    if (this.autoPersist) {
      this.save();
    }

    return batchId;
  }

  /**
   * Complete a batch
   * @param {number} batchId - Batch ID to complete
   */
  completeBatch(batchId) {
    const batch = this.batches.get(batchId);
    if (!batch) {
      throw new Error(`Batch not found: ${batchId}`);
    }

    const now = Date.now();
    batch.endTime = now;
    
    // Check if any waves failed
    const hasFailures = batch.waveIds.some(id => {
      const wave = this.waves.get(id);
      return wave && wave.status === WaveStatus.FAILED;
    });

    batch.status = hasFailures ? 'partial' : 'completed';

    this._addHistoryEntry('batch_complete', {
      batchId,
      timestamp: now,
      duration: now - batch.startTime,
      status: batch.status,
      waveIds: batch.waveIds
    });

    if (this.autoPersist) {
      this.save();
    }
  }

  // ============================================
  // STATE QUERY METHODS
  // ============================================

  /**
   * Get status of a specific wave
   * @param {string} waveId - Wave identifier
   * @returns {string} Wave status: 'pending' | 'running' | 'completed' | 'failed'
   */
  getWaveStatus(waveId) {
    const wave = this.waves.get(waveId);
    return wave ? wave.status : WaveStatus.PENDING;
  }

  /**
   * Get all currently running waves
   * @returns {string[]} Array of running wave IDs
   */
  getRunningWaves() {
    return this._getWavesByStatus(WaveStatus.RUNNING);
  }

  /**
   * Get all completed waves
   * @returns {string[]} Array of completed wave IDs
   */
  getCompletedWaves() {
    return this._getWavesByStatus(WaveStatus.COMPLETED);
  }

  /**
   * Get all failed waves
   * @returns {string[]} Array of failed wave IDs
   */
  getFailedWaves() {
    return this._getWavesByStatus(WaveStatus.FAILED);
  }

  /**
   * Get all pending waves
   * @returns {string[]} Array of pending wave IDs
   */
  getPendingWaves() {
    return this._getWavesByStatus(WaveStatus.PENDING);
  }

  /**
   * Get waves by status
   * @private
   * @param {string} status - Status to filter by
   * @returns {string[]} Array of wave IDs
   */
  _getWavesByStatus(status) {
    const result = [];
    for (const [waveId, wave] of this.waves) {
      if (wave.status === status) {
        result.push(waveId);
      }
    }
    return result;
  }

  /**
   * Get wave details
   * @param {string} waveId - Wave identifier
   * @returns {Object|null} Wave details or null if not found
   */
  getWaveDetails(waveId) {
    const wave = this.waves.get(waveId);
    if (!wave) return null;

    return {
      id: waveId,
      ...wave,
      duration: this.getWaveDuration(waveId)
    };
  }

  // ============================================
  // PERSISTENCE METHODS
  // ============================================

  /**
   * Save state to file
   */
  save() {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.stateFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const state = this.toJSON();
      fs.writeFileSync(this.stateFile, JSON.stringify(state, null, 2), 'utf8');
    } catch (error) {
      // Non-fatal: log warning but don't throw
      console.warn(chalk.yellow(`Warning: Could not save parallel state: ${error.message}`));
    }
  }

  /**
   * Load state from file
   * @returns {boolean} True if state was loaded successfully
   */
  load() {
    try {
      if (!fs.existsSync(this.stateFile)) {
        return false;
      }

      const content = fs.readFileSync(this.stateFile, 'utf8');
      const state = JSON.parse(content);

      // Restore waves
      this.waves = new Map(state.waves || []);
      
      // Restore batches
      this.batches = new Map(state.batches || []);
      this.currentBatchId = state.currentBatchId || 0;

      // Restore history
      this.history = state.history || [];

      // Restore execution times
      this.executionStartTime = state.executionStartTime || null;
      this.executionEndTime = state.executionEndTime || null;
      this.isExecuting = state.isExecuting || false;

      return true;
    } catch (error) {
      console.warn(chalk.yellow(`Warning: Could not load parallel state: ${error.message}`));
      return false;
    }
  }

  /**
   * Clear saved state (both in memory and on disk)
   */
  clear() {
    this.waves = new Map();
    this.batches = new Map();
    this.currentBatchId = 0;
    this.history = [];
    this.executionStartTime = null;
    this.executionEndTime = null;
    this.isExecuting = false;

    try {
      if (fs.existsSync(this.stateFile)) {
        fs.unlinkSync(this.stateFile);
      }
    } catch (error) {
      // Ignore deletion errors
    }
  }

  // ============================================
  // METRICS METHODS
  // ============================================

  /**
   * Get total execution duration
   * @returns {number|null} Duration in milliseconds, or null if not complete
   */
  getTotalDuration() {
    if (!this.executionStartTime) {
      return null;
    }

    const endTime = this.executionEndTime || Date.now();
    return endTime - this.executionStartTime;
  }

  /**
   * Get duration for a specific wave
   * @param {string} waveId - Wave identifier
   * @returns {number|null} Duration in milliseconds, or null if not complete
   */
  getWaveDuration(waveId) {
    const wave = this.waves.get(waveId);
    if (!wave || !wave.startTime) {
      return null;
    }

    const endTime = wave.endTime || Date.now();
    return endTime - wave.startTime;
  }

  /**
   * Calculate parallel execution efficiency
   * Compares actual parallel time to theoretical sequential time
   * @returns {Object} Efficiency metrics
   */
  getParallelEfficiency() {
    const completedWaves = this.getCompletedWaves();
    
    if (completedWaves.length === 0) {
      return {
        sequentialTime: 0,
        parallelTime: 0,
        efficiency: 0,
        speedupFactor: 1,
        wavesAnalyzed: 0
      };
    }

    // Calculate what sequential time would have been
    let sequentialTime = 0;
    for (const waveId of completedWaves) {
      const duration = this.getWaveDuration(waveId);
      if (duration) {
        sequentialTime += duration;
      }
    }

    // Actual parallel time
    const parallelTime = this.getTotalDuration() || 0;

    // Calculate metrics
    const speedupFactor = parallelTime > 0 ? sequentialTime / parallelTime : 1;
    const efficiency = parallelTime > 0 ? Math.min(100, (sequentialTime / parallelTime / completedWaves.length) * 100) : 0;

    return {
      sequentialTime,
      parallelTime,
      efficiency: Math.round(efficiency * 100) / 100,
      speedupFactor: Math.round(speedupFactor * 100) / 100,
      timeSaved: sequentialTime - parallelTime,
      wavesAnalyzed: completedWaves.length
    };
  }

  /**
   * Get average wave duration
   * @returns {number} Average duration in milliseconds
   */
  getAverageWaveDuration() {
    const completedWaves = this.getCompletedWaves();
    if (completedWaves.length === 0) return 0;

    let totalDuration = 0;
    for (const waveId of completedWaves) {
      totalDuration += this.getWaveDuration(waveId) || 0;
    }

    return Math.round(totalDuration / completedWaves.length);
  }

  // ============================================
  // EXECUTION LIFECYCLE
  // ============================================

  /**
   * Mark execution as started
   */
  startExecution() {
    this.executionStartTime = Date.now();
    this.executionEndTime = null;
    this.isExecuting = true;

    this._addHistoryEntry('execution_start', {
      timestamp: this.executionStartTime
    });

    if (this.autoPersist) {
      this.save();
    }
  }

  /**
   * Mark execution as completed
   */
  endExecution() {
    this.executionEndTime = Date.now();
    this.isExecuting = false;

    this._addHistoryEntry('execution_end', {
      timestamp: this.executionEndTime,
      duration: this.getTotalDuration()
    });

    if (this.autoPersist) {
      this.save();
    }
  }

  // ============================================
  // SUMMARY AND SERIALIZATION
  // ============================================

  /**
   * Get full execution summary
   * @returns {Object} Execution summary
   */
  getSummary() {
    const running = this.getRunningWaves();
    const completed = this.getCompletedWaves();
    const failed = this.getFailedWaves();
    const pending = this.getPendingWaves();

    return {
      status: this.isExecuting ? 'running' : (this.executionEndTime ? 'completed' : 'not_started'),
      waves: {
        total: this.waves.size,
        running: running.length,
        completed: completed.length,
        failed: failed.length,
        pending: pending.length
      },
      batches: {
        total: this.batches.size,
        current: this.currentBatchId
      },
      timing: {
        startTime: this.executionStartTime,
        endTime: this.executionEndTime,
        totalDuration: this.getTotalDuration(),
        averageWaveDuration: this.getAverageWaveDuration()
      },
      efficiency: this.getParallelEfficiency(),
      failedWaves: failed.map(id => ({
        id,
        error: this.waves.get(id)?.error
      })),
      historyEntries: this.history.length
    };
  }

  /**
   * Serialize state to JSON-compatible object
   * @returns {Object} Serializable state
   */
  toJSON() {
    return {
      waves: Array.from(this.waves.entries()),
      batches: Array.from(this.batches.entries()),
      currentBatchId: this.currentBatchId,
      history: this.history,
      executionStartTime: this.executionStartTime,
      executionEndTime: this.executionEndTime,
      isExecuting: this.isExecuting,
      savedAt: new Date().toISOString()
    };
  }

  /**
   * Create tracker from JSON state
   * @static
   * @param {Object} json - JSON state object
   * @param {Object} [options={}] - Tracker options
   * @returns {ParallelStateTracker} New tracker instance
   */
  static fromJSON(json, options = {}) {
    const tracker = new ParallelStateTracker(options);
    
    tracker.waves = new Map(json.waves || []);
    tracker.batches = new Map(json.batches || []);
    tracker.currentBatchId = json.currentBatchId || 0;
    tracker.history = json.history || [];
    tracker.executionStartTime = json.executionStartTime || null;
    tracker.executionEndTime = json.executionEndTime || null;
    tracker.isExecuting = json.isExecuting || false;

    return tracker;
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  /**
   * Add entry to history log
   * @private
   * @param {string} type - Entry type
   * @param {Object} data - Entry data
   */
  _addHistoryEntry(type, data) {
    this.history.push({
      type,
      data,
      timestamp: Date.now()
    });

    // Keep history bounded (last 1000 entries)
    if (this.history.length > 1000) {
      this.history = this.history.slice(-1000);
    }
  }

  // ============================================
  // DISPLAY HELPERS
  // ============================================

  /**
   * Format duration for display
   * @param {number} ms - Duration in milliseconds
   * @returns {string} Formatted duration
   */
  formatDuration(ms) {
    if (ms === null || ms === undefined) return '-';
    
    if (ms < 1000) {
      return `${ms}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(1)}s`;
    } else {
      const minutes = Math.floor(ms / 60000);
      const seconds = Math.round((ms % 60000) / 1000);
      return `${minutes}m ${seconds}s`;
    }
  }

  /**
   * Get colored status string for display
   * @param {string} status - Wave status
   * @returns {string} Colored status string
   */
  getColoredStatus(status) {
    switch (status) {
      case WaveStatus.RUNNING:
        return chalk.blue('●') + ' ' + chalk.blue('running');
      case WaveStatus.COMPLETED:
        return chalk.green('✓') + ' ' + chalk.green('completed');
      case WaveStatus.FAILED:
        return chalk.red('✗') + ' ' + chalk.red('failed');
      case WaveStatus.PENDING:
      default:
        return chalk.gray('○') + ' ' + chalk.gray('pending');
    }
  }

  /**
   * Print summary to console
   */
  printSummary() {
    const summary = this.getSummary();
    
    console.log(chalk.bold('\n📊 Parallel Execution Summary'));
    console.log(chalk.gray('─'.repeat(40)));
    
    console.log(`Status: ${this._getStatusColor(summary.status)}`);
    console.log(`Waves: ${chalk.green(summary.waves.completed)} completed, ` +
                `${chalk.blue(summary.waves.running)} running, ` +
                `${chalk.red(summary.waves.failed)} failed, ` +
                `${chalk.gray(summary.waves.pending)} pending`);
    console.log(`Batches: ${summary.batches.total} total`);
    console.log(`Duration: ${this.formatDuration(summary.timing.totalDuration)}`);
    
    if (summary.efficiency.wavesAnalyzed > 0) {
      console.log(chalk.gray('─'.repeat(40)));
      console.log(chalk.bold('Efficiency Metrics:'));
      console.log(`  Speedup Factor: ${chalk.cyan(summary.efficiency.speedupFactor + 'x')}`);
      console.log(`  Time Saved: ${chalk.green(this.formatDuration(summary.efficiency.timeSaved))}`);
      console.log(`  Parallel Efficiency: ${chalk.cyan(summary.efficiency.efficiency + '%')}`);
    }

    if (summary.failedWaves.length > 0) {
      console.log(chalk.gray('─'.repeat(40)));
      console.log(chalk.red.bold('Failed Waves:'));
      for (const fw of summary.failedWaves) {
        console.log(`  ${chalk.red('✗')} ${fw.id}: ${fw.error}`);
      }
    }

    console.log('');
  }

  /**
   * Get colored status for summary
   * @private
   * @param {string} status - Execution status
   * @returns {string} Colored status
   */
  _getStatusColor(status) {
    switch (status) {
      case 'running':
        return chalk.blue('● Running');
      case 'completed':
        return chalk.green('✓ Completed');
      case 'not_started':
        return chalk.gray('○ Not Started');
      default:
        return chalk.gray(status);
    }
  }
}

module.exports = { ParallelStateTracker, WaveStatus };
