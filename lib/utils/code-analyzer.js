/**
 * REIS v2.0 Code Analyzer
 * Provides codebase analysis utilities for file/directory existence,
 * function/export detection, and dependency/import analysis.
 */

const fs = require('fs');
const path = require('path');

/**
 * CodeAnalyzer class for codebase analysis utilities
 */
class CodeAnalyzer {
  /**
   * Create a new CodeAnalyzer instance
   * @param {string} [baseDir=process.cwd()] - Base directory for relative paths
   */
  constructor(baseDir = process.cwd()) {
    this.baseDir = baseDir;
    this._packageJsonCache = null;
  }

  // ============================================
  // File/Directory Existence Methods
  // ============================================

  /**
   * Check if a file exists
   * @param {string} filePath - Path to the file (relative or absolute)
   * @returns {boolean} True if file exists
   */
  fileExists(filePath) {
    const resolved = this._resolvePath(filePath);
    try {
      const stat = fs.statSync(resolved);
      return stat.isFile();
    } catch {
      return false;
    }
  }

  /**
   * Check if a directory exists
   * @param {string} dirPath - Path to the directory (relative or absolute)
   * @returns {boolean} True if directory exists
   */
  directoryExists(dirPath) {
    const resolved = this._resolvePath(dirPath);
    try {
      const stat = fs.statSync(resolved);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Resolve a file path to absolute, returning null if not found
   * @param {string} filePath - Path to resolve
   * @returns {string|null} Absolute path or null if not found
   */
  resolveFilePath(filePath) {
    const resolved = this._resolvePath(filePath);
    return this.fileExists(filePath) ? resolved : null;
  }

  /**
   * Find files matching a simple glob pattern
   * Supports: *.js, **\/*.js, src/*.js, src/**\/*.js
   * @param {string} pattern - Glob pattern to match
   * @returns {string[]} Array of matching file paths (relative to baseDir)
   */
  findFiles(pattern) {
    const results = [];
    const isRecursive = pattern.includes('**');
    
    // Parse the pattern
    let baseSearchDir = this.baseDir;
    let filePattern = pattern;
    
    // Handle patterns like "src/*.js" or "src/**/*.js"
    const lastSlash = pattern.lastIndexOf('/');
    if (lastSlash !== -1) {
      const dirPart = pattern.substring(0, lastSlash).replace('**/', '').replace('**', '');
      if (dirPart && !dirPart.includes('*')) {
        baseSearchDir = path.join(this.baseDir, dirPart);
      }
      filePattern = pattern.substring(lastSlash + 1);
    }
    
    // Convert file pattern to regex
    const regexPattern = this._globToRegex(filePattern);
    
    // Search for files
    this._searchFiles(baseSearchDir, regexPattern, isRecursive, results, this.baseDir);
    
    return results;
  }

  /**
   * Check which files exist and which are missing
   * @param {string[]} filePaths - Array of file paths to check
   * @returns {{found: string[], missing: string[]}} Object with found and missing arrays
   */
  checkFilesExist(filePaths) {
    const found = [];
    const missing = [];
    
    for (const filePath of filePaths) {
      if (this.fileExists(filePath)) {
        found.push(filePath);
      } else {
        missing.push(filePath);
      }
    }
    
    return { found, missing };
  }

  /**
   * Check which directories exist and which are missing
   * @param {string[]} dirPaths - Array of directory paths to check
   * @returns {{found: string[], missing: string[]}} Object with found and missing arrays
   */
  checkDirectoriesExist(dirPaths) {
    const found = [];
    const missing = [];
    
    for (const dirPath of dirPaths) {
      if (this.directoryExists(dirPath)) {
        found.push(dirPath);
      } else {
        missing.push(dirPath);
      }
    }
    
    return { found, missing };
  }

  // ============================================
  // Function/Export Detection Methods
  // ============================================

  /**
   * Check if a function exists in a file
   * @param {string} filePath - Path to the file
   * @param {string} functionName - Name of the function to find
   * @returns {boolean} True if function exists
   */
  functionExists(filePath, functionName) {
    const functions = this.getFunctions(filePath);
    return functions.includes(functionName);
  }

  /**
   * Get all function names from a file
   * @param {string} filePath - Path to the file
   * @returns {string[]} Array of function names
   */
  getFunctions(filePath) {
    const content = this._readFile(filePath);
    if (!content) return [];
    
    // Remove comments to avoid false positives
    const cleanContent = this._removeComments(content);
    const functions = new Set();
    let match;
    
    // Match function declarations: function name(
    const funcDeclRegex = /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
    while ((match = funcDeclRegex.exec(cleanContent)) !== null) {
      functions.add(match[1]);
    }
    
    // Match arrow functions and method definitions: name = ( or name: function or name(
    const arrowFuncRegex = /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s*)?\(/g;
    while ((match = arrowFuncRegex.exec(cleanContent)) !== null) {
      functions.add(match[1]);
    }
    
    // Match arrow functions with arrow: name = (...) =>
    const arrowFuncRegex2 = /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s*)?[^=]*=>/g;
    while ((match = arrowFuncRegex2.exec(cleanContent)) !== null) {
      functions.add(match[1]);
    }
    
    // Match class methods: methodName( or async methodName(
    const methodRegex = /^\s*(?:async\s+)?([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*\{/gm;
    while ((match = methodRegex.exec(cleanContent)) !== null) {
      // Exclude control flow keywords
      if (!['if', 'while', 'for', 'switch', 'catch', 'with'].includes(match[1])) {
        functions.add(match[1]);
      }
    }
    
    return Array.from(functions);
  }

  /**
   * Check if an export exists in a file
   * @param {string} filePath - Path to the file
   * @param {string} exportName - Name of the export to find
   * @returns {boolean} True if export exists
   */
  exportExists(filePath, exportName) {
    const exports = this.getExports(filePath);
    return exports.includes(exportName);
  }

  /**
   * Get all export names from a file
   * @param {string} filePath - Path to the file
   * @returns {string[]} Array of export names
   */
  getExports(filePath) {
    const content = this._readFile(filePath);
    if (!content) return [];
    
    // Remove comments to avoid false positives
    const cleanContent = this._removeComments(content);
    const exports = new Set();
    let match;
    
    // Match: module.exports = { name1, name2 }
    const moduleExportsObjRegex = /module\.exports\s*=\s*\{([^}]+)\}/g;
    while ((match = moduleExportsObjRegex.exec(cleanContent)) !== null) {
      const names = match[1].split(',').map(n => n.trim().split(':')[0].trim());
      names.forEach(n => {
        if (n && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(n)) {
          exports.add(n);
        }
      });
    }
    
    // Match: module.exports.name = or exports.name =
    const namedExportRegex = /(?:module\.)?exports\.([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g;
    while ((match = namedExportRegex.exec(cleanContent)) !== null) {
      exports.add(match[1]);
    }
    
    // Match: module.exports = ClassName (single export)
    const singleExportRegex = /module\.exports\s*=\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*;?$/gm;
    while ((match = singleExportRegex.exec(cleanContent)) !== null) {
      if (!match[1].startsWith('{') && !match[1].startsWith('function')) {
        exports.add(match[1]);
      }
    }
    
    // Match ES6: export { name1, name2 }
    const es6ExportObjRegex = /export\s*\{([^}]+)\}/g;
    while ((match = es6ExportObjRegex.exec(cleanContent)) !== null) {
      const names = match[1].split(',').map(n => {
        const parts = n.trim().split(/\s+as\s+/);
        return parts[parts.length - 1].trim();
      });
      names.forEach(n => {
        if (n && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(n)) {
          exports.add(n);
        }
      });
    }
    
    // Match ES6: export const/let/var/function/class name
    const es6NamedExportRegex = /export\s+(?:const|let|var|function|class)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
    while ((match = es6NamedExportRegex.exec(cleanContent)) !== null) {
      exports.add(match[1]);
    }
    
    // Match ES6: export default name
    const es6DefaultRegex = /export\s+default\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
    while ((match = es6DefaultRegex.exec(cleanContent)) !== null) {
      exports.add('default');
      if (!['function', 'class', 'new'].includes(match[1])) {
        exports.add(match[1]);
      }
    }
    
    return Array.from(exports);
  }

  /**
   * Check if a function signature matches expected parameters
   * @param {string} filePath - Path to the file
   * @param {string} functionName - Name of the function
   * @param {string[]} expectedParams - Expected parameter names
   * @returns {{exists: boolean, params: string[], matches: boolean}} Signature check result
   */
  checkFunctionSignature(filePath, functionName, expectedParams) {
    const content = this._readFile(filePath);
    if (!content) {
      return { exists: false, params: [], matches: false };
    }
    
    // Try to find the function and extract its parameters
    const patterns = [
      // function name(params)
      new RegExp(`function\\s+${functionName}\\s*\\(([^)]*)\\)`, 'm'),
      // const name = (params) =>
      new RegExp(`(?:const|let|var)\\s+${functionName}\\s*=\\s*(?:async\\s*)?\\(([^)]*)\\)\\s*=>`, 'm'),
      // const name = function(params)
      new RegExp(`(?:const|let|var)\\s+${functionName}\\s*=\\s*(?:async\\s*)?function\\s*\\(([^)]*)\\)`, 'm'),
      // class method: name(params) {
      new RegExp(`^\\s*(?:async\\s+)?${functionName}\\s*\\(([^)]*)\\)\\s*\\{`, 'm')
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        const paramsStr = match[1].trim();
        const params = paramsStr
          ? paramsStr.split(',').map(p => {
              // Extract just the parameter name (handle defaults, destructuring, rest)
              const cleaned = p.trim()
                .replace(/\s*=.*$/, '')  // Remove defaults
                .replace(/^\.\.\./, '')  // Remove rest operator
                .replace(/^\{.*\}$/, 'destructured')  // Handle destructuring
                .replace(/^\[.*\]$/, 'destructured');  // Handle array destructuring
              return cleaned.trim();
            }).filter(p => p)
          : [];
        
        const matches = expectedParams.length === params.length &&
          expectedParams.every((p, i) => p === params[i]);
        
        return { exists: true, params, matches };
      }
    }
    
    return { exists: false, params: [], matches: false };
  }

  // ============================================
  // Dependency/Import Analysis Methods
  // ============================================

  /**
   * Get all imports from a file
   * @param {string} filePath - Path to the file
   * @returns {Array<{module: string, isLocal: boolean, resolvedPath: string|null}>} Array of import info
   */
  getImports(filePath) {
    const content = this._readFile(filePath);
    if (!content) return [];
    
    // Remove comments to avoid false positives
    const cleanContent = this._removeComments(content);
    const imports = [];
    const seen = new Set();
    let match;
    
    // Match CommonJS: require('module') or require("module")
    const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = requireRegex.exec(cleanContent)) !== null) {
      const moduleName = match[1];
      if (!seen.has(moduleName)) {
        seen.add(moduleName);
        const isLocal = moduleName.startsWith('.') || moduleName.startsWith('/');
        imports.push({
          module: moduleName,
          isLocal,
          resolvedPath: isLocal ? this.resolveImport(moduleName, filePath) : null
        });
      }
    }
    
    // Match ES6: import ... from 'module'
    const importRegex = /import\s+(?:[^'"]+\s+from\s+)?['"]([^'"]+)['"]/g;
    while ((match = importRegex.exec(cleanContent)) !== null) {
      const moduleName = match[1];
      if (!seen.has(moduleName)) {
        seen.add(moduleName);
        const isLocal = moduleName.startsWith('.') || moduleName.startsWith('/');
        imports.push({
          module: moduleName,
          isLocal,
          resolvedPath: isLocal ? this.resolveImport(moduleName, filePath) : null
        });
      }
    }
    
    // Match dynamic imports: import('module')
    const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = dynamicImportRegex.exec(cleanContent)) !== null) {
      const moduleName = match[1];
      if (!seen.has(moduleName)) {
        seen.add(moduleName);
        const isLocal = moduleName.startsWith('.') || moduleName.startsWith('/');
        imports.push({
          module: moduleName,
          isLocal,
          resolvedPath: isLocal ? this.resolveImport(moduleName, filePath) : null
        });
      }
    }
    
    return imports;
  }

  /**
   * Check if an npm dependency exists in package.json
   * @param {string} packageName - Name of the package
   * @returns {{exists: boolean, version: string|null, isDev: boolean}} Dependency info
   */
  checkNpmDependency(packageName) {
    const pkg = this._getPackageJson();
    if (!pkg) {
      return { exists: false, version: null, isDev: false };
    }
    
    // Check dependencies
    if (pkg.dependencies && pkg.dependencies[packageName]) {
      return {
        exists: true,
        version: pkg.dependencies[packageName],
        isDev: false
      };
    }
    
    // Check devDependencies
    if (pkg.devDependencies && pkg.devDependencies[packageName]) {
      return {
        exists: true,
        version: pkg.devDependencies[packageName],
        isDev: true
      };
    }
    
    // Check peerDependencies
    if (pkg.peerDependencies && pkg.peerDependencies[packageName]) {
      return {
        exists: true,
        version: pkg.peerDependencies[packageName],
        isDev: false
      };
    }
    
    // Check optionalDependencies
    if (pkg.optionalDependencies && pkg.optionalDependencies[packageName]) {
      return {
        exists: true,
        version: pkg.optionalDependencies[packageName],
        isDev: false
      };
    }
    
    return { exists: false, version: null, isDev: false };
  }

  /**
   * Get list of missing dependencies from package.json
   * @param {string[]} packageNames - Array of package names to check
   * @returns {string[]} Array of missing package names
   */
  getMissingDependencies(packageNames) {
    const missing = [];
    
    for (const packageName of packageNames) {
      const result = this.checkNpmDependency(packageName);
      if (!result.exists) {
        missing.push(packageName);
      }
    }
    
    return missing;
  }

  /**
   * Resolve an import path to an absolute file path
   * @param {string} importPath - The import path (e.g., './utils/helper')
   * @param {string} fromFile - The file containing the import
   * @returns {string|null} Absolute path or null if not found
   */
  resolveImport(importPath, fromFile) {
    const fromDir = path.dirname(this._resolvePath(fromFile));
    const basePath = path.resolve(fromDir, importPath);
    
    // Try exact path
    if (this.fileExists(basePath)) {
      return basePath;
    }
    
    // Try with extensions
    const extensions = ['.js', '.mjs', '.cjs', '.json', '.node'];
    for (const ext of extensions) {
      const withExt = basePath + ext;
      if (fs.existsSync(withExt) && fs.statSync(withExt).isFile()) {
        return withExt;
      }
    }
    
    // Try as directory with index file
    if (fs.existsSync(basePath) && fs.statSync(basePath).isDirectory()) {
      for (const ext of extensions) {
        const indexPath = path.join(basePath, 'index' + ext);
        if (fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()) {
          return indexPath;
        }
      }
    }
    
    return null;
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * Remove comments from JavaScript/TypeScript content
   * @private
   * @param {string} content - File content
   * @returns {string} Content with comments removed
   */
  _removeComments(content) {
    // Remove single-line comments (but not URLs like http://)
    let result = content.replace(/(?<!:)\/\/.*$/gm, '');
    // Remove multi-line comments (including JSDoc)
    result = result.replace(/\/\*[\s\S]*?\*\//g, '');
    return result;
  }

  /**
   * Resolve a path relative to baseDir
   * @private
   * @param {string} filePath - Path to resolve
   * @returns {string} Absolute path
   */
  _resolvePath(filePath) {
    if (path.isAbsolute(filePath)) {
      return filePath;
    }
    return path.join(this.baseDir, filePath);
  }

  /**
   * Read file contents safely
   * @private
   * @param {string} filePath - Path to the file
   * @returns {string|null} File contents or null if error
   */
  _readFile(filePath) {
    try {
      const resolved = this._resolvePath(filePath);
      return fs.readFileSync(resolved, 'utf8');
    } catch {
      return null;
    }
  }

  /**
   * Get cached package.json contents
   * @private
   * @returns {object|null} Package.json contents or null
   */
  _getPackageJson() {
    if (this._packageJsonCache === null) {
      try {
        const pkgPath = path.join(this.baseDir, 'package.json');
        const content = fs.readFileSync(pkgPath, 'utf8');
        this._packageJsonCache = JSON.parse(content);
      } catch {
        this._packageJsonCache = false; // Mark as attempted but failed
      }
    }
    return this._packageJsonCache || null;
  }

  /**
   * Convert a simple glob pattern to regex
   * @private
   * @param {string} pattern - Glob pattern (e.g., *.js)
   * @returns {RegExp} Regular expression
   */
  _globToRegex(pattern) {
    const escaped = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    return new RegExp(`^${escaped}$`);
  }

  /**
   * Recursively search for files matching a pattern
   * @private
   * @param {string} dir - Directory to search
   * @param {RegExp} pattern - Pattern to match filenames
   * @param {boolean} recursive - Whether to search subdirectories
   * @param {string[]} results - Array to collect results
   * @param {string} baseDir - Base directory for relative paths
   */
  _searchFiles(dir, pattern, recursive, results, baseDir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isFile() && pattern.test(entry.name)) {
          results.push(path.relative(baseDir, fullPath));
        } else if (entry.isDirectory() && recursive) {
          // Skip node_modules and hidden directories
          if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
            this._searchFiles(fullPath, pattern, recursive, results, baseDir);
          }
        }
      }
    } catch {
      // Directory not accessible, skip
    }
  }
}

module.exports = {
  CodeAnalyzer
};
