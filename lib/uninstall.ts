import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { PLATFORMS, removeClaudeHooks } from './install.js';

interface PlatformInstallStatus {
  key: string;
  clientName: string;
  baseDir: string;
  reisDir: string;
  agentsDir: string;
  agentFiles: string[];
  commandPaths: { path: string; kind: 'dir' | 'namespaced-files'; rel: string }[];
}

// Detect REIS installations across all supported platforms
function detectInstalls(): PlatformInstallStatus[] {
  const homeDir = os.homedir();
  const found: PlatformInstallStatus[] = [];

  for (const platform of Object.values(PLATFORMS)) {
    const baseDir = path.join(homeDir, platform.baseDir);
    const reisDir = path.join(baseDir, 'reis');
    const agentsDir = path.join(baseDir, platform.agentsDirName);

    let agentFiles: string[] = [];
    if (fs.existsSync(agentsDir)) {
      try {
        agentFiles = fs.readdirSync(agentsDir).filter(f => f.startsWith('reis_'));
      } catch {
        // unreadable dir - treat as no agents
      }
    }

    const commandPaths: PlatformInstallStatus['commandPaths'] = [];
    if (platform.commands) {
      if (platform.commands.dirName.includes('/')) {
        // namespaced dir owned entirely by REIS (e.g. commands/reis)
        commandPaths.push({ path: path.join(baseDir, platform.commands.dirName), kind: 'dir', rel: platform.commands.dirName });
      }
      if (platform.commands.mode === 'codex-prompt') {
        commandPaths.push({ path: path.join(baseDir, platform.commands.dirName), kind: 'namespaced-files', rel: platform.commands.dirName });
      }
      if (platform.commands.mode === 'copilot-skill') {
        commandPaths.push({ path: path.join(baseDir, platform.commands.dirName), kind: 'namespaced-files', rel: platform.commands.dirName });
      }
    }

    if (fs.existsSync(reisDir) || agentFiles.length > 0 || commandPaths.some(cp => fs.existsSync(cp.path))) {
      found.push({
        key: platform.key,
        clientName: platform.clientName,
        baseDir: platform.baseDir,
        reisDir,
        agentsDir,
        agentFiles,
        commandPaths
      });
    }
  }

  return found;
}

function showSuccess(message: string): void {
  console.log(message);
}

function showError(error: string): void {
  console.log(error);
}

/**
 * Uninstall command - remove REIS files with confirmation
 * @param {Object} args - {}
 */
export async function uninstall(args: any): Promise<void> {
  console.log(chalk.white.bold(`
  ██████  ███████ ██ ███████
  ██   ██ ██      ██ ██
  ██████  █████   ██ ███████
  ██   ██ ██      ██      ██
  ██   ██ ███████ ██ ███████
  `));

  console.log(chalk.red.bold('  REIS - Uninstall'));
  console.log(chalk.gray('  Remove REIS from your AI CLI tools\n'));

  const installs = detectInstalls();

  if (installs.length === 0) {
    console.log(chalk.yellow('  ⚠️  REIS is not installed\n'));
    console.log(chalk.gray('  There is nothing to uninstall.'));
    console.log(chalk.gray('  REIS files were not found in ~/.rovodev/, ~/.gemini/, ~/.claude/, ~/.codex/ or ~/.copilot/\n'));
    return;
  }

  console.log(chalk.bold.red('  ⚠️  Uninstall REIS\n'));
  console.log(chalk.yellow('  This will remove:'));
  for (const inst of installs) {
    console.log(chalk.yellow(`    • [${inst.key}] ~/${inst.baseDir}/reis/ (documentation and templates)`));
    console.log(chalk.yellow(`    • [${inst.key}] ${inst.agentFiles.length} REIS agent file(s) in ~/${inst.baseDir}/${path.basename(inst.agentsDir)}/`));
  }
  console.log(chalk.gray('\n  Your project .planning/ directories will NOT be affected.\n'));

  let selectedKeys: string[];
  if (installs.length === 1) {
    selectedKeys = [installs[0].key];
  } else {
    try {
      const { targets } = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'targets',
          message: 'Which installations should be removed?',
          choices: installs.map(i => ({ name: `${i.clientName} (~/${i.baseDir})`, value: i.key })),
          default: installs.map(i => i.key),
          validate: (answers: string[]) => answers.length > 0 || 'Select at least one target.'
        }
      ]);
      selectedKeys = targets;
    } catch {
      console.log(chalk.red('\n✗ Uninstall cancelled or failed\n'));
      return;
    }
  }

  console.log('');
  try {
    const { choice } = await inquirer.prompt([
      {
        type: 'input',
        name: 'choice',
        message: `Remove REIS from ${selectedKeys.length} installation(s)? (1 = yes, 2 = cancel):`,
        default: '2',
        validate: (input: string) => {
          if (input === '1' || input === '2') {
            return true;
          }
          return 'Please enter 1 or 2';
        }
      }
    ]);

    console.log('');

    if (choice === '2') {
      console.log(chalk.green('  ✓ Uninstall cancelled\n'));
      return;
    }

    console.log(chalk.cyan('  Uninstalling REIS...\n'));

    for (const key of selectedKeys) {
      const inst = installs.find(i => i.key === key);
      if (!inst) {
        continue;
      }

      if (fs.existsSync(inst.reisDir)) {
        fs.rmSync(inst.reisDir, { recursive: true, force: true });
        console.log(chalk.green(`  ✓ [${inst.key}] Removed ~/${inst.baseDir}/reis/`));
      }

      let removedAgents = 0;
      for (const file of inst.agentFiles) {
        try {
          fs.unlinkSync(path.join(inst.agentsDir, file));
          removedAgents++;
        } catch (e) {
          console.log(chalk.yellow(`  ⚠ [${inst.key}] Failed to remove ${file}: ${(e as any).message}`));
        }
      }
      if (removedAgents > 0) {
        console.log(chalk.green(`  ✓ [${inst.key}] Removed ${removedAgents} REIS agent file(s)`));
      }

      // Remove injected Claude lifecycle hooks
      if (inst.key === 'claude') {
        const settingsPath = path.join(os.homedir(), '.claude', 'settings.json');
        if (removeClaudeHooks(settingsPath)) {
          console.log(chalk.green(`  ✓ [${inst.key}] Removed REIS hooks from settings.json`));
        }
        const localSettings = path.join('.claude', 'settings.json');
        if (fs.existsSync(localSettings) && removeClaudeHooks(localSettings)) {
          console.log(chalk.green(`  ✓ [${inst.key}] Removed REIS hooks from project settings.json`));
        }
      }

      for (const cp of inst.commandPaths) {
        try {
          if (!fs.existsSync(cp.path)) {
            continue;
          }
          if (cp.kind === 'dir') {
            fs.rmSync(cp.path, { recursive: true, force: true });
            console.log(chalk.green(`  ✓ [${inst.key}] Removed ~/${inst.baseDir}/${cp.rel}/`));
          } else {
            // shared dir - remove only reis-namespaced entries
            const entries = fs.readdirSync(cp.path).filter(f => f.startsWith('reis-') || f.startsWith('reis_'));
            let removed = 0;
            for (const entry of entries) {
              const p2 = path.join(cp.path, entry);
              fs.rmSync(p2, { recursive: true, force: true });
              removed++;
            }
            if (removed > 0) {
              console.log(chalk.green(`  ✓ [${inst.key}] Removed ${removed} REIS entr(ies) from ~/${inst.baseDir}/${cp.rel}/`));
            }
          }
        } catch (e) {
          console.log(chalk.yellow(`  ⚠ [${inst.key}] Failed to clean ${cp.rel}: ${(e as any).message}`));
        }
      }
    }

    showSuccess('\nREIS uninstalled successfully!');
    console.log(chalk.gray('  Note: If installed globally, run: ') + chalk.cyan('npm uninstall -g @gravirei/reis\n'));

  } catch (err) {
    showError('\nUninstall cancelled or failed');
  }
};
