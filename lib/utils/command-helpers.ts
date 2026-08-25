import chalk from 'chalk';
import path from 'path';
import fs from 'fs';

/**
 * Display a prompt message for Rovo Dev
 * @param {string} message - The prompt message
 * @returns {string} - The message (for programmatic use)
 */
export function showPrompt(message: string): string {
  console.log(message);
  return message;
}

/**
 * Display an error message
 * @param {string} error - The error message
 */
export function showError(error: string): void {
  console.log(chalk.red(`✗ Error: ${error}`));
}

/**
 * Display a success message
 * @param {string} message - The success message
 */
export function showSuccess(message: string): void {
  console.log(chalk.green(`✓ ${message}`));
}

/**
 * Display an info message
 * @param {string} message - The info message
 */
export function showInfo(message: string): void {
  console.log(chalk.cyan(message));
}

/**
 * Display a warning message
 * @param {string} message - The warning message
 */
export function showWarning(message: string): void {
  console.log(chalk.yellow(`⚠ ${message}`));
}

/**
 * Get the package version
 * @returns {string} - The version string
 */
export function getVersion(): string {
  const packageJson = require('../../package.json');
  return packageJson.version;
}

/**
 * Check if .planning/ directory exists
 * @returns {boolean} - True if directory exists
 */
export function checkPlanningDir(): boolean {
  const planningDir = path.join(process.cwd(), '.planning');
  return fs.existsSync(planningDir);
}

/**
 * Validate a phase number
 * @param {string} phase - The phase number to validate
 * @returns {number|null} - The validated phase number or null if invalid
 */
export function validatePhaseNumber(phase: string): number | null {
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
