/**
 * Gate Runner - Core execution engine for quality gates
 * @module lib/utils/gate-runner
 */

const chalk = require('chalk');
const { EventEmitter } = require('events');

/**
 * Gate result structure
 */
class GateResult {
  /**
   * Create a gate result
   * @param {string} gateName - Name of the gate
   * @param {string} category - Category (security, quality, performance, accessibility)
   */
  constructor(gateName, category) {
    this.gateName = gateName;
    this.category = category;
    this.status = 'pending'; // 'pending' | 'running' | 'passed' | 'warning' | 'failed' | 'skipped' | 'error'
    this.message = '';
    this.details = []; // Array of check details
    this.duration = 0;
    this.timestamp = null;
    this.error = null;
  }

  /**
   * Mark gate as passed
   * @param {string} message - Success message
   * @param {Array} details - Detail items
   */
  pass(message, details = []) {
    this.status = 'passed';
    this.message = message;
    this.details = details;
    this.timestamp = new Date().toISOString();
    return this;
  }

  /**
   * Mark gate as warning
   * @param {string} message - Warning message
   * @param {Array} details - Detail items
   */
  warn(message, details = []) {
    this.status = 'warning';
    this.message = message;
    this.details = details;
    this.timestamp = new Date().toISOString();
    return this;
  }

  /**
   * Mark gate as failed
   * @param {string} message - Failure message
   * @param {Array} details - Detail items
   */
  fail(message, details = []) {
    this.status = 'failed';
    this.message = message;
    this.details = details;
    this.timestamp = new Date().toISOString();
    return this;
  }

  /**
   * Mark gate as skipped
   * @param {string} message - Skip reason
   */
  skip(message) {
    this.status = 'skipped';
    this.message = message;
    this.timestamp = new Date().toISOString();
    return this;
  }

  /**
   * Mark gate as error
   * @param {string} message - Error message
   * @param {Error} err - Error object
   */
  error(message, err = null) {
    this.status = 'error';
    this.message = message;
    this.error = err ? err.message : null;
    this.timestamp = new Date().toISOString();
    return this;
  }

  /**
   * Convert to plain object
   * @returns {Object}
   */
  toJSON() {
    return {
      gateName: this.gateName,
      category: this.category,
      status: this.status,
      message: this.message,
      details: this.details,
      duration: this.duration,
      timestamp: this.timestamp,
      error: this.error
    };
  }
}

/**
 * Base gate class - extend this for custom gates
 */
class BaseGate {
  /**
   * Create a base gate
   * @param {string} name - Gate name
   * @param {string} category - Gate category
   * @param {Object} config - Gate configuration
   */
  constructor(name, category, config = {}) {
    this.name = name;
    this.category = category;
    this.config = config;
    this.enabled = config.enabled !== false;
  }

  /**
   * Run the gate - override in subclasses
   * @returns {Promise<GateResult>}
   */
  async run() {
    throw new Error('run() must be implemented by subclass');
  }

  /**
   * Check if gate is enabled
   * @returns {boolean}
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Get gate info
   * @returns {Object}
   */
  getInfo() {
    return {
      name: this.name,
      category: this.category,
      enabled: this.enabled,
      config: this.config
    };
  }
}

/**
 * Gate Runner - executes and manages quality gates
 */
class GateRunner extends EventEmitter {
  /**
   * Create a gate runner
   * @param {Object} config - Runner configuration
   */
  constructor(config = {}) {
    super();
    this.config = config;
    this.gates = new Map(); // gateName -> gateInstance
    this.results = []; // Array of GateResult objects
    this.timeout = config.timeout || 30000; // 30s default
    this.isRunning = false;
    this.aborted = false;
  }

  /**
   * Register a gate
   * @param {string} name - Gate name
   * @param {BaseGate} gate - Gate instance
   */
  registerGate(name, gate) {
    if (!(gate instanceof BaseGate)) {
      throw new Error(`Gate must extend BaseGate: ${name}`);
    }
    this.gates.set(name, gate);
    this.emit('gate:registered', { name, gate });
    return this;
  }

  /**
   * Unregister a gate
   * @param {string} name - Gate name
   */
  unregisterGate(name) {
    const removed = this.gates.delete(name);
    if (removed) {
      this.emit('gate:unregistered', { name });
    }
    return removed;
  }

  /**
   * Get a registered gate
   * @param {string} name - Gate name
   * @returns {BaseGate|undefined}
   */
  getGate(name) {
    return this.gates.get(name);
  }

  /**
   * Get all registered gates
   * @returns {Map}
   */
  getAllGates() {
    return this.gates;
  }

  /**
   * Run all enabled gates
   * @param {Object} options - Run options
   * @returns {Promise<Array<GateResult>>}
   */
  async runAll(options = {}) {
    this.reset();
    this.isRunning = true;
    this.emit('run:start', { total: this.gates.size });

    const results = [];

    for (const [name, gate] of this.gates) {
      if (this.aborted) {
        const result = new GateResult(name, gate.category);
        result.skip('Aborted');
        results.push(result);
        continue;
      }

      if (!gate.isEnabled()) {
        const result = new GateResult(name, gate.category);
        result.skip('Disabled in configuration');
        results.push(result);
        this.emit('gate:skipped', { name, result });
        continue;
      }

      const result = await this.runGate(name, options);
      results.push(result);
    }

    this.results = results;
    this.isRunning = false;
    this.emit('run:complete', { results, summary: this.getSummary() });

    return results;
  }

  /**
   * Run gates by category
   * @param {string} category - Category name
   * @param {Object} options - Run options
   * @returns {Promise<Array<GateResult>>}
   */
  async runCategory(category, options = {}) {
    this.reset();
    this.isRunning = true;

    const categoryGates = Array.from(this.gates.entries())
      .filter(([_, gate]) => gate.category === category);

    this.emit('run:start', { total: categoryGates.length, category });

    const results = [];

    for (const [name, gate] of categoryGates) {
      if (this.aborted) {
        const result = new GateResult(name, gate.category);
        result.skip('Aborted');
        results.push(result);
        continue;
      }

      if (!gate.isEnabled()) {
        const result = new GateResult(name, gate.category);
        result.skip('Disabled in configuration');
        results.push(result);
        this.emit('gate:skipped', { name, result });
        continue;
      }

      const result = await this.runGate(name, options);
      results.push(result);
    }

    this.results = results;
    this.isRunning = false;
    this.emit('run:complete', { results, summary: this.getSummary() });

    return results;
  }

  /**
   * Run a single gate
   * @param {string} name - Gate name
   * @param {Object} options - Run options
   * @returns {Promise<GateResult>}
   */
  async runGate(name, options = {}) {
    const gate = this.gates.get(name);
    if (!gate) {
      const result = new GateResult(name, 'unknown');
      result.error(`Gate not found: ${name}`);
      return result;
    }

    const result = new GateResult(name, gate.category);
    const timeout = options.timeout || this.timeout;
    const startTime = Date.now();

    this.emit('gate:start', { name, gate });

    try {
      const gateResult = await this.executeWithTimeout(gate, timeout);
      
      // Copy result properties
      result.status = gateResult.status;
      result.message = gateResult.message;
      result.details = gateResult.details;
      result.duration = Date.now() - startTime;
      result.timestamp = new Date().toISOString();

      this.emit('gate:complete', { name, result });
    } catch (err) {
      result.error(`Gate execution failed: ${err.message}`, err);
      result.duration = Date.now() - startTime;
      this.emit('gate:error', { name, error: err, result });
    }

    return result;
  }

  /**
   * Execute gate with timeout protection
   * @param {BaseGate} gate - Gate to execute
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<GateResult>}
   */
  async executeWithTimeout(gate, timeout) {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new Error(`Gate ${gate.name} timed out after ${timeout}ms`)),
        timeout
      );
    });

    try {
      const result = await Promise.race([gate.run(), timeoutPromise]);
      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Aggregate results by category
   * @returns {Object}
   */
  aggregateResults() {
    const byCategory = {};

    for (const result of this.results) {
      if (!byCategory[result.category]) {
        byCategory[result.category] = {
          results: [],
          passed: 0,
          warning: 0,
          failed: 0,
          skipped: 0,
          error: 0
        };
      }

      byCategory[result.category].results.push(result);
      
      if (result.status === 'passed') byCategory[result.category].passed++;
      else if (result.status === 'warning') byCategory[result.category].warning++;
      else if (result.status === 'failed') byCategory[result.category].failed++;
      else if (result.status === 'skipped') byCategory[result.category].skipped++;
      else if (result.status === 'error') byCategory[result.category].error++;
    }

    return byCategory;
  }

  /**
   * Check if all gates passed
   * @returns {boolean}
   */
  hasPassed() {
    return this.results.every(r => 
      r.status === 'passed' || r.status === 'skipped' || r.status === 'warning'
    );
  }

  /**
   * Check if any gates have warnings
   * @returns {boolean}
   */
  hasWarnings() {
    return this.results.some(r => r.status === 'warning');
  }

  /**
   * Check if any gates failed
   * @returns {boolean}
   */
  hasFailed() {
    return this.results.some(r => r.status === 'failed' || r.status === 'error');
  }

  /**
   * Get summary of gate results
   * @returns {Object}
   */
  getSummary() {
    const counts = {
      total: this.results.length,
      passed: 0,
      warning: 0,
      failed: 0,
      skipped: 0,
      error: 0
    };

    let totalDuration = 0;

    for (const result of this.results) {
      if (counts[result.status] !== undefined) {
        counts[result.status]++;
      }
      totalDuration += result.duration || 0;
    }

    return {
      ...counts,
      duration: totalDuration,
      hasPassed: this.hasPassed(),
      hasWarnings: this.hasWarnings(),
      hasFailed: this.hasFailed(),
      overallStatus: this.hasFailed() ? 'failed' : (this.hasWarnings() ? 'warning' : 'passed'),
      byCategory: this.aggregateResults()
    };
  }

  /**
   * Abort running gates
   */
  abort() {
    this.aborted = true;
    this.emit('run:abort');
  }

  /**
   * Reset runner state
   */
  reset() {
    this.results = [];
    this.aborted = false;
  }
}

module.exports = { GateRunner, GateResult, BaseGate };
