#!/usr/bin/env node
// REIS update-awareness hook (SessionStart).
// Compares installed REIS version against npm latest using a 24h cache.
// Never blocks the session: all failures exit 0 silently.
const fs = require('fs');
const path = require('path');
const os = require('os');

function main() {
  try {
    // locate installed marker relative to this script: <reisDir>/hooks/../.reis-version
    const reisDir = path.resolve(__dirname, '..');
    const marker = path.join(reisDir, '.reis-version');
    const installed = fs.readFileSync(marker, 'utf8').trim();
    if (!installed) return;

    const cacheFile = path.join(reisDir, '.update-cache.json');
    const TTL = 24 * 60 * 60 * 1000;
    let latest = null;
    if (fs.existsSync(cacheFile)) {
      try {
        const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
        if (Date.now() - cache.fetchedAt < TTL && cache.latest) {
          latest = cache.latest;
        }
      } catch {}
    }

    if (!latest) {
      // refresh cache in background; stay silent this session
      const child = require('child_process').spawn(
        process.execPath,
        ['-e', `require('child_process').execSync('npm view @gravirei/reis version',{stdio:['ignore','pipe','ignore']}).toString().trim()`],
        { detached: true, stdio: 'ignore', timeout: 15000 }
      );
      // write cache via a detached helper is overkill; do it inline best-effort
      child.on('exit', () => {});
      try {
        child.unref();
        const { execSync } = require('child_process');
        setTimeout(() => {
          try {
            const v = execSync('npm view @gravirei/reis version', {
              timeout: 10000,
              stdio: ['ignore', 'pipe', 'ignore']
            }).toString().trim();
            fs.writeFileSync(cacheFile, JSON.stringify({ fetchedAt: Date.now(), latest: v }));
          } catch {}
        }, 0);
      } catch {}
      return;
    }

    if (latest !== installed) {
      process.stderr.write(
        `[REIS] Update available: ${installed} -> ${latest}. Run: npm install -g @gravirei/reis && reis update\n`
      );
    }
  } catch {}
  process.exit(0);
}
main();
