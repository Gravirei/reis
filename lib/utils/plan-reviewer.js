/**
 * REIS v2.0 Plan Reviewer
 * Reviews PLAN.md files against the codebase to validate tasks,
 * detect already-complete work, and identify issues before execution.
 */

const fs = require('fs');
const path = require('path');
const { CodeAnalyzer } = require('./code-analyzer');

/**
 * Task status types
 */
const TaskStatus = {
  OK: 'ok',
  ALREADY_COMPLETE: 'already_complete',
  PATH_ERROR: 'path_error',
  MISSING_DEPENDENCY: 'missing_dependency',
  CONFLICT: 'conflict'
};

/**
 * PlanReviewer class for reviewing PLAN.md files against codebase
 */
class PlanReviewer {
  /**
   * Create a new PlanReviewer instance
   * @param {string} [rootPath=process.cwd()] - Root path for the project
   * @param {object} [config={}] - Configuration options
   * @param {boolean} [config.autoFix=false] - Whether to auto-fix simple issues
   * @param {boolean} [config.strict=false] - Whether to use strict validation
   */
  constructor(rootPath = process.cwd(), config = {}) {
    this.rootPath = rootPath;
    this.analyzer = new CodeAnalyzer(rootPath);
    this.config = {
      autoFix: false,
      strict: false,
      ...config
    };
  }

  // ============================================
  // Main Review Methods
  // ============================================

  /**
   * Review a single PLAN.md file
   * @param {string} planPath - Path to the PLAN.md file
   * @returns {Promise<object>} Review results
   */
  async reviewPlan(planPath) {
    const resolvedPath = path.isAbsolute(planPath) 
      ? planPath 
      : path.join(this.rootPath, planPath);

    if (!fs.existsSync(resolvedPath)) {
      return {
        success: false,
        planPath,
        error: `Plan file not found: ${planPath}`,
        tasks: [],
        summary: { total: 0, ok: 0, issues: 0 }
      };
    }

    const content = fs.readFileSync(resolvedPath, 'utf8');
    const parsed = this.parsePlanContent(content);
    const tasks = this.extractTasks(content);
    
    const results = {
      success: true,
      planPath,
      planInfo: parsed,
      tasks: [],
      summary: {
        total: tasks.length,
        ok: 0,
        alreadyComplete: 0,
        pathErrors: 0,
        missingDependencies: 0,
        conflicts: 0
      }
    };

    // Validate each task
    for (const task of tasks) {
      const validation = await this.validateTask(task);
      results.tasks.push({
        ...task,
        validation
      });

      // Update summary counts
      switch (validation.status) {
        case TaskStatus.OK:
          results.summary.ok++;
          break;
        case TaskStatus.ALREADY_COMPLETE:
          results.summary.alreadyComplete++;
          break;
        case TaskStatus.PATH_ERROR:
          results.summary.pathErrors++;
          break;
        case TaskStatus.MISSING_DEPENDENCY:
          results.summary.missingDependencies++;
          break;
        case TaskStatus.CONFLICT:
          results.summary.conflicts++;
          break;
      }
    }

    // Generate report if there are issues
    if (results.summary.ok < results.summary.total) {
      results.report = this.generateReport(results);
      
      // Auto-fix if enabled
      if (this.config.autoFix) {
        const issues = results.tasks
          .filter(t => t.validation.status !== TaskStatus.OK)
          .map(t => ({ task: t, ...t.validation }));
        
        if (issues.length > 0) {
          results.fixes = await this.autoFixPlan(resolvedPath, issues);
        }
      }
    }

    return results;
  }

  /**
   * Review all PLAN.md files in a directory
   * @param {string} planDirectory - Directory containing plan files
   * @returns {Promise<object>} Combined review results
   */
  async reviewAllPlans(planDirectory) {
    const resolvedDir = path.isAbsolute(planDirectory)
      ? planDirectory
      : path.join(this.rootPath, planDirectory);

    if (!fs.existsSync(resolvedDir)) {
      return {
        success: false,
        error: `Directory not found: ${planDirectory}`,
        plans: []
      };
    }

    const planFiles = this._findPlanFiles(resolvedDir);
    const results = {
      success: true,
      directory: planDirectory,
      plans: [],
      summary: {
        totalPlans: planFiles.length,
        totalTasks: 0,
        ok: 0,
        issues: 0
      }
    };

    for (const planFile of planFiles) {
      const planResult = await this.reviewPlan(planFile);
      results.plans.push(planResult);
      
      results.summary.totalTasks += planResult.summary.total;
      results.summary.ok += planResult.summary.ok;
      results.summary.issues += (planResult.summary.total - planResult.summary.ok);
    }

    return results;
  }

  // ============================================
  // Plan Parsing Methods
  // ============================================

  /**
   * Parse PLAN.md content and extract metadata
   * @param {string} content - Plan file content
   * @returns {object} Parsed plan information
   */
  parsePlanContent(content) {
    const info = {
      title: null,
      objective: null,
      phase: null,
      plan: null,
      dependencies: [],
      successCriteria: [],
      verification: []
    };

    // Extract title (first # heading)
    const titleMatch = content.match(/^#\s+(.+)$/m);
    if (titleMatch) {
      info.title = titleMatch[1].trim();
    }

    // Extract objective
    const objectiveMatch = content.match(/##\s*Objective\s*\n+([\s\S]*?)(?=\n##|\n<task|$)/i);
    if (objectiveMatch) {
      info.objective = objectiveMatch[1].trim();
    }

    // Extract phase and plan from title or content
    const phaseMatch = content.match(/Phase\s*(\d+)/i);
    if (phaseMatch) {
      info.phase = parseInt(phaseMatch[1], 10);
    }

    const planMatch = content.match(/Plan\s*(\d+[-.]?\d*)/i);
    if (planMatch) {
      info.plan = planMatch[1];
    }

    // Extract dependencies
    const depsMatch = content.match(/##\s*Dependencies\s*\n+([\s\S]*?)(?=\n##|\n<task|$)/i);
    if (depsMatch) {
      const depLines = depsMatch[1].split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').trim());
      info.dependencies = depLines;
    }

    // Extract success criteria
    const criteriaMatch = content.match(/##\s*Success\s*Criteria\s*\n+([\s\S]*?)(?=\n##|\n<task|$)/i);
    if (criteriaMatch) {
      const criteriaLines = criteriaMatch[1].split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').trim());
      info.successCriteria = criteriaLines;
    }

    // Extract verification steps
    const verifyMatch = content.match(/##\s*Verification\s*\n+([\s\S]*?)(?=\n##|\n<task|$)/i);
    if (verifyMatch) {
      info.verification = verifyMatch[1].trim();
    }

    return info;
  }

  /**
   * Extract tasks from plan content
   * @param {string} content - Plan file content
   * @returns {Array<object>} Array of task objects
   */
  extractTasks(content) {
    const tasks = [];
    const taskRegex = /<task(?:\s+[^>]*)?>[\s\S]*?<\/task>/gi;
    let match;

    while ((match = taskRegex.exec(content)) !== null) {
      const taskContent = match[0];
      const task = this._parseTask(taskContent);
      if (task) {
        task.rawContent = taskContent;
        tasks.push(task);
      }
    }

    return tasks;
  }

  /**
   * Extract files from a task
   * @param {object} task - Task object
   * @returns {string[]} Array of file paths
   */
  extractFiles(task) {
    const files = [];
    
    // From explicit files tag
    if (task.files && Array.isArray(task.files)) {
      files.push(...task.files);
    }

    // From action content - look for file paths
    if (task.action) {
      const pathMatches = task.action.match(/(?:['"`])((?:\.\/|\/|[a-zA-Z_])[a-zA-Z0-9_\-./]+\.[a-zA-Z]+)(?:['"`])/g);
      if (pathMatches) {
        for (const pm of pathMatches) {
          const cleanPath = pm.replace(/['"`]/g, '');
          if (!files.includes(cleanPath)) {
            files.push(cleanPath);
          }
        }
      }
    }

    return files;
  }

  /**
   * Extract expected functions from a task
   * @param {object} task - Task object
   * @returns {Array<{file: string, functions: string[]}>} Expected functions by file
   */
  extractExpectedFunctions(task) {
    const expectations = [];
    
    if (!task.action) return expectations;

    // Look for patterns like "create function X" or "add method Y"
    const funcPatterns = [
      /(?:create|add|implement)\s+(?:function|method)\s+['"`]?(\w+)['"`]?/gi,
      /(?:function|method)\s+['"`]?(\w+)['"`]?\s+(?:that|which|to)/gi,
      /(\w+)\s*\([^)]*\)\s*(?:=>|\{)/g
    ];

    const functions = new Set();
    for (const pattern of funcPatterns) {
      let match;
      while ((match = pattern.exec(task.action)) !== null) {
        if (!['if', 'while', 'for', 'switch', 'catch', 'function', 'return'].includes(match[1])) {
          functions.add(match[1]);
        }
      }
    }

    // Associate with files
    const files = this.extractFiles(task);
    if (files.length > 0 && functions.size > 0) {
      expectations.push({
        file: files[0],
        functions: Array.from(functions)
      });
    }

    return expectations;
  }

  /**
   * Extract expected exports from a task
   * @param {object} task - Task object
   * @returns {Array<{file: string, exports: string[]}>} Expected exports by file
   */
  extractExpectedExports(task) {
    const expectations = [];
    
    if (!task.action) return expectations;

    // Look for export patterns
    const exportPatterns = [
      /(?:export|exports)\s+(?:const|let|var|function|class)?\s*['"`]?(\w+)['"`]?/gi,
      /module\.exports\s*=\s*\{([^}]+)\}/gi,
      /module\.exports\.(\w+)/gi
    ];

    const exports = new Set();
    for (const pattern of exportPatterns) {
      let match;
      while ((match = pattern.exec(task.action)) !== null) {
        if (match[1].includes(',')) {
          // Handle { a, b, c }
          match[1].split(',').forEach(e => exports.add(e.trim()));
        } else {
          exports.add(match[1]);
        }
      }
    }

    // Associate with files
    const files = this.extractFiles(task);
    if (files.length > 0 && exports.size > 0) {
      expectations.push({
        file: files[0],
        exports: Array.from(exports)
      });
    }

    return expectations;
  }

  // ============================================
  // Validation Methods
  // ============================================

  /**
   * Validate a single task against the codebase
   * @param {object} task - Task object to validate
   * @returns {Promise<object>} Validation result
   */
  async validateTask(task) {
    const result = {
      status: TaskStatus.OK,
      issues: [],
      suggestions: []
    };

    // Extract what we need to check
    const files = this.extractFiles(task);
    const expectedFunctions = this.extractExpectedFunctions(task);
    const expectedExports = this.extractExpectedExports(task);

    // Check file targets
    const fileCheck = this.checkFileTargets(files);
    if (fileCheck.issues.length > 0) {
      result.issues.push(...fileCheck.issues);
      result.suggestions.push(...fileCheck.suggestions);
    }

    // Check if task is already complete
    const completionCheck = await this._checkTaskCompletion(task, files, expectedFunctions, expectedExports);
    if (completionCheck.complete) {
      result.status = TaskStatus.ALREADY_COMPLETE;
      result.issues.push({
        type: 'already_complete',
        message: completionCheck.message,
        details: completionCheck.details
      });
      return result;
    }

    // Check function targets
    for (const { file, functions } of expectedFunctions) {
      if (this.analyzer.fileExists(file)) {
        const funcCheck = this.checkFunctionTargets(file, functions);
        if (funcCheck.issues.length > 0) {
          result.issues.push(...funcCheck.issues);
        }
      }
    }

    // Check export targets
    for (const { file, exports } of expectedExports) {
      if (this.analyzer.fileExists(file)) {
        const exportCheck = this.checkExportTargets(file, exports);
        if (exportCheck.issues.length > 0) {
          result.issues.push(...exportCheck.issues);
        }
      }
    }

    // Check dependencies
    const depCheck = this.checkDependencies(task);
    if (depCheck.issues.length > 0) {
      result.status = TaskStatus.MISSING_DEPENDENCY;
      result.issues.push(...depCheck.issues);
      result.suggestions.push(...depCheck.suggestions);
    }

    // Determine final status based on issues
    if (result.issues.length > 0 && result.status === TaskStatus.OK) {
      const hasPathError = result.issues.some(i => i.type === 'path_error');
      const hasConflict = result.issues.some(i => i.type === 'conflict');
      
      if (hasPathError) {
        result.status = TaskStatus.PATH_ERROR;
      } else if (hasConflict) {
        result.status = TaskStatus.CONFLICT;
      }
    }

    return result;
  }

  /**
   * Check file targets for issues
   * @param {string[]} files - Array of file paths
   * @returns {object} Check result with issues and suggestions
   */
  checkFileTargets(files) {
    const result = {
      issues: [],
      suggestions: []
    };

    for (const file of files) {
      // Check for common path issues
      if (file.includes('\\')) {
        result.issues.push({
          type: 'path_error',
          message: `File path uses backslashes: ${file}`,
          file
        });
        result.suggestions.push({
          type: 'fix_path',
          original: file,
          suggested: file.replace(/\\/g, '/')
        });
      }

      // Check for duplicate slashes
      if (file.includes('//')) {
        result.issues.push({
          type: 'path_error',
          message: `File path has duplicate slashes: ${file}`,
          file
        });
        result.suggestions.push({
          type: 'fix_path',
          original: file,
          suggested: file.replace(/\/+/g, '/')
        });
      }

      // Check if parent directory exists for new files
      const dir = path.dirname(file);
      if (dir && dir !== '.' && !this.analyzer.directoryExists(dir)) {
        // Try to find similar directory
        const suggestion = this._findSimilarPath(dir);
        if (suggestion) {
          result.issues.push({
            type: 'path_error',
            message: `Directory does not exist: ${dir}`,
            file
          });
          result.suggestions.push({
            type: 'fix_directory',
            original: dir,
            suggested: suggestion
          });
        }
      }
    }

    return result;
  }

  /**
   * Check function targets for conflicts
   * @param {string} filePath - Path to the file
   * @param {string[]} functions - Expected function names
   * @returns {object} Check result with issues
   */
  checkFunctionTargets(filePath, functions) {
    const result = {
      issues: [],
      existing: [],
      missing: []
    };

    const existingFunctions = this.analyzer.getFunctions(filePath);

    for (const func of functions) {
      if (existingFunctions.includes(func)) {
        result.existing.push(func);
        if (this.config.strict) {
          result.issues.push({
            type: 'conflict',
            message: `Function already exists: ${func} in ${filePath}`,
            file: filePath,
            function: func
          });
        }
      } else {
        result.missing.push(func);
      }
    }

    return result;
  }

  /**
   * Check export targets for conflicts
   * @param {string} filePath - Path to the file
   * @param {string[]} exports - Expected export names
   * @returns {object} Check result with issues
   */
  checkExportTargets(filePath, exports) {
    const result = {
      issues: [],
      existing: [],
      missing: []
    };

    const existingExports = this.analyzer.getExports(filePath);

    for (const exp of exports) {
      if (existingExports.includes(exp)) {
        result.existing.push(exp);
        if (this.config.strict) {
          result.issues.push({
            type: 'conflict',
            message: `Export already exists: ${exp} in ${filePath}`,
            file: filePath,
            export: exp
          });
        }
      } else {
        result.missing.push(exp);
      }
    }

    return result;
  }

  /**
   * Check task dependencies
   * @param {object} task - Task object
   * @returns {object} Check result with issues and suggestions
   */
  checkDependencies(task) {
    const result = {
      issues: [],
      suggestions: []
    };

    // Check for required imports in action
    if (task.action) {
      // Look for require/import statements that reference local files
      const importMatches = task.action.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g) || [];
      const esImportMatches = task.action.match(/import\s+.*\s+from\s+['"]([^'"]+)['"]/g) || [];
      
      const allImports = [...importMatches, ...esImportMatches];
      
      for (const imp of allImports) {
        const moduleMatch = imp.match(/['"]([^'"]+)['"]/);
        if (moduleMatch) {
          const modulePath = moduleMatch[1];
          
          // Check local imports
          if (modulePath.startsWith('.')) {
            const files = this.extractFiles(task);
            const baseFile = files[0] || '.';
            const baseDir = path.dirname(baseFile);
            const resolvedPath = path.join(baseDir, modulePath);
            
            // Try to resolve with extensions
            const extensions = ['.js', '.ts', '.mjs', '.json'];
            let found = false;
            
            for (const ext of ['', ...extensions]) {
              if (this.analyzer.fileExists(resolvedPath + ext)) {
                found = true;
                break;
              }
            }
            
            if (!found && !modulePath.includes('*')) {
              result.issues.push({
                type: 'missing_dependency',
                message: `Local dependency not found: ${modulePath}`,
                module: modulePath
              });
            }
          } else if (!modulePath.startsWith('@') && !modulePath.includes('/')) {
            // Check npm dependencies
            const depInfo = this.analyzer.checkNpmDependency(modulePath);
            if (!depInfo.exists) {
              result.issues.push({
                type: 'missing_dependency',
                message: `NPM dependency not found: ${modulePath}`,
                module: modulePath
              });
              result.suggestions.push({
                type: 'install_dependency',
                command: `npm install ${modulePath}`
              });
            }
          }
        }
      }
    }

    return result;
  }

  // ============================================
  // Report Generation Methods
  // ============================================

  /**
   * Generate a review report
   * @param {object} results - Review results
   * @returns {string} Markdown formatted report
   */
  generateReport(results) {
    const lines = [];
    const timestamp = new Date().toISOString().split('T')[0];

    lines.push(`# Plan Review Report`);
    lines.push('');
    lines.push(`**Plan:** ${results.planPath}`);
    lines.push(`**Date:** ${timestamp}`);
    lines.push(`**Status:** ${results.summary.ok === results.summary.total ? '✓ Ready' : '⚠️ Issues Found'}`);
    lines.push('');

    // Summary section
    lines.push('## Summary');
    lines.push('');
    lines.push(`| Metric | Count |`);
    lines.push(`|--------|-------|`);
    lines.push(`| Total Tasks | ${results.summary.total} |`);
    lines.push(`| Ready to Execute | ${results.summary.ok} |`);
    lines.push(`| Already Complete | ${results.summary.alreadyComplete} |`);
    lines.push(`| Path Errors | ${results.summary.pathErrors} |`);
    lines.push(`| Missing Dependencies | ${results.summary.missingDependencies} |`);
    lines.push(`| Conflicts | ${results.summary.conflicts} |`);
    lines.push('');

    // Task details
    lines.push('## Task Details');
    lines.push('');

    for (const task of results.tasks) {
      const statusIcon = this._getStatusIcon(task.validation.status);
      lines.push(`### ${statusIcon} ${task.name}`);
      lines.push('');
      
      if (task.type) {
        lines.push(`**Type:** ${task.type}`);
      }
      
      if (task.validation.status !== TaskStatus.OK) {
        lines.push(`**Status:** ${task.validation.status}`);
        lines.push('');
        
        if (task.validation.issues.length > 0) {
          lines.push('**Issues:**');
          for (const issue of task.validation.issues) {
            lines.push(`- ${issue.message}`);
          }
          lines.push('');
        }
        
        if (task.validation.suggestions.length > 0) {
          lines.push('**Suggestions:**');
          for (const suggestion of task.validation.suggestions) {
            if (suggestion.type === 'fix_path') {
              lines.push(`- Change \`${suggestion.original}\` to \`${suggestion.suggested}\``);
            } else if (suggestion.type === 'install_dependency') {
              lines.push(`- Run: \`${suggestion.command}\``);
            } else {
              lines.push(`- ${JSON.stringify(suggestion)}`);
            }
          }
          lines.push('');
        }
      }
    }

    // Recommendations
    const actionableIssues = results.tasks.filter(t => 
      t.validation.status !== TaskStatus.OK && 
      t.validation.status !== TaskStatus.ALREADY_COMPLETE
    );

    if (actionableIssues.length > 0) {
      lines.push('## Recommended Actions');
      lines.push('');
      
      let actionNum = 1;
      for (const task of actionableIssues) {
        for (const suggestion of task.validation.suggestions) {
          if (suggestion.type === 'install_dependency') {
            lines.push(`${actionNum}. Install missing dependency: \`${suggestion.command}\``);
            actionNum++;
          } else if (suggestion.type === 'fix_path') {
            lines.push(`${actionNum}. Fix path in task "${task.name}": \`${suggestion.original}\` → \`${suggestion.suggested}\``);
            actionNum++;
          }
        }
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Auto-fix simple issues in a plan
   * @param {string} planPath - Path to the plan file
   * @param {Array<object>} issues - Issues to fix
   * @returns {Promise<object>} Fix results
   */
  async autoFixPlan(planPath, issues) {
    const result = {
      fixed: [],
      skipped: [],
      newContent: null
    };

    let content = fs.readFileSync(planPath, 'utf8');
    let modified = false;

    for (const issue of issues) {
      const { task, suggestions } = issue;

      for (const suggestion of suggestions || []) {
        if (suggestion.type === 'fix_path' && suggestion.original && suggestion.suggested) {
          // Replace path in content
          const originalContent = content;
          content = content.replace(
            new RegExp(this._escapeRegex(suggestion.original), 'g'),
            suggestion.suggested
          );
          
          if (content !== originalContent) {
            result.fixed.push({
              task: task.name,
              type: 'path_fix',
              from: suggestion.original,
              to: suggestion.suggested
            });
            modified = true;
          }
        } else {
          result.skipped.push({
            task: task.name,
            suggestion,
            reason: 'Cannot auto-fix this type of issue'
          });
        }
      }

      // Mark already complete tasks
      if (issue.status === TaskStatus.ALREADY_COMPLETE && task.rawContent) {
        // Add a comment to indicate task is already complete
        const markedContent = task.rawContent.replace(
          /<task/,
          '<!-- ALREADY_COMPLETE -->\n<task'
        );
        
        if (!content.includes('<!-- ALREADY_COMPLETE -->')) {
          content = content.replace(task.rawContent, markedContent);
          result.fixed.push({
            task: task.name,
            type: 'marked_complete'
          });
          modified = true;
        }
      }
    }

    if (modified) {
      result.newContent = content;
      
      // Write if autoFix is enabled
      if (this.config.autoFix) {
        fs.writeFileSync(planPath, content, 'utf8');
        result.written = true;
      }
    }

    return result;
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * Parse a single task XML block
   * @private
   * @param {string} taskContent - Task XML content
   * @returns {object|null} Parsed task object
   */
  _parseTask(taskContent) {
    const task = {
      name: null,
      type: null,
      files: [],
      action: null,
      verify: null,
      done: null
    };

    // Extract attributes from task tag
    const attrMatch = taskContent.match(/<task([^>]*)>/);
    if (attrMatch && attrMatch[1]) {
      const nameMatch = attrMatch[1].match(/name\s*=\s*["']([^"']+)["']/);
      if (nameMatch) task.name = nameMatch[1];

      const typeMatch = attrMatch[1].match(/type\s*=\s*["']([^"']+)["']/);
      if (typeMatch) task.type = typeMatch[1];
    }

    // Extract name from <name> tag if not in attributes
    if (!task.name) {
      const nameTagMatch = taskContent.match(/<name>([^<]+)<\/name>/i);
      if (nameTagMatch) task.name = nameTagMatch[1].trim();
    }

    // Extract files
    const filesMatch = taskContent.match(/<files>([\s\S]*?)<\/files>/i);
    if (filesMatch) {
      task.files = filesMatch[1]
        .split('\n')
        .map(f => f.trim())
        .filter(f => f && !f.startsWith('#') && !f.startsWith('//'));
    }

    // Extract action
    const actionMatch = taskContent.match(/<action>([\s\S]*?)<\/action>/i);
    if (actionMatch) {
      task.action = actionMatch[1].trim();
    }

    // Extract verify
    const verifyMatch = taskContent.match(/<verify>([\s\S]*?)<\/verify>/i);
    if (verifyMatch) {
      task.verify = verifyMatch[1].trim();
    }

    // Extract done criteria
    const doneMatch = taskContent.match(/<done>([\s\S]*?)<\/done>/i);
    if (doneMatch) {
      task.done = doneMatch[1].trim();
    }

    return task.name ? task : null;
  }

  /**
   * Check if a task is already complete
   * @private
   * @param {object} task - Task object
   * @param {string[]} files - Files involved
   * @param {Array} expectedFunctions - Expected functions
   * @param {Array} expectedExports - Expected exports
   * @returns {Promise<object>} Completion check result
   */
  async _checkTaskCompletion(task, files, expectedFunctions, expectedExports) {
    const result = {
      complete: false,
      message: '',
      details: []
    };

    // Check if all target files exist
    const existingFiles = files.filter(f => this.analyzer.fileExists(f));
    
    if (existingFiles.length === files.length && files.length > 0) {
      // All files exist - check if they have expected content
      let allFunctionsExist = true;
      let allExportsExist = true;

      for (const { file, functions } of expectedFunctions) {
        const existingFuncs = this.analyzer.getFunctions(file);
        const missingFuncs = functions.filter(f => !existingFuncs.includes(f));
        if (missingFuncs.length > 0) {
          allFunctionsExist = false;
        }
      }

      for (const { file, exports } of expectedExports) {
        const existingExps = this.analyzer.getExports(file);
        const missingExps = exports.filter(e => !existingExps.includes(e));
        if (missingExps.length > 0) {
          allExportsExist = false;
        }
      }

      // If we have specific expectations and they're all met
      if ((expectedFunctions.length > 0 || expectedExports.length > 0) && 
          allFunctionsExist && allExportsExist) {
        result.complete = true;
        result.message = 'All target files exist with expected functions/exports';
        result.details = existingFiles.map(f => `File exists: ${f}`);
      }
      // If no specific expectations but all files exist
      else if (expectedFunctions.length === 0 && expectedExports.length === 0 && files.length > 0) {
        // Check done criteria if available
        if (task.done && task.done.includes('exists')) {
          result.complete = true;
          result.message = 'Target files already exist';
          result.details = existingFiles.map(f => `File exists: ${f}`);
        }
      }
    }

    return result;
  }

  /**
   * Find all PLAN.md files in a directory
   * @private
   * @param {string} dir - Directory to search
   * @returns {string[]} Array of plan file paths
   */
  _findPlanFiles(dir) {
    const planFiles = [];
    
    const search = (currentDir) => {
      try {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);
          
          if (entry.isFile() && entry.name.match(/PLAN.*\.md$/i)) {
            planFiles.push(fullPath);
          } else if (entry.isDirectory() && 
                     !entry.name.startsWith('.') && 
                     entry.name !== 'node_modules') {
            search(fullPath);
          }
        }
      } catch {
        // Skip inaccessible directories
      }
    };

    search(dir);
    return planFiles.sort();
  }

  /**
   * Find a similar path that exists
   * @private
   * @param {string} targetPath - Path to find similar to
   * @returns {string|null} Similar existing path or null
   */
  _findSimilarPath(targetPath) {
    const parts = targetPath.split('/').filter(p => p);
    
    // Try to find by walking up and checking variations
    for (let i = parts.length; i > 0; i--) {
      const partialPath = parts.slice(0, i).join('/');
      
      if (this.analyzer.directoryExists(partialPath)) {
        // Found existing parent - check for similar children
        const remaining = parts.slice(i);
        if (remaining.length > 0) {
          const expectedChild = remaining[0].toLowerCase();
          try {
            const children = fs.readdirSync(path.join(this.rootPath, partialPath));
            for (const child of children) {
              if (child.toLowerCase() === expectedChild || 
                  child.toLowerCase().includes(expectedChild)) {
                return path.join(partialPath, child, ...remaining.slice(1));
              }
            }
          } catch {
            // Skip
          }
        }
        return partialPath;
      }
    }

    return null;
  }

  /**
   * Get status icon for a task status
   * @private
   * @param {string} status - Task status
   * @returns {string} Status icon
   */
  _getStatusIcon(status) {
    switch (status) {
      case TaskStatus.OK:
        return '✓';
      case TaskStatus.ALREADY_COMPLETE:
        return '✔️';
      case TaskStatus.PATH_ERROR:
        return '📁';
      case TaskStatus.MISSING_DEPENDENCY:
        return '📦';
      case TaskStatus.CONFLICT:
        return '⚠️';
      default:
        return '❓';
    }
  }

  /**
   * Escape special regex characters
   * @private
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  _escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

module.exports = {
  PlanReviewer,
  TaskStatus
};
