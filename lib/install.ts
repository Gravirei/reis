#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import inquirer from 'inquirer';

// ASCII Art Banner
const banner = `
${chalk.white.bold('  ██████  ███████ ██ ███████')}
${chalk.white.bold('  ██   ██ ██      ██ ██     ')}
${chalk.white.bold('  ██████  █████   ██ ███████')}
${chalk.white.bold('  ██   ██ ██      ██      ██')}
${chalk.white.bold('  ██   ██ ███████ ██ ███████')}
  
  ${chalk.blue.bold('Roadmap Execution & Implementation System')}
  ${chalk.gray('Systematic development with parallel subagent execution')}
`;

// Check if running in CI environment or sudo (where stdin is not available)
const isSilentMode = process.argv.includes('--silent');
const isCIEnvironment = process.env.CI === 'true' || isSilentMode;
const isSudo = process.getuid && process.getuid() === 0;
// Check if stdin is actually readable (not just isTTY)
const hasInteractiveStdin = process.stdin.isTTY && !process.stdin.destroyed && typeof process.stdin.read === 'function';
const isInteractive = !isCIEnvironment && !isSudo && hasInteractiveStdin;

// Main installation function
async function install() {
  try {
    // Show banner unless in silent mode
    if (!isSilentMode) {
      console.log(banner);
    }
    
    // Check for non-interactive modes
    if (isCIEnvironment) {
      if (!isSilentMode) {
        console.log(chalk.gray('Running in CI mode - installing automatically...\n'));
      }
      await performInstallation(false, isSilentMode);
      return;
    }
    
    if (isSudo) {
      if (!isSilentMode) {
        console.log(chalk.gray('Running with sudo - installing automatically...\n'));
      }
      await performInstallation(false, isSilentMode);
      return;
    }
    
    // Interactive mode - show prompt
    if (!isSilentMode) {
      console.log(chalk.white('This will install REIS files to ~/.rovodev/reis/ and/or ~/.gemini/reis/\n'));
    }
    
    // Double-check we can actually prompt
    if (!isInteractive) {
      if (!isSilentMode) {
        console.log(chalk.gray('Non-interactive mode detected - installing automatically...\n'));
      }
      await performInstallation(false, isSilentMode);
      return;
    }
    
    try {
      // Prompt for installation target
      const { target } = await inquirer.prompt([
        {
          type: 'list',
          name: 'target',
          message: 'Where would you like to install REIS?',
          choices: [
            { name: 'Both (Atlassian Rovo Dev & Gemini CLI)', value: 'both' },
            { name: 'Atlassian Rovo Dev (~/.rovodev)', value: 'rovodev' },
            { name: 'Gemini CLI (~/.gemini)', value: 'gemini' }
          ],
          default: 'both'
        }
      ]);
      
      console.log('');
      await performInstallation(false, false, target);
    } catch (promptError) {
      // inquirer failed, install anyway
      if (!isSilentMode) {
        console.log(chalk.gray('Prompt failed - installing automatically...\n'));
      }
      await performInstallation(false, isSilentMode);
    }
    
  } catch (error) {
    console.error(chalk.red('\n✗ Installation failed:'), error.message);
    // Don't exit with error code - allow npm install to continue
    console.log(chalk.yellow('Installation had issues but package is available.'));
  }
}

// Perform the actual installation
async function performInstallation(overwrite = false, silent = false, target = 'both') {
  const homeDir = os.homedir();
  
  const platforms = target === 'both' ? ['rovodev', 'gemini'] : [target];
  let totalFiles = 0;
  
  for (const platform of platforms) {
    const baseDirName = platform === 'gemini' ? '.gemini' : '.rovodev';
    const baseDir = path.join(homeDir, baseDirName);
    
    // Define target directories
    const reisDir = path.join(baseDir, 'reis');
    const templatesDir = path.join(reisDir, 'templates');
    const agentsDirName = platform === 'gemini' ? 'agents' : 'subagents';
    const subagentsDir = path.join(baseDir, agentsDirName);
    
    // Create directories
    ensureDir(reisDir);
    ensureDir(templatesDir);
    ensureDir(subagentsDir);
    
    // Copy files
    const packageDir = path.join(__dirname, '..');
    let fileCount = 0;
    
    // Copy documentation files from docs/ to ~/<baseDir>/reis/
    const docsDir = path.join(packageDir, 'docs');
    if (fs.existsSync(docsDir)) {
      const docFiles = fs.readdirSync(docsDir);
      docFiles.forEach(file => {
        const src = path.join(docsDir, file);
        const dest = path.join(reisDir, file);
        if (copyFile(src, dest, overwrite)) {
          fileCount++;
        }
      });
    }
    
    // Copy templates from templates/ to ~/<baseDir>/reis/templates/
    const templatesSourceDir = path.join(packageDir, 'templates');
    if (fs.existsSync(templatesSourceDir)) {
      const count = copyDirectory(templatesSourceDir, templatesDir, overwrite);
      fileCount += count;
    }
    
    // Copy subagents from subagents/ to ~/<baseDir>/subagents/
    // ALWAYS overwrite subagents - they should stay up-to-date with package version
    const subagentsSourceDir = path.join(packageDir, 'subagents');
    if (fs.existsSync(subagentsSourceDir)) {
      const subagentFiles = fs.readdirSync(subagentsSourceDir);
      subagentFiles.forEach(file => {
        const src = path.join(subagentsSourceDir, file);
        const dest = path.join(subagentsDir, file);
        // Always overwrite subagent files to ensure they're up-to-date
        if (platform === 'gemini' && file.endsWith('.md')) {
          try {
            let content = fs.readFileSync(src, 'utf8');
            // Remove the tools array from YAML frontmatter for Gemini CLI
            content = content.replace(/^tools:\n(?:- .*\n)+/m, '');
            fs.writeFileSync(dest, content);
            fileCount++;
          } catch (e) {
            console.log(chalk.yellow(`  ⚠ Failed to process ${file}: ${e.message}`));
          }
        } else {
          if (copyFile(src, dest, true)) {
            fileCount++;
          }
        }
      });
    }
    
    totalFiles += fileCount;
    
    // Success message and next steps (only when called standalone)
    if (!silent) {
      showSuccessMessage(fileCount, platform);
    }
  }
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
function copyFile(src, dest, overwrite = false) {
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
    
    // Skip if file already exists (unless overwrite is true)
    if (fs.existsSync(dest) && !overwrite) {
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
function copyDirectory(srcDir, destDir, overwrite = false) {
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
        count += copyDirectory(srcPath, destPath, overwrite);
      } else {
        // Copy file
        if (copyFile(srcPath, destPath, overwrite)) {
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

// Show success message with next steps
function showSuccessMessage(fileCount, platform) {
  const isGemini = platform === 'gemini';
  const dirName = isGemini ? '.gemini' : '.rovodev';
  const clientName = isGemini ? 'Gemini CLI' : 'Atlassian Rovo Dev';
  
  console.log(chalk.green(`\n✓ Installation complete for ${clientName}\n`));
  console.log(chalk.gray(`  Location: ~/${dirName}/reis/`));
  console.log(chalk.white(`  Installed ${fileCount} files`));
  console.log(chalk.white(`  Open ${clientName} and run ${chalk.cyan('reis help')} to get started\n`));
}

// Run installation if called directly
if (require.main === module) {
  install().catch(error => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  });
}

export { install, performInstallation };
