const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { performInstallation, PLATFORMS } = require('../lib/install.js');

describe('Installer (v3 agent-native package)', function () {
  let homeDir;

  beforeEach(() => {
    homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reis-installer-'));
  });

  afterEach(() => {
    fs.rmSync(homeDir, { recursive: true, force: true });
  });

  it('installs agents, docs, templates, and commands for every platform', async () => {
    // Redirect homedir by faking via scope='local' into a temp project dir
    const proj = fs.mkdtempSync(path.join(os.tmpdir(), 'reis-proj-'));
    const cwd = process.cwd();
    process.chdir(proj);
    try {
      await performInstallation(false, true, 'all', 'local');
      for (const platform of Object.values(PLATFORMS)) {
        const base = path.join(proj, platform.baseDir);
        assert.ok(fs.existsSync(path.join(base, 'reis')), `${platform.key}: reis dir`);
        assert.ok(fs.existsSync(path.join(base, platform.agentsDirName)), `${platform.key}: agents dir`);
        const agents = fs.readdirSync(path.join(base, platform.agentsDirName));
        assert.ok(agents.length >= 11, `${platform.key}: 11+ agents installed`);
      }
      assert.ok(fs.existsSync(path.join(proj, '.claude/commands/reis/plan.md')));
      assert.ok(fs.existsSync(path.join(proj, '.gemini/commands/reis/plan.toml')));
      assert.ok(fs.existsSync(path.join(proj, '.codex/prompts/reis-plan.md')));
      assert.ok(fs.existsSync(path.join(proj, '.copilot/skills/plan/SKILL.md')));

      // methodology tree installed per platform
      const wf = path.join(proj, '.claude/reis/workflows');
      assert.ok(fs.existsSync(wf), 'workflows dir');
      assert.ok(fs.readdirSync(wf).filter(f => f.endsWith('.md')).length >= 24, '24+ workflows');
      assert.ok(fs.existsSync(path.join(proj, '.claude/reis/references/state-format.md')));
      assert.ok(fs.existsSync(path.join(proj, '.claude/reis/contexts/execution.md')));
    } finally {
      process.chdir(cwd);
      fs.rmSync(proj, { recursive: true, force: true });
    }
  });

  it('rewrites methodology paths per scope', async () => {
    const proj = fs.mkdtempSync(path.join(os.tmpdir(), 'reis-proj-'));
    const cwd = process.cwd();
    process.chdir(proj);
    try {
      await performInstallation(false, true, 'claude', 'local');
      const md = fs.readFileSync(path.join(proj, '.claude/commands/reis/plan.md'), 'utf8');
      assert.ok(md.includes('.claude/reis/workflows/plan.md'), 'local relative path');
      assert.ok(!md.includes('~/.claude/reis/'), 'no global path remains');
    } finally {
      process.chdir(cwd);
      fs.rmSync(proj, { recursive: true, force: true });
    }
  });

  it('generates valid Codex TOML commands', async () => {
    const proj = fs.mkdtempSync(path.join(os.tmpdir(), 'reis-proj-'));
    const cwd = process.cwd();
    process.chdir(proj);
    try {
      await performInstallation(false, true, 'codex', 'local');
      const files = fs.readdirSync(path.join(proj, '.codex/prompts')).filter(f => f.startsWith('reis-'));
      assert.strictEqual(files.length, 30);
      for (const f of files) {
        const content = fs.readFileSync(path.join(proj, '.codex/prompts', f), 'utf8');
        assert.ok(!content.startsWith('---'), `${f}: frontmatter stripped`);
      }
    } finally {
      process.chdir(cwd);
      fs.rmSync(proj, { recursive: true, force: true });
    }
  });
});
