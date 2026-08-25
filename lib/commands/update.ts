import chalk from 'chalk';
import { execSync } from 'child_process';
import { getVersion } from '../utils/command-helpers.js';

/**
 * Update command - check for and install REIS updates
 * @param {Object} args - {}
 */
export async function update(args: any): Promise<number> {
  const currentVersion = getVersion();
  const packageName = '@gravirei/reis';
  const w = chalk.bold.white;
  const g = chalk.green;
  const y = chalk.yellow;
  const r = chalk.red;
  const c = chalk.cyan;

  // ASCII Art Banner
  console.log(w(`
                       ██████╗ ███████╗██╗███████╗
                       ██╔══██╗██╔════╝██║██╔════╝
                       ██████╔╝█████╗  ██║███████╗
                       ██╔══██╗██╔══╝  ██║╚════██║
                       ██║  ██║███████╗██║███████║
                       ╚═╝  ╚═╝╚══════╝╚═╝╚══════╝
`));
  
  console.log(w('             REIS - Roadmap Execution & Implementation System'));
  console.log(w('                  Specially designed for Atlassian Rovo Dev'));
  console.log('');
  console.log(w('●  Update Manager'));
  console.log(w('   ───────────────'));
  console.log('');
  console.log(w(`   Current Version:  v${currentVersion}`));
  console.log('');
  console.log(c('   🔍 Checking for updates...'));
  console.log('');

  try {
    // Check latest version from npm
    const latestVersion = execSync(`npm view ${packageName} version 2>/dev/null`, { 
      encoding: 'utf-8' 
    }).trim();

    if (currentVersion === latestVersion) {
      // Already up to date
      console.log(w('   ┌──────────────────────────────────────────────────────┐'));
      console.log(w('   │  ') + g('✅ You\'re up to date!') + w('                              │'));
      console.log(w('   │                                                      │'));
      console.log(w('   │     Installed: ') + g(`v${currentVersion}`) + w(' (latest)' + ' '.repeat(Math.max(0, 22 - currentVersion.length))) + w('│'));
      console.log(w('   └──────────────────────────────────────────────────────┘'));
      console.log('');
      return 0;
    }

    // New version available
    console.log(w(`   Latest Version:   v${latestVersion}`));
    console.log('');
    console.log(w('   ┌──────────────────────────────────────────────────────┐'));
    console.log(w('   │  ') + y('📦 New version available!') + w('                          │'));
    console.log(w('   │                                                      │'));
    const versionLine = `v${currentVersion}  →  v${latestVersion}`;
    const padding = Math.max(0, 38 - versionLine.length);
    console.log(w('   │     ') + c(versionLine) + w(' '.repeat(padding) + '│'));
    console.log(w('   └──────────────────────────────────────────────────────┘'));
    console.log('');

    // Ask user for confirmation
    const inquirer = require('inquirer');
    try {
      const { confirmUpdate } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmUpdate',
          message: 'Do you want to update REIS now?',
          default: true
        }
      ]);

      console.log('');

      if (!confirmUpdate) {
        console.log(c('   ℹ Update skipped. Run "reis update" anytime to update.'));
        console.log('');
        return 0;
      }

      // User confirmed, proceed with update
      console.log(c(`   ⏳ Downloading and installing v${latestVersion}...`));
      console.log('');

      try {
        // Try global update
        execSync(`npm install -g ${packageName}@latest`, { 
          stdio: 'inherit',
          encoding: 'utf-8'
        });
        
        console.log('');
        console.log(g(`   ✓ Successfully updated to v${latestVersion}!`));
        console.log('');
        console.log(c('   Run "reis whats-new" to see what\'s changed.'));
        console.log('');
        return 0;

      } catch (installError) {
        // If global install fails, suggest manual update
        console.log('');
        console.log(r('   ❌ Update failed (may need elevated privileges)'));
        console.log('');
        console.log(w('   Try manually:'));
        console.log(c(`   $ sudo npm install -g ${packageName}@latest`));
        console.log('');
        return 1;
      }

    } catch (promptError) {
      // Non-interactive mode - show manual instructions
      console.log(y('   Non-interactive mode detected.'));
      console.log('');
      console.log(w('   To update manually, run:'));
      console.log(c(`   $ npm install -g ${packageName}@latest`));
      console.log('');
      return 0;
    }

  } catch (error) {
    // Network error or npm not available
    console.log(r('   ❌ Could not check for updates'));
    console.log('');
    console.log(w('   Please check your internet connection and try again.'));
    console.log('');
    console.log(w('   Manual update:'));
    console.log(c(`   $ npm install -g ${packageName}@latest`));
    console.log('');
    return 1;
  }
};
