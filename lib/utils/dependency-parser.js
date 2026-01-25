/**
 * REIS v2.0 Dependency Parser
 * Parse dependency metadata from PLAN.md files for parallel wave execution
 */

const fs = require('fs');
const path = require('path');
const { WaveDependencyGraph } = require('./wave-dependency-graph');

/**
 * Parsed wave data structure
 * @typedef {object} ParsedWave
 * @property {string} id - Wave identifier (e.g., "Wave 1")
 * @property {number} number - Wave number
 * @property {string} name - Wave name/description
 * @property {string} size - Wave size (small/medium/large)
 * @property {string[]} dependencies - Array of dependency wave IDs
 * @property {string|null} parallelGroup - Parallel group name
 * @property {number} lineNumber - Line number in source file
 * @property {string[]} tasks - Task descriptions
 */

/**
 * Parsed plan data structure
 * @typedef {object} ParsedPlan
 * @property {ParsedWave[]} waves - Array of parsed waves
 * @property {Map<string, string[]>} dependencies - Map of waveId to dependency IDs
 * @property {Map<string, string>} groups - Map of waveId to parallel group
 * @property {string[]} errors - Validation errors
 * @property {string[]} warnings - Validation warnings
 */

/**
 * DependencyParser - Parse PLAN.md files for dependency information
 */
class DependencyParser {
  constructor() {
    // Pattern to match dependency comments: <!-- @dependencies: Wave 1, Wave 2 -->
    this.dependencyPattern = /<!--\s*@dependenc(?:y|ies):\s*(.+?)\s*-->/gi;
    
    // Pattern to match parallel group comments: <!-- @parallel-group: backend -->
    this.groupPattern = /<!--\s*@parallel-group:\s*(.+?)\s*-->/gi;
    
    // Pattern to match wave headers: ## Wave 1: Description (Size: small)
    this.wavePattern = /^(#{2,3})\s+Wave\s+(\d+)(?::\s*(.+?))?(?:\s+\(Size:\s*(small|medium|large)\))?$/i;
    
    // Pattern to match wave references in dependencies
    this.waveRefPattern = /Wave\s*(\d+)/gi;
  }

  /**
   * Parse a PLAN.md file
   * @param {string} filePath - Path to PLAN.md file
   * @returns {ParsedPlan} - Parsed plan data
   */
  parseFile(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    return this.parseContent(content);
  }

  /**
   * Parse PLAN.md content string
   * @param {string} content - Plan content
   * @returns {ParsedPlan} - Parsed plan data
   */
  parseContent(content) {
    const lines = content.split('\n');
    const waves = [];
    const dependencies = new Map();
    const groups = new Map();
    const errors = [];
    const warnings = [];

    let currentWave = null;
    let pendingDependencies = [];
    let pendingGroup = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Check for dependency comment before wave header
      const depMatch = this._matchDependency(line);
      if (depMatch !== null) {
        pendingDependencies = depMatch;
        continue;
      }

      // Check for parallel group comment before wave header
      const groupMatch = this._matchGroup(line);
      if (groupMatch) {
        pendingGroup = groupMatch;
        continue;
      }

      // Check for wave header
      const waveData = this.parseWaveHeader(line);
      if (waveData) {
        // Save previous wave
        if (currentWave) {
          waves.push(currentWave);
        }

        // Create new wave with pending metadata
        currentWave = {
          id: `Wave ${waveData.number}`,
          number: waveData.number,
          name: waveData.name || `Wave ${waveData.number}`,
          size: waveData.size || 'medium',
          dependencies: [...pendingDependencies],
          parallelGroup: pendingGroup,
          lineNumber,
          tasks: []
        };

        // Store in maps
        dependencies.set(currentWave.id, currentWave.dependencies);
        if (pendingGroup) {
          groups.set(currentWave.id, pendingGroup);
        }

        // Reset pending metadata
        pendingDependencies = [];
        pendingGroup = null;
        continue;
      }

      // Check for inline dependency comment after wave header
      if (currentWave && line.includes('@dependenc')) {
        const inlineDepMatch = this._matchDependency(line);
        if (inlineDepMatch && inlineDepMatch.length > 0) {
          currentWave.dependencies = [...new Set([...currentWave.dependencies, ...inlineDepMatch])];
          dependencies.set(currentWave.id, currentWave.dependencies);
        }
      }

      // Check for inline parallel group comment
      if (currentWave && line.includes('@parallel-group')) {
        const inlineGroupMatch = this._matchGroup(line);
        if (inlineGroupMatch) {
          currentWave.parallelGroup = inlineGroupMatch;
          groups.set(currentWave.id, inlineGroupMatch);
        }
      }

      // Extract tasks for current wave
      if (currentWave) {
        const taskMatch = line.match(/^\s*[-*]\s+(\[[ x]\]\s+)?(.+)$/) ||
                         line.match(/^\s*\d+\.\s+(.+)$/);
        if (taskMatch) {
          const taskText = taskMatch[2] || taskMatch[1];
          if (taskText && taskText.trim().length > 0 && !taskText.includes('@')) {
            currentWave.tasks.push(taskText.trim());
          }
        }
      }
    }

    // Add last wave
    if (currentWave) {
      waves.push(currentWave);
    }

    // Validate the parsed data
    this._validateParsedData(waves, errors, warnings);

    return {
      waves,
      dependencies,
      groups,
      errors,
      warnings
    };
  }

  /**
   * Parse a wave header line
   * @param {string} line - Line to parse
   * @returns {object|null} - Parsed wave data or null
   */
  parseWaveHeader(line) {
    const trimmed = line.trim();
    const match = trimmed.match(this.wavePattern);

    if (!match) {
      return null;
    }

    return {
      level: match[1].length, // Number of # characters
      number: parseInt(match[2], 10),
      name: match[3] ? match[3].trim() : null,
      size: match[4] ? match[4].toLowerCase() : null
    };
  }

  /**
   * Parse dependencies from content
   * @param {string} content - Content to parse
   * @returns {Map<string, string[]>} - Map of waveId to dependencies
   */
  parseDependencies(content) {
    const parsed = this.parseContent(content);
    return parsed.dependencies;
  }

  /**
   * Parse parallel groups from content
   * @param {string} content - Content to parse
   * @returns {Map<string, string>} - Map of waveId to group name
   */
  parseParallelGroups(content) {
    const parsed = this.parseContent(content);
    return parsed.groups;
  }

  /**
   * Build a WaveDependencyGraph from parsed data
   * @param {ParsedPlan} parsedData - Parsed plan data
   * @returns {WaveDependencyGraph} - Dependency graph
   */
  buildGraph(parsedData) {
    const graph = new WaveDependencyGraph();

    // Add all waves to the graph
    for (const wave of parsedData.waves) {
      graph.addWave(wave.id, {
        number: wave.number,
        name: wave.name,
        size: wave.size,
        parallelGroup: wave.parallelGroup,
        tasks: wave.tasks
      });
    }

    // Add dependencies
    for (const wave of parsedData.waves) {
      for (const depId of wave.dependencies) {
        graph.addDependency(wave.id, depId);
      }
    }

    return graph;
  }

  /**
   * Validate dependencies in a graph
   * @param {WaveDependencyGraph} graph - Graph to validate
   * @returns {object} - Validation result with errors and warnings
   */
  validateDependencies(graph) {
    const errors = [];
    const warnings = [];
    const waveIds = new Set(graph.getAllWaveIds());

    // Check for missing wave references
    for (const waveId of waveIds) {
      const deps = graph.getDependencies(waveId);
      for (const depId of deps) {
        if (!waveIds.has(depId)) {
          errors.push(`Wave "${waveId}" depends on non-existent wave "${depId}"`);
        }
      }
    }

    // Check for cycles
    const cycles = graph.detectCycles();
    if (cycles.length > 0) {
      for (const cycle of cycles) {
        errors.push(`Circular dependency detected: ${cycle.join(' -> ')}`);
      }
    }

    // Check for orphan waves (no dependencies and no dependents, excluding first wave)
    for (const waveId of waveIds) {
      const deps = graph.getDependencies(waveId);
      const dependents = graph.getDependents(waveId);
      const wave = graph.getWave(waveId);
      
      if (deps.length === 0 && dependents.length === 0 && wave?.number > 1) {
        warnings.push(`Wave "${waveId}" has no dependencies or dependents - verify this is intentional`);
      }
    }

    // Check for self-dependencies
    for (const waveId of waveIds) {
      const deps = graph.getDependencies(waveId);
      if (deps.includes(waveId)) {
        errors.push(`Wave "${waveId}" depends on itself`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Parse a complete PLAN.md file and return a validated graph
   * @param {string} filePath - Path to PLAN.md file
   * @returns {object} - Result with graph, parsedData, and validation
   */
  parseAndBuildGraph(filePath) {
    const parsedData = this.parseFile(filePath);
    const graph = this.buildGraph(parsedData);
    const validation = this.validateDependencies(graph);

    return {
      graph,
      parsedData,
      validation,
      isValid: validation.valid && parsedData.errors.length === 0
    };
  }

  /**
   * Match dependency comment in a line
   * @private
   * @param {string} line - Line to check
   * @returns {string[]|null} - Array of dependency wave IDs, or null if no match
   */
  _matchDependency(line) {
    // Reset regex lastIndex
    this.dependencyPattern.lastIndex = 0;
    
    const match = this.dependencyPattern.exec(line);
    if (!match) {
      return null; // No dependency comment found
    }
    
    const depString = match[1].trim().toLowerCase();
    
    // Handle "none" or empty
    if (depString === 'none' || depString === '') {
      return [];
    }

    // Extract wave references
    const deps = [];
    this.waveRefPattern.lastIndex = 0;
    let waveMatch;
    while ((waveMatch = this.waveRefPattern.exec(match[1])) !== null) {
      deps.push(`Wave ${waveMatch[1]}`);
    }

    return deps;
  }

  /**
   * Match parallel group comment in a line
   * @private
   * @param {string} line - Line to check
   * @returns {string|null} - Group name or null
   */
  _matchGroup(line) {
    // Reset regex lastIndex
    this.groupPattern.lastIndex = 0;
    
    const match = this.groupPattern.exec(line);
    if (match) {
      return match[1].trim();
    }
    return null;
  }

  /**
   * Validate parsed data for common issues
   * @private
   * @param {ParsedWave[]} waves - Parsed waves
   * @param {string[]} errors - Error array to populate
   * @param {string[]} warnings - Warning array to populate
   */
  _validateParsedData(waves, errors, warnings) {
    const waveNumbers = new Set();
    const waveIds = new Set();

    for (const wave of waves) {
      // Check for duplicate wave numbers
      if (waveNumbers.has(wave.number)) {
        errors.push(`Duplicate wave number: ${wave.number}`);
      }
      waveNumbers.add(wave.number);
      waveIds.add(wave.id);

      // Check for empty waves
      if (wave.tasks.length === 0) {
        warnings.push(`Wave "${wave.id}" has no tasks`);
      }
    }

    // Check for missing dependency references
    for (const wave of waves) {
      for (const depId of wave.dependencies) {
        if (!waveIds.has(depId)) {
          errors.push(`Wave "${wave.id}" depends on non-existent wave "${depId}"`);
        }
      }
    }

    // Check for non-sequential wave numbers
    const sortedNumbers = Array.from(waveNumbers).sort((a, b) => a - b);
    for (let i = 0; i < sortedNumbers.length; i++) {
      if (sortedNumbers[i] !== i + 1) {
        warnings.push(`Wave numbers are not sequential (missing Wave ${i + 1})`);
        break;
      }
    }
  }

  /**
   * Get parallel groups summary
   * @param {ParsedPlan} parsedData - Parsed plan data
   * @returns {Map<string, string[]>} - Map of group name to wave IDs
   */
  getGroupsMap(parsedData) {
    const groupsMap = new Map();

    for (const wave of parsedData.waves) {
      if (wave.parallelGroup) {
        if (!groupsMap.has(wave.parallelGroup)) {
          groupsMap.set(wave.parallelGroup, []);
        }
        groupsMap.get(wave.parallelGroup).push(wave.id);
      }
    }

    return groupsMap;
  }

  /**
   * Generate a summary of the parsed plan
   * @param {ParsedPlan} parsedData - Parsed plan data
   * @returns {object} - Summary object
   */
  getSummary(parsedData) {
    const groupsMap = this.getGroupsMap(parsedData);
    
    return {
      totalWaves: parsedData.waves.length,
      wavesWithDependencies: parsedData.waves.filter(w => w.dependencies.length > 0).length,
      wavesWithoutDependencies: parsedData.waves.filter(w => w.dependencies.length === 0).length,
      parallelGroups: Array.from(groupsMap.keys()),
      groupCounts: Object.fromEntries(
        Array.from(groupsMap.entries()).map(([group, waves]) => [group, waves.length])
      ),
      sizes: {
        small: parsedData.waves.filter(w => w.size === 'small').length,
        medium: parsedData.waves.filter(w => w.size === 'medium').length,
        large: parsedData.waves.filter(w => w.size === 'large').length
      },
      totalTasks: parsedData.waves.reduce((sum, w) => sum + w.tasks.length, 0),
      errors: parsedData.errors,
      warnings: parsedData.warnings
    };
  }
}

module.exports = { DependencyParser };
