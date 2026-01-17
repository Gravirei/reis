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
    continueOnError: false // Stop execution if wave fails
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
  
  return {
    valid: errors.length === 0,
    errors
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
  getWaveSize,
  createSampleConfig,
  DEFAULT_CONFIG
};
