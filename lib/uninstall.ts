import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import { PLATFORMS } from './install.js';
import { removeClaudeHooks } from './install.js';

interface PlatformInstallStatus {
  key: string;
  clientName: string;
  baseDir: string;
  reisDir: string;
  agentsDir: string;
  agentFiles: string[];
  commandPaths: { path: string; kind: 'dir' | 'namespaced-files'; rel: string }[];
}

// Candidate base directories for a platform: default home path plus any
// env-var override location (installs may live in either).
function candidateBaseDirs(platformKey: string, defaultBase: string): string[] {
  const homeDir = os.homedir();
  const candidates = new Set<string>([path.join(homeDir, defaultBase)]);
  const envNames: Record<string, string[]> = {
    claude: ['CLAUDE_CONFIG_DIR'],
    gemini: ['GEMINI_CONFIG_DIR'],
    codex: ['CODEX_HOME', 'CODEX_CONFIG_DIR'],
    copilot: ['COPILOT_HOME', 'COPILOT_CONFIG_DIR'],
    rovodev: ['ROVODEV_HOME', 'ROVODEV_CONFIG_DIR']
  };
  for (const envName of envNames[platformKey] || []) {
    const v = process.env[envName];
    if (v) candidates.add(path.isAbsolute(v) ? v : path.join(homeDir, v));
  }
  // --config-dir flag (matches installer behavior; single platform)
  const idx = process.argv.indexOf('--config-dir');
  if (idx !== -1 && process.argv[idx + 1]) {
    const v = process.argv[idx + 1];
    candidates.add(path.isAbsolute(v) ? v : path.join(process.cwd(), v));
  }
  return [...candidates];
}

// Back up an installation directory before removal (keeps last 3 per platform)
function backupInstallDir(baseDir: string, platformKey: string): string | null {
  try {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupRoot = path.join(os.homedir(), '.reis-uninstall-backups', platformKey);
    fs.mkdirSync(backupRoot, { recursive: true });
    const dest = path.join(backupRoot, `reis-${stamp}`);
    fs.mkdirSync(dest, { recursive: true });
    // copy contents (reis dir + agents + commands) without executing anything
    for (const entry of [path.join(baseDir, 'reis'), path.join(baseDir, 'commands', 'reis')]) {
      if (fs.existsSync(entry)) {
        const target = path.join(dest, path.basename(path.dirname(entry)) === 'reis' ? 'reis' : 'commands-reis');
        fs.cpSync(entry, target, { recursive: true });
      }
    }
    if (fs.existsSync(path.join(baseDir, platformKey === 'rovodev' ? 'subagents' : 'agents'))) {
      fs.cpSync(
        path.join(baseDir, platformKey === 'rovodev' ? 'subagents' : 'agents'),
        path.join(dest, 'agents'),
        { recursive: true }
      );
    }
    // retain newest 3 backups per platform
    try {
      const backups = fs.readdirSync(backupRoot).sort().reverse();
      for (const old of backups.slice(3)) {
        fs.rmSync(path.join(backupRoot, old), { recursive: true, force: true });
      }
    } catch {}
    return dest;
  } catch {
    return null;
  }
}

// Detect REIS installations across all supported platforms
function detectInstalls(): PlatformInstallStatus[] {
  const found: PlatformInstallStatus[] = [];

  for (const platform of Object.values(PLATFORMS)) {
    const baseDir = candidateBaseDirs(platform.key, platform.baseDir).find(dir => {
      const hasReis = fs.existsSync(path.join(dir, 'reis'));
      let hasAgents = false;
      try {
        hasAgents = fs.existsSync(path.join(dir, platform.agentsDirName)) &&
          fs.readdirSync(path.join(dir, platform.agentsDirName)).some(f => f.startsWith('reis_'));
      } catch {}
      return hasReis || hasAgents;
    }) || path.join(os.homedir(), platform.baseDir);

    if (process.env.REIS_DEBUG) console.error(`[REIS_DEBUG] ${platform.key} candidates=${JSON.stringify(candidateBaseDirs(platform.key, platform.baseDir))} picked=${baseDir}`);
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

    const displayBase = baseDir.startsWith(os.homedir())
      ? '~' + baseDir.slice(os.homedir().length)
      : baseDir;
    if (fs.existsSync(reisDir) || agentFiles.length > 0 || commandPaths.some(cp => fs.existsSync(cp.path))) {
      found.push({
        key: platform.key,
        clientName: platform.clientName,
        baseDir: displayBase,
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
export async function uninstall(args: any & { yes?: boolean }): Promise<void> {
  const nonInteractive = args?.yes || process.argv.includes('--yes');
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
    console.log(chalk.yellow(`    • [${inst.key}] ${inst.baseDir}/reis/ (documentation and templates)`));
    console.log(chalk.yellow(`    • [${inst.key}] ${inst.agentFiles.length} REIS agent file(s) in ${inst.baseDir}/${path.basename(inst.agentsDir)}/`));
  }
  console.log(chalk.gray('\n  Your project .planning/ directories will NOT be affected.\n'));

  let selectedKeys: string[];
  if (nonInteractive) {
    selectedKeys = installs.map(i => i.key);
    console.log(chalk.gray('  Non-interactive mode: removing all detected installations.\n'));
  } else if (installs.length === 1) {
    selectedKeys = [installs[0].key];
  } else {
    try {
      const { targets } = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'targets',
          message: 'Which installations should be removed?',
          choices: installs.map(i => ({ name: `${i.clientName} (${i.baseDir})`, value: i.key })),
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
  if (!nonInteractive) {
    let choice: string;
    try {
      const answer = await inquirer.prompt([
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
      choice = answer.choice;
    } catch {
      console.log(chalk.red('\n✗ Uninstall cancelled or failed\n'));
      return;
    }

    console.log('');

    if (choice === '2') {
      console.log(chalk.green('  ✓ Uninstall cancelled\n'));
      return;
    }
  }

  try {
    console.log(chalk.cyan('  Uninstalling REIS...\n'));

    for (const key of selectedKeys) {
      const inst = installs.find(i => i.key === key);
      if (!inst) {
        continue;
      }

      const backupPath = backupInstallDir(
        path.dirname(inst.reisDir),
        inst.key
      );
      if (backupPath) {
        console.log(chalk.gray(`  • [${inst.key}] Backed up to ${backupPath}`));
      }

      if (fs.existsSync(inst.reisDir)) {
        fs.rmSync(inst.reisDir, { recursive: true, force: true });
        console.log(chalk.green(`  ✓ [${inst.key}] Removed ${inst.baseDir}/reis/`));
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
            console.log(chalk.green(`  ✓ [${inst.key}] Removed ${inst.baseDir}/${cp.rel}/`));
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
              console.log(chalk.green(`  ✓ [${inst.key}] Removed ${removed} REIS entr(ies) from ${inst.baseDir}/${cp.rel}/`));
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
