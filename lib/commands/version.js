const chalk = require('chalk');
const { getVersion } = require('../utils/command-helpers');

module.exports = function version() {
  const ver = getVersion();
  
  console.log(chalk.bold.cyan(`\nREIS v${ver}`));
  console.log(chalk.gray('Roadmap Execution & Implementation System\n'));
  console.log(chalk.white('Install location: ') + chalk.cyan('~/.rovodev/reis/'));
  console.log(chalk.white('Package location: ') + chalk.cyan('node_modules/reis/\n'));
  
  return 0;
};
