const path = require('path');
const fs = require('fs');

/**
 * Path Sanitization Utility
 * Prevents path traversal attacks by ensuring all file operations
 * stay within the project boundary.
 */

/**
 * Sanitize and validate a user-provided path
 * @param {string} userPath - The path provided by user
 * @param {string} [baseDir] - Base directory to resolve against (default: cwd)
 * @returns {string} The resolved, sanitized absolute path
 * @throws {Error} If path traversal is detected
 */
function sanitizePath(userPath, baseDir = process.cwd()) {
  if (!userPath || typeof userPath !== 'string') {
    throw new Error('Invalid path: path must be a non-empty string');
  }

  // Normalize and resolve the path
  const normalizedBase = path.resolve(baseDir);
  const resolvedPath = path.resolve(normalizedBase, userPath);
  
  // Check for path traversal
  if (!resolvedPath.startsWith(normalizedBase + path.sep) && resolvedPath !== normalizedBase) {
    throw new Error(`Path traversal detected: "${userPath}" resolves outside project boundary`);
  }
  
  return resolvedPath;
}

/**
 * Sanitize path and verify it exists
 * @param {string} userPath - The path provided by user
 * @param {string} [baseDir] - Base directory to resolve against
 * @returns {string} The resolved, sanitized absolute path
 * @throws {Error} If path traversal is detected or file doesn't exist
 */
function sanitizeExistingPath(userPath, baseDir = process.cwd()) {
  const sanitized = sanitizePath(userPath, baseDir);
  
  if (!fs.existsSync(sanitized)) {
    throw new Error(`Path not found: "${userPath}"`);
  }
  
  return sanitized;
}

/**
 * Sanitize path for a file (verify it's not a directory)
 * @param {string} userPath - The path provided by user
 * @param {string} [baseDir] - Base directory to resolve against
 * @returns {string} The resolved, sanitized absolute path
 * @throws {Error} If path traversal is detected, doesn't exist, or is a directory
 */
function sanitizeFilePath(userPath, baseDir = process.cwd()) {
  const sanitized = sanitizeExistingPath(userPath, baseDir);
  
  const stats = fs.statSync(sanitized);
  if (stats.isDirectory()) {
    throw new Error(`Expected file but got directory: "${userPath}"`);
  }
  
  return sanitized;
}

/**
 * Sanitize path for a directory (verify it's not a file)
 * @param {string} userPath - The path provided by user
 * @param {string} [baseDir] - Base directory to resolve against
 * @returns {string} The resolved, sanitized absolute path
 * @throws {Error} If path traversal is detected, doesn't exist, or is a file
 */
function sanitizeDirPath(userPath, baseDir = process.cwd()) {
  const sanitized = sanitizeExistingPath(userPath, baseDir);
  
  const stats = fs.statSync(sanitized);
  if (!stats.isDirectory()) {
    throw new Error(`Expected directory but got file: "${userPath}"`);
  }
  
  return sanitized;
}

/**
 * Sanitize path for creating a new file (parent directory must exist)
 * @param {string} userPath - The path provided by user
 * @param {string} [baseDir] - Base directory to resolve against
 * @returns {string} The resolved, sanitized absolute path
 * @throws {Error} If path traversal is detected or parent directory doesn't exist
 */
function sanitizeNewFilePath(userPath, baseDir = process.cwd()) {
  const sanitized = sanitizePath(userPath, baseDir);
  const parentDir = path.dirname(sanitized);
  
  if (!fs.existsSync(parentDir)) {
    throw new Error(`Parent directory not found for: "${userPath}"`);
  }
  
  return sanitized;
}

/**
 * Check if a path is within the allowed boundary (without throwing)
 * @param {string} userPath - The path to check
 * @param {string} [baseDir] - Base directory
 * @returns {boolean} True if path is safe, false otherwise
 */
function isPathSafe(userPath, baseDir = process.cwd()) {
  try {
    sanitizePath(userPath, baseDir);
    return true;
  } catch {
    return false;
  }
}

/**
 * Join paths safely, ensuring result stays within boundary
 * @param {string} baseDir - Base directory
 * @param {...string} paths - Path segments to join
 * @returns {string} The resolved, sanitized path
 * @throws {Error} If resulting path escapes boundary
 */
function safeJoin(baseDir, ...paths) {
  const joined = path.join(...paths);
  return sanitizePath(joined, baseDir);
}

module.exports = {
  sanitizePath,
  sanitizeExistingPath,
  sanitizeFilePath,
  sanitizeDirPath,
  sanitizeNewFilePath,
  isPathSafe,
  safeJoin
};
