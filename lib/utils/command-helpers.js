const chalk = require('chalk');
const path = require('path');
const fs = require('fs');

/**
 * Display a prompt message for Rovo Dev
 * @param {string} message - The prompt message
 * @returns {string} - The message (for programmatic use)
 */
function showPrompt(message) {
  console.log(message);
  return message;
}

/**
 * Display an error message
 * @param {string} error - The error message
 */
function showError(error) {
  console.log(chalk.red(`✗ Error: ${error}`));
}

/**
 * Display a success message
 * @param {string} message - The success message
 */
function showSuccess(message) {
  console.log(chalk.green(`✓ ${message}`));
}

/**
 * Display an info message
 * @param {string} message - The info message
 */
function showInfo(message) {
  console.log(chalk.cyan(message));
}

/**
 * Get the package version
 * @returns {string} - The version string
 */
function getVersion() {
  const packageJson = require('../../package.json');
  return packageJson.version;
}

/**
 * Check if .planning/ directory exists
 * @returns {boolean} - True if directory exists
 */
function checkPlanningDir() {
  const planningDir = path.join(process.cwd(), '.planning');
  return fs.existsSync(planningDir);
}

module.exports = {
  showPrompt,
  showError,
  showSuccess,
  showInfo,
  getVersion,
  checkPlanningDir
};
