/**
 * Gate Command - Run quality gates
 * @module lib/commands/gate
 */

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { GateRunner, GateResult, BaseGate } = require('../utils/gate-runner');
const { GateReporter } = require('../utils/gate-reporter');
const { SecurityGate, QualityGate, PerformanceGate, AccessibilityGate } = require('../utils/gates');
const { loadConfig } = require('../utils/config');

/**
 * Default gate configuration
 */
const DEFAULT_GATE_CONFIG = {
  enabled: true,
  runOn: ['verify'],
  blockOnFail: true,
  timeout: 30000,

  security: {
    enabled: true,
    vulnerabilities: { enabled: true, failOn: 'high', allowedAdvisories: [] },
    secrets: { enabled: true, allowedFiles: ['.env.example', '.env.sample'] },
    licenses: { 
      enabled: true, 
      allowed: ['MIT', 'Apache-2.0', 'BSD-3-Clause', 'BSD-2-Clause', 'ISC', '0BSD', 'Unlicense'],
      forbidden: []
    }
  },

  quality: {
    enabled: true,
    coverage: { enabled: false, minimum: 80, failOn: 60 },
    lint: { enabled: true, failOnError: true, failOnWarning: false },
    complexity: { enabled: false, maxCyclomaticComplexity: 10 },
    documentation: { enabled: false, minimumCoverage: 50 }
  },

  performance: {
    enabled: false,
    bundleSize: { enabled: false, maxSize: '500kb', warnSize: '400kb' },
    buildTime: { enabled: false, maxTime: 60000 },
    dependencies: { enabled: true }
  },

  accessibility: {
    enabled: false,
    wcagLevel: 'AA',
    failOn: 'serious'
  }
};

/**
 * Merge user config with defaults
 * @param {Object} userConfig - User configuration
 * @returns {Object}
 */
function mergeConfig(userConfig = {}) {
  const merged = { ...DEFAULT_GATE_CONFIG };

  for (const category of ['security', 'quality', 'performance', 'accessibility']) {
    if (userConfig[category]) {
      merged[category] = {
        ...merged[category],
        ...userConfig[category]
      };

      // Deep merge check configs
      for (const check of Object.keys(merged[category])) {
        if (typeof merged[category][check] === 'object' && userConfig[category][check]) {
          merged[category][check] = {
            ...merged[category][check],
            ...userConfig[category][check]
          };
        }
      }
    }
  }

  // Top-level overrides
  if (userConfig.enabled !== undefined) merged.enabled = userConfig.enabled;
  if (userConfig.blockOnFail !== undefined) merged.blockOnFail = userConfig.blockOnFail;
  if (userConfig.timeout !== undefined) merged.timeout = userConfig.timeout;

  return merged;
}

/**
 * Create and configure gate runner
 * @param {Object} config - Gate configuration
 * @returns {GateRunner}
 */
function createGateRunner(config) {
  const runner = new GateRunner({ timeout: config.timeout || 30000 });

  // Register gates based on config
  if (config.security?.enabled !== false) {
    runner.registerGate('security', new SecurityGate(config.security || {}));
  }

  if (config.quality?.enabled !== false) {
    runner.registerGate('quality', new QualityGate(config.quality || {}));
  }

  if (config.performance?.enabled) {
    runner.registerGate('performance', new PerformanceGate(config.performance || {}));
  }

  if (config.accessibility?.enabled) {
    runner.registerGate('accessibility', new AccessibilityGate(config.accessibility || {}));
  }

  return runner;
}

/**
 * Run all gates
 * @param {Object} options - Command options
 */
async function runAllGates(options = {}) {
  console.log(chalk.cyan('\n🛡️  Running Quality Gates...\n'));

  const projectConfig = loadConfig();
  const gateConfig = mergeConfig(projectConfig?.gates || {});

  if (!gateConfig.enabled) {
    console.log(chalk.yellow('Quality gates are disabled in configuration.'));
    return { passed: true, results: [] };
  }

  const runner = createGateRunner(gateConfig);
  const reporter = new GateReporter({
    format: options.format || 'ascii',
    verbose: options.verbose || false
  });

  // Add event listeners for progress
  runner.on('gate:start', ({ name }) => {
    if (options.verbose) {
      console.log(chalk.gray(`  Running ${name} gate...`));
    }
  });

  runner.on('gate:complete', ({ name, result }) => {
    if (options.verbose) {
      const icon = result.status === 'passed' ? '✅' : 
                   result.status === 'warning' ? '⚠️' : 
                   result.status === 'failed' ? '❌' : '⏭️';
      console.log(chalk.gray(`  ${icon} ${name}: ${result.message}`));
    }
  });

  const startTime = Date.now();
  const results = await runner.runAll();
  const summary = runner.getSummary();
  summary.duration = Date.now() - startTime;

  // Print report
  console.log('');
  reporter.printReport(results, summary);

  // Return result for integration
  return {
    passed: runner.hasPassed(),
    hasWarnings: runner.hasWarnings(),
    hasFailed: runner.hasFailed(),
    results,
    summary
  };
}

/**
 * Run specific category gates
 * @param {string} category - Category name
 * @param {Object} options - Command options
 */
async function runCategoryGates(category, options = {}) {
  console.log(chalk.cyan(`\n🛡️  Running ${category.charAt(0).toUpperCase() + category.slice(1)} Gates...\n`));

  const projectConfig = loadConfig();
  const gateConfig = mergeConfig(projectConfig?.gates || {});

  const runner = createGateRunner(gateConfig);
  const reporter = new GateReporter({
    format: options.format || 'ascii',
    verbose: options.verbose || false
  });

  const startTime = Date.now();
  const results = await runner.runCategory(category);
  const summary = runner.getSummary();
  summary.duration = Date.now() - startTime;

  console.log('');
  reporter.printReport(results, summary);

  return {
    passed: runner.hasPassed(),
    results,
    summary
  };
}

/**
 * Show gate configuration status
 * @param {Object} options - Command options
 */
function showGateStatus(options = {}) {
  const projectConfig = loadConfig();
  const gateConfig = mergeConfig(projectConfig?.gates || {});

  console.log(chalk.cyan('\n🛡️  Quality Gate Configuration\n'));

  const categories = ['security', 'quality', 'performance', 'accessibility'];

  for (const category of categories) {
    const catConfig = gateConfig[category] || {};
    const enabled = catConfig.enabled !== false;
    const icon = enabled ? chalk.green('✓') : chalk.gray('○');
    
    console.log(`${icon} ${chalk.bold(category.charAt(0).toUpperCase() + category.slice(1))}`);

    if (enabled && typeof catConfig === 'object') {
      for (const [check, checkConfig] of Object.entries(catConfig)) {
        if (check === 'enabled') continue;
        if (typeof checkConfig === 'object') {
          const checkEnabled = checkConfig.enabled !== false;
          const checkIcon = checkEnabled ? chalk.green('  ✓') : chalk.gray('  ○');
          console.log(`${checkIcon} ${check}`);
        }
      }
    }
    console.log('');
  }

  console.log(chalk.gray('Configure gates in reis.config.js under the "gates" key.'));
  console.log(chalk.gray('See: reis help gates\n'));
}

/**
 * Generate gate report file
 * @param {Object} options - Command options
 */
async function generateReport(options = {}) {
  const result = await runAllGates({ ...options, verbose: false });

  const reporter = new GateReporter({
    format: options.format || 'markdown',
    verbose: true
  });

  const report = reporter.generateReport(result.results, result.summary);

  const outputPath = options.output || 'GATE_REPORT.md';
  fs.writeFileSync(outputPath, report);

  console.log(chalk.green(`\n✅ Report saved to ${outputPath}\n`));
}

/**
 * Main gate command handler
 * @param {string} subcommand - Subcommand
 * @param {Object} options - Command options
 */
async function gateCommand(subcommand, options = {}) {
  try {
    switch (subcommand) {
      case 'check':
      case 'run':
      case undefined:
        return await runAllGates(options);

      case 'security':
        return await runCategoryGates('security', options);

      case 'quality':
        return await runCategoryGates('quality', options);

      case 'performance':
        return await runCategoryGates('performance', options);

      case 'accessibility':
        return await runCategoryGates('accessibility', options);

      case 'status':
      case 'config':
        return showGateStatus(options);

      case 'report':
        return await generateReport(options);

      default:
        console.log(chalk.red(`Unknown gate subcommand: ${subcommand}`));
        console.log(chalk.gray('\nAvailable subcommands:'));
        console.log(chalk.gray('  check, run      - Run all configured gates'));
        console.log(chalk.gray('  security        - Run security gates only'));
        console.log(chalk.gray('  quality         - Run quality gates only'));
        console.log(chalk.gray('  performance     - Run performance gates only'));
        console.log(chalk.gray('  accessibility   - Run accessibility gates only'));
        console.log(chalk.gray('  status, config  - Show gate configuration'));
        console.log(chalk.gray('  report          - Generate detailed report file'));
        process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red(`\n❌ Gate error: ${error.message}\n`));
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

module.exports = {
  gateCommand,
  runAllGates,
  runCategoryGates,
  createGateRunner,
  mergeConfig,
  DEFAULT_GATE_CONFIG
};
