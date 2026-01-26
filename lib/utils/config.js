/**
 * REIS v2.0 Config System
 * Loads and validates reis.config.js from project root
 * Inspired by GSD's config system
 */

const fs = require('fs');
const path = require('path');

/**
 * Default configuration
 */
const DEFAULT_CONFIG = {
  // Wave execution settings
  waves: {
    defaultSize: 'medium', // 'small' | 'medium' | 'large'
    sizes: {
      small: {
        maxTasks: 3,
        estimatedMinutes: 30,
        description: 'Quick focused tasks'
      },
      medium: {
        maxTasks: 5,
        estimatedMinutes: 60,
        description: 'Standard development tasks'
      },
      large: {
        maxTasks: 8,
        estimatedMinutes: 120,
        description: 'Complex multi-step tasks'
      }
    },
    autoCheckpoint: true, // Create checkpoint after each wave
    continueOnError: false, // Stop execution if wave fails
    
    // Parallel execution settings
    parallel: {
      enabled: false,           // Enable parallel wave execution
      maxConcurrent: 4,         // Max waves to run simultaneously
      strategy: 'dependency',   // 'dependency' | 'group' | 'auto'
      conflictResolution: 'queue', // 'fail' | 'queue' | 'merge' | 'branch'
      isolatedBranches: false   // Create git branches per parallel wave
    }
  },

  // Git integration settings
  git: {
    autoCommit: true, // Auto-commit after wave completion
    commitMessagePrefix: '[REIS v2.0]', // Prefix for commit messages
    requireCleanTree: true, // Require clean working tree before starting
    createBranch: false, // Auto-create branch for project
    branchPrefix: 'reis/' // Prefix for auto-created branches
  },

  // State management
  state: {
    trackMetrics: true, // Track performance metrics
    saveCheckpoints: true, // Save checkpoint history
    maxCheckpoints: 10 // Maximum checkpoints to keep
  },

  // LLM preferences
  llm: {
    provider: 'auto', // 'auto' | 'openai' | 'anthropic' | 'custom'
    temperature: 0.7,
    maxTokens: 4096
  },

  // Planning settings
  planning: {
    requirePlan: true, // Require PLAN.md before execution
    validateWaves: true, // Validate wave structure
    autoOptimize: false // Suggest wave optimizations
  },

  // Output settings
  output: {
    verbose: false, // Detailed logging
    showProgress: true, // Show progress indicators
    colorize: true // Use colors in output
  },

  // Kanban board settings
  kanban: {
    enabled: true, // Show kanban board on commands
    style: 'full' // 'full' | 'compact' | 'minimal'
  },

  // Quality gate settings for cycle integration
  gates: {
    enabled: true,              // Enable quality gates
    runOn: ['cycle'],           // When to auto-run: 'cycle', 'verify', or both
    blockOnFail: true,          // Block cycle progression on gate failure
    blockOnWarning: false,      // Block cycle progression on warnings
    timeout: 30000              // Gate timeout in ms
  },

  // Plan review settings
  review: {
    enabled: true,              // Enable plan review
    autoFix: false,             // Auto-fix simple issues
    strict: false,              // Strict mode (fail on warnings)
    checks: {
      fileExists: true,         // Check if target files exist
      functionExists: true,     // Check if target functions exist
      exportExists: true,       // Check if exports exist
      dependencyExists: true,   // Check if dependencies exist
      patternMatch: false       // Check pattern matching (expensive)
    }
  }
};

/**
 * Load config from project root
 * @param {string} projectRoot - Project root directory
 * @returns {Object} Merged config (defaults + user config)
 */
function loadConfig(projectRoot = process.cwd()) {
  const configPath = path.join(projectRoot, 'reis.config.js');
  
  // Start with defaults
  let config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  
  // Try to load user config
  if (fs.existsSync(configPath)) {
    try {
      const userConfig = require(configPath);
      config = deepMerge(config, userConfig);
      
      // Validate the merged config
      const validation = validateConfig(config);
      if (!validation.valid) {
        throw new Error(`Invalid config: ${validation.errors.join(', ')}`);
      }
      
      if (config.output.verbose) {
        console.log(`✓ Loaded config from ${configPath}`);
      }
    } catch (error) {
      console.error(`Error loading config from ${configPath}:`, error.message);
      console.log('Using default configuration');
    }
  }
  
  return config;
}

/**
 * Deep merge two objects
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 */
function deepMerge(target, source) {
  const output = Object.assign({}, target);
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  
  return output;
}

/**
 * Check if value is an object
 * @param {*} item - Value to check
 * @returns {boolean} True if object
 */
function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Validate gate cycle configuration
 * @param {Object} config - Config to validate
 * @returns {Object} Validation result {valid: boolean, errors: string[], warnings: string[]}
 */
function validateGateCycleConfig(config) {
  const errors = [];
  const warnings = [];
  
  if (config.gates) {
    const gates = config.gates;
    
    // Validate runOn
    if (gates.runOn && !Array.isArray(gates.runOn)) {
      errors.push('gates.runOn must be an array');
    } else if (gates.runOn) {
      const validRunOn = ['cycle', 'verify'];
      for (const item of gates.runOn) {
        if (!validRunOn.includes(item)) {
          warnings.push(`gates.runOn contains unknown value: ${item}`);
        }
      }
    }
    
    // Validate enabled
    if (gates.enabled !== undefined && typeof gates.enabled !== 'boolean') {
      errors.push('gates.enabled must be a boolean');
    }
    
    // Validate blockOnFail
    if (gates.blockOnFail !== undefined && typeof gates.blockOnFail !== 'boolean') {
      errors.push('gates.blockOnFail must be a boolean');
    }
    
    // Validate blockOnWarning
    if (gates.blockOnWarning !== undefined && typeof gates.blockOnWarning !== 'boolean') {
      errors.push('gates.blockOnWarning must be a boolean');
    }
    
    // Validate timeout
    if (gates.timeout !== undefined && (typeof gates.timeout !== 'number' || gates.timeout < 0)) {
      errors.push('gates.timeout must be a positive number');
    }
  }
  
  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate review configuration
 * @param {Object} config - Config to validate
 * @returns {Object} Validation result {valid: boolean, errors: string[], warnings: string[]}
 */
function validateReviewConfig(config) {
  const errors = [];
  const warnings = [];
  
  if (config.review) {
    const review = config.review;
    
    if (review.enabled !== undefined && typeof review.enabled !== 'boolean') {
      errors.push('review.enabled must be a boolean');
    }
    
    if (review.autoFix !== undefined && typeof review.autoFix !== 'boolean') {
      errors.push('review.autoFix must be a boolean');
    }
    
    if (review.strict !== undefined && typeof review.strict !== 'boolean') {
      errors.push('review.strict must be a boolean');
    }
    
    // Validate checks object
    if (review.checks) {
      const validChecks = ['fileExists', 'functionExists', 'exportExists', 'dependencyExists', 'patternMatch'];
      for (const [key, value] of Object.entries(review.checks)) {
        if (!validChecks.includes(key)) {
          warnings.push(`review.checks contains unknown check: ${key}`);
        }
        if (typeof value !== 'boolean') {
          errors.push(`review.checks.${key} must be a boolean`);
        }
      }
    }
  }
  
  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate configuration
 * @param {Object} config - Config to validate
 * @returns {Object} Validation result {valid: boolean, errors: string[]}
 */
function validateConfig(config) {
  const errors = [];
  
  // Validate wave sizes
  if (config.waves) {
    const validSizes = ['small', 'medium', 'large'];
    if (config.waves.defaultSize && !validSizes.includes(config.waves.defaultSize)) {
      errors.push(`Invalid defaultSize: ${config.waves.defaultSize}. Must be one of: ${validSizes.join(', ')}`);
    }
    
    // Validate wave size definitions
    if (config.waves.sizes) {
      validSizes.forEach(size => {
        const sizeConfig = config.waves.sizes[size];
        if (sizeConfig) {
          if (typeof sizeConfig.maxTasks !== 'number' || sizeConfig.maxTasks < 1) {
            errors.push(`Invalid maxTasks for ${size}: must be a positive number`);
          }
          if (typeof sizeConfig.estimatedMinutes !== 'number' || sizeConfig.estimatedMinutes < 1) {
            errors.push(`Invalid estimatedMinutes for ${size}: must be a positive number`);
          }
        }
      });
    }
  }
  
  // Validate git settings
  if (config.git) {
    if (typeof config.git.autoCommit !== 'boolean') {
      errors.push('git.autoCommit must be a boolean');
    }
    if (config.git.commitMessagePrefix && typeof config.git.commitMessagePrefix !== 'string') {
      errors.push('git.commitMessagePrefix must be a string');
    }
  }
  
  // Validate state settings
  if (config.state) {
    if (config.state.maxCheckpoints && (typeof config.state.maxCheckpoints !== 'number' || config.state.maxCheckpoints < 1)) {
      errors.push('state.maxCheckpoints must be a positive number');
    }
  }
  
  // Validate LLM settings
  if (config.llm) {
    const validProviders = ['auto', 'openai', 'anthropic', 'custom'];
    if (config.llm.provider && !validProviders.includes(config.llm.provider)) {
      errors.push(`Invalid llm.provider: ${config.llm.provider}. Must be one of: ${validProviders.join(', ')}`);
    }
  }
  
  // Validate parallel execution settings
  if (config.waves?.parallel) {
    const p = config.waves.parallel;
    
    if (p.maxConcurrent !== undefined && (typeof p.maxConcurrent !== 'number' || p.maxConcurrent < 1)) {
      errors.push('waves.parallel.maxConcurrent must be a positive number');
    }
    
    const validStrategies = ['dependency', 'group', 'auto'];
    if (p.strategy && !validStrategies.includes(p.strategy)) {
      errors.push(`waves.parallel.strategy must be one of: ${validStrategies.join(', ')}`);
    }
    
    const validResolutions = ['fail', 'queue', 'merge', 'branch'];
    if (p.conflictResolution && !validResolutions.includes(p.conflictResolution)) {
      errors.push(`waves.parallel.conflictResolution must be one of: ${validResolutions.join(', ')}`);
    }
    
    if (p.enabled !== undefined && typeof p.enabled !== 'boolean') {
      errors.push('waves.parallel.enabled must be a boolean');
    }
    
    if (p.isolatedBranches !== undefined && typeof p.isolatedBranches !== 'boolean') {
      errors.push('waves.parallel.isolatedBranches must be a boolean');
    }
  }

  // Validate gate cycle config
  const gateValidation = validateGateCycleConfig(config);
  errors.push(...gateValidation.errors);
  
  // Validate review config
  const reviewValidation = validateReviewConfig(config);
  errors.push(...reviewValidation.errors);
  
  return {
    valid: errors.length === 0,
    errors,
    warnings: [...(gateValidation.warnings || []), ...(reviewValidation.warnings || [])]
  };
}

/**
 * Get wave size configuration
 * @param {Object} config - Config object
 * @param {string} size - Wave size ('small' | 'medium' | 'large')
 * @returns {Object} Wave size config
 */
function getWaveSize(config, size) {
  const waveSize = size || config.waves.defaultSize;
  return config.waves.sizes[waveSize] || config.waves.sizes.medium;
}

/**
 * Create a sample config file
 * @param {string} targetPath - Path to create config file
 */
function createSampleConfig(targetPath) {
  const sampleConfig = `/**
 * REIS v2.0 Configuration
 * Customize your REIS workflow
 */

module.exports = {
  // Wave execution settings
  waves: {
    defaultSize: 'medium', // 'small' | 'medium' | 'large'
    autoCheckpoint: true,
    continueOnError: false
  },

  // Git integration
  git: {
    autoCommit: true,
    commitMessagePrefix: '[REIS v2.0]',
    requireCleanTree: true
  },

  // Output preferences
  output: {
    verbose: false,
    showProgress: true,
    colorize: true
  }
};
`;

  fs.writeFileSync(targetPath, sampleConfig, 'utf8');
  console.log(`✓ Created sample config at ${targetPath}`);
}

module.exports = {
  loadConfig,
  validateConfig,
  validateGateCycleConfig,
  validateReviewConfig,
  getWaveSize,
  createSampleConfig,
  DEFAULT_CONFIG
};
