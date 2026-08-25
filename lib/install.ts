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

// Supported installation platforms
interface CommandTarget {
  dirName: string;
  extension: string;
  mode: 'markdown' | 'gemini-toml' | 'codex-prompt' | 'copilot-skill';
}

interface PlatformConfig {
  key: string;
  baseDir: string;
  agentsDirName: string;
  agentExtension: string;
  transform: 'rovodev' | 'strip-tools' | 'codex-toml';
  clientName: string;
  commands: CommandTarget | null;
}

const PLATFORMS: Record<string, PlatformConfig> = {
  rovodev: {
    key: 'rovodev',
    baseDir: '.rovodev',
    agentsDirName: 'subagents',
    agentExtension: '.md',
    transform: 'rovodev',
    clientName: 'Atlassian Rovo Dev',
    commands: null
  },
  gemini: {
    key: 'gemini',
    baseDir: '.gemini',
    agentsDirName: 'agents',
    agentExtension: '.md',
    transform: 'strip-tools',
    clientName: 'Gemini CLI',
    commands: { dirName: 'commands/reis', extension: '.toml', mode: 'gemini-toml' }
  },
  claude: {
    key: 'claude',
    baseDir: '.claude',
    agentsDirName: 'agents',
    agentExtension: '.md',
    transform: 'strip-tools',
    clientName: 'Claude Code',
    commands: { dirName: 'commands/reis', extension: '.md', mode: 'markdown' }
  },
  codex: {
    key: 'codex',
    baseDir: '.codex',
    agentsDirName: 'agents',
    agentExtension: '.toml',
    transform: 'codex-toml',
    clientName: 'OpenAI Codex',
    commands: { dirName: 'prompts', extension: '.md', mode: 'codex-prompt' }
  },
  copilot: {
    key: 'copilot',
    baseDir: '.copilot',
    agentsDirName: 'agents',
    agentExtension: '.agent.md',
    transform: 'strip-tools',
    clientName: 'GitHub Copilot CLI',
    commands: { dirName: 'skills', extension: '/SKILL.md', mode: 'copilot-skill' }
  }
};

const ALL_PLATFORM_KEYS = Object.keys(PLATFORMS);

function resolvePlatforms(target: string): PlatformConfig[] {
  if (target === 'all') {
    return ALL_PLATFORM_KEYS.map(k => PLATFORMS[k]);
  }
  if (target === 'both') {
    return [PLATFORMS.rovodev, PLATFORMS.gemini];
  }
  return target
    .split(',')
    .map(t => t.trim())
    .filter(t => PLATFORMS[t])
    .map(t => PLATFORMS[t]);
}

// Parse YAML frontmatter from a subagent markdown file
function parseFrontmatter(content: string): { fields: Record<string, string>; body: string } | null {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    return null;
  }
  const fields: Record<string, string> = {};
  let currentKey = '';
  const lines = match[1].split('\n');
  for (const line of lines) {
    const kv = line.match(/^([a-zA-Z_-]+):\s*(.*)$/);
    if (kv && !line.startsWith(' ')) {
      currentKey = kv[1];
      fields[currentKey] = kv[2].trim();
    } else if (currentKey && line.startsWith('- ')) {
      // list item - keep only the first for scalar use
      if (!(currentKey in fields)) {
        fields[currentKey] = line.substring(2).trim();
      }
    }
  }
  return { fields, body: match[2].trim() };
}

// Convert a subagent markdown file to Codex TOML format
function toCodexTOML(content: string, fileName: string): string | null {
  const parsed = parseFrontmatter(content);
  if (!parsed) {
    console.log(chalk.yellow(`  ⚠ Skipping ${fileName}: no frontmatter found`));
    return null;
  }
  const name = parsed.fields.name || fileName.replace(/\.md$/, '');
  const description = (parsed.fields.description || '').replace(/"/g, '\\"');
  // Literal multiline string ('''): no escape processing; guard the delimiter
  const instructions = parsed.body.replace(/'''/g, "''\\''");
  return [
    `name = "${name}"`,
    `description = "${description}"`,
    `developer_instructions = '''`,
    instructions,
    `'''`,
    ''
  ].join('\n');
}

// Strip the tools array from frontmatter (for CLIs that don't support it)
function stripToolsBlock(content: string): string {
  return content.replace(/^tools:\n(?:- .*\n)+/m, '');
}

// Rewrite methodology-path references for the target platform and scope
function rewritePaths(content: string, baseDir: string, scopeRoot: string): string {
  // Canonical authored form references ~/.claude/reis/
  if (scopeRoot === os.homedir()) {
    return content.split('~/.claude/reis/').join(`~/${baseDir}/reis/`);
  }
  // Local (project) installs: agent runs inside the project, relative paths work
  return content.split('~/.claude/reis/').join(`${baseDir}/reis/`);
}

interface ParsedCommand {
  name: string;
  description: string;
  body: string;
}

// Parse a command dispatcher markdown file (frontmatter + body)
function parseCommandFile(content: string): ParsedCommand | null {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    return null;
  }
  const nameMatch = match[1].match(/^name:\s*(.+)$/m);
  const descMatch = match[1].match(/^description:\s*(.+)$/m);
  return {
    name: nameMatch ? nameMatch[1].trim() : 'unknown',
    description: descMatch ? descMatch[1].trim() : '',
    body: match[2].trim()
  };
}

// Convert a parsed command to Gemini TOML command format
function toGeminiTOML(cmd: ParsedCommand): string {
  const description = cmd.description.replace(/"/g, '\\"');
  const prompt = cmd.body.replace(/\$ARGUMENTS/g, '{{args}}');
  return [
    `description = "${description}"`,
    ``,
    `prompt = """`,
    prompt,
    `"""`,
    ''
  ].join('\n');
}

// Convert a parsed command to a Copilot skill definition
function toCopilotSkill(cmd: ParsedCommand): string {
  const description = cmd.description.replace(/"/g, "'");
  return [
    `---`,
    `name: ${cmd.name.replace(':', '-')}`,
    `description: "${description}"`,
    `---`,
    ``,
    cmd.body,
    ''
  ].join('\n');
}

// Convert a parsed command to a Codex prompt file (frontmatter stripped)
function toCodexPrompt(cmd: ParsedCommand): string {
  return `${cmd.body}\n`;
}

// Claude Code hooks injection (marker-scoped, user entries preserved)
const REIS_HOOK_MARKER = 'reis/hooks/';

function injectClaudeHooks(settingsPath: string, hookCommands: { event: string; command: string; matcher?: string }[]): void {
  let settings: any = {};
  if (fs.existsSync(settingsPath)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    } catch {
      console.log(chalk.yellow(`  ⚠ Could not parse ${settingsPath} - skipping hooks injection`));
      return;
    }
  }
  fs.copyFileSync(settingsPath, settingsPath + '.reis-backup');
  settings.hooks = settings.hooks || {};
  for (const { event, command, matcher } of hookCommands) {
    const arr = (settings.hooks[event] = settings.hooks[event] || []);
    // remove previous reis entries for idempotent update
    for (const entry of arr) {
      if (entry.hooks) {
        entry.hooks = entry.hooks.filter((h: any) => !String(h.command || '').includes(REIS_HOOK_MARKER));
      }
    }
    for (let i = arr.length - 1; i >= 0; i--) {
      if (!arr[i].hooks || arr[i].hooks.length === 0) arr.splice(i, 1);
    }
    const entry: Record<string, unknown> = { hooks: [{ type: 'command', command }] };
    if (matcher) {
      entry.matcher = matcher;
    }
    arr.push(entry);
  }
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

function removeClaudeHooks(settingsPath: string): boolean {
  if (!fs.existsSync(settingsPath)) return false;
  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    if (!settings.hooks) return false;
    let removed = false;
    for (const event of Object.keys(settings.hooks)) {
      const arr = settings.hooks[event];
      if (!Array.isArray(arr)) continue;
      for (const entry of arr) {
        if (entry.hooks) {
          const before = entry.hooks.length;
          entry.hooks = entry.hooks.filter((h: any) => !String(h.command || '').includes(REIS_HOOK_MARKER));
          if (entry.hooks.length !== before) removed = true;
        }
      }
      settings.hooks[event] = arr.filter((entry: any) => entry.hooks && entry.hooks.length > 0);
      if (settings.hooks[event].length === 0) delete settings.hooks[event];
    }
    if (Object.keys(settings.hooks).length === 0) delete settings.hooks;
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    return removed;
  } catch {
    return false;
  }
}

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
      console.log(chalk.white('This will install REIS files for your AI CLI tools:\n  ~/.rovodev  ~/.gemini  ~/.claude  ~/.codex  ~/.copilot\n'));
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
          type: 'checkbox',
          name: 'target',
          message: 'Which AI CLI tools should REIS be installed for?',
          choices: [
            { name: 'Atlassian Rovo Dev (~/.rovodev)', value: 'rovodev' },
            { name: 'Gemini CLI (~/.gemini)', value: 'gemini' },
            { name: 'Claude Code (~/.claude)', value: 'claude' },
            { name: 'OpenAI Codex (~/.codex, TOML agents)', value: 'codex' },
            { name: 'GitHub Copilot CLI (~/.copilot, .agent.md)', value: 'copilot' }
          ],
          default: ['rovodev', 'gemini'],
          validate: (answers: string[]) => answers.length > 0 || 'Select at least one target.'
        }
      ]);

      let scope: 'global' | 'local' = 'global';
      try {
        const { installScope } = await inquirer.prompt([
          {
            type: 'list',
            name: 'installScope',
            message: 'Install scope?',
            choices: [
              { name: 'Global - available in all projects (~)', value: 'global' },
              { name: 'Current project only (./)', value: 'local' }
            ],
            default: 'global'
          }
        ]);
        scope = installScope;
      } catch {
        // keep global on prompt failure
      }

      console.log('');
      await performInstallation(false, false, target.join(','), scope);
    } catch (promptError) {
      // inquirer failed, install anyway
      if (!isSilentMode) {
        console.log(chalk.gray('Prompt failed - installing automatically...\n'));
      }
      await performInstallation(false, isSilentMode);
    }
    
  } catch (error) {
    console.error(chalk.red('\n✗ Installation failed:'), (error as any).message);
    // Don't exit with error code - allow npm install to continue
    console.log(chalk.yellow('Installation had issues but package is available.'));
  }
}

// Perform the actual installation
async function performInstallation(overwrite = false, silent = false, target = 'all', scope: 'global' | 'local' = 'global', hooks = true) {
  const rootDir = scope === 'local' ? process.cwd() : os.homedir();
  const platforms = resolvePlatforms(target);
  let totalFiles = 0;

  for (const platform of platforms) {
    const baseDir = path.join(rootDir, platform.baseDir);

    // Define target directories
    const reisDir = path.join(baseDir, 'reis');
    const templatesDir = path.join(reisDir, 'templates');
    const subagentsDir = path.join(baseDir, platform.agentsDirName);

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

    // Copy subagents from subagents/ to the platform agents directory
    // ALWAYS overwrite subagents - they should stay up-to-date with package version
    const subagentsSourceDir = path.join(packageDir, 'agents');
    if (fs.existsSync(subagentsSourceDir)) {
      const subagentFiles = fs.readdirSync(subagentsSourceDir);
      subagentFiles.forEach(file => {
        if (!file.endsWith('.md')) {
          return;
        }
        const src = path.join(subagentsSourceDir, file);
        try {
          const content = fs.readFileSync(src, 'utf8');

          if (platform.transform === 'codex-toml') {
            const toml = toCodexTOML(content, file);
            if (toml) {
              const parsed = parseFrontmatter(content);
              const name = (parsed && parsed.fields.name) || file.replace(/\.md$/, '');
              const dest = path.join(subagentsDir, `${name}.toml`);
              fs.writeFileSync(dest, toml);
              fileCount++;
            }
            return;
          }

          const outContent = platform.transform === 'strip-tools'
            ? stripToolsBlock(content)
            : content;
          const parsed = parseFrontmatter(content);
          const name = (parsed && parsed.fields.name) || file.replace(/\.md$/, '');
          const dest = path.join(subagentsDir, `${name}${platform.agentExtension}`);
          fs.writeFileSync(dest, outContent);
          fileCount++;
        } catch (e) {
          console.log(chalk.yellow(`  ⚠ Failed to process ${file}: ${(e as any).message}`));
        }
      });
    }

    // Install slash-command dispatchers (where the platform supports them)
    if (platform.commands) {
      const commandsSourceDir = path.join(packageDir, 'commands', 'reis');
      if (fs.existsSync(commandsSourceDir)) {
        const cmdTarget = path.join(baseDir, platform.commands.dirName);
        ensureDir(cmdTarget);
        const commandFiles = fs.readdirSync(commandsSourceDir).filter(f => f.endsWith('.md'));
        for (const file of commandFiles) {
          try {
            const raw = fs.readFileSync(path.join(commandsSourceDir, file), 'utf8');
            const parsed = parseCommandFile(raw);
            if (!parsed) {
              continue;
            }
            const body = rewritePaths(raw, platform.baseDir, rootDir);
            const cmdName = file.replace(/\.md$/, '');
            let out: string;
            let destName: string;
            switch (platform.commands.mode) {
              case 'gemini-toml': {
                const p2 = parseCommandFile(body);
                out = p2 ? toGeminiTOML(p2) : '';
                destName = `${cmdName}.toml`;
                break;
              }
              case 'codex-prompt': {
                const p3 = parseCommandFile(body);
                out = p3 ? toCodexPrompt(p3) : '';
                destName = `reis-${cmdName}.md`;
                break;
              }
              case 'copilot-skill': {
                const p4 = parseCommandFile(body);
                out = p4 ? toCopilotSkill(p4) : '';
                destName = `${cmdName}/SKILL.md`;
                break;
              }
              default:
                out = stripToolsBlock(body);
                destName = `${cmdName}.md`;
            }
            if (!out) {
              continue;
            }
            const dest = path.join(cmdTarget, destName);
            ensureDir(path.dirname(dest));
            fs.writeFileSync(dest, out);
            fileCount++;
          } catch (e) {
            console.log(chalk.yellow(`  ⚠ Failed to process command ${file}: ${(e as any).message}`));
          }
        }
      }
    }

    // Install hook scripts (all platforms can use them manually)
    const hooksSourceDir = path.join(packageDir, 'hooks');
    if (fs.existsSync(hooksSourceDir)) {
      copyDirectory(hooksSourceDir, path.join(reisDir, 'hooks'), true);
    }

    // Inject lifecycle hooks into Claude Code settings (only supported runtime)
    if (platform.key === 'claude' && hooks) {
      const hooksBase = scope === 'local'
        ? `.${platform.baseDir}/reis/hooks`
        : `~/${platform.baseDir}/reis/hooks`;
      const settingsPath = path.join(baseDir, 'settings.json');
      injectClaudeHooks(settingsPath, [
        { event: 'SessionStart', command: `${hooksBase}/session-start.sh` },
        { event: 'PreToolUse', command: `node ${hooksBase}/workflow-guard.js`, matcher: 'Edit|Write' }
      ]);
      if (!silent) {
        console.log(chalk.green(`  ✓ [${platform.key}] Lifecycle hooks injected into ${settingsPath}`));
      }
    }

    totalFiles += fileCount;

    // Success message and next steps (only when called standalone)
    if (!silent) {
      showSuccessMessage(fileCount, platform);
    }
  }
}

// Ensure directory exists
function ensureDir(dir: string) {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (error) {
    throw new Error(`Failed to create directory ${dir}: ${(error as any).message}`);
  }
}

// Copy a single file
function copyFile(src: string, dest: string, overwrite = false) {
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
    console.log(chalk.yellow(`  ⚠ Failed to copy ${src}: ${(error as any).message}`));
    return false;
  }
}

// Copy a directory recursively
function copyDirectory(srcDir: string, destDir: string, overwrite = false) {
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
    console.log(chalk.yellow(`  ⚠ Failed to copy directory ${srcDir}: ${(error as any).message}`));
    return count;
  }
}

// Show success message with next steps
function showSuccessMessage(fileCount: number, platform: PlatformConfig) {
  console.log(chalk.green(`\n✓ Installation complete for ${platform.clientName}\n`));
  console.log(chalk.gray(`  Location: ~/${platform.baseDir}/reis/`));
  console.log(chalk.white(`  Installed ${fileCount} files`));
  console.log(chalk.white(`  Open ${platform.clientName} and run ${chalk.cyan('reis help')} to get started\n`));
}

// Run installation if called directly
if (require.main === module) {
  install().catch(error => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  });
}

export { install, performInstallation, PLATFORMS, ALL_PLATFORM_KEYS, removeClaudeHooks };
