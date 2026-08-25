const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { getVersion } = require('../utils/command-helpers');

module.exports = function version() {
  const ver = getVersion();
  
  console.log(chalk.bold.cyan(`\nREIS v${ver}`));
  console.log(chalk.gray('Roadmap Execution & Implementation System\n'));
  
  const homeDir = os.homedir();
  const rovodevDir = path.join(homeDir, '.rovodev', 'reis');
  const geminiDir = path.join(homeDir, '.gemini', 'reis');
  
  const locations = [];
  if (fs.existsSync(rovodevDir)) locations.push('~/.rovodev/reis/');
  if (fs.existsSync(geminiDir)) locations.push('~/.gemini/reis/');
  
  if (locations.length > 0) {
    console.log(chalk.white('Install locations: ') + chalk.cyan(locations.join(', ')));
  } else {
    console.log(chalk.white('Install location: ') + chalk.yellow('Not installed globally'));
  }
  
  console.log(chalk.white('Package location: ') + chalk.cyan('node_modules/reis/\n'));
  
  return 0;
};
