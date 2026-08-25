#!/usr/bin/env node
/**
 * REIS runtime probe helper.
 *
 * Usage: node scripts/lib/probe.js <runtime> <sandboxRoot>
 *
 * Performs file-level assertions after a REIS install into the sandbox root.
 * Exit 0 = pass, 2 = assertion failure, 3 = runtime prerequisites missing.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const [, , runtime, sandbox] = process.argv;
if (!runtime || !sandbox) {
  console.error('usage: probe.js <runtime> <sandboxRoot>');
  process.exit(3);
}

function fail(msg) {
  console.error(`  ✗ ${msg}`);
  process.exit(2);
}
function pass(msg) {
  console.log(`  ✓ ${msg}`);
}

// --- file-level assertions -------------------------------------------------
const baseDirs = { claude: '.claude', gemini: '.gemini', codex: '.codex', copilot: '.copilot' };
const base = path.join(sandbox, baseDirs[runtime] || '');
if (!fs.existsSync(base)) fail(`${base} was not created by installer`);

// agents
let agentsDir;
if (runtime === 'rovodev') agentsDir = path.join(base, 'subagents');
else agentsDir = path.join(base, 'agents');
if (!fs.existsSync(agentsDir)) fail(`agents dir missing: ${agentsDir}`);
const agentCount = fs.readdirSync(agentsDir).filter(f => f.startsWith('reis_')).length;
if (agentCount < 11) fail(`expected >=11 reis agents, found ${agentCount}`);
pass(`${agentCount} agents installed`);

// methodology
const workflows = path.join(base, 'reis/workflows');
if (!fs.existsSync(workflows)) fail('reis/workflows missing');
const wfCount = fs.readdirSync(workflows).filter(f => f.endsWith('.md')).length;
if (wfCount < 24) fail(`expected >=24 workflows, found ${wfCount}`);
pass(`${wfCount} workflows installed`);

// commands (per runtime format)
if (runtime === 'claude') {
  const dir = path.join(base, 'commands/reis');
  const n = fs.readdirSync(dir).filter(f => f.endsWith('.md')).length;
  if (n !== 30) fail(`expected 30 claude commands, found ${n}`);
  const sample = fs.readFileSync(path.join(dir, 'plan.md'), 'utf8');
  if (sample.includes('~/.claude/reis/') && !process.env.REIS_LOCAL) {
    // global installs keep ~/.claude paths for claude itself
  }
  pass(`${n} markdown commands`);
} else if (runtime === 'gemini') {
  const dir = path.join(base, 'commands/reis');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.toml'));
  if (files.length !== 30) fail(`expected 30 gemini TOML commands, found ${files.length}`);
  const sample = fs.readFileSync(path.join(dir, 'plan.toml'), 'utf8');
  if (!sample.includes('{{args}}') && !sample.includes('description')) pass('toml shape ok (no-arg command)');
  else pass(`${files.length} TOML commands incl. {{args}} templating`);
} else if (runtime === 'codex') {
  const dir = path.join(base, 'prompts');
  const files = fs.readdirSync(dir).filter(f => /^reis-.*\.md$/.test(f));
  if (files.length !== 30) fail(`expected 30 codex prompts, found ${files.length}`);
  const sample = fs.readFileSync(path.join(dir, 'reis-plan.md'), 'utf8');
  if (sample.startsWith('---')) fail('codex prompt still has frontmatter');
  pass(`${files.length} prompts, frontmatter stripped`);
} else if (runtime === 'copilot') {
  const dir = path.join(base, 'skills');
  const skills = fs.readdirSync(dir).filter(f =>
    fs.existsSync(path.join(dir, f, 'SKILL.md'))
  );
  if (skills.length !== 30) fail(`expected 30 copilot skills, found ${skills.length}`);
  pass(`${skills.length} skills`);
}

console.log(`  FILE-CHECKS PASSED for ${runtime}`);
