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
 * Display a warning message
 * @param {string} message - The warning message
 */
function showWarning(message) {
  console.log(chalk.yellow(`⚠ ${message}`));
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

/**
 * Validate a phase number
 * @param {string} phase - The phase number to validate
 * @returns {number|null} - The validated phase number or null if invalid
 */
function validatePhaseNumber(phase) {
  const num = parseInt(phase, 10);
  if (isNaN(num)) {
    showError('Phase number must be a valid number');
    return null;
  }
  if (num < 1) {
    showError('Phase number must be greater than 0');
    return null;
  }
  return num;
}

module.exports = {
  showPrompt,
  showError,
  showSuccess,
  showInfo,
  showWarning,
  getVersion,
  checkPlanningDir,
  validatePhaseNumber
};
