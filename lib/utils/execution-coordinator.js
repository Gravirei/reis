/**
 * REIS Execution Coordinator
 * Orchestrates parallel wave execution with async operations, events, and state sync
 * 
 * @module lib/utils/execution-coordinator
 */

const EventEmitter = require('events');
const { ParallelWaveScheduler } = require('./parallel-wave-scheduler');

/**
 * Execution Coordinator
 * Handles HOW waves run in parallel: async execution, events, error handling
 */
class ExecutionCoordinator extends EventEmitter {
  /**
   * Create a new ExecutionCoordinator
   * @param {Object} options - Coordinator options
   * @param {number} [options.timeout=300000] - Timeout per wave in ms (default 5 min)
   * @param {number} [options.retryCount=0] - Number of retries for failed waves
   * @param {number} [options.retryDelay=1000] - Base delay between retries in ms
   * @param {boolean} [options.stopOnFirstFailure=false] - Stop all execution on first failure
   * @param {Function} [options.onWaveStart] - Callback when wave starts
   * @param {Function} [options.onWaveComplete] - Callback when wave completes
   * @param {Function} [options.onWaveError] - Callback when wave fails
   * @param {Function} [options.onBatchComplete] - Callback when batch completes
   */
  constructor(options = {}) {
    super();
    this.scheduler = null;
    this.waveExecutors = new Map(); // waveId -> executor function
    this.results = new Map();       // waveId -> execution result
    this.aborted = false;
    this.startTime = null;
    this.endTime = null;

    this.options = {
      timeout: options.timeout || 300000,           // 5 min default per wave
      retryCount: options.retryCount || 0,
      retryDelay: options.retryDelay || 1000,       // 1 second base delay
      stopOnFirstFailure: options.stopOnFirstFailure || false,
      onWaveStart: options.onWaveStart || (() => {}),
      onWaveComplete: options.onWaveComplete || (() => {}),
      onWaveError: options.onWaveError || (() => {}),
      onBatchComplete: options.onBatchComplete || (() => {})
    };
  }

  /**
   * Initialize coordinator with scheduler and wave executors
   * @param {ParallelWaveScheduler} scheduler - The scheduler instance
   * @param {Object|Map} waveExecutors - Map of waveId -> async executor function
   */
  initialize(scheduler, waveExecutors) {
    if (!scheduler) {
      throw new Error('Must provide a ParallelWaveScheduler instance');
    }
    this.scheduler = scheduler;
    this.waveExecutors = waveExecutors instanceof Map 
      ? waveExecutors 
      : new Map(Object.entries(waveExecutors));
    this.results = new Map();
    this.aborted = false;
  }

  /**
   * Execute all waves according to the scheduler
   * @param {Object|Map} [waveExecutor] - Optional executor map (overrides initialized executors)
   * @returns {Promise<Object>} Execution result with success status and details
   */
  async executeAll(waveExecutor = null) {
    if (!this.scheduler) {
      throw new Error('Coordinator not initialized. Call initialize() first.');
    }

    // Allow passing executor at execution time
    if (waveExecutor) {
      this.waveExecutors = waveExecutor instanceof Map 
        ? waveExecutor 
        : new Map(Object.entries(waveExecutor));
    }

    this.startTime = Date.now();
    this.aborted = false;
    this.results = new Map();

    const totalWaves = this.scheduler.graph.nodes.size;
    this.emit('start', { 
      totalWaves,
      timestamp: new Date().toISOString()
    });

    let batchNumber = 0;

    while (!this.scheduler.isComplete() && !this.aborted) {
      const batch = this.scheduler.getNextBatch();

      if (batch.length === 0) {
        // No waves ready - check if blocked by failures or deadlock
        const blocked = this.scheduler.getBlockedWaves();
        if (blocked.length > 0) {
          this.emit('blocked', { 
            blockedWaves: blocked,
            failedWaves: Array.from(this.scheduler.failed)
          });
        }
        break;
      }

      batchNumber++;
      this.emit('batchStart', {
        batchNumber,
        batch,
        batchSize: batch.length,
        status: this.scheduler.getStatus()
      });

      // Execute batch in parallel
      const batchResults = await this.executeBatch(batch);

      this.emit('batchComplete', {
        batchNumber,
        batch,
        results: batchResults,
        status: this.scheduler.getStatus()
      });

      // Call batch complete callback
      this.options.onBatchComplete({
        batchNumber,
        batch,
        results: batchResults
      });

      // Check for stop condition
      if (this.options.stopOnFirstFailure && batchResults.some(r => !r.success)) {
        this.emit('stopped', { 
          reason: 'failure',
          batchNumber,
          failedWaves: batchResults.filter(r => !r.success).map(r => r.waveId)
        });
        break;
      }
    }

    this.endTime = Date.now();
    const finalStatus = this.scheduler.getStatus();
    const success = finalStatus.failed === 0 && !this.aborted;

    const finalResult = {
      success,
      aborted: this.aborted,
      status: finalStatus,
      results: Object.fromEntries(this.results),
      duration: this.endTime - this.startTime,
      batchesExecuted: batchNumber
    };

    this.emit('complete', finalResult);

    return finalResult;
  }

  /**
   * Execute a batch of waves in parallel
   * @param {string[]} waveIds - Array of wave IDs to execute
   * @param {Object|Map} [waveExecutor] - Optional executor map
   * @returns {Promise<Object[]>} Array of execution results
   */
  async executeBatch(waveIds, waveExecutor = null) {
    const executors = waveExecutor 
      ? (waveExecutor instanceof Map ? waveExecutor : new Map(Object.entries(waveExecutor)))
      : this.waveExecutors;

    // Mark all waves as started
    waveIds.forEach(id => this.scheduler.startWave(id));

    // Execute all waves in parallel with individual error handling
    const promises = waveIds.map(waveId => this.executeWave(waveId, executors));
    
    return Promise.all(promises);
  }

  /**
   * Execute a single wave with timeout and retry support
   * @param {string} waveId - Wave ID to execute
   * @param {Map} [executors] - Optional executor map
   * @returns {Promise<Object>} Execution result for this wave
   */
  async executeWave(waveId, executors = null) {
    const waveExecutors = executors || this.waveExecutors;
    
    try {
      this.emit('waveStart', { waveId, timestamp: new Date().toISOString() });
      this.options.onWaveStart({ waveId });

      const executor = waveExecutors.get(waveId);
      if (!executor) {
        throw new Error(`No executor found for wave: ${waveId}`);
      }

      // Execute with retry support
      let result;
      if (this.options.retryCount > 0) {
        result = await this.executeWithRetry(executor, waveId, this.options.retryCount);
      } else {
        result = await this.executeWithTimeout(executor, waveId, this.options.timeout);
      }

      // Mark as completed
      this.scheduler.completeWave(waveId);
      const waveResult = { 
        waveId, 
        success: true, 
        result,
        duration: Date.now() - this.startTime
      };
      this.results.set(waveId, waveResult);

      this.emit('waveComplete', { waveId, result });
      this.options.onWaveComplete({ waveId, result });

      return waveResult;

    } catch (error) {
      // Mark as failed
      this.scheduler.markFailed(waveId, error.message);
      const waveResult = { 
        waveId, 
        success: false, 
        error: error.message,
        duration: Date.now() - this.startTime
      };
      this.results.set(waveId, waveResult);

      this.emit('waveFailed', { waveId, error: error.message });
      this.options.onWaveError({ waveId, error: error.message });

      return waveResult;
    }
  }

  /**
   * Execute with timeout protection
   * @param {Function} executor - Async executor function
   * @param {string} waveId - Wave ID for error messages
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<any>} Executor result
   */
  async executeWithTimeout(executor, waveId, timeout) {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new Error(`Wave ${waveId} timed out after ${timeout}ms`)),
        timeout
      );
    });

    try {
      const result = await Promise.race([executor(waveId), timeoutPromise]);
      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Execute with retry and exponential backoff
   * @param {Function} executor - Async executor function
   * @param {string} waveId - Wave ID
   * @param {number} maxRetries - Maximum retry attempts
   * @returns {Promise<any>} Executor result
   */
  async executeWithRetry(executor, waveId, maxRetries) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          // Exponential backoff: 1s, 2s, 4s, 8s...
          const delay = this.options.retryDelay * Math.pow(2, attempt - 1);
          this.emit('waveRetry', { 
            waveId, 
            attempt, 
            maxRetries,
            delayMs: delay 
          });
          await this._sleep(delay);
        }

        return await this.executeWithTimeout(executor, waveId, this.options.timeout);

      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          this.emit('waveRetryFailed', { 
            waveId, 
            attempt, 
            error: error.message,
            willRetry: true
          });
        }
      }
    }

    throw lastError;
  }

  /**
   * Get current execution progress
   * @returns {Object} Progress object with completed, total, and percent
   */
  getProgress() {
    if (!this.scheduler) {
      return { completed: 0, total: 0, percent: 0 };
    }

    const status = this.scheduler.getStatus();
    return {
      completed: status.completed,
      total: status.total,
      percent: status.progress,
      running: status.running,
      failed: status.failed,
      pending: status.pending
    };
  }

  /**
   * Abort pending executions
   * Currently running waves will complete, but no new waves will start
   */
  abort() {
    this.aborted = true;
    this.emit('aborted', { 
      timestamp: new Date().toISOString(),
      status: this.scheduler ? this.scheduler.getStatus() : null
    });
  }

  /**
   * Create a checkpoint of current execution state
   * @returns {Object} Serializable checkpoint object
   */
  createCheckpoint() {
    if (!this.scheduler) {
      return null;
    }

    return {
      timestamp: new Date().toISOString(),
      completed: Array.from(this.scheduler.completed),
      failed: Array.from(this.scheduler.failed),
      failureReasons: Object.fromEntries(this.scheduler.failureReasons),
      results: Object.fromEntries(this.results),
      status: this.scheduler.getStatus()
    };
  }

  /**
   * Recover from a saved checkpoint
   * @param {Object} checkpoint - Previously saved checkpoint
   */
  recoverFromCheckpoint(checkpoint) {
    if (!this.scheduler || !checkpoint) {
      throw new Error('Scheduler must be initialized and checkpoint must be provided');
    }

    // Restore scheduler state
    this.scheduler.completed = new Set(checkpoint.completed || []);
    this.scheduler.failed = new Set(checkpoint.failed || []);
    this.scheduler.failureReasons = new Map(Object.entries(checkpoint.failureReasons || {}));
    this.scheduler.running = new Set(); // Clear running since we're recovering

    // Restore results
    this.results = new Map(Object.entries(checkpoint.results || {}));

    this.emit('recovered', { 
      checkpoint,
      status: this.scheduler.getStatus()
    });
  }

  /**
   * Get execution summary
   * @returns {Object} Summary of execution results
   */
  getSummary() {
    const status = this.scheduler ? this.scheduler.getStatus() : { total: 0 };
    const results = Object.fromEntries(this.results);

    const successfulWaves = Object.entries(results)
      .filter(([_, r]) => r.success)
      .map(([id]) => id);

    const failedWaves = Object.entries(results)
      .filter(([_, r]) => !r.success)
      .map(([id]) => id);

    return {
      ...status,
      results,
      successfulWaves,
      failedWaves,
      duration: this.endTime && this.startTime ? this.endTime - this.startTime : null,
      aborted: this.aborted
    };
  }

  /**
   * Get waves blocked by failed dependencies
   * @returns {Object[]} Array of blocked wave info
   */
  getBlockedWaves() {
    return this.scheduler ? this.scheduler.getBlockedWaves() : [];
  }

  /**
   * Sleep utility for retry delays
   * @private
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = { ExecutionCoordinator };
