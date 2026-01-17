#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const chalk = require('chalk');
const inquirer = require('inquirer');

// ASCII Art Banner
const banner = `
${chalk.cyan.bold('╦═╗╔═╗╦╔═╗')}
${chalk.cyan.bold('╠╦╝║╣ ║╚═╗')}
${chalk.cyan.bold('╩╚═╚═╝╩╚═╝')}
${chalk.blue('Roadmap Execution & Implementation System')}
`;

// Check if running in CI environment or if stdin is not a TTY
const isCIEnvironment = process.env.CI === 'true' || process.argv.includes('--silent') || !process.stdin.isTTY;

// Main installation function
async function install() {
  try {
    // Show banner
    console.log(banner);
    
    // Check for silent mode
    if (isCIEnvironment) {
      console.log(chalk.gray('Running in CI mode - installing automatically...\n'));
      await performInstallation();
      return;
    }
    
    // Display installation message
    console.log(chalk.white('This will install REIS files to ~/.rovodev/reis/\n'));
    
    // Prompt for confirmation
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Continue with installation?',
        default: true
      }
    ]);
    
    if (!confirm) {
      console.log(chalk.yellow('\n✗ Installation cancelled'));
      process.exit(0);
    }
    
    console.log('');
    await performInstallation();
    
  } catch (error) {
    console.error(chalk.red('\n✗ Installation failed:'), error.message);
    process.exit(1);
  }
}

// Perform the actual installation
async function performInstallation() {
  const homeDir = os.homedir();
  
  // Define target directories
  const reisDir = path.join(homeDir, '.rovodev', 'reis');
  const templatesDir = path.join(reisDir, 'templates');
  const subagentsDir = path.join(homeDir, '.rovodev', 'subagents');
  
  console.log(chalk.cyan('Creating directories...'));
  
  // Create directories
  ensureDir(reisDir);
  ensureDir(templatesDir);
  ensureDir(subagentsDir);
  
  console.log(chalk.green('✓ Directories created\n'));
  
  // File copying will be implemented in next task
  console.log(chalk.cyan('Installing files...'));
  
  // TODO: Copy files (next task)
  
  console.log(chalk.green('\n✓ Installation complete!\n'));
}

// Ensure directory exists
function ensureDir(dir) {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (error) {
    throw new Error(`Failed to create directory ${dir}: ${error.message}`);
  }
}

// Run installation if called directly
if (require.main === module) {
  install().catch(error => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  });
}

module.exports = { install };
