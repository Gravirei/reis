/**
 * REIS Kanban Command
 * Manage kanban board settings
 */

import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

interface KanbanConfig {
  enabled?: boolean;
  style?: string;
}

function kanban(args: string[], options: Record<string, unknown> = {}): number {
  const subcommand = args[0];

  // Load current config
  const configPath = path.join(process.cwd(), 'reis.config.js');
  let config: Record<string, any> = {};
  try {
    if (fs.existsSync(configPath)) {
      delete require.cache[require.resolve(configPath)];
      config = require(configPath);
    }
  } catch (e) {
    // Config doesn't exist yet
  }

  // Ensure kanban config exists
  config.kanban = config.kanban || { enabled: true, style: 'full' };

  switch (subcommand) {
    case 'enable':
      config.kanban.enabled = true;
      saveConfig(configPath, config);
      console.log(chalk.green('\n✓ Kanban board enabled\n'));
      break;

    case 'disable':
      config.kanban.enabled = false;
      saveConfig(configPath, config);
      console.log(chalk.yellow('\n✓ Kanban board disabled\n'));
      break;

    case 'toggle':
      config.kanban.enabled = !config.kanban.enabled;
      saveConfig(configPath, config);
      console.log(config.kanban.enabled
        ? chalk.green('\n✓ Kanban board enabled\n')
        : chalk.yellow('\n✓ Kanban board disabled\n'));
      break;

    case 'style':
      const style = args[1];
      if (!style || !['full', 'compact', 'minimal'].includes(style as string)) {
        console.log(chalk.red('\nInvalid style. Use: full, compact, or minimal\n'));
        return 1;
      }
      config.kanban.style = style;
      saveConfig(configPath, config);
      console.log(chalk.green(`\n✓ Kanban style set to: ${style}\n`));
      break;

    default:
      // Show current settings
      showSettings(config.kanban);
  }

  return 0;
}

function showSettings(kanbanConfig: KanbanConfig): void {
  console.log('');
  console.log(chalk.cyan('┌─────────────────────────────────────────────────────────────────┐'));
  console.log(chalk.cyan('│                     REIS Kanban Settings                        │'));
  console.log(chalk.cyan('└─────────────────────────────────────────────────────────────────┘'));
  console.log('');
  console.log(`  Status:  ${kanbanConfig.enabled !== false ? chalk.green('✓ Enabled') : chalk.yellow('✗ Disabled')}`);
  console.log(`  Style:   ${chalk.white(kanbanConfig.style || 'full')}`);
  console.log('');
  console.log(chalk.gray('  Commands:'));
  console.log(chalk.gray('  ─────────────────────────────────────────────────────────────'));
  console.log('');
  console.log('  reis kanban                  Show current settings');
  console.log('  reis kanban enable           Enable kanban board');
  console.log('  reis kanban disable          Disable kanban board');
  console.log('  reis kanban toggle           Toggle kanban on/off');
  console.log('  reis kanban style <style>    Set style (full|compact|minimal)');
  console.log('');
  console.log(chalk.gray('  Styles:'));
  console.log(chalk.gray('  ─────────────────────────────────────────────────────────────'));
  console.log('');
  console.log('  full      Complete board with all columns and details');
  console.log('  compact   Single-line summary in a box');
  console.log('  minimal   Text-only status line');
  console.log('');
  console.log(chalk.gray('  Shows on: plan, execute, verify, debug, cycle, progress,'));
  console.log(chalk.gray('            resume, checkpoint, execute-plan'));
  console.log('');
  console.log(chalk.gray('  To hide for single command: --no-kanban'));
  console.log('');
}

function saveConfig(configPath: string, config: Record<string, any>): void {
  const configContent = `// REIS Configuration
module.exports = ${JSON.stringify(config, null, 2).replace(/"([^"]+)":/g, '$1:')};
`;
  fs.writeFileSync(configPath, configContent);
}

export = kanban;
