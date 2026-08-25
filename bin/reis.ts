#!/usr/bin/env node
// REIS v3 — agent-native package.
// The AI tools (Claude Code, Codex, Gemini, Copilot, Rovo) are the primary
// interface via /reis:* commands. This binary only manages installation.

import fs from 'fs';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import packageJson from '../package.json';

const VERSION = packageJson.version;

function showHelp(): void {
  console.log(`
  REIS v${VERSION} - Roadmap Execution & Implementation System

  REIS is an agent-native methodology: install it, then use /reis:* commands
  inside your AI CLI tool (Claude Code, Codex, Gemini CLI, Copilot CLI, Rovo Dev).

  Usage:
    reis                Install REIS (interactive)
    reis install        Same as above (--local to install into the current project)
    reis uninstall      Remove installed REIS files
    reis update         Reinstall (refresh) agents and commands
    reis version        Show version
    reis help           Show this help

  Flags:
    --local             Install into the current project instead of your home directory
    --global            Install into your home directory (default)
    --hooks / --no-hooks   Toggle lifecycle hooks injection (default: hooks)
    --profile=<name>       Command set: core | standard | full (default: full)

  Learn more: https://github.com/Gravirei/reis
`);
}

async function runInstall(overwrite: boolean): Promise<void> {
  const scope: 'global' | 'local' =
    process.argv.includes('--local') ? 'local' : 'global';
  const hooks = !process.argv.includes('--no-hooks');
  const profileArg = process.argv.find(a => a.startsWith('--profile='));
  const profile = profileArg ? profileArg.split('=')[1] : undefined;
  const { performInstallation } = await import('../lib/install.js');
  // On update without explicit --profile, respect previously persisted choice
  let effectiveProfile = profile;
  if (!effectiveProfile && overwrite && scope === 'global') {
    try {
      const fsMod = await import('fs');
      const pathMod = await import('path');
      const osMod = await import('os');
      const marker = pathMod.join(osMod.homedir(), '.claude/reis/.profile');
      const persisted = fsMod.readFileSync(marker, 'utf8').trim();
      if (['core', 'standard', 'full'].includes(persisted)) effectiveProfile = persisted as any;
    } catch {}
  }
  // Targets: default to all platforms unless flags narrow it down
  const targets = ['rovodev', 'gemini', 'claude', 'codex', 'copilot']
    .filter(p => process.argv.includes(`--${p}`));
  await performInstallation(overwrite, false, targets.length ? targets.join(',') : 'all', scope, hooks, effectiveProfile as any);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const cmd = args.find(a => !a.startsWith('--'));

  switch (cmd) {
    case undefined:
    case 'install': {
      console.log(chalk.bold.cyan(`\n  REIS v${VERSION} - installer\n`));
      await runInstall(false);
      break;
    }
    case 'update': {
      console.log(chalk.bold.cyan(`\n  REIS v${VERSION} - updating\n`));
      await runInstall(true);
      break;
    }
    case 'uninstall': {
      const { uninstall } = await import('../lib/uninstall.js');
      await uninstall({});
      break;
    }
    case 'version':
    case '--version':
    case '-v':
      console.log(VERSION);
      break;
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;
    default:
      console.log(chalk.yellow(`  Unknown command: ${cmd}\n`));
      showHelp();
      process.exitCode = 1;
  }
}

main().catch(err => {
  console.error(chalk.red('Error:'), (err as Error).message);
  process.exitCode = 1;
});
