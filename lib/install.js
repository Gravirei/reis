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
  
  // Copy files
  console.log(chalk.cyan('Installing files...'));
  
  const packageDir = path.join(__dirname, '..');
  let fileCount = 0;
  
  // Copy documentation files from docs/ to ~/.rovodev/reis/
  const docsDir = path.join(packageDir, 'docs');
  if (fs.existsSync(docsDir)) {
    console.log(chalk.gray('  Copying documentation...'));
    const docFiles = fs.readdirSync(docsDir);
    docFiles.forEach(file => {
      const src = path.join(docsDir, file);
      const dest = path.join(reisDir, file);
      if (copyFile(src, dest)) {
        fileCount++;
      }
    });
  }
  
  // Copy templates from templates/ to ~/.rovodev/reis/templates/
  const templatesSourceDir = path.join(packageDir, 'templates');
  if (fs.existsSync(templatesSourceDir)) {
    console.log(chalk.gray('  Copying templates...'));
    const count = copyDirectory(templatesSourceDir, templatesDir);
    fileCount += count;
  }
  
  // Copy subagents from subagents/ to ~/.rovodev/subagents/
  const subagentsSourceDir = path.join(packageDir, 'subagents');
  if (fs.existsSync(subagentsSourceDir)) {
    console.log(chalk.gray('  Copying subagents...'));
    const subagentFiles = fs.readdirSync(subagentsSourceDir);
    subagentFiles.forEach(file => {
      const src = path.join(subagentsSourceDir, file);
      const dest = path.join(subagentsDir, file);
      if (copyFile(src, dest)) {
        fileCount++;
      }
    });
  }
  
  console.log(chalk.green(`\n✓ Installed ${fileCount} files successfully\n`));
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

// Copy a single file
function copyFile(src, dest) {
  try {
    // Check if source exists
    if (!fs.existsSync(src)) {
      console.log(chalk.yellow(`  ⚠ Source file not found: ${src}`));
      return false;
    }
    
    // Skip if it's a directory
    if (fs.statSync(src).isDirectory()) {
      return false;
    }
    
    // Create destination directory if needed
    const destDir = path.dirname(dest);
    ensureDir(destDir);
    
    // Skip if file already exists (idempotent)
    if (fs.existsSync(dest)) {
      // Optionally update if source is newer, but for now just skip
      return false;
    }
    
    // Copy the file
    fs.copyFileSync(src, dest);
    return true;
    
  } catch (error) {
    console.log(chalk.yellow(`  ⚠ Failed to copy ${src}: ${error.message}`));
    return false;
  }
}

// Copy a directory recursively
function copyDirectory(srcDir, destDir) {
  let count = 0;
  
  try {
    // Ensure source exists
    if (!fs.existsSync(srcDir)) {
      console.log(chalk.yellow(`  ⚠ Source directory not found: ${srcDir}`));
      return count;
    }
    
    // Ensure destination directory exists
    ensureDir(destDir);
    
    // Read all files in source directory
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(srcDir, entry.name);
      const destPath = path.join(destDir, entry.name);
      
      if (entry.isDirectory()) {
        // Recursively copy subdirectory
        count += copyDirectory(srcPath, destPath);
      } else {
        // Copy file
        if (copyFile(srcPath, destPath)) {
          count++;
        }
      }
    }
    
    return count;
    
  } catch (error) {
    console.log(chalk.yellow(`  ⚠ Failed to copy directory ${srcDir}: ${error.message}`));
    return count;
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
