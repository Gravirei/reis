/**
 * REIS Parallel Wave Scheduler
 * Schedules waves for parallel execution based on dependencies
 * 
 * @module lib/utils/parallel-wave-scheduler
 */

const { WaveDependencyGraph } = require('./wave-dependency-graph');

/**
 * Parallel Wave Scheduler
 * Determines which waves can execute concurrently based on dependencies and constraints
 */
class ParallelWaveScheduler {
  /**
   * Create a new ParallelWaveScheduler
   * @param {Object} options - Scheduler options
   * @param {number} [options.maxConcurrent=4] - Maximum concurrent waves
   * @param {string} [options.strategy='dependency'] - Scheduling strategy: 'dependency' | 'group' | 'auto'
   */
  constructor(options = {}) {
    this.maxConcurrent = options.maxConcurrent || 4;
    this.strategy = options.strategy || 'dependency'; // 'dependency' | 'group' | 'auto'
    this.graph = null;
    this.completed = new Set();
    this.running = new Set();
    this.failed = new Set();
    this.failureReasons = new Map(); // waveId -> error message
  }

  /**
   * Initialize scheduler with a dependency graph
   * @param {WaveDependencyGraph} graph - The dependency graph to schedule
   * @throws {Error} If graph is not a valid WaveDependencyGraph instance
   */
  initialize(graph) {
    if (!graph || typeof graph.nodes === 'undefined') {
      throw new Error('Must provide a valid WaveDependencyGraph instance');
    }
    this.graph = graph;
    this.reset();
  }

  /**
   * Reset scheduler state
   */
  reset() {
    this.completed = new Set();
    this.running = new Set();
    this.failed = new Set();
    this.failureReasons = new Map();
  }

  /**
   * Get next batch of waves that can execute in parallel
   * @returns {string[]} Array of wave IDs that can start now
   */
  getNextBatch() {
    if (!this.graph) {
      throw new Error('Scheduler not initialized. Call initialize() first.');
    }

    const ready = [];

    for (const [waveId, metadata] of this.graph.nodes) {
      // Skip completed, running, or failed waves
      if (this.completed.has(waveId) || this.running.has(waveId) || this.failed.has(waveId)) {
        continue;
      }

      // Get dependencies for this wave
      const deps = this.graph.getDependencies(waveId);
      
      // Check if any dependency failed
      const anyDepFailed = deps.some(d => this.failed.has(d));
      if (anyDepFailed) {
        continue; // Cannot run if any dependency failed
      }

      // Check if all dependencies are complete
      const allDepsComplete = deps.every(d => this.completed.has(d));
      if (allDepsComplete) {
        ready.push(waveId);
      }
    }

    // Apply scheduling strategy
    let batch = ready;
    if (this.strategy === 'group') {
      batch = this._applyGroupStrategy(ready);
    } else if (this.strategy === 'auto') {
      batch = this._applyAutoStrategy(ready);
    }

    // Respect max concurrent limit
    const availableSlots = this.maxConcurrent - this.running.size;
    batch = batch.slice(0, Math.max(0, availableSlots));

    return batch;
  }

  /**
   * Check if a specific wave can start
   * @param {string} waveId - Wave ID to check
   * @returns {boolean} True if the wave can start
   */
  canStart(waveId) {
    if (!this.graph) return false;
    if (!this.graph.nodes.has(waveId)) return false;
    if (this.completed.has(waveId) || this.running.has(waveId) || this.failed.has(waveId)) {
      return false;
    }

    const deps = this.graph.getDependencies(waveId);
    const anyDepFailed = deps.some(d => this.failed.has(d));
    if (anyDepFailed) return false;

    const allDepsComplete = deps.every(d => this.completed.has(d));
    if (!allDepsComplete) return false;

    // Check concurrent limit
    return this.running.size < this.maxConcurrent;
  }

  /**
   * Mark a wave as started/running
   * @param {string} waveId - Wave ID to mark as started
   */
  markStarted(waveId) {
    this.running.add(waveId);
  }

  /**
   * Alias for markStarted for backward compatibility
   * @param {string} waveId - Wave ID to start
   */
  startWave(waveId) {
    this.markStarted(waveId);
  }

  /**
   * Mark a wave as completed
   * @param {string} waveId - Wave ID to mark as completed
   */
  markCompleted(waveId) {
    this.running.delete(waveId);
    this.completed.add(waveId);
  }

  /**
   * Alias for markCompleted for backward compatibility
   * @param {string} waveId - Wave ID to complete
   */
  completeWave(waveId) {
    this.markCompleted(waveId);
  }

  /**
   * Mark a wave as failed
   * @param {string} waveId - Wave ID to mark as failed
   * @param {string} [error] - Error message describing the failure
   */
  markFailed(waveId, error = 'Unknown error') {
    this.running.delete(waveId);
    this.failed.add(waveId);
    this.failureReasons.set(waveId, error);
  }

  /**
   * Alias for markFailed for backward compatibility
   * @param {string} waveId - Wave ID to fail
   */
  failWave(waveId) {
    this.markFailed(waveId);
  }

  /**
   * Check if all waves are done (completed or failed)
   * @returns {boolean} True if all waves are done
   */
  isComplete() {
    if (!this.graph) return true;
    const total = this.graph.nodes.size;
    return this.completed.size + this.failed.size >= total;
  }

  /**
   * Get current scheduler status
   * @returns {Object} Status object with counts and progress
   */
  getStatus() {
    const total = this.graph ? this.graph.nodes.size : 0;
    const completedCount = this.completed.size;
    const runningCount = this.running.size;
    const failedCount = this.failed.size;
    const pendingCount = total - completedCount - runningCount - failedCount;

    return {
      total,
      completed: completedCount,
      running: runningCount,
      failed: failedCount,
      pending: pendingCount,
      progress: total > 0 ? Math.round((completedCount / total) * 100) : 0,
      completedWaves: Array.from(this.completed),
      runningWaves: Array.from(this.running),
      failedWaves: Array.from(this.failed),
      failureReasons: Object.fromEntries(this.failureReasons)
    };
  }

  /**
   * Get waves that are blocked due to failed dependencies
   * @returns {Object[]} Array of blocked wave info
   */
  getBlockedWaves() {
    if (!this.graph) return [];

    const blocked = [];
    for (const [waveId, metadata] of this.graph.nodes) {
      if (this.completed.has(waveId) || this.running.has(waveId) || this.failed.has(waveId)) {
        continue;
      }

      const deps = this.graph.getDependencies(waveId);
      const failedDeps = deps.filter(d => this.failed.has(d));
      
      if (failedDeps.length > 0) {
        blocked.push({
          waveId,
          blockedBy: failedDeps,
          reasons: failedDeps.map(d => this.failureReasons.get(d))
        });
      }
    }

    return blocked;
  }

  /**
   * Generate a complete execution plan (pre-compute all batches)
   * @returns {Object[]} Array of batch objects with wave IDs and estimated timing
   */
  generateExecutionPlan() {
    if (!this.graph) {
      throw new Error('Scheduler not initialized. Call initialize() first.');
    }

    // Create a temporary scheduler to simulate execution
    const tempCompleted = new Set();
    const tempRunning = new Set();
    const plan = [];
    let batchNumber = 0;

    while (tempCompleted.size < this.graph.nodes.size) {
      const ready = [];

      for (const [waveId, metadata] of this.graph.nodes) {
        if (tempCompleted.has(waveId)) continue;

        const deps = this.graph.getDependencies(waveId);
        const allDepsComplete = deps.every(d => tempCompleted.has(d));

        if (allDepsComplete) {
          ready.push(waveId);
        }
      }

      if (ready.length === 0) {
        // Deadlock or all done
        break;
      }

      // Apply max concurrent limit
      const batch = ready.slice(0, this.maxConcurrent);
      
      // Calculate estimated duration (max of waves in batch)
      let maxDuration = 0;
      for (const waveId of batch) {
        const meta = this.graph.nodes.get(waveId);
        const duration = meta?.estimatedMinutes || 30; // Default 30 min
        maxDuration = Math.max(maxDuration, duration);
      }

      plan.push({
        batch: batchNumber++,
        waves: batch,
        waveCount: batch.length,
        estimatedDuration: maxDuration,
        parallel: batch.length > 1
      });

      // Mark batch as completed for next iteration
      batch.forEach(id => tempCompleted.add(id));
    }

    return plan;
  }

  /**
   * Estimate total execution time given wave durations
   * @param {Map|Object} waveDurations - Map or object of waveId -> minutes
   * @returns {number} Estimated total minutes with parallelism
   */
  estimateCompletion(waveDurations = {}) {
    const plan = this.generateExecutionPlan();
    const durations = waveDurations instanceof Map 
      ? waveDurations 
      : new Map(Object.entries(waveDurations));

    let totalMinutes = 0;

    for (const batch of plan) {
      // For each batch, time is the max of all waves (parallel execution)
      let batchDuration = 0;
      for (const waveId of batch.waves) {
        const waveDuration = durations.get(waveId) || 
                            this.graph.nodes.get(waveId)?.estimatedMinutes || 
                            30;
        batchDuration = Math.max(batchDuration, waveDuration);
      }
      totalMinutes += batchDuration;
    }

    return totalMinutes;
  }

  /**
   * Compare sequential vs parallel execution times
   * @param {Map|Object} [waveDurations] - Optional custom wave durations
   * @returns {Object} Comparison with sequential, parallel times and savings
   */
  compareSequentialVsParallel(waveDurations = {}) {
    if (!this.graph) {
      throw new Error('Scheduler not initialized');
    }

    const durations = waveDurations instanceof Map 
      ? waveDurations 
      : new Map(Object.entries(waveDurations));

    // Calculate sequential time (sum of all waves)
    let sequentialMinutes = 0;
    for (const [waveId, metadata] of this.graph.nodes) {
      sequentialMinutes += durations.get(waveId) || metadata?.estimatedMinutes || 30;
    }

    // Calculate parallel time
    const parallelMinutes = this.estimateCompletion(waveDurations);

    // Calculate savings
    const savedMinutes = sequentialMinutes - parallelMinutes;
    const savedPercent = sequentialMinutes > 0 
      ? Math.round((savedMinutes / sequentialMinutes) * 100) 
      : 0;

    return {
      sequential: sequentialMinutes,
      parallel: parallelMinutes,
      saved: savedMinutes,
      savings: `${savedPercent}% (${savedMinutes} minutes)`,
      speedup: sequentialMinutes > 0 
        ? `${(sequentialMinutes / parallelMinutes).toFixed(1)}x` 
        : '1x'
    };
  }

  /**
   * Generate ASCII timeline visualization
   * @returns {string} ASCII art timeline
   */
  getExecutionTimeline() {
    const plan = this.generateExecutionPlan();
    if (plan.length === 0) return 'No waves to execute';

    const lines = [];
    lines.push('Execution Timeline:');
    lines.push('═'.repeat(60));

    let timeOffset = 0;
    for (const batch of plan) {
      const batchLabel = `Batch ${batch.batch + 1}`;
      const wavesStr = batch.waves.join(', ');
      const durationStr = `~${batch.estimatedDuration}min`;
      
      if (batch.parallel) {
        lines.push(`[${timeOffset}min] ${batchLabel} (parallel): ${wavesStr} ${durationStr}`);
        for (const waveId of batch.waves) {
          lines.push(`         ├── ${waveId}`);
        }
      } else {
        lines.push(`[${timeOffset}min] ${batchLabel}: ${wavesStr} ${durationStr}`);
      }
      
      timeOffset += batch.estimatedDuration;
    }

    lines.push('═'.repeat(60));
    lines.push(`Total estimated time: ${timeOffset} minutes`);

    return lines.join('\n');
  }

  /**
   * Apply group-based scheduling strategy
   * Prioritizes waves from the same parallel-group
   * @private
   * @param {string[]} waves - Ready wave IDs
   * @returns {string[]} Sorted wave IDs
   */
  _applyGroupStrategy(waves) {
    // Group waves by their parallel-group metadata
    const groups = new Map();

    for (const waveId of waves) {
      const meta = this.graph.nodes.get(waveId);
      const group = meta?.parallelGroup || 'default';

      if (!groups.has(group)) {
        groups.set(group, []);
      }
      groups.get(group).push(waveId);
    }

    // Sort groups by size (largest first) for better parallelism
    const sortedGroups = Array.from(groups.entries())
      .sort((a, b) => b[1].length - a[1].length);

    // Flatten back to array, keeping group order
    return sortedGroups.flatMap(([_, groupWaves]) => groupWaves);
  }

  /**
   * Apply auto scheduling strategy
   * Automatically chooses best approach based on graph structure
   * @private
   * @param {string[]} waves - Ready wave IDs
   * @returns {string[]} Sorted wave IDs
   */
  _applyAutoStrategy(waves) {
    // Check if waves have parallel-group metadata
    const hasGroups = waves.some(waveId => {
      const meta = this.graph.nodes.get(waveId);
      return meta?.parallelGroup && meta.parallelGroup !== 'default';
    });

    if (hasGroups) {
      return this._applyGroupStrategy(waves);
    }

    // Default: sort by estimated duration (shortest first for better throughput)
    return [...waves].sort((a, b) => {
      const metaA = this.graph.nodes.get(a);
      const metaB = this.graph.nodes.get(b);
      const durationA = metaA?.estimatedMinutes || 30;
      const durationB = metaB?.estimatedMinutes || 30;
      return durationA - durationB;
    });
  }
}

module.exports = { ParallelWaveScheduler };
