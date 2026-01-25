/**
 * REIS Wave Conflict Detector
 * Detects file conflicts between waves that might run in parallel
 * 
 * @module lib/utils/wave-conflict-detector
 */

const chalk = require('chalk');
const path = require('path');

/**
 * Conflict severity levels
 * @enum {string}
 */
const ConflictSeverity = {
  HIGH: 'high',     // Same file modified by multiple waves
  MEDIUM: 'medium', // Same directory modified
  LOW: 'low'        // Same pattern area (e.g., both touch frontend)
};

/**
 * Conflict types
 * @enum {string}
 */
const ConflictType = {
  DIRECT: 'direct',       // Same exact file
  DIRECTORY: 'directory', // Same directory
  PATTERN: 'pattern'      // Same pattern area
};

/**
 * Default file pattern configuration by area
 */
const DEFAULT_FILE_PATTERNS = {
  backend: ['src/api/**', 'src/models/**', 'prisma/**', 'src/services/**', 'lib/api/**'],
  frontend: ['src/components/**', 'src/pages/**', 'src/hooks/**', 'src/app/**'],
  shared: ['src/types/**', 'src/utils/**', 'src/config/**', 'lib/utils/**'],
  tests: ['test/**', '__tests__/**', '*.test.js', '*.spec.js', '**/*.test.js'],
  config: ['*.config.js', '*.config.ts', '.env*', 'package.json', 'tsconfig.json']
};

/**
 * WaveConflictDetector - Identifies file conflicts between parallel waves
 */
class WaveConflictDetector {
  /**
   * Create a new WaveConflictDetector
   * @param {Object} options - Detector options
   * @param {Object} [options.filePatterns] - Custom file pattern configuration
   * @param {boolean} [options.strictMode=false] - Fail on any overlap
   * @param {string[]} [options.ignorePatterns] - Patterns to ignore in conflict detection
   */
  constructor(options = {}) {
    this.filePatterns = options.filePatterns || DEFAULT_FILE_PATTERNS;
    this.strictMode = options.strictMode || false;
    this.ignorePatterns = options.ignorePatterns || ['*.md', '*.txt', 'README*', 'LICENSE*'];
  }

  /**
   * Analyze a wave's tasks to determine affected files/patterns
   * @param {Object} wave - Wave object with id, tasks, and optional filePatterns
   * @returns {Object} Analysis result with files, patterns, and areas
   */
  analyzeWave(wave) {
    const result = {
      waveId: wave.id,
      files: new Set(),
      patterns: new Set(),
      areas: new Set()
    };

    // If wave has explicit filePatterns, use them
    if (wave.filePatterns && Array.isArray(wave.filePatterns)) {
      for (const pattern of wave.filePatterns) {
        result.patterns.add(pattern);
        
        // Determine which area this pattern belongs to
        for (const [area, areaPatterns] of Object.entries(this.filePatterns)) {
          for (const areaPattern of areaPatterns) {
            if (this._patternsOverlap(pattern, areaPattern)) {
              result.areas.add(area);
            }
          }
        }
      }
    }

    // If wave has tasks with file information, extract from them
    if (wave.tasks && Array.isArray(wave.tasks)) {
      for (const task of wave.tasks) {
        // Handle task objects with files property
        if (task.files) {
          const taskFiles = Array.isArray(task.files) ? task.files : [task.files];
          for (const file of taskFiles) {
            result.files.add(file);
            result.patterns.add(file);
          }
        }
        
        // Handle string tasks - try to extract file paths
        if (typeof task === 'string') {
          const fileMatches = task.match(/[\w\-./]+\.(js|ts|jsx|tsx|json|css|scss|md)/g);
          if (fileMatches) {
            for (const file of fileMatches) {
              result.files.add(file);
              result.patterns.add(file);
            }
          }
        }
      }
    }

    return {
      waveId: result.waveId,
      files: Array.from(result.files),
      patterns: Array.from(result.patterns),
      areas: Array.from(result.areas)
    };
  }

  /**
   * Check if two waves have conflicting file patterns
   * @param {Object} waveA - First wave
   * @param {Object} waveB - Second wave
   * @returns {Object|null} Conflict object if conflicts exist, null otherwise
   */
  detectConflicts(waveA, waveB) {
    const analysisA = this.analyzeWave(waveA);
    const analysisB = this.analyzeWave(waveB);

    const overlaps = [];
    const conflicts = {
      direct: [],    // Same file
      directory: [], // Same directory
      pattern: []    // Same pattern area
    };

    // Check for direct file conflicts
    for (const patternA of analysisA.patterns) {
      for (const patternB of analysisB.patterns) {
        // Skip if either pattern should be ignored
        if (this._shouldIgnore(patternA) || this._shouldIgnore(patternB)) {
          continue;
        }

        const overlapType = this._getOverlapType(patternA, patternB);
        if (overlapType) {
          overlaps.push({
            patternA,
            patternB,
            type: overlapType
          });
          conflicts[overlapType].push({ patternA, patternB });
        }
      }
    }

    // Check for area conflicts (same logical area)
    const sharedAreas = analysisA.areas.filter(area => analysisB.areas.includes(area));

    if (overlaps.length === 0 && sharedAreas.length === 0) {
      return null;
    }

    return {
      waves: [waveA.id, waveB.id],
      overlaps,
      conflicts,
      sharedAreas,
      severity: this.getConflictSeverity({ conflicts, sharedAreas }),
      analysisA,
      analysisB
    };
  }

  /**
   * Check all pairs of waves that might run in parallel
   * @param {Array} waves - Array of wave objects
   * @param {Object} [dependencyGraph] - Optional dependency graph to check parallel eligibility
   * @returns {Array} Array of conflict objects
   */
  detectAllConflicts(waves, dependencyGraph = null) {
    const allConflicts = [];

    for (let i = 0; i < waves.length; i++) {
      for (let j = i + 1; j < waves.length; j++) {
        const waveA = waves[i];
        const waveB = waves[j];

        // If we have a dependency graph, only check waves that could run in parallel
        if (dependencyGraph) {
          if (!this._couldRunInParallel(waveA.id, waveB.id, dependencyGraph)) {
            continue;
          }
        }

        const conflict = this.detectConflicts(waveA, waveB);
        if (conflict) {
          allConflicts.push(conflict);
        }
      }
    }

    return allConflicts;
  }

  /**
   * Suggest parallel groups based on file patterns
   * Uses graph coloring to find non-conflicting sets
   * @param {Array} waves - Array of wave objects
   * @returns {Array} Array of wave groups that can safely run together
   */
  suggestGroups(waves) {
    // Build conflict adjacency map
    const conflictMap = new Map();
    for (const wave of waves) {
      conflictMap.set(wave.id, new Set());
    }

    // Find all conflicts
    const conflicts = this.detectAllConflicts(waves);
    for (const conflict of conflicts) {
      const [waveA, waveB] = conflict.waves;
      conflictMap.get(waveA).add(waveB);
      conflictMap.get(waveB).add(waveA);
    }

    // Graph coloring - greedy approach
    const colors = new Map(); // waveId -> color (group number)
    const groups = []; // Array of arrays of wave IDs

    // Sort waves by number of conflicts (most constrained first)
    const sortedWaves = [...waves].sort((a, b) => {
      return conflictMap.get(b.id).size - conflictMap.get(a.id).size;
    });

    for (const wave of sortedWaves) {
      // Find colors used by conflicting waves
      const usedColors = new Set();
      for (const conflictingWaveId of conflictMap.get(wave.id)) {
        if (colors.has(conflictingWaveId)) {
          usedColors.add(colors.get(conflictingWaveId));
        }
      }

      // Find smallest color not used by neighbors
      let color = 0;
      while (usedColors.has(color)) {
        color++;
      }

      colors.set(wave.id, color);

      // Add to groups array
      while (groups.length <= color) {
        groups.push([]);
      }
      groups[color].push(wave.id);
    }

    return groups.map((waveIds, index) => ({
      group: index + 1,
      waves: waveIds,
      canRunInParallel: true,
      reason: 'No file conflicts between these waves'
    }));
  }

  /**
   * Match a file path against a glob-like pattern
   * @param {string} filePath - File path to match
   * @param {string} pattern - Glob pattern to match against
   * @returns {boolean} True if the file matches the pattern
   */
  matchesPattern(filePath, pattern) {
    // Normalize paths
    const normalizedPath = filePath.replace(/\\/g, '/');
    const normalizedPattern = pattern.replace(/\\/g, '/');

    // Convert glob pattern to regex
    const regexStr = normalizedPattern
      .replace(/\./g, '\\.')           // Escape dots
      .replace(/\*\*/g, '{{GLOBSTAR}}') // Temp replace **
      .replace(/\*/g, '[^/]*')         // * matches anything except /
      .replace(/\?/g, '[^/]')          // ? matches single char except /
      .replace(/{{GLOBSTAR}}/g, '.*'); // ** matches anything including /

    const regex = new RegExp(`^${regexStr}$`);
    return regex.test(normalizedPath);
  }

  /**
   * Get conflict severity based on conflict details
   * @param {Object} conflict - Conflict object with conflicts and sharedAreas
   * @returns {string} Severity: 'high', 'medium', or 'low'
   */
  getConflictSeverity(conflict) {
    // High severity: direct file conflicts
    if (conflict.conflicts && conflict.conflicts.direct && conflict.conflicts.direct.length > 0) {
      return ConflictSeverity.HIGH;
    }

    // Medium severity: directory conflicts
    if (conflict.conflicts && conflict.conflicts.directory && conflict.conflicts.directory.length > 0) {
      return ConflictSeverity.MEDIUM;
    }

    // Low severity: only shared areas or pattern conflicts
    if ((conflict.sharedAreas && conflict.sharedAreas.length > 0) ||
        (conflict.conflicts && conflict.conflicts.pattern && conflict.conflicts.pattern.length > 0)) {
      return ConflictSeverity.LOW;
    }

    return ConflictSeverity.LOW;
  }

  /**
   * Generate a detailed conflict report
   * @param {Array} conflicts - Array of conflict objects
   * @returns {Object} Report object with summary and details
   */
  generateReport(conflicts) {
    const report = {
      summary: {
        totalConflicts: conflicts.length,
        highSeverity: 0,
        mediumSeverity: 0,
        lowSeverity: 0,
        affectedWaves: new Set()
      },
      conflicts: [],
      recommendations: []
    };

    for (const conflict of conflicts) {
      // Count by severity
      switch (conflict.severity) {
        case ConflictSeverity.HIGH:
          report.summary.highSeverity++;
          break;
        case ConflictSeverity.MEDIUM:
          report.summary.mediumSeverity++;
          break;
        case ConflictSeverity.LOW:
          report.summary.lowSeverity++;
          break;
      }

      // Track affected waves
      for (const waveId of conflict.waves) {
        report.summary.affectedWaves.add(waveId);
      }

      // Add conflict details
      report.conflicts.push({
        waves: conflict.waves,
        severity: conflict.severity,
        overlaps: conflict.overlaps,
        sharedAreas: conflict.sharedAreas,
        recommendation: this._getRecommendation(conflict)
      });
    }

    // Convert Set to Array for JSON serialization
    report.summary.affectedWaves = Array.from(report.summary.affectedWaves);

    // Generate overall recommendations
    if (report.summary.highSeverity > 0) {
      report.recommendations.push({
        priority: 'high',
        action: 'serialize',
        message: 'High severity conflicts detected. Consider serializing conflicting waves.'
      });
    }

    if (report.summary.totalConflicts > 0) {
      report.recommendations.push({
        priority: 'medium',
        action: 'review',
        message: 'Review wave groupings to minimize conflicts.'
      });

      // Suggest safe groups
      report.recommendations.push({
        priority: 'info',
        action: 'suggest',
        message: 'Use suggestGroups() to get recommended parallel groupings.'
      });
    }

    return report;
  }

  /**
   * Format report for console output
   * @param {Object} report - Report object from generateReport
   * @returns {string} Formatted string for console output
   */
  formatReport(report) {
    const lines = [];

    lines.push(chalk.bold.underline('\n📋 Wave Conflict Report\n'));

    // Summary
    lines.push(chalk.bold('Summary:'));
    lines.push(`  Total Conflicts: ${report.summary.totalConflicts}`);
    lines.push(`  ${chalk.red('High Severity:')} ${report.summary.highSeverity}`);
    lines.push(`  ${chalk.yellow('Medium Severity:')} ${report.summary.mediumSeverity}`);
    lines.push(`  ${chalk.blue('Low Severity:')} ${report.summary.lowSeverity}`);
    lines.push(`  Affected Waves: ${report.summary.affectedWaves.join(', ')}`);
    lines.push('');

    // Conflict details
    if (report.conflicts.length > 0) {
      lines.push(chalk.bold('Conflicts:'));
      for (const conflict of report.conflicts) {
        const severityColor = conflict.severity === 'high' ? chalk.red :
                             conflict.severity === 'medium' ? chalk.yellow : chalk.blue;
        
        lines.push(`  ${severityColor('●')} ${conflict.waves.join(' ↔ ')} [${conflict.severity}]`);
        
        if (conflict.overlaps && conflict.overlaps.length > 0) {
          for (const overlap of conflict.overlaps.slice(0, 3)) {
            lines.push(`    - ${overlap.patternA} ↔ ${overlap.patternB} (${overlap.type})`);
          }
          if (conflict.overlaps.length > 3) {
            lines.push(`    ... and ${conflict.overlaps.length - 3} more`);
          }
        }

        if (conflict.sharedAreas && conflict.sharedAreas.length > 0) {
          lines.push(`    Shared areas: ${conflict.sharedAreas.join(', ')}`);
        }

        lines.push(`    ${chalk.dim('→')} ${conflict.recommendation}`);
      }
      lines.push('');
    }

    // Recommendations
    if (report.recommendations.length > 0) {
      lines.push(chalk.bold('Recommendations:'));
      for (const rec of report.recommendations) {
        const icon = rec.priority === 'high' ? chalk.red('!') :
                    rec.priority === 'medium' ? chalk.yellow('●') : chalk.blue('ℹ');
        lines.push(`  ${icon} ${rec.message}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Validate parallel execution for a set of waves
   * @param {Array} waves - Array of wave objects
   * @returns {Object} Validation result with valid boolean and details
   */
  validateParallelExecution(waves) {
    const conflicts = this.detectAllConflicts(waves);

    if (conflicts.length === 0) {
      return {
        valid: true,
        conflicts: [],
        warnings: [],
        errors: []
      };
    }

    const hasHighSeverity = conflicts.some(c => c.severity === ConflictSeverity.HIGH);
    const hasMediumSeverity = conflicts.some(c => c.severity === ConflictSeverity.MEDIUM);

    return {
      valid: !this.strictMode && !hasHighSeverity,
      conflicts,
      warnings: conflicts.filter(c => c.severity === ConflictSeverity.LOW || 
                                      c.severity === ConflictSeverity.MEDIUM),
      errors: conflicts.filter(c => c.severity === ConflictSeverity.HIGH)
    };
  }

  // ==================== Private Methods ====================

  /**
   * Check if two patterns overlap
   * @private
   * @param {string} patternA - First pattern
   * @param {string} patternB - Second pattern
   * @returns {boolean} True if patterns could match the same files
   */
  _patternsOverlap(patternA, patternB) {
    // Normalize patterns
    const a = patternA.replace(/\\/g, '/');
    const b = patternB.replace(/\\/g, '/');

    // Exact match
    if (a === b) return true;

    // Check if one is a subset of the other
    const dirA = path.dirname(a);
    const dirB = path.dirname(b);
    const fileA = path.basename(a);
    const fileB = path.basename(b);

    // Same directory check
    if (dirA === dirB) {
      // Both wildcards
      if (fileA.includes('*') && fileB.includes('*')) return true;
      // One is wildcard
      if (fileA === '*' || fileB === '*') return true;
      // One matches the other
      if (this.matchesPattern(fileB, fileA) || this.matchesPattern(fileA, fileB)) return true;
      // Exact file match
      if (fileA === fileB) return true;
    }

    // Glob star (**) matching
    if (a.includes('**')) {
      const prefix = a.split('**')[0];
      if (b.startsWith(prefix) || prefix === '') return true;
    }
    if (b.includes('**')) {
      const prefix = b.split('**')[0];
      if (a.startsWith(prefix) || prefix === '') return true;
    }

    // Directory containment
    if (dirA.startsWith(dirB + '/') || dirB.startsWith(dirA + '/')) {
      // One directory contains the other
      if (fileA === '*' || fileB === '*' || fileA.includes('*') || fileB.includes('*')) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get the type of overlap between two patterns
   * @private
   * @param {string} patternA - First pattern
   * @param {string} patternB - Second pattern
   * @returns {string|null} Overlap type or null if no overlap
   */
  _getOverlapType(patternA, patternB) {
    const a = patternA.replace(/\\/g, '/');
    const b = patternB.replace(/\\/g, '/');

    // Direct: exact same file
    if (a === b) return ConflictType.DIRECT;
    
    // Check if both resolve to the same concrete file
    if (!a.includes('*') && !b.includes('*') && !a.includes('?') && !b.includes('?')) {
      // Both are concrete paths
      if (path.normalize(a) === path.normalize(b)) {
        return ConflictType.DIRECT;
      }
      return null;
    }

    // Check for pattern overlap
    if (this._patternsOverlap(a, b)) {
      const dirA = path.dirname(a);
      const dirB = path.dirname(b);

      // Same directory = directory conflict
      if (dirA === dirB) {
        return ConflictType.DIRECTORY;
      }

      // One contains the other = pattern conflict
      return ConflictType.PATTERN;
    }

    return null;
  }

  /**
   * Check if a pattern should be ignored
   * @private
   * @param {string} pattern - Pattern to check
   * @returns {boolean} True if should be ignored
   */
  _shouldIgnore(pattern) {
    const filename = path.basename(pattern);
    
    for (const ignorePattern of this.ignorePatterns) {
      if (this.matchesPattern(filename, ignorePattern)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if two waves could run in parallel based on dependency graph
   * @private
   * @param {string} waveIdA - First wave ID
   * @param {string} waveIdB - Second wave ID
   * @param {Object} graph - Dependency graph
   * @returns {boolean} True if waves could run in parallel
   */
  _couldRunInParallel(waveIdA, waveIdB, graph) {
    // If A depends on B or B depends on A, they cannot run in parallel
    const depsA = graph.getDependencies ? graph.getDependencies(waveIdA) : [];
    const depsB = graph.getDependencies ? graph.getDependencies(waveIdB) : [];

    if (depsA.includes(waveIdB) || depsB.includes(waveIdA)) {
      return false;
    }

    // Check transitive dependencies
    if (graph.getAllDependencies) {
      const allDepsA = graph.getAllDependencies(waveIdA);
      const allDepsB = graph.getAllDependencies(waveIdB);

      if (allDepsA.includes(waveIdB) || allDepsB.includes(waveIdA)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get recommendation for a conflict
   * @private
   * @param {Object} conflict - Conflict object
   * @returns {string} Recommendation message
   */
  _getRecommendation(conflict) {
    switch (conflict.severity) {
      case ConflictSeverity.HIGH:
        return `Add dependency: ${conflict.waves[1]} should depend on ${conflict.waves[0]}`;
      case ConflictSeverity.MEDIUM:
        return `Consider serializing or using separate branches for ${conflict.waves.join(' and ')}`;
      case ConflictSeverity.LOW:
        return `Low risk - monitor for merge conflicts`;
      default:
        return 'Review wave file patterns';
    }
  }
}

module.exports = { 
  WaveConflictDetector,
  ConflictSeverity,
  ConflictType,
  DEFAULT_FILE_PATTERNS
};
