/**
 * REIS v2.0 Wave Executor
 * Parse PLAN.md into waves and execute them sequentially or in parallel
 */

import fs from 'fs';
import path from 'path';
import StateManager from './state-manager.js';
import { loadConfig, getWaveSize } from './config.js';
import { commitWaveCompletion, isGitRepo, getGitStatus } from './git-integration.js';

// Parallel execution modules (Phase 1-3)
import { WaveDependencyGraph } from './wave-dependency-graph.js';
import { DependencyParser } from './dependency-parser.js';
import { ParallelWaveScheduler } from './parallel-wave-scheduler.js';
import { ExecutionCoordinator } from './execution-coordinator.js';
import { WaveConflictDetector } from './wave-conflict-detector.js';
import { ConflictResolver } from './conflict-resolver.js';
import type { ReisConfig, WaveSize } from '../../src/types/config.js';

/**
 * Wave structure
 */
export class Wave {
  id: number;
  name: string;
  size: WaveSize;
  tasks: string[];
  status: string;
  startTime: Date | null;
  endTime: Date | null;
  commit: string | null;
  error: any;
  dependencies?: string[];
  parallelGroup?: string | null;

  constructor(id: number, name: string, size: WaveSize, tasks: string[] = []) {
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

  complete(commitHash: string | null = null) {
    this.status = 'completed';
    this.endTime = new Date();
    this.commit = commitHash;
  }

  fail(error: any) {
    this.status = 'failed';
    this.endTime = new Date();
    this.error = error;
  }

  getDuration() {
    if (!this.startTime || !this.endTime) return null;
    const diffMs = (this.endTime as unknown as number) - (this.startTime as unknown as number);
    return Math.round(diffMs / 1000 / 60); // minutes
  }
}

/**
 * Wave Executor
 */
export class WaveExecutor {
  projectRoot: string;
  planningDir: string;
  planPath: string;
  config: ReisConfig;
  stateManager: StateManager;
  waves: Wave[];
  currentWaveIndex: number;
  maxConcurrent: number;
  parallelMode: boolean;
  dependencyGraph: WaveDependencyGraph | null;
  scheduler: ParallelWaveScheduler | null;
  coordinator: ExecutionCoordinator | null;
  conflictDetector: WaveConflictDetector | null;
  conflictResolver: ConflictResolver | null;
  parallelState: { running: Set<string>; completed: Set<string>; pending: Set<string>; failed: Set<string> };

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.planningDir = path.join(projectRoot, '.planning');
    this.planPath = path.join(this.planningDir, 'PLAN.md');
    
    this.config = loadConfig(projectRoot);
    this.stateManager = new StateManager(projectRoot);
    
    this.waves = [];
    this.currentWaveIndex = -1;
    
    // Parallel execution state
    this.maxConcurrent = 4;
    this.parallelMode = false;
    this.dependencyGraph = null;
    this.scheduler = null;
    this.coordinator = null;
    this.conflictDetector = null;
    this.conflictResolver = null;
    
    // Parallel execution tracking
    this.parallelState = {
      running: new Set(),
      completed: new Set(),
      pending: new Set(),
      failed: new Set()
    };
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
  extractWaves(content: string): Wave[] {
    const waves: Wave[] = [];
    const lines = content.split('\n');
    
    let currentWave: Wave | null = null;
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
        const waveSize = (waveMatch[4] || this.config.waves.defaultSize) as WaveSize;

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
  validateWaves(waves: Wave[]): void {
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
  completeCurrentWave(options: any = {}) {
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
        console.warn(`Warning: Auto-commit failed: ${(error as Error).message}`);
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
  failCurrentWave(error: any) {
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
        .reduce((sum: number, w) => sum + (w.getDuration() as number), 0)
    };

    return report;
  }

  // ============================================
  // PARALLEL EXECUTION METHODS
  // ============================================

  /**
   * Set maximum concurrent waves for parallel execution
   * @param {number} n - Maximum concurrent waves (1-10)
   */
  setMaxConcurrent(n: number): void {
    if (typeof n !== 'number' || n < 1 || n > 10) {
      throw new Error('maxConcurrent must be a number between 1 and 10');
    }
    this.maxConcurrent = n;
    
    // Update scheduler if already initialized
    if (this.scheduler) {
      this.scheduler.maxConcurrent = n;
    }
  }

  /**
   * Build dependency graph from parsed waves
   * Uses DependencyParser to extract dependencies from PLAN.md
   * @returns {WaveDependencyGraph} The constructed dependency graph
   */
  buildDependencyGraph() {
    // Ensure waves are parsed
    if (this.waves.length === 0) {
      this.parsePlan();
    }

    // Use DependencyParser to get rich dependency information
    const parser = new DependencyParser();
    let parsedPlan: any;
    
    try {
      parsedPlan = parser.parseFile(this.planPath);
    } catch (error) {
      // Fallback: create graph from basic wave structure
      parsedPlan = {
        waves: this.waves.map((w, idx) => ({
          id: `Wave ${idx + 1}`,
          number: idx + 1,
          name: w.name,
          size: w.size,
          dependencies: [],
          parallelGroup: null,
          tasks: w.tasks
        })),
        dependencies: new Map(),
        groups: new Map()
      };
    }

    // Build WaveDependencyGraph
    this.dependencyGraph = parser.buildGraph(parsedPlan);
    
    // Sync parsed waves with our wave objects
    this._syncWavesFromParsedPlan(parsedPlan);

    return this.dependencyGraph;
  }

  /**
   * Sync internal waves array with parsed plan data
   * @private
   * @param {Object} parsedPlan - Parsed plan from DependencyParser
   */
  _syncWavesFromParsedPlan(parsedPlan: any): void {
    // Update existing waves with dependency info from parsed plan
    for (const parsed of parsedPlan.waves) {
      const existingWave = this.waves.find(w => 
        w.name.includes(`Wave ${parsed.number}`) || w.id === parsed.number - 1
      );
      
      if (existingWave) {
        existingWave.dependencies = parsed.dependencies;
        existingWave.parallelGroup = parsed.parallelGroup;
      }
    }

    // Initialize parallel state
    this.parallelState.pending = new Set(this.waves.map((_, idx) => `Wave ${idx + 1}`));
    this.parallelState.running = new Set();
    this.parallelState.completed = new Set();
    this.parallelState.failed = new Set();
  }

  /**
   * Initialize parallel execution components
   * @param {Object} options - Initialization options
   * @param {string} [options.conflictStrategy='queue'] - Conflict resolution strategy
   * @param {number} [options.timeout=300000] - Timeout per wave in ms
   * @param {boolean} [options.stopOnFirstFailure=false] - Stop on first failure
   */
  initializeParallel(options: any = {}) {
    // Build dependency graph if not already built
    if (!this.dependencyGraph) {
      this.buildDependencyGraph();
    }

    // Initialize conflict detector and resolver
    this.conflictDetector = new WaveConflictDetector({
      strictMode: options.strictMode || false
    });

    this.conflictResolver = new ConflictResolver({
      strategy: options.conflictStrategy || 'queue'
    });

    // Initialize scheduler
    this.scheduler = new ParallelWaveScheduler({
      maxConcurrent: this.maxConcurrent,
      strategy: 'dependency'
    });
    this.scheduler.initialize(this.dependencyGraph!);

    // Initialize coordinator with callbacks for state tracking
    this.coordinator = new ExecutionCoordinator({
      timeout: options.timeout || 300000,
      retryCount: options.retryCount || 0,
      stopOnFirstFailure: options.stopOnFirstFailure || false,
      onWaveStart: ({ waveId }: { waveId: string }) => this._onParallelWaveStart(waveId),
      onWaveComplete: ({ waveId, result }: { waveId: string; result: any }) => this._onParallelWaveComplete(waveId, result),
      onWaveError: ({ waveId, error }: { waveId: string; error: any }) => this._onParallelWaveError(waveId, error),
      onBatchComplete: ({ batchNumber, results }: { batchNumber: number; results: any[] }) => this._onBatchComplete(batchNumber, results)
    });
    this.coordinator.initialize(this.scheduler, new Map());

    this.parallelMode = true;
  }

  /**
   * Execute waves in parallel based on dependencies
   * @param {Object} options - Execution options
   * @param {Function} [options.waveExecutor] - Custom wave executor function
   * @param {boolean} [options.dryRun=false] - Simulate execution without running
   * @param {boolean} [options.checkConflicts=true] - Check for file conflicts
   * @returns {Promise<Object>} Execution results
   */
  async executeParallel(options: any = {}) {
    const { waveExecutor, dryRun = false, checkConflicts = true } = options;

    // Initialize if not already done
    if (!this.parallelMode) {
      this.initializeParallel(options);
    }

    // Check for conflicts if enabled
    if (checkConflicts) {
      const conflictResult = this._checkAndResolveConflicts();
      if (!conflictResult.canProceed) {
        return {
          success: false,
          error: 'Conflicts detected and could not be resolved',
          conflicts: conflictResult.conflicts,
          resolution: conflictResult.resolution
        };
      }
    }

    // If dry run, return the execution plan
    if (dryRun) {
      return this._generateParallelPlan();
    }

    // Build wave executors map
    const executorMap = this._buildWaveExecutorMap(waveExecutor);

    // Execute using coordinator
    const result = await this.coordinator!.executeAll(executorMap);

    // Update wave statuses from results
    this._updateWaveStatusesFromResults(result.results);

    // Generate final report
    return {
      success: result.success,
      aborted: result.aborted,
      duration: result.duration,
      batchesExecuted: result.batchesExecuted,
      waves: this.getParallelStatus(),
      report: this.generateReport(),
      results: result.results
    };
  }

  /**
   * Check for conflicts and attempt to resolve them
   * @private
   * @returns {Object} Conflict check result
   */
  _checkAndResolveConflicts() {
    // Get waves for conflict detection
    const waveData = this.waves.map((w, idx) => ({
      id: `Wave ${idx + 1}`,
      tasks: w.tasks.map(t => typeof t === 'string' ? { description: t } : t)
    }));

    // Detect conflicts
    const conflicts = (this.conflictDetector as any).detectBatchConflicts(waveData);

    if (conflicts.length === 0) {
      return { canProceed: true, conflicts: [], resolution: null };
    }

    // Try to resolve conflicts
    const resolution = this.conflictResolver!.resolve(conflicts, this.scheduler!);

    return {
      canProceed: resolution.resolved,
      conflicts,
      resolution
    };
  }

  /**
   * Build executor map for all waves
   * @private
   * @param {Function} customExecutor - Optional custom executor function
   * @returns {Map} Map of waveId -> executor function
   */
  _buildWaveExecutorMap(customExecutor: any) {
    const executorMap = new Map();

    for (let i = 0; i < this.waves.length; i++) {
      const wave = this.waves[i];
      const waveId = `Wave ${i + 1}`;

      if (customExecutor) {
        // Use custom executor
        executorMap.set(waveId, async () => customExecutor(wave, waveId));
      } else {
        // Default executor: mark wave as executed (for orchestration layer)
        executorMap.set(waveId, async () => {
          // This is a placeholder - the actual work is done by the orchestrating agent
          // We track the state and handle commits
          return {
            waveId,
            wave: wave.name,
            tasks: wave.tasks.length,
            executed: true
          };
        });
      }
    }

    return executorMap;
  }

  /**
   * Generate parallel execution plan without executing
   * @private
   * @returns {Object} Execution plan
   */
  _generateParallelPlan() {
    const batches: any[] = [];
    const tempScheduler = new ParallelWaveScheduler({
      maxConcurrent: this.maxConcurrent
    });
    tempScheduler.initialize(this.dependencyGraph!);

    while (!tempScheduler.isComplete()) {
      const batch = tempScheduler.getNextBatch();
      if (batch.length === 0) break;
      
      batches.push({
        batchNumber: batches.length + 1,
        waves: batch,
        canRunParallel: batch.length > 1
      });

      // Simulate completion for planning
      batch.forEach(id => tempScheduler.completeWave(id));
    }

    return {
      success: true,
      dryRun: true,
      totalBatches: batches.length,
      batches,
      estimatedSpeedup: this._calculateEstimatedSpeedup(batches),
      waves: this.waves.map((w, idx) => ({
        id: `Wave ${idx + 1}`,
        name: w.name,
        size: w.size,
        tasks: w.tasks.length
      }))
    };
  }

  /**
   * Calculate estimated speedup from parallel execution
   * @private
   * @param {Array} batches - Execution batches
   * @returns {Object} Speedup metrics
   */
  _calculateEstimatedSpeedup(batches: any[]) {
    const sequentialTime = this.waves.reduce((sum, w) => {
      return sum + getWaveSize(this.config, w.size).estimatedMinutes;
    }, 0);

    const parallelTime = batches.reduce((sum: number, batch: any) => {
      // Each batch takes the time of its longest wave
      const maxBatchTime = Math.max(...batch.waves.map((waveId: string) => {
        const idx = parseInt(waveId.replace('Wave ', '')) - 1;
        const wave = this.waves[idx];
        return wave ? getWaveSize(this.config, wave.size).estimatedMinutes : 0;
      }));
      return sum + maxBatchTime;
    }, 0);

    return {
      sequentialMinutes: sequentialTime,
      parallelMinutes: parallelTime,
      speedupFactor: parallelTime > 0 ? (sequentialTime / parallelTime).toFixed(2) : 1,
      timeSaved: sequentialTime - parallelTime
    };
  }

  /**
   * Update wave statuses from execution results
   * @private
   * @param {Object} results - Results from coordinator
   */
  _updateWaveStatusesFromResults(results: any): void {
    for (const [waveId, result] of Object.entries(results) as [string, any][]) {
      const idx = parseInt(waveId.replace('Wave ', '')) - 1;
      const wave = this.waves[idx];
      
      if (wave) {
        if (result.success) {
          wave.complete(result.commit || null);
        } else {
          wave.fail(result.error || 'Unknown error');
        }
      }
    }
  }

  /**
   * Callback when a parallel wave starts
   * @private
   * @param {string} waveId - Wave ID
   */
  _onParallelWaveStart(waveId: string): void {
    this.parallelState.pending.delete(waveId);
    this.parallelState.running.add(waveId);

    const idx = parseInt(waveId.replace('Wave ', '')) - 1;
    const wave = this.waves[idx];
    
    if (wave) {
      wave.start();
      this.stateManager.addActivity(`[PARALLEL] Started: ${wave.name}`);
    }
  }

  /**
   * Callback when a parallel wave completes
   * @private
   * @param {string} waveId - Wave ID
   * @param {Object} result - Execution result
   */
  _onParallelWaveComplete(waveId: string, result: any): void {
    this.parallelState.running.delete(waveId);
    this.parallelState.completed.add(waveId);

    const idx = parseInt(waveId.replace('Wave ', '')) - 1;
    const wave = this.waves[idx];
    
    if (wave) {
      // Auto-commit if enabled
      let commitHash = null;
      if (this.config.git.autoCommit && isGitRepo(this.projectRoot)) {
        try {
          const phase = this.stateManager.state.currentPhase || 'Development';
          const commit = commitWaveCompletion(
            wave.name,
            phase,
            {
              projectRoot: this.projectRoot,
              prefix: this.config.git.commitMessagePrefix,
              details: result.changes || [],
              testStatus: result.testStatus || 'pending'
            }
          );
          
          if (commit) {
            commitHash = commit.shortHash;
          }
        } catch (error) {
          // Non-fatal: log and continue
        }
      }

      wave.complete(commitHash);
      this.stateManager.addActivity(`[PARALLEL] Completed: ${wave.name}${commitHash ? ` (${commitHash})` : ''}`);
    }
  }

  /**
   * Callback when a parallel wave fails
   * @private
   * @param {string} waveId - Wave ID
   * @param {string} error - Error message
   */
  _onParallelWaveError(waveId: string, error: any): void {
    this.parallelState.running.delete(waveId);
    this.parallelState.failed.add(waveId);

    const idx = parseInt(waveId.replace('Wave ', '')) - 1;
    const wave = this.waves[idx];
    
    if (wave) {
      wave.fail(error);
      this.stateManager.addActivity(`[PARALLEL] Failed: ${wave.name} - ${error}`);
      this.stateManager.addBlocker(`Parallel wave failed: ${wave.name}`);
    }
  }

  /**
   * Callback when a batch completes
   * @private
   * @param {number} batchNumber - Batch number
   * @param {Array} results - Batch results
   */
  _onBatchComplete(batchNumber: number, results: any[]): void {
    const successful = results.filter((r: any) => r.success).length;
    const failed = results.filter((r: any) => !r.success).length;
    
    this.stateManager.addActivity(
      `[PARALLEL] Batch ${batchNumber} complete: ${successful} succeeded, ${failed} failed`
    );
  }

  /**
   * Get status of all waves in parallel execution
   * @returns {Object} Status of all waves
   */
  getParallelStatus() {
    return {
      running: Array.from(this.parallelState.running),
      completed: Array.from(this.parallelState.completed),
      pending: Array.from(this.parallelState.pending),
      failed: Array.from(this.parallelState.failed),
      progress: {
        total: this.waves.length,
        completed: this.parallelState.completed.size,
        running: this.parallelState.running.size,
        pending: this.parallelState.pending.size,
        failed: this.parallelState.failed.size,
        percentage: this.waves.length > 0 
          ? Math.round((this.parallelState.completed.size / this.waves.length) * 100)
          : 0
      }
    };
  }

  /**
   * Abort parallel execution
   */
  abortParallel() {
    if (this.coordinator) {
      this.coordinator.abort();
    }
    this.stateManager.addActivity('[PARALLEL] Execution aborted by user');
  }

  /**
   * Reset parallel execution state
   */
  resetParallel() {
    this.parallelState = {
      running: new Set(),
      completed: new Set(),
      pending: new Set(this.waves.map((_, idx) => `Wave ${idx + 1}`)),
      failed: new Set()
    };

    if (this.scheduler) {
      this.scheduler.reset();
    }

    // Reset wave statuses
    for (const wave of this.waves) {
      wave.status = 'pending';
      wave.startTime = null;
      wave.endTime = null;
      wave.commit = null;
      wave.error = null;
    }
  }
}
