#!/usr/bin/env node
// REIS workflow-guard: warns when .planning artifacts are edited while no
// REIS cycle is active. Reads a Claude Code PreToolUse event from stdin.
// Defensive: any internal error exits 0 (never brick a session).
let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', c => (raw += c));
process.stdin.on('end', () => {
  try {
    const event = JSON.parse(raw || '{}');
    const filePath =
      (event.tool_input && (event.tool_input.file_path || event.tool_input.notebook_path)) || '';
    if (!filePath || !filePath.includes('.planning' + require('path').sep) && !filePath.includes('.planning/')) {
      process.exit(0);
    }
    const fs = require('fs');
    let cycleActive = false;
    try {
      const state = JSON.parse(fs.readFileSync('.reis/cycle-state.json', 'utf8'));
      cycleActive = !!state.currentState && !['IDLE', 'COMPLETE', 'FAILED'].includes(state.currentState);
    } catch {}
    if (!cycleActive) {
      // Non-blocking advisory on stderr
      process.stderr.write(
        `[REIS] Warning: editing ${filePath} outside an active REIS cycle.\n` +
        `[REIS] Prefer /reis:plan or /reis:roadmap-edit so changes stay tracked.\n`
      );
    }
  } catch {}
  process.exit(0);
});
