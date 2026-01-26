/**
 * Quality Gate - Code quality checks for quality gates
 * @module lib/utils/gates/quality-gate
 */

const { BaseGate, GateResult } = require('../gate-runner');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

/**
 * Quality Gate - runs code quality checks
 */
class QualityGate extends BaseGate {
  /**
   * Create a quality gate
   * @param {Object} config - Gate configuration
   */
  constructor(config = {}) {
    super('quality', 'quality', config);
    this.checks = [
      { name: 'coverage', method: 'checkCoverage' },
      { name: 'lint', method: 'checkLint' },
      { name: 'complexity', method: 'checkComplexity' },
      { name: 'documentation', method: 'checkDocumentation' }
    ];
  }

  /**
   * Run all quality checks
   * @returns {Promise<GateResult>}
   */
  async run() {
    const result = new GateResult(this.name, this.category);
    const details = [];
    let hasFailure = false;
    let hasWarning = false;

    for (const check of this.checks) {
      const checkConfig = this.config[check.name];
      if (checkConfig?.enabled === false) {
        details.push({
          name: check.name,
          status: 'skipped',
          message: 'Disabled in configuration'
        });
        continue;
      }

      try {
        const checkResult = await this[check.method]();
        details.push(checkResult);
        if (checkResult.status === 'failed') hasFailure = true;
        if (checkResult.status === 'warning') hasWarning = true;
      } catch (err) {
        details.push({
          name: check.name,
          status: 'error',
          message: `Check failed: ${err.message}`
        });
        hasFailure = true;
      }
    }

    if (hasFailure) {
      result.fail('Quality checks failed', details);
    } else if (hasWarning) {
      result.warn('Quality checks passed with warnings', details);
    } else {
      result.pass('All quality checks passed', details);
    }

    return result;
  }

  /**
   * Check test coverage
   * @returns {Promise<Object>}
   */
  async checkCoverage() {
    const config = this.config.coverage || {};
    const minimum = config.minimum || 80;
    const failOn = config.failOn || 60;

    // Look for coverage report files
    const coveragePaths = [
      'coverage/coverage-summary.json',
      'coverage/lcov-report/index.html',
      'coverage/coverage-final.json',
      '.nyc_output/coverage-summary.json'
    ];

    let coverageData = null;
    let coveragePath = null;

    for (const cp of coveragePaths) {
      const fullPath = path.join(process.cwd(), cp);
      if (fs.existsSync(fullPath)) {
        coveragePath = fullPath;
        if (cp.endsWith('.json')) {
          try {
            coverageData = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
            break;
          } catch (e) {}
        }
      }
    }

    // If no coverage report found, try running coverage command
    if (!coverageData) {
      // Check if test script exists
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          const hasTestCoverage = pkg.scripts && 
            (pkg.scripts['test:coverage'] || pkg.scripts.coverage);
          
          if (!hasTestCoverage) {
            return {
              name: 'Code Coverage',
              status: 'skipped',
              message: 'No coverage report found and no coverage script configured',
              details: []
            };
          }
        } catch (e) {}
      }

      return {
        name: 'Code Coverage',
        status: 'skipped',
        message: 'No coverage report found. Run tests with coverage first.',
        details: [{ hint: 'Run: npm test -- --coverage or npm run test:coverage' }]
      };
    }

    // Parse coverage data
    let totalCoverage = 0;
    let coverageDetails = [];

    if (coverageData.total) {
      // Istanbul/NYC format
      const total = coverageData.total;
      const lines = total.lines?.pct || 0;
      const statements = total.statements?.pct || 0;
      const functions = total.functions?.pct || 0;
      const branches = total.branches?.pct || 0;
      
      totalCoverage = Math.round((lines + statements + functions + branches) / 4);
      coverageDetails = [
        { metric: 'Lines', coverage: `${lines.toFixed(1)}%` },
        { metric: 'Statements', coverage: `${statements.toFixed(1)}%` },
        { metric: 'Functions', coverage: `${functions.toFixed(1)}%` },
        { metric: 'Branches', coverage: `${branches.toFixed(1)}%` }
      ];
    } else {
      // Try to extract overall percentage
      totalCoverage = 0;
    }

    let status = 'passed';
    let message = `Coverage: ${totalCoverage}% (minimum: ${minimum}%)`;

    if (totalCoverage < failOn) {
      status = 'failed';
      message = `Coverage ${totalCoverage}% is below minimum ${failOn}%`;
    } else if (totalCoverage < minimum) {
      status = 'warning';
      message = `Coverage ${totalCoverage}% is below target ${minimum}%`;
    }

    return {
      name: 'Code Coverage',
      status,
      message,
      details: coverageDetails
    };
  }

  /**
   * Check for lint errors
   * @returns {Promise<Object>}
   */
  async checkLint() {
    const config = this.config.lint || {};
    const failOnError = config.failOnError !== false;
    const failOnWarning = config.failOnWarning || false;

    // Check if eslint is available
    const eslintConfigFiles = [
      '.eslintrc.js', '.eslintrc.json', '.eslintrc.yml', '.eslintrc.yaml',
      '.eslintrc', 'eslint.config.js', 'eslint.config.mjs'
    ];

    const hasEslintConfig = eslintConfigFiles.some(f => 
      fs.existsSync(path.join(process.cwd(), f))
    );

    // Also check package.json for eslintConfig
    let hasEslintInPackage = false;
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        hasEslintInPackage = !!pkg.eslintConfig;
      } catch (e) {}
    }

    if (!hasEslintConfig && !hasEslintInPackage) {
      return {
        name: 'Lint Errors',
        status: 'skipped',
        message: 'No ESLint configuration found',
        details: []
      };
    }

    try {
      // Try running eslint
      const eslintCmd = fs.existsSync(path.join(process.cwd(), 'node_modules/.bin/eslint'))
        ? 'npx eslint'
        : 'eslint';

      let output;
      try {
        output = execSync(`${eslintCmd} . --format json --max-warnings -1 2>/dev/null`, {
          encoding: 'utf8',
          maxBuffer: 10 * 1024 * 1024,
          cwd: process.cwd()
        });
      } catch (execError) {
        output = execError.stdout || '[]';
      }

      let results;
      try {
        results = JSON.parse(output);
      } catch (e) {
        return {
          name: 'Lint Errors',
          status: 'warning',
          message: 'Could not parse ESLint output',
          details: []
        };
      }

      // Count errors and warnings
      let errorCount = 0;
      let warningCount = 0;
      const fileIssues = [];

      for (const file of results) {
        errorCount += file.errorCount || 0;
        warningCount += file.warningCount || 0;
        
        if (file.errorCount > 0 || file.warningCount > 0) {
          fileIssues.push({
            file: path.relative(process.cwd(), file.filePath),
            errors: file.errorCount,
            warnings: file.warningCount
          });
        }
      }

      let status = 'passed';
      let message = `No lint errors`;

      if (errorCount > 0 && failOnError) {
        status = 'failed';
        message = `Found ${errorCount} errors, ${warningCount} warnings`;
      } else if (warningCount > 0 && failOnWarning) {
        status = 'failed';
        message = `Found ${warningCount} warnings (failOnWarning enabled)`;
      } else if (errorCount > 0 || warningCount > 0) {
        status = 'warning';
        message = `${errorCount} errors, ${warningCount} warnings`;
      }

      return {
        name: 'Lint Errors',
        status,
        message,
        details: fileIssues.slice(0, 5)
      };
    } catch (error) {
      return {
        name: 'Lint Errors',
        status: 'skipped',
        message: `ESLint not available: ${error.message}`,
        details: []
      };
    }
  }

  /**
   * Check code complexity
   * @returns {Promise<Object>}
   */
  async checkComplexity() {
    const config = this.config.complexity || {};
    const maxCyclomatic = config.maxCyclomaticComplexity || 10;
    const maxCognitive = config.maxCognitiveComplexity || 15;

    // Simple complexity check by analyzing function sizes
    const issues = [];
    const codeExtensions = ['.js', '.ts', '.jsx', '.tsx'];
    const ignoreDirs = ['node_modules', '.git', 'dist', 'build', 'coverage', '.next'];

    const analyzeFile = (filePath) => {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const relativePath = path.relative(process.cwd(), filePath);

        // Simple heuristic: count nested blocks and function length
        const lines = content.split('\n');
        let inFunction = false;
        let functionName = '';
        let functionStart = 0;
        let braceDepth = 0;
        let maxDepth = 0;
        let functionLines = 0;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          
          // Detect function start
          const funcMatch = line.match(/(?:function\s+(\w+)|(\w+)\s*[=:]\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>|\w+\s*=>))/);
          if (funcMatch && !inFunction) {
            inFunction = true;
            functionName = funcMatch[1] || funcMatch[2] || 'anonymous';
            functionStart = i + 1;
            braceDepth = 0;
            maxDepth = 0;
            functionLines = 0;
          }

          if (inFunction) {
            functionLines++;
            
            // Count braces for nesting depth
            for (const char of line) {
              if (char === '{') {
                braceDepth++;
                maxDepth = Math.max(maxDepth, braceDepth);
              } else if (char === '}') {
                braceDepth--;
                if (braceDepth <= 0) {
                  // Function ended
                  // Check complexity (nesting depth as proxy for cyclomatic)
                  if (maxDepth > maxCyclomatic || functionLines > 50) {
                    issues.push({
                      file: relativePath,
                      function: functionName,
                      line: functionStart,
                      depth: maxDepth,
                      lines: functionLines,
                      issue: maxDepth > maxCyclomatic 
                        ? `Nesting depth ${maxDepth} exceeds ${maxCyclomatic}`
                        : `Function has ${functionLines} lines (consider splitting)`
                    });
                  }
                  inFunction = false;
                }
              }
            }
          }
        }
      } catch (e) {
        // Skip files that can't be analyzed
      }
    };

    const scanDir = (dir) => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory() && !ignoreDirs.includes(entry.name)) {
            scanDir(fullPath);
          } else if (entry.isFile() && codeExtensions.some(ext => entry.name.endsWith(ext))) {
            analyzeFile(fullPath);
          }
        }
      } catch (e) {}
    };

    scanDir(process.cwd());

    let status = 'passed';
    let message = 'Code complexity within limits';

    if (issues.length > 10) {
      status = 'failed';
      message = `${issues.length} functions exceed complexity limits`;
    } else if (issues.length > 0) {
      status = 'warning';
      message = `${issues.length} functions may need refactoring`;
    }

    return {
      name: 'Code Complexity',
      status,
      message,
      details: issues.slice(0, 5)
    };
  }

  /**
   * Check documentation coverage
   * @returns {Promise<Object>}
   */
  async checkDocumentation() {
    const config = this.config.documentation || {};
    const minimumCoverage = config.minimumCoverage || 50;

    // Check for JSDoc comments in source files
    const codeExtensions = ['.js', '.ts', '.jsx', '.tsx'];
    const ignoreDirs = ['node_modules', '.git', 'dist', 'build', 'coverage', '.next', 'test', '__tests__'];

    let totalFunctions = 0;
    let documentedFunctions = 0;
    const undocumented = [];

    const analyzeFile = (filePath) => {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const relativePath = path.relative(process.cwd(), filePath);
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          
          // Detect exported functions/classes
          const exportMatch = line.match(/export\s+(?:default\s+)?(?:async\s+)?(?:function|class|const|let)\s+(\w+)/);
          const funcMatch = line.match(/^\s*(?:async\s+)?(?:function\s+(\w+)|(\w+)\s*\([^)]*\)\s*{)/);
          
          if (exportMatch || funcMatch) {
            totalFunctions++;
            const funcName = exportMatch?.[1] || funcMatch?.[1] || funcMatch?.[2];
            
            // Check for JSDoc comment above
            let hasJsDoc = false;
            for (let j = i - 1; j >= Math.max(0, i - 10); j--) {
              const prevLine = lines[j].trim();
              if (prevLine === '*/') {
                hasJsDoc = true;
                break;
              }
              if (prevLine && !prevLine.startsWith('*') && !prevLine.startsWith('//')) {
                break;
              }
            }

            if (hasJsDoc) {
              documentedFunctions++;
            } else if (funcName && !funcName.startsWith('_')) {
              undocumented.push({
                file: relativePath,
                function: funcName,
                line: i + 1
              });
            }
          }
        }
      } catch (e) {}
    };

    const scanDir = (dir) => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory() && !ignoreDirs.includes(entry.name)) {
            scanDir(fullPath);
          } else if (entry.isFile() && codeExtensions.some(ext => entry.name.endsWith(ext))) {
            analyzeFile(fullPath);
          }
        }
      } catch (e) {}
    };

    scanDir(process.cwd());

    if (totalFunctions === 0) {
      return {
        name: 'Documentation',
        status: 'skipped',
        message: 'No functions found to check',
        details: []
      };
    }

    const coverage = Math.round((documentedFunctions / totalFunctions) * 100);
    
    let status = 'passed';
    let message = `Documentation coverage: ${coverage}%`;

    if (coverage < minimumCoverage) {
      status = 'warning';
      message = `Documentation coverage ${coverage}% below target ${minimumCoverage}%`;
    }

    return {
      name: 'Documentation',
      status,
      message,
      details: undocumented.slice(0, 5)
    };
  }
}

module.exports = { QualityGate };
