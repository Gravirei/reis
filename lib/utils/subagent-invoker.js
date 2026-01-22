/**
 * REIS Subagent Invoker
 * Programmatic invocation of REIS subagents
 * 
 * Provides:
 * - Loading subagent definitions from markdown files with YAML frontmatter
 * - Building execution contexts with plan, state, and config
 * - Event-based invocation pattern for async operations
 * - Structured result objects with artifacts and metadata
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

// Get project root (where subagents/ directory lives)
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const SUBAGENTS_DIR = path.join(PROJECT_ROOT, 'subagents');

// ============================================================================
// Custom Error Classes
// ============================================================================

/**
 * Error thrown when a subagent definition is not found
 */
class SubagentNotFoundError extends Error {
  constructor(name) {
    const available = listSubagentsInternal();
    super(`Subagent '${name}' not found. Available: ${available.join(', ')}`);
    this.name = 'SubagentNotFoundError';
    this.subagentName = name;
  }
}

/**
 * Error thrown when a subagent definition is invalid
 */
class InvalidDefinitionError extends Error {
  constructor(name, reason) {
    super(`Invalid subagent definition '${name}': ${reason}`);
    this.name = 'InvalidDefinitionError';
    this.subagentName = name;
    this.reason = reason;
  }
}

/**
 * Error thrown when invocation times out
 */
class TimeoutError extends Error {
  constructor(subagentName, timeout) {
    super(`Subagent '${subagentName}' invocation timed out after ${timeout}ms`);
    this.name = 'TimeoutError';
    this.subagentName = subagentName;
    this.timeout = timeout;
  }
}

/**
 * Error thrown when invocation fails
 */
class InvocationError extends Error {
  constructor(subagentName, reason, cause = null) {
    super(`Failed to invoke subagent '${subagentName}': ${reason}`);
    this.name = 'InvocationError';
    this.subagentName = subagentName;
    this.reason = reason;
    this.cause = cause;
  }
}

// ============================================================================
// Data Classes
// ============================================================================

/**
 * SubagentDefinition - Parsed subagent definition from markdown file
 */
class SubagentDefinition {
  /**
   * @param {string} name - Subagent identifier
   * @param {string} description - What the subagent does
   * @param {string[]} tools - List of tools the subagent can use
   * @param {string} systemPrompt - The system prompt/instructions
   */
  constructor(name, description, tools, systemPrompt) {
    this.name = name;
    this.description = description;
    this.tools = tools || [];
    this.systemPrompt = systemPrompt;
  }

  /**
   * Create a plain object representation
   * @returns {Object}
   */
  toJSON() {
    return {
      name: this.name,
      description: this.description,
      tools: this.tools,
      systemPromptLength: this.systemPrompt?.length || 0
    };
  }
}

/**
 * ExecutionContext - Context for subagent invocation
 */
class ExecutionContext {
  /**
   * @param {SubagentDefinition} subagent - The subagent definition
   * @param {Object} options - Context options
   */
  constructor(subagent, options = {}) {
    this.subagent = subagent;
    this.planPath = options.planPath || null;
    this.planContent = options.planContent || null;
    this.projectState = options.projectState || null;
    this.projectConfig = options.projectConfig || null;
    this.additionalContext = options.additionalContext || {};
    this.timeout = options.timeout || 300000; // 5 min default
    this.verbose = options.verbose || false;
  }

  /**
   * Build the full prompt for invocation
   * @returns {string} Complete prompt
   */
  buildPrompt() {
    const parts = [];

    // Header
    parts.push(`# Subagent: ${this.subagent.name}`);
    parts.push('');

    // System Instructions
    parts.push('## System Instructions');
    parts.push(this.subagent.systemPrompt || '_No system prompt defined_');
    parts.push('');

    // Project Context
    parts.push('## Project Context');
    parts.push('');
    parts.push('**Project State:**');
    if (this.projectState) {
      if (typeof this.projectState === 'string') {
        parts.push(this.projectState);
      } else {
        parts.push('```json');
        parts.push(JSON.stringify(this.projectState, null, 2));
        parts.push('```');
      }
    } else {
      parts.push('_No state file found_');
    }
    parts.push('');

    parts.push('**Configuration:**');
    if (this.projectConfig) {
      parts.push('```json');
      parts.push(JSON.stringify(this.projectConfig, null, 2));
      parts.push('```');
    } else {
      parts.push('_Using defaults_');
    }
    parts.push('');

    // Task Context (Plan)
    if (this.planContent || this.planPath) {
      parts.push('## Task Context');
      if (this.planPath) {
        parts.push(`**Plan Path:** \`${this.planPath}\``);
        parts.push('');
      }
      if (this.planContent) {
        parts.push(this.planContent);
      }
      parts.push('');
    }

    // Additional Instructions
    if (Object.keys(this.additionalContext).length > 0) {
      parts.push('## Additional Instructions');
      for (const [key, value] of Object.entries(this.additionalContext)) {
        parts.push(`**${key}:**`);
        if (typeof value === 'string') {
          parts.push(value);
        } else {
          parts.push('```json');
          parts.push(JSON.stringify(value, null, 2));
          parts.push('```');
        }
        parts.push('');
      }
    }

    // Footer
    parts.push('---');
    parts.push('Execute the task as described above.');

    return parts.join('\n');
  }

  /**
   * Create a plain object representation
   * @returns {Object}
   */
  toJSON() {
    return {
      subagent: this.subagent.name,
      planPath: this.planPath,
      hasPlanContent: !!this.planContent,
      hasProjectState: !!this.projectState,
      hasProjectConfig: !!this.projectConfig,
      timeout: this.timeout,
      verbose: this.verbose
    };
  }
}

/**
 * InvocationResult - Result from subagent invocation
 */
class InvocationResult {
  constructor() {
    this.success = false;
    this.output = '';
    this.artifacts = [];
    this.duration = 0;
    this.error = null;
    this.metadata = {};
  }

  /**
   * Create a successful result
   * @param {Object} options
   * @returns {InvocationResult}
   */
  static success(options = {}) {
    const result = new InvocationResult();
    result.success = true;
    result.output = options.output || '';
    result.artifacts = options.artifacts || [];
    result.duration = options.duration || 0;
    result.metadata = options.metadata || {};
    return result;
  }

  /**
   * Create a failed result
   * @param {Error|string} error
   * @param {Object} options
   * @returns {InvocationResult}
   */
  static failure(error, options = {}) {
    const result = new InvocationResult();
    result.success = false;
    result.error = error instanceof Error ? error : new Error(error);
    result.output = options.output || '';
    result.duration = options.duration || 0;
    result.metadata = options.metadata || {};
    return result;
  }

  /**
   * Create a plain object representation
   * @returns {Object}
   */
  toJSON() {
    return {
      success: this.success,
      outputLength: this.output?.length || 0,
      artifactCount: this.artifacts?.length || 0,
      duration: this.duration,
      error: this.error?.message || null,
      metadata: this.metadata
    };
  }
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Parse YAML frontmatter from markdown content
 * @param {string} content - Markdown content with YAML frontmatter
 * @returns {{ frontmatter: Object, body: string }}
 */
function parseYamlFrontmatter(content) {
  // Match YAML frontmatter: ---\n...\n---
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: null, body: content };
  }

  const yamlContent = match[1];
  const body = match[2];

  // Simple YAML parser for our specific format
  const frontmatter = {};
  const lines = yamlContent.split('\n');
  let currentKey = null;
  let isArrayMode = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Check for array item
    if (trimmed.startsWith('- ') && isArrayMode && currentKey) {
      frontmatter[currentKey].push(trimmed.substring(2).trim());
      continue;
    }

    // Check for key: value
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex > 0) {
      const key = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();

      if (value === '' || value === '|' || value === '>') {
        // Array or multiline value coming
        frontmatter[key] = [];
        currentKey = key;
        isArrayMode = true;
      } else {
        frontmatter[key] = value;
        isArrayMode = false;
        currentKey = null;
      }
    }
  }

  return { frontmatter, body };
}

/**
 * Internal function to list subagents (avoids circular dependency with error class)
 * @returns {string[]}
 */
function listSubagentsInternal() {
  if (!fs.existsSync(SUBAGENTS_DIR)) {
    return [];
  }

  return fs.readdirSync(SUBAGENTS_DIR)
    .filter(file => file.endsWith('.md') && !file.startsWith('.'))
    .map(file => file.replace('.md', ''));
}

/**
 * List all available subagents
 * @returns {string[]} Array of subagent names
 */
function listSubagents() {
  return listSubagentsInternal();
}

/**
 * Load subagent definition from markdown file
 * @param {string} name - Subagent name (e.g., 'reis_executor')
 * @returns {SubagentDefinition} Parsed definition
 * @throws {SubagentNotFoundError} If subagent file doesn't exist
 * @throws {InvalidDefinitionError} If definition is malformed
 */
function loadSubagentDefinition(name) {
  const filePath = path.join(SUBAGENTS_DIR, `${name}.md`);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    throw new SubagentNotFoundError(name);
  }

  // Read file content
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    throw new InvalidDefinitionError(name, `Failed to read file: ${error.message}`);
  }

  // Parse YAML frontmatter
  const { frontmatter, body } = parseYamlFrontmatter(content);

  if (!frontmatter) {
    throw new InvalidDefinitionError(name, 'Missing YAML frontmatter (must start with ---)');
  }

  // Validate required fields
  if (!frontmatter.name) {
    throw new InvalidDefinitionError(name, 'Missing required field: name');
  }

  if (!frontmatter.description) {
    throw new InvalidDefinitionError(name, 'Missing required field: description');
  }

  // Create and return definition
  return new SubagentDefinition(
    frontmatter.name,
    frontmatter.description,
    frontmatter.tools || [],
    body.trim()
  );
}

/**
 * Validate subagent definition
 * @param {SubagentDefinition} definition
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateDefinition(definition) {
  const errors = [];

  if (!definition) {
    errors.push('Definition is null or undefined');
    return { valid: false, errors };
  }

  if (!definition.name || typeof definition.name !== 'string') {
    errors.push('Missing or invalid name');
  }

  if (!definition.description || typeof definition.description !== 'string') {
    errors.push('Missing or invalid description');
  }

  if (!Array.isArray(definition.tools)) {
    errors.push('Tools must be an array');
  }

  if (!definition.systemPrompt || definition.systemPrompt.length < 10) {
    errors.push('System prompt is missing or too short');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Load project state from STATE.md
 * @param {string} projectRoot
 * @returns {string|null} State content or null
 */
function loadProjectState(projectRoot = process.cwd()) {
  const statePath = path.join(projectRoot, '.planning', 'STATE.md');
  
  if (fs.existsSync(statePath)) {
    try {
      return fs.readFileSync(statePath, 'utf8');
    } catch (error) {
      return null;
    }
  }
  
  return null;
}

/**
 * Load project config
 * @param {string} projectRoot
 * @returns {Object|null} Config object or null
 */
function loadProjectConfig(projectRoot = process.cwd()) {
  // Try .planning/config.json first
  const planningConfigPath = path.join(projectRoot, '.planning', 'config.json');
  if (fs.existsSync(planningConfigPath)) {
    try {
      const content = fs.readFileSync(planningConfigPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      // Fall through to try reis.config.js
    }
  }

  // Try reis.config.js
  const reisConfigPath = path.join(projectRoot, 'reis.config.js');
  if (fs.existsSync(reisConfigPath)) {
    try {
      // Clear require cache to get fresh config
      delete require.cache[require.resolve(reisConfigPath)];
      return require(reisConfigPath);
    } catch (error) {
      return null;
    }
  }

  return null;
}

/**
 * Build execution context for a subagent
 * @param {string} subagentName - Which subagent to invoke
 * @param {Object} options - Context options
 * @returns {ExecutionContext}
 */
function buildExecutionContext(subagentName, options = {}) {
  // Load subagent definition
  const subagent = loadSubagentDefinition(subagentName);

  // Load project state if not provided
  const projectRoot = options.projectRoot || process.cwd();
  let projectState = options.projectState;
  if (projectState === undefined) {
    projectState = loadProjectState(projectRoot);
  }

  // Load project config if not provided
  let projectConfig = options.projectConfig;
  if (projectConfig === undefined) {
    projectConfig = loadProjectConfig(projectRoot);
  }

  // Load plan content if planPath provided but planContent not
  let planContent = options.planContent;
  if (!planContent && options.planPath) {
    const planFullPath = path.isAbsolute(options.planPath) 
      ? options.planPath 
      : path.join(projectRoot, options.planPath);
    
    if (fs.existsSync(planFullPath)) {
      try {
        planContent = fs.readFileSync(planFullPath, 'utf8');
      } catch (error) {
        // Leave planContent as undefined
      }
    }
  }

  // Construct and return context
  return new ExecutionContext(subagent, {
    planPath: options.planPath,
    planContent,
    projectState,
    projectConfig,
    additionalContext: options.additionalContext,
    timeout: options.timeout,
    verbose: options.verbose
  });
}

// ============================================================================
// SubagentInvoker Class
// ============================================================================

/**
 * SubagentInvoker - Event-based subagent invocation
 * 
 * Events:
 * - 'start' - Invocation started { subagent, context }
 * - 'progress' - Progress update { message, percent }
 * - 'output' - Output chunk received { chunk }
 * - 'complete' - Invocation complete { result }
 * - 'error' - Error occurred { error }
 * - 'timeout' - Invocation timed out { subagent, timeout }
 */
class SubagentInvoker extends EventEmitter {
  /**
   * @param {Object} options
   * @param {boolean} options.verbose - Enable verbose logging
   * @param {string} options.mode - Execution mode ('prompt' | 'api')
   */
  constructor(options = {}) {
    super();
    this.verbose = options.verbose || false;
    this.mode = options.mode || 'prompt'; // Currently only 'prompt' mode is implemented
  }

  /**
   * Invoke a subagent with the given context
   * @param {ExecutionContext} context
   * @returns {Promise<InvocationResult>}
   */
  async invoke(context) {
    const startTime = Date.now();
    
    // Emit start event
    this.emit('start', {
      subagent: context.subagent.name,
      context: context.toJSON()
    });

    if (this.verbose) {
      console.log(`[SubagentInvoker] Starting invocation of ${context.subagent.name}`);
    }

    try {
      // Create timeout promise
      let timeoutId;
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          const error = new TimeoutError(context.subagent.name, context.timeout);
          this.emit('timeout', { subagent: context.subagent.name, timeout: context.timeout });
          reject(error);
        }, context.timeout);
      });

      // Create execution promise
      const executionPromise = this._executeSubagent(context);

      // Race between execution and timeout
      const result = await Promise.race([executionPromise, timeoutPromise]);
      
      // Clear timeout
      clearTimeout(timeoutId);

      // Calculate duration
      result.duration = Date.now() - startTime;

      // Emit progress
      this.emit('progress', { message: 'Execution complete', percent: 100 });

      // Emit complete event
      this.emit('complete', { result });

      if (this.verbose) {
        console.log(`[SubagentInvoker] Completed in ${result.duration}ms`);
      }

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Create failure result
      const result = InvocationResult.failure(error, {
        duration,
        metadata: { mode: this.mode }
      });

      // Emit error event
      this.emit('error', { error });

      if (this.verbose) {
        console.log(`[SubagentInvoker] Failed after ${duration}ms: ${error.message}`);
      }

      return result;
    }
  }

  /**
   * Invoke multiple subagents in parallel
   * @param {ExecutionContext[]} contexts
   * @returns {Promise<InvocationResult[]>}
   */
  async invokeParallel(contexts) {
    if (this.verbose) {
      console.log(`[SubagentInvoker] Starting parallel invocation of ${contexts.length} subagents`);
    }

    const promises = contexts.map(context => this.invoke(context));
    return Promise.all(promises);
  }

  /**
   * Internal method to execute subagent
   * Currently implements prompt-generation mode
   * Future: Will support API calls when Rovo Dev API is available
   * 
   * @param {ExecutionContext} context
   * @returns {Promise<InvocationResult>}
   * @private
   */
  async _executeSubagent(context) {
    // Emit progress
    this.emit('progress', { message: 'Building prompt', percent: 10 });

    // Build the full prompt
    const prompt = context.buildPrompt();

    // Emit progress
    this.emit('progress', { message: 'Prompt built', percent: 30 });

    // Emit output (the generated prompt)
    this.emit('output', { chunk: prompt });

    // Emit progress
    this.emit('progress', { message: 'Ready for execution', percent: 50 });

    // In prompt-generation mode, we return the prompt as output
    // The actual execution would happen when this prompt is sent to an LLM
    return InvocationResult.success({
      output: prompt,
      artifacts: [],
      metadata: {
        mode: this.mode,
        subagent: context.subagent.name,
        tools: context.subagent.tools,
        promptLength: prompt.length
      }
    });
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Convenience function for simple subagent invocation
 * @param {string} subagentName - Name of subagent to invoke
 * @param {Object} options - Invocation options
 * @returns {Promise<InvocationResult>}
 */
async function invokeSubagent(subagentName, options = {}) {
  const context = buildExecutionContext(subagentName, options);
  const invoker = new SubagentInvoker({ 
    verbose: options.verbose,
    mode: options.mode 
  });
  return invoker.invoke(context);
}

/**
 * Invoke subagent with retry logic
 * @param {string} subagentName
 * @param {Object} options
 * @param {number} options.maxRetries - Maximum retry attempts (default: 3)
 * @param {number} options.retryDelay - Delay between retries in ms (default: 1000)
 * @returns {Promise<InvocationResult>}
 */
async function invokeWithRetry(subagentName, options = {}) {
  const maxRetries = options.maxRetries || 3;
  const retryDelay = options.retryDelay || 1000;
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const context = buildExecutionContext(subagentName, options);
      const invoker = new SubagentInvoker({ 
        verbose: options.verbose,
        mode: options.mode 
      });
      
      const result = await invoker.invoke(context);
      
      if (result.success) {
        return result;
      }
      
      lastError = result.error;
      
      // Don't retry on certain errors
      if (result.error instanceof SubagentNotFoundError || 
          result.error instanceof InvalidDefinitionError) {
        return result;
      }
      
    } catch (error) {
      lastError = error;
    }

    // Wait before retry (except on last attempt)
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  return InvocationResult.failure(lastError || new Error('Max retries exceeded'), {
    metadata: { retries: maxRetries }
  });
}

/**
 * Factory function to create a new SubagentInvoker instance
 * @param {Object} options
 * @returns {SubagentInvoker}
 */
function createInvoker(options = {}) {
  return new SubagentInvoker(options);
}

// ============================================================================
// Module Exports
// ============================================================================

module.exports = {
  // Classes
  SubagentDefinition,
  ExecutionContext,
  InvocationResult,
  SubagentInvoker,
  
  // Error Classes
  SubagentNotFoundError,
  InvalidDefinitionError,
  TimeoutError,
  InvocationError,
  
  // Core Functions
  loadSubagentDefinition,
  listSubagents,
  validateDefinition,
  buildExecutionContext,
  
  // Convenience Functions
  invokeSubagent,
  invokeWithRetry,
  createInvoker,
  
  // Internal (exported for testing)
  parseYamlFrontmatter,
  loadProjectState,
  loadProjectConfig
};
