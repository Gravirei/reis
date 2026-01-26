/**
 * REIS v2.0 Wave Dependency Graph
 * Directed Acyclic Graph (DAG) for managing wave dependencies in parallel execution
 */

/**
 * Node colors for cycle detection using DFS
 * @enum {number}
 */
const NodeColor = {
  WHITE: 0, // Unvisited
  GRAY: 1,  // Currently being processed (in stack)
  BLACK: 2  // Fully processed
};

/**
 * WaveDependencyGraph - DAG structure for wave dependencies
 * Supports cycle detection, topological sorting, and execution ordering
 */
class WaveDependencyGraph {
  /**
   * Create a new WaveDependencyGraph
   */
  constructor() {
    /** @type {Map<string, {wave: any, dependencies: Set<string>, dependents: Set<string>}>} */
    this.nodes = new Map();
    /** @type {Set<string>} */
    this.completed = new Set();
  }

  /**
   * Add a wave to the graph
   * @param {string} waveId - Unique identifier for the wave
   * @param {any} wave - Wave data object (optional)
   * @returns {WaveDependencyGraph} - Returns this for chaining
   */
  addWave(waveId, wave = null) {
    if (!this.nodes.has(waveId)) {
      this.nodes.set(waveId, {
        wave,
        dependencies: new Set(),
        dependents: new Set()
      });
    } else if (wave !== null) {
      // Update wave data if provided
      this.nodes.get(waveId).wave = wave;
    }
    return this;
  }

  /**
   * Add a dependency between waves
   * @param {string} waveId - Wave that has the dependency
   * @param {string} dependsOnWaveId - Wave that must complete first
   * @returns {WaveDependencyGraph} - Returns this for chaining
   */
  addDependency(waveId, dependsOnWaveId) {
    // Ensure both nodes exist
    this.addWave(waveId);
    this.addWave(dependsOnWaveId);

    // Add dependency relationship
    this.nodes.get(waveId).dependencies.add(dependsOnWaveId);
    this.nodes.get(dependsOnWaveId).dependents.add(waveId);

    return this;
  }

  /**
   * Remove a dependency between waves
   * @param {string} waveId - Wave that has the dependency
   * @param {string} dependsOnWaveId - Wave to remove from dependencies
   * @returns {boolean} - True if dependency was removed
   */
  removeDependency(waveId, dependsOnWaveId) {
    const node = this.nodes.get(waveId);
    const dependsOnNode = this.nodes.get(dependsOnWaveId);

    if (!node || !dependsOnNode) {
      return false;
    }

    const removed = node.dependencies.delete(dependsOnWaveId);
    dependsOnNode.dependents.delete(waveId);

    return removed;
  }

  /**
   * Get all dependencies for a wave
   * @param {string} waveId - Wave to get dependencies for
   * @returns {string[]} - Array of dependency wave IDs
   */
  getDependencies(waveId) {
    const node = this.nodes.get(waveId);
    if (!node) {
      return [];
    }
    return Array.from(node.dependencies);
  }

  /**
   * Get all dependents (waves that depend on this wave)
   * @param {string} waveId - Wave to get dependents for
   * @returns {string[]} - Array of dependent wave IDs
   */
  getDependents(waveId) {
    const node = this.nodes.get(waveId);
    if (!node) {
      return [];
    }
    return Array.from(node.dependents);
  }

  /**
   * Get all dependencies recursively (transitive closure)
   * Returns all waves that must complete before this wave can run
   * @param {string} waveId - Wave to get all dependencies for
   * @param {Set<string>} [visited] - Set of already visited nodes (for cycle prevention)
   * @returns {string[]} - Array of all dependency wave IDs (direct and indirect)
   */
  getAllDependencies(waveId, visited = new Set()) {
    const node = this.nodes.get(waveId);
    if (!node) {
      return [];
    }

    const allDeps = [];
    
    for (const depId of node.dependencies) {
      // Skip already visited to prevent infinite loops in case of cycles
      if (visited.has(depId)) {
        continue;
      }
      
      visited.add(depId);
      allDeps.push(depId);
      
      // Recursively get dependencies of this dependency
      const transitiveDeps = this.getAllDependencies(depId, visited);
      allDeps.push(...transitiveDeps);
    }

    // Return unique values
    return [...new Set(allDeps)];
  }

  /**
   * Get all dependents recursively (transitive closure)
   * Returns all waves that depend on this wave (directly or indirectly)
   * @param {string} waveId - Wave to get all dependents for
   * @param {Set<string>} [visited] - Set of already visited nodes (for cycle prevention)
   * @returns {string[]} - Array of all dependent wave IDs (direct and indirect)
   */
  getAllDependents(waveId, visited = new Set()) {
    const node = this.nodes.get(waveId);
    if (!node) {
      return [];
    }

    const allDependents = [];
    
    for (const dependentId of node.dependents) {
      // Skip already visited to prevent infinite loops in case of cycles
      if (visited.has(dependentId)) {
        continue;
      }
      
      visited.add(dependentId);
      allDependents.push(dependentId);
      
      // Recursively get dependents of this dependent
      const transitiveDependents = this.getAllDependents(dependentId, visited);
      allDependents.push(...transitiveDependents);
    }

    // Return unique values
    return [...new Set(allDependents)];
  }

  /**
   * Check if the graph has any cycles
   * @returns {boolean} - True if cycles exist
   */
  hasCycle() {
    const cycles = this.detectCycles();
    return cycles.length > 0;
  }

  /**
   * Detect all cycles in the graph using DFS with color marking
   * @returns {string[][]} - Array of cycle paths (empty if no cycles)
   */
  detectCycles() {
    const colors = new Map();
    const parent = new Map();
    const cycles = [];

    // Initialize all nodes as WHITE (unvisited)
    for (const waveId of this.nodes.keys()) {
      colors.set(waveId, NodeColor.WHITE);
      parent.set(waveId, null);
    }

    /**
     * DFS visit function
     * @param {string} nodeId - Current node to visit
     * @param {string[]} path - Current path from start
     * @returns {boolean} - True if cycle found
     */
    const dfsVisit = (nodeId, path) => {
      colors.set(nodeId, NodeColor.GRAY);
      const currentPath = [...path, nodeId];

      const node = this.nodes.get(nodeId);
      if (!node) return false;

      // Visit all dependencies (edges go from dependent to dependency)
      for (const depId of node.dependencies) {
        const color = colors.get(depId);

        if (color === NodeColor.GRAY) {
          // Found a back edge - cycle detected
          const cycleStart = currentPath.indexOf(depId);
          const cyclePath = [...currentPath.slice(cycleStart), depId];
          cycles.push(cyclePath);
          return true;
        }

        if (color === NodeColor.WHITE) {
          parent.set(depId, nodeId);
          dfsVisit(depId, currentPath);
        }
      }

      colors.set(nodeId, NodeColor.BLACK);
      return false;
    };

    // Run DFS from each unvisited node
    for (const waveId of this.nodes.keys()) {
      if (colors.get(waveId) === NodeColor.WHITE) {
        dfsVisit(waveId, []);
      }
    }

    return cycles;
  }

  /**
   * Get execution order using topological sort (Kahn's algorithm)
   * @returns {string[]} - Ordered array of wave IDs (empty if cycle exists)
   */
  getExecutionOrder() {
    if (this.hasCycle()) {
      return [];
    }

    const inDegree = new Map();
    const queue = [];
    const result = [];

    // Calculate in-degree for each node (number of dependencies)
    for (const [waveId, node] of this.nodes) {
      inDegree.set(waveId, node.dependencies.size);
      if (node.dependencies.size === 0) {
        queue.push(waveId);
      }
    }

    // Process nodes with no dependencies first
    while (queue.length > 0) {
      // Sort queue for deterministic order
      queue.sort();
      const current = queue.shift();
      result.push(current);

      // Reduce in-degree for all dependents
      const node = this.nodes.get(current);
      for (const dependentId of node.dependents) {
        const newDegree = inDegree.get(dependentId) - 1;
        inDegree.set(dependentId, newDegree);
        if (newDegree === 0) {
          queue.push(dependentId);
        }
      }
    }

    return result;
  }

  /**
   * Get waves that can be executed (all dependencies satisfied, not completed)
   * @returns {string[]} - Array of executable wave IDs
   */
  getExecutableWaves() {
    const executable = [];

    for (const [waveId, node] of this.nodes) {
      // Skip if already completed
      if (this.completed.has(waveId)) {
        continue;
      }

      // Check if all dependencies are completed
      let allDepsCompleted = true;
      for (const depId of node.dependencies) {
        if (!this.completed.has(depId)) {
          allDepsCompleted = false;
          break;
        }
      }

      if (allDepsCompleted) {
        executable.push(waveId);
      }
    }

    // Sort for deterministic order
    return executable.sort();
  }

  /**
   * Mark a wave as completed
   * @param {string} waveId - Wave to mark as completed
   * @returns {string[]} - Waves that became executable after this completion
   */
  markCompleted(waveId) {
    if (!this.nodes.has(waveId)) {
      return [];
    }

    const previousExecutable = new Set(this.getExecutableWaves());
    this.completed.add(waveId);
    const newExecutable = this.getExecutableWaves();

    // Return only newly executable waves
    return newExecutable.filter(id => !previousExecutable.has(id));
  }

  /**
   * Check if a wave is completed
   * @param {string} waveId - Wave to check
   * @returns {boolean} - True if completed
   */
  isCompleted(waveId) {
    return this.completed.has(waveId);
  }

  /**
   * Reset completion status of all waves
   * @returns {WaveDependencyGraph} - Returns this for chaining
   */
  reset() {
    this.completed.clear();
    return this;
  }

  /**
   * Get wave data for a specific wave
   * @param {string} waveId - Wave to get
   * @returns {any} - Wave data or null
   */
  getWave(waveId) {
    const node = this.nodes.get(waveId);
    return node ? node.wave : null;
  }

  /**
   * Get all wave IDs in the graph
   * @returns {string[]} - Array of all wave IDs
   */
  getAllWaveIds() {
    return Array.from(this.nodes.keys());
  }

  /**
   * Get the number of waves in the graph
   * @returns {number} - Number of waves
   */
  size() {
    return this.nodes.size;
  }

  /**
   * Serialize graph to JSON for persistence
   * @returns {object} - JSON-serializable object
   */
  toJSON() {
    const nodes = {};
    for (const [waveId, node] of this.nodes) {
      nodes[waveId] = {
        wave: node.wave,
        dependencies: Array.from(node.dependencies),
        dependents: Array.from(node.dependents)
      };
    }

    return {
      nodes,
      completed: Array.from(this.completed)
    };
  }

  /**
   * Deserialize graph from JSON
   * @param {object} json - JSON object from toJSON()
   * @returns {WaveDependencyGraph} - New graph instance
   */
  static fromJSON(json) {
    const graph = new WaveDependencyGraph();

    if (!json || !json.nodes) {
      return graph;
    }

    // Restore nodes
    for (const [waveId, nodeData] of Object.entries(json.nodes)) {
      graph.nodes.set(waveId, {
        wave: nodeData.wave,
        dependencies: new Set(nodeData.dependencies || []),
        dependents: new Set(nodeData.dependents || [])
      });
    }

    // Restore completed set
    if (json.completed) {
      for (const waveId of json.completed) {
        graph.completed.add(waveId);
      }
    }

    return graph;
  }

  /**
   * Generate Mermaid diagram syntax for visualization
   * @returns {string} - Mermaid diagram syntax
   */
  toMermaid() {
    const lines = ['graph TD'];

    // Add nodes with styling
    for (const [waveId, node] of this.nodes) {
      const label = node.wave?.name || waveId;
      const safeId = waveId.replace(/[^a-zA-Z0-9]/g, '_');
      const safeLabel = label.replace(/"/g, "'");

      // Style based on completion status
      if (this.completed.has(waveId)) {
        lines.push(`    ${safeId}["✓ ${safeLabel}"]:::completed`);
      } else if (this.getExecutableWaves().includes(waveId)) {
        lines.push(`    ${safeId}["◉ ${safeLabel}"]:::executable`);
      } else {
        lines.push(`    ${safeId}["○ ${safeLabel}"]:::pending`);
      }
    }

    // Add edges (dependencies)
    for (const [waveId, node] of this.nodes) {
      const safeId = waveId.replace(/[^a-zA-Z0-9]/g, '_');
      for (const depId of node.dependencies) {
        const safeDepId = depId.replace(/[^a-zA-Z0-9]/g, '_');
        lines.push(`    ${safeDepId} --> ${safeId}`);
      }
    }

    // Add style classes
    lines.push('');
    lines.push('    classDef completed fill:#90EE90,stroke:#228B22');
    lines.push('    classDef executable fill:#87CEEB,stroke:#4169E1');
    lines.push('    classDef pending fill:#F5F5F5,stroke:#808080');

    return lines.join('\n');
  }

  /**
   * Create a deep clone of the graph
   * @returns {WaveDependencyGraph} - Cloned graph
   */
  clone() {
    return WaveDependencyGraph.fromJSON(this.toJSON());
  }

  /**
   * Get graph statistics
   * @returns {object} - Statistics about the graph
   */
  getStats() {
    const totalWaves = this.nodes.size;
    const completedCount = this.completed.size;
    const executableCount = this.getExecutableWaves().length;
    const pendingCount = totalWaves - completedCount - executableCount;

    let totalDependencies = 0;
    let maxDependencies = 0;
    let maxDependents = 0;

    for (const node of this.nodes.values()) {
      totalDependencies += node.dependencies.size;
      maxDependencies = Math.max(maxDependencies, node.dependencies.size);
      maxDependents = Math.max(maxDependents, node.dependents.size);
    }

    return {
      totalWaves,
      completedCount,
      executableCount,
      pendingCount,
      totalDependencies,
      maxDependencies,
      maxDependents,
      progress: totalWaves > 0 ? Math.round((completedCount / totalWaves) * 100) : 0
    };
  }
}

module.exports = { WaveDependencyGraph };
