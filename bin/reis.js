#!/usr/bin/env node

const { program } = require('commander');
const packageJson = require('../package.json');

// Set version from package.json
program.version(packageJson.version, '-V, --version', 'output the current version');

// Commands will be added in Phase 5-8
// For now, show a simple placeholder message

program.action(() => {
  console.log(`REIS v${packageJson.version} - Commands coming soon. Run 'reis help' for more info.`);
});

// Parse command-line arguments
program.parse(process.argv);

// If no arguments provided, show the default message
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
