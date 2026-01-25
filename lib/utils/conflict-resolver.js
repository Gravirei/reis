/**
 * REIS Conflict Resolver
 * Provides strategies for handling detected file conflicts between parallel waves
 * 
 * @module lib/utils/conflict-resolver
 */

const chalk = require('chalk');
const { WaveConflictDetector, ConflictSeverity } = require('./wave-conflict-detector');

/**
 * Resolution strategies
 * @enum {string}
 */
const ResolutionStrategy = {
  FAIL: 'fail',     // Stop execution if conflicts detected
  QUEUE: 'queue',   // Serialize conflicting waves (add dependencies)
  BRANCH: 'branch', // Create isolated git branches per wave
  MERGE: 'merge'    // Allow conflicts, rely on git merge later
};

/**
 * ConflictResolver - Resolves file conflicts between parallel waves
 */
class ConflictResolver {
  /**
   * Create a new ConflictResolver
   * @param {Object} options - Resolver options
   * @param {string} [options.strategy='fail'] - Resolution strategy: 'fail' | 'queue' | 'merge' | 'branch'
   * @param {Function} [options.onConflict] - Callback for custom handling
   * @param {Object} [options.detectorOptions] - Options to pass to WaveConflictDetector
   */
  constructor(options = {}) {
    this.strategy = options.strategy || ResolutionStrategy.FAIL;
    this.onConflict = options.onConflict || null;
    this.detector = new WaveConflictDetector(options.detectorOptions || {});
  }

  /**
   * Resolve conflicts based on strategy
   * @param {Array} conflicts - Array of conflict objects from WaveConflictDetector
   * @param {Object} scheduler - ParallelWaveScheduler instance (for queue strategy)
   * @returns {Object} Resolution result
   */
  resolve(conflicts, scheduler = null) {
    // If no conflicts, nothing to resolve
    if (!conflicts || conflicts.length === 0) {
      return {
        resolved: true,
        strategy: 'none',
        message: 'No conflicts to resolve',
        modifications: []
      };
    }

    // Call custom handler if provided
    if (this.onConflict) {
      const customResult = this.onConflict(conflicts);
      if (customResult && customResult.handled) {
        return customResult;
      }
    }

    // Apply resolution strategy
    switch (this.strategy) {
      case ResolutionStrategy.FAIL:
        return this._strategyFail(conflicts);
      
      case ResolutionStrategy.QUEUE:
        return this._strategyQueue(conflicts, scheduler);
      
      case ResolutionStrategy.BRANCH:
        return this._strategyBranch(conflicts);
      
      case ResolutionStrategy.MERGE:
        return this._strategyMerge(conflicts);
      
      default:
        return this._strategyFail(conflicts);
    }
  }

  /**
   * Strategy: Fail - Stop execution if conflicts detected
   * @private
   * @param {Array} conflicts - Array of conflict objects
   * @returns {Object} Resolution result indicating failure
   */
  _strategyFail(conflicts) {
    const highSeverity = conflicts.filter(c => c.severity === ConflictSeverity.HIGH);
    const mediumSeverity = conflicts.filter(c => c.severity === ConflictSeverity.MEDIUM);

    return {
      resolved: false,
      strategy: ResolutionStrategy.FAIL,
      error: `${conflicts.length} conflict(s) detected - cannot proceed`,
      message: this._formatFailMessage(conflicts),
      conflicts: conflicts,
      summary: {
        total: conflicts.length,
        high: highSeverity.length,
        medium: mediumSeverity.length,
        low: conflicts.length - highSeverity.length - mediumSeverity.length
      },
      suggestions: conflicts.map(c => ({
        waves: c.waves,
        suggestion: `Add dependency: <!-- @dependencies: ${c.waves[0]} --> to ${c.waves[1]}`
      }))
    };
  }

  /**
   * Strategy: Queue - Serialize conflicting waves (remove parallelism)
   * @private
   * @param {Array} conflicts - Array of conflict objects
   * @param {Object} scheduler - ParallelWaveScheduler instance
   * @returns {Object} Resolution result with modifications
   */
  _strategyQueue(conflicts, scheduler) {
    const modifications = [];
    const addedDependencies = new Set();

    // Sort conflicts by severity (high first)
    const sortedConflicts = [...conflicts].sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return (severityOrder[a.severity] || 2) - (severityOrder[b.severity] || 2);
    });

    for (const conflict of sortedConflicts) {
      const [waveA, waveB] = conflict.waves;
      const depKey = `${waveA}->${waveB}`;
      const reversDepKey = `${waveB}->${waveA}`;

      // Skip if we already added this dependency (or its reverse)
      if (addedDependencies.has(depKey) || addedDependencies.has(reversDepKey)) {
        continue;
      }

      // Add serialization dependency (waveB depends on waveA)
      modifications.push({
        type: 'add_dependency',
        from: waveA,
        to: waveB,
        reason: `File conflict: ${this._formatOverlaps(conflict.overlaps)}`,
        severity: conflict.severity
      });

      addedDependencies.add(depKey);

      // If scheduler provided, actually add the dependency
      if (scheduler && scheduler.graph) {
        this.addSerializationDependency(waveA, waveB, scheduler.graph);
      }
    }

    // Check for cycles if we have a scheduler with graph
    let hasCycle = false;
    let cycleInfo = null;

    if (scheduler && scheduler.graph && scheduler.graph.hasCycle) {
      hasCycle = scheduler.graph.hasCycle();
      if (hasCycle && scheduler.graph.detectCycles) {
        cycleInfo = scheduler.graph.detectCycles();
      }
    }

    if (hasCycle) {
      return {
        resolved: false,
        strategy: ResolutionStrategy.QUEUE,
        error: 'Cannot resolve conflicts without creating circular dependency',
        cycle: cycleInfo,
        conflicts: conflicts,
        modifications: modifications
      };
    }

    return {
      resolved: true,
      strategy: ResolutionStrategy.QUEUE,
      message: `Serialized ${modifications.length} conflicting wave pair(s)`,
      modifications: modifications,
      originalConflicts: conflicts
    };
  }

  /**
   * Strategy: Branch - Create isolated git branches per wave
   * @private
   * @param {Array} conflicts - Array of conflict objects
   * @returns {Object} Resolution result with branch information
   */
  _strategyBranch(conflicts) {
    const branches = [];
    const affectedWaves = new Set();

    for (const conflict of conflicts) {
      for (const waveId of conflict.waves) {
        affectedWaves.add(waveId);
      }
    }

    // Create branch info for each affected wave
    for (const waveId of affectedWaves) {
      const safeBranchName = waveId.toLowerCase().replace(/[^a-z0-9]/g, '-');
      branches.push({
        waveId: waveId,
        branchName: `reis/parallel/${safeBranchName}`,
        action: 'create',
        mergeTarget: 'main'
      });
    }

    return {
      resolved: true,
      strategy: ResolutionStrategy.BRANCH,
      message: `Will create ${branches.length} isolated branch(es) for conflicting waves`,
      branches: branches,
      mergeOrder: this._calculateMergeOrder(conflicts, branches),
      warnings: [
        'Branches will need manual merge resolution after wave completion',
        'Consider using queue strategy for simpler conflict resolution'
      ],
      originalConflicts: conflicts
    };
  }

  /**
   * Strategy: Merge - Allow conflicts, rely on git merge later
   * @private
   * @param {Array} conflicts - Array of conflict objects
   * @returns {Object} Resolution result with merge warnings
   */
  _strategyMerge(conflicts) {
    const highSeverity = conflicts.filter(c => c.severity === ConflictSeverity.HIGH);

    // Warn about high severity conflicts
    const warnings = [];
    if (highSeverity.length > 0) {
      warnings.push(
        chalk.yellow(`⚠ ${highSeverity.length} high-severity conflict(s) may cause merge issues`)
      );
      
      for (const conflict of highSeverity) {
        warnings.push(
          `  - ${conflict.waves.join(' ↔ ')}: ${this._formatOverlaps(conflict.overlaps)}`
        );
      }
    }

    return {
      resolved: true,
      strategy: ResolutionStrategy.MERGE,
      message: 'Allowing parallel execution - git merge conflicts may occur',
      warnings: warnings,
      expectedMergeConflicts: conflicts.map(c => ({
        waves: c.waves,
        files: c.overlaps.map(o => o.patternA),
        severity: c.severity
      })),
      recommendations: [
        'Review changes carefully before merging',
        'Use git diff to identify conflicting changes',
        'Consider using --no-ff when merging to preserve history'
      ],
      originalConflicts: conflicts
    };
  }

  /**
   * Add artificial dependency to prevent parallel execution
   * @param {string} waveA - Wave that should complete first
   * @param {string} waveB - Wave that should wait for waveA
   * @param {Object} graph - WaveDependencyGraph instance
   * @returns {boolean} True if dependency was added successfully
   */
  addSerializationDependency(waveA, waveB, graph) {
    if (!graph) {
      return false;
    }

    // Check if this would create a cycle
    if (graph.getAllDependencies) {
      const bDeps = graph.getAllDependencies(waveB);
      if (bDeps.includes(waveA)) {
        // waveA already depends on waveB, can't add reverse
        return false;
      }
    }

    // Add the dependency
    if (graph.addDependency) {
      graph.addDependency(waveB, waveA);
      return true;
    }

    return false;
  }

  /**
   * Generate resolution recommendations based on conflicts
   * @param {Array} conflicts - Array of conflict objects
   * @returns {Object} Recommendations object
   */
  generateRecommendations(conflicts) {
    const recommendations = {
      preferredStrategy: ResolutionStrategy.FAIL,
      reasoning: [],
      alternativeStrategies: [],
      actionItems: []
    };

    if (!conflicts || conflicts.length === 0) {
      recommendations.preferredStrategy = 'none';
      recommendations.reasoning.push('No conflicts detected - all strategies are safe');
      return recommendations;
    }

    const highCount = conflicts.filter(c => c.severity === ConflictSeverity.HIGH).length;
    const mediumCount = conflicts.filter(c => c.severity === ConflictSeverity.MEDIUM).length;
    const lowCount = conflicts.filter(c => c.severity === 'low').length;

    // Determine preferred strategy based on conflict profile
    if (highCount > 0) {
      recommendations.preferredStrategy = ResolutionStrategy.QUEUE;
      recommendations.reasoning.push(
        `${highCount} high-severity conflict(s) detected - serialization recommended`
      );
      recommendations.alternativeStrategies.push({
        strategy: ResolutionStrategy.BRANCH,
        suitability: 'good',
        reason: 'Branch isolation can handle high-severity conflicts with manual merge'
      });
    } else if (mediumCount > 0) {
      recommendations.preferredStrategy = ResolutionStrategy.QUEUE;
      recommendations.reasoning.push(
        `${mediumCount} medium-severity conflict(s) - queue strategy is safest`
      );
      recommendations.alternativeStrategies.push({
        strategy: ResolutionStrategy.MERGE,
        suitability: 'acceptable',
        reason: 'Medium conflicts may be resolvable with git merge'
      });
    } else if (lowCount > 0) {
      recommendations.preferredStrategy = ResolutionStrategy.MERGE;
      recommendations.reasoning.push(
        `Only ${lowCount} low-severity conflict(s) - merge strategy should work`
      );
      recommendations.alternativeStrategies.push({
        strategy: ResolutionStrategy.QUEUE,
        suitability: 'good',
        reason: 'Queue is always safe but reduces parallelism'
      });
    }

    // Generate action items
    for (const conflict of conflicts) {
      if (conflict.severity === ConflictSeverity.HIGH) {
        recommendations.actionItems.push({
          priority: 'high',
          action: `Add dependency between ${conflict.waves[1]} and ${conflict.waves[0]}`,
          command: `<!-- @dependencies: ${conflict.waves[0]} -->`
        });
      }
    }

    // Add general recommendations
    recommendations.actionItems.push({
      priority: 'info',
      action: 'Review wave file patterns to minimize overlap',
      details: 'Consider splitting waves by functional area (frontend/backend/shared)'
    });

    return recommendations;
  }

  /**
   * Format conflict report for console output
   * @param {Object} result - Resolution result
   * @returns {string} Formatted string
   */
  formatResult(result) {
    const lines = [];

    if (result.resolved) {
      lines.push(chalk.green(`✓ Conflicts resolved using '${result.strategy}' strategy`));
    } else {
      lines.push(chalk.red(`✗ Could not resolve conflicts using '${result.strategy}' strategy`));
      if (result.error) {
        lines.push(chalk.red(`  Error: ${result.error}`));
      }
    }

    lines.push('');

    if (result.message) {
      lines.push(result.message);
    }

    if (result.modifications && result.modifications.length > 0) {
      lines.push('');
      lines.push(chalk.bold('Modifications:'));
      for (const mod of result.modifications) {
        lines.push(`  ${chalk.yellow('+')} ${mod.to} now depends on ${mod.from}`);
        lines.push(`    ${chalk.dim(mod.reason)}`);
      }
    }

    if (result.branches && result.branches.length > 0) {
      lines.push('');
      lines.push(chalk.bold('Branches to create:'));
      for (const branch of result.branches) {
        lines.push(`  ${chalk.cyan(branch.branchName)} for ${branch.waveId}`);
      }
    }

    if (result.warnings && result.warnings.length > 0) {
      lines.push('');
      lines.push(chalk.bold('Warnings:'));
      for (const warning of result.warnings) {
        lines.push(`  ${chalk.yellow('⚠')} ${warning}`);
      }
    }

    if (result.suggestions && result.suggestions.length > 0) {
      lines.push('');
      lines.push(chalk.bold('Suggestions:'));
      for (const suggestion of result.suggestions) {
        lines.push(`  ${chalk.blue('→')} ${suggestion.suggestion}`);
      }
    }

    return lines.join('\n');
  }

  // ==================== Private Helper Methods ====================

  /**
   * Format fail message with conflict details
   * @private
   */
  _formatFailMessage(conflicts) {
    const lines = ['Parallel execution blocked due to file conflicts:'];
    
    for (const conflict of conflicts) {
      const severityIcon = conflict.severity === 'high' ? chalk.red('●') :
                          conflict.severity === 'medium' ? chalk.yellow('●') : chalk.blue('●');
      lines.push(`  ${severityIcon} ${conflict.waves.join(' ↔ ')} [${conflict.severity}]`);
    }
    
    return lines.join('\n');
  }

  /**
   * Format overlaps for display
   * @private
   */
  _formatOverlaps(overlaps) {
    if (!overlaps || overlaps.length === 0) {
      return 'pattern overlap';
    }
    
    const uniquePatterns = new Set();
    for (const overlap of overlaps.slice(0, 3)) {
      uniquePatterns.add(overlap.patternA);
    }
    
    let result = Array.from(uniquePatterns).join(', ');
    if (overlaps.length > 3) {
      result += ` (+${overlaps.length - 3} more)`;
    }
    
    return result;
  }

  /**
   * Calculate merge order for branch strategy
   * @private
   */
  _calculateMergeOrder(conflicts, branches) {
    // Simple topological sort based on conflict dependencies
    const order = [];
    const merged = new Set();
    const waveIds = branches.map(b => b.waveId);

    // Build dependency map from conflicts
    const mustMergeBefore = new Map();
    for (const waveId of waveIds) {
      mustMergeBefore.set(waveId, new Set());
    }

    for (const conflict of conflicts) {
      const [waveA, waveB] = conflict.waves;
      // waveA should merge before waveB (lower severity wave first)
      if (mustMergeBefore.has(waveB)) {
        mustMergeBefore.get(waveB).add(waveA);
      }
    }

    // Kahn's algorithm for topological sort
    while (merged.size < waveIds.length) {
      let found = false;
      for (const waveId of waveIds) {
        if (merged.has(waveId)) continue;
        
        const deps = mustMergeBefore.get(waveId);
        const allDepsMerged = Array.from(deps).every(d => merged.has(d));
        
        if (allDepsMerged) {
          order.push(waveId);
          merged.add(waveId);
          found = true;
        }
      }
      
      // If no progress, we have a cycle - just add remaining in any order
      if (!found) {
        for (const waveId of waveIds) {
          if (!merged.has(waveId)) {
            order.push(waveId);
            merged.add(waveId);
          }
        }
      }
    }

    return order;
  }
}

module.exports = { 
  ConflictResolver,
  ResolutionStrategy
};
