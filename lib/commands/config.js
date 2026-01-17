/**
 * REIS v2.0 Config Command
 * Manage REIS configuration (show, init, validate, docs)
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { loadConfig, validateConfig, DEFAULT_CONFIG, createSampleConfig } = require('../utils/config.js');

/**
 * Deep merge two objects
 */
function deepMerge(target, source) {
  const output = JSON.parse(JSON.stringify(target));
  
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
 */
function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Config command handler
 * @param {Object} options - Command options
 * @param {string} options.subcommand - Subcommand: show, init, validate, docs
 * @param {boolean} options.json - Output as JSON (for show)
 * @param {boolean} options.force - Force overwrite (for init)
 * @param {string} options.path - Custom config path
 */
async function config(options = {}) {
  const subcommand = options.subcommand || 'show';
  const projectRoot = process.cwd();
  const configPath = options.path || path.join(projectRoot, 'reis.config.js');

  switch (subcommand) {
    case 'show':
      await showConfig(projectRoot, configPath, options.json);
      break;
    case 'init':
      await initConfig(configPath, options.force);
      break;
    case 'validate':
      await validateConfigFile(projectRoot, configPath);
      break;
    case 'docs':
      await showDocs();
      break;
    default:
      console.error(chalk.red(`Unknown subcommand: ${subcommand}`));
      console.log('Valid subcommands: show, init, validate, docs');
      process.exit(1);
  }
}

/**
 * Show current configuration
 */
async function showConfig(projectRoot, configPath, asJson = false) {
  try {
    // If custom path provided, use directory of that path as projectRoot
    const actualProjectRoot = configPath !== path.join(projectRoot, 'reis.config.js')
      ? path.dirname(configPath)
      : projectRoot;
    const config = loadConfig(actualProjectRoot);
    const hasConfigFile = fs.existsSync(configPath);
    const source = hasConfigFile ? configPath : 'defaults';

    if (asJson) {
      console.log(JSON.stringify({ config, source }, null, 2));
      return;
    }

    // Formatted output
    console.log(chalk.bold.cyan('\nREIS Configuration\n'));

    // Waves section
    console.log(chalk.bold('Waves:'));
    const defaultSizeLabel = hasConfigFile && config.waves.defaultSize !== DEFAULT_CONFIG.waves.defaultSize
      ? chalk.yellow(`${config.waves.defaultSize} (from reis.config.js)`)
      : `${config.waves.defaultSize} (default)`;
    console.log(`  Default size: ${defaultSizeLabel}`);
    console.log(`  Small: ${config.waves.sizes.small.maxTasks} tasks, ~${config.waves.sizes.small.estimatedMinutes} min`);
    console.log(`  Medium: ${config.waves.sizes.medium.maxTasks} tasks, ~${config.waves.sizes.medium.estimatedMinutes} min`);
    console.log(`  Large: ${config.waves.sizes.large.maxTasks} tasks, ~${config.waves.sizes.large.estimatedMinutes} min`);
    console.log(`  Auto-checkpoint: ${config.waves.autoCheckpoint ? chalk.green('enabled') : chalk.red('disabled')}`);
    console.log('');

    // Git section
    console.log(chalk.bold('Git:'));
    const autoCommitLabel = hasConfigFile && config.git.autoCommit !== DEFAULT_CONFIG.git.autoCommit
      ? chalk.yellow(`${config.git.autoCommit ? 'enabled' : 'disabled'} (from reis.config.js)`)
      : `${config.git.autoCommit ? 'enabled' : 'disabled'} (default)`;
    console.log(`  Auto-commit: ${autoCommitLabel}`);
    console.log(`  Commit prefix: "${config.git.commitMessagePrefix}"`);
    console.log(`  Require clean tree: ${config.git.requireCleanTree ? chalk.green('yes') : chalk.yellow('no')}`);
    console.log('');

    // State section
    console.log(chalk.bold('State:'));
    console.log(`  Track metrics: ${config.state.trackMetrics ? 'yes' : 'no'}`);
    console.log(`  Save checkpoints: ${config.state.saveCheckpoints ? 'yes' : 'no'}`);
    console.log(`  Max checkpoints: ${config.state.maxCheckpoints}`);
    console.log('');

    // LLM section
    console.log(chalk.bold('LLM:'));
    console.log(`  Provider: ${config.llm.provider}`);
    console.log(`  Temperature: ${config.llm.temperature}`);
    console.log(`  Max tokens: ${config.llm.maxTokens}`);
    console.log('');

    // Planning section
    console.log(chalk.bold('Planning:'));
    console.log(`  Require plan: ${config.planning.requirePlan ? 'yes' : 'no'}`);
    console.log(`  Validate waves: ${config.planning.validateWaves ? 'yes' : 'no'}`);
    console.log(`  Auto-optimize: ${config.planning.autoOptimize ? 'yes' : 'no'}`);
    console.log('');

    // Output section
    console.log(chalk.bold('Output:'));
    console.log(`  Verbose: ${config.output.verbose ? 'yes' : 'no'}`);
    console.log(`  Show progress: ${config.output.showProgress ? 'yes' : 'no'}`);
    console.log(`  Colorize: ${config.output.colorize ? 'yes' : 'no'}`);
    console.log('');

    // Source
    if (hasConfigFile) {
      console.log(chalk.gray(`Source: ${configPath}`));
    } else {
      console.log(chalk.gray('Source: using defaults (no reis.config.js found)'));
      console.log(chalk.gray(`Run ${chalk.cyan('reis config init')} to create a config file`));
    }
    console.log('');
  } catch (error) {
    console.error(chalk.red('Error loading config:'), error.message);
    process.exit(1);
  }
}

/**
 * Initialize config file
 */
async function initConfig(configPath, force = false) {
  try {
    // Check if config already exists
    if (fs.existsSync(configPath) && !force) {
      console.error(chalk.red(`\nConfig file already exists: ${configPath}`));
      console.log(chalk.gray(`Use ${chalk.cyan('reis config init --force')} to overwrite\n`));
      process.exit(1);
    }

    // Read template
    const templatePath = path.join(__dirname, '../../templates/reis.config.template.js');
    if (!fs.existsSync(templatePath)) {
      // Fallback: use createSampleConfig from config utility
      createSampleConfig(configPath);
      console.log(chalk.green(`\n✓ Created config file: ${configPath}\n`));
      console.log(chalk.gray('Next steps:'));
      console.log(chalk.gray(`  1. Edit ${chalk.cyan('reis.config.js')} to customize settings`));
      console.log(chalk.gray(`  2. Run ${chalk.cyan('reis config validate')} to verify`));
      console.log(chalk.gray(`  3. Run ${chalk.cyan('reis config show')} to view current config\n`));
      return;
    }

    // Copy template to config location
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    fs.writeFileSync(configPath, templateContent, 'utf8');

    console.log(chalk.green(`\n✓ Created config file: ${configPath}\n`));
    console.log(chalk.gray('Next steps:'));
    console.log(chalk.gray(`  1. Edit ${chalk.cyan('reis.config.js')} to customize settings`));
    console.log(chalk.gray(`  2. Run ${chalk.cyan('reis config validate')} to verify`));
    console.log(chalk.gray(`  3. Run ${chalk.cyan('reis config show')} to view current config`));
    console.log(chalk.gray(`  4. Run ${chalk.cyan('reis config docs')} for detailed documentation\n`));
  } catch (error) {
    console.error(chalk.red('Error creating config file:'), error.message);
    process.exit(1);
  }
}

/**
 * Validate config file
 */
async function validateConfigFile(projectRoot, configPath) {
  try {
    // Check if config file exists
    if (!fs.existsSync(configPath)) {
      console.log(chalk.yellow('\nNo config file found - using defaults'));
      console.log(chalk.green('✓ Default configuration is valid\n'));
      console.log(chalk.gray(`Run ${chalk.cyan('reis config init')} to create a config file\n`));
      return;
    }

    // Load and validate
    let userConfig;
    try {
      // Clear require cache to get fresh config
      delete require.cache[require.resolve(configPath)];
      userConfig = require(configPath);
    } catch (error) {
      console.error(chalk.red(`\n✗ Config file has syntax errors:\n`));
      console.log(chalk.gray(`File: ${configPath}`));
      console.log(chalk.red(`Error: ${error.message}\n`));
      process.exit(1);
    }

    // Merge with defaults for validation using deep merge
    const config = deepMerge(DEFAULT_CONFIG, userConfig);

    const validation = validateConfig(config);

    if (validation.valid) {
      console.log(chalk.green('\n✓ Configuration is valid\n'));
      console.log(chalk.gray(`File: ${configPath}`));
      console.log(chalk.gray(`Run ${chalk.cyan('reis config show')} to view configuration\n`));
    } else {
      console.error(chalk.red(`\n✗ Configuration has ${validation.errors.length} error(s):\n`));
      validation.errors.forEach((error, index) => {
        console.error(chalk.red(`${index + 1}. ${error}`));
      });
      console.error(chalk.gray(`\nFile: ${configPath}`));
      console.error(chalk.gray(`Fix errors and run ${chalk.cyan('reis config validate')} again\n`));
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red('Error validating config:'), error.message);
    process.exit(1);
  }
}

/**
 * Show config documentation
 */
async function showDocs() {
  const docsPath = path.join(__dirname, '../../templates/CONFIG_DOCS.md');
  
  // Check if docs file exists
  if (fs.existsSync(docsPath)) {
    const docs = fs.readFileSync(docsPath, 'utf8');
    console.log(docs);
  } else {
    // Fallback inline documentation
    console.log(chalk.bold.cyan('\nREIS Configuration Documentation\n'));
    console.log(chalk.bold('Overview'));
    console.log('REIS can be customized via reis.config.js in your project root.\n');
    
    console.log(chalk.bold('Creating a Config File'));
    console.log(`Run ${chalk.cyan('reis config init')} to create a sample configuration file.\n`);
    
    console.log(chalk.bold('Configuration Sections\n'));
    
    console.log(chalk.bold('1. Waves'));
    console.log('   Configure wave execution behavior:');
    console.log('   - defaultSize: "small" | "medium" | "large"');
    console.log('   - sizes.small/medium/large: { maxTasks, estimatedMinutes }');
    console.log('   - autoCheckpoint: boolean - Auto-checkpoint after each wave');
    console.log('   - continueOnError: boolean - Continue if wave fails\n');
    
    console.log(chalk.bold('2. Git'));
    console.log('   Configure git integration:');
    console.log('   - autoCommit: boolean - Auto-commit after wave completion');
    console.log('   - commitMessagePrefix: string - Prefix for commit messages');
    console.log('   - requireCleanTree: boolean - Require clean tree before starting');
    console.log('   - createBranch: boolean - Auto-create branch for project');
    console.log('   - branchPrefix: string - Prefix for auto-created branches\n');
    
    console.log(chalk.bold('3. State'));
    console.log('   Configure state management:');
    console.log('   - trackMetrics: boolean - Track performance metrics');
    console.log('   - saveCheckpoints: boolean - Save checkpoint history');
    console.log('   - maxCheckpoints: number - Maximum checkpoints to keep\n');
    
    console.log(chalk.bold('4. LLM'));
    console.log('   Configure LLM preferences:');
    console.log('   - provider: "auto" | "openai" | "anthropic" | "custom"');
    console.log('   - temperature: number - LLM temperature (0-1)');
    console.log('   - maxTokens: number - Maximum tokens per request\n');
    
    console.log(chalk.bold('5. Planning'));
    console.log('   Configure planning behavior:');
    console.log('   - requirePlan: boolean - Require PLAN.md before execution');
    console.log('   - validateWaves: boolean - Validate wave structure');
    console.log('   - autoOptimize: boolean - Suggest wave optimizations\n');
    
    console.log(chalk.bold('6. Output'));
    console.log('   Configure output preferences:');
    console.log('   - verbose: boolean - Detailed logging');
    console.log('   - showProgress: boolean - Show progress indicators');
    console.log('   - colorize: boolean - Use colors in output\n');
    
    console.log(chalk.bold('Examples\n'));
    console.log('Minimal config (override only what you need):');
    console.log(chalk.gray('module.exports = {'));
    console.log(chalk.gray('  waves: { defaultSize: "large" },'));
    console.log(chalk.gray('  git: { autoCommit: false }'));
    console.log(chalk.gray('};\n'));
    
    console.log('For more details, run:');
    console.log(chalk.cyan('  reis config init') + ' - Create sample config');
    console.log(chalk.cyan('  reis config show') + ' - View current config');
    console.log(chalk.cyan('  reis config validate') + ' - Validate config\n');
  }
}

module.exports = config;
