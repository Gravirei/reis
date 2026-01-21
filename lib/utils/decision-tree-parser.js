/**
 * Decision Tree Parser
 * 
 * Parses decision trees from markdown with enhanced features:
 * - Conditional branches [IF: condition]
 * - Metadata annotations [weight: N], [priority: level], etc.
 * - Semantic validation (cycles, orphans, balance)
 * - Context evaluation
 */

const fs = require('fs');
const path = require('path');

/**
 * Parse all decision trees from markdown content
 * @param {string} markdownContent - The markdown file content
 * @returns {Array} Array of parsed tree objects
 */
function parseDecisionTrees(markdownContent) {
  const trees = [];
  const lines = markdownContent.split('\n');
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    
    // Look for decision tree headers
    const treeMatch = line.match(/^##\s+Decision Tree:\s*(.+)$/);
    if (treeMatch) {
      const treeName = treeMatch[1].trim();
      
      // Find the code block
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        i++;
      }
      
      if (i < lines.length) {
        i++; // Skip opening ```
        const treeLines = [];
        
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          treeLines.push(lines[i]);
          i++;
        }
        
        // Parse the tree content
        const tree = parseTreeContent(treeName, treeLines);
        if (tree) {
          trees.push(tree);
        }
      }
    }
    
    i++;
  }
  
  return trees;
}

/**
 * Parse tree content into structured format
 * @param {string} name - Tree name
 * @param {Array} lines - Lines of tree content
 * @returns {Object} Parsed tree structure
 */
function parseTreeContent(name, lines) {
  if (lines.length === 0) return null;
  
  const root = lines[0].trim();
  if (!root) return null;
  
  const branches = [];
  const stack = []; // Track parent branches for hierarchy
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const branch = parseBranchLine(line);
    if (branch) {
      // Determine parent based on indentation
      while (stack.length > 0 && stack[stack.length - 1].level >= branch.level) {
        stack.pop();
      }
      
      if (stack.length === 0) {
        // Top-level branch
        branches.push(branch);
      } else {
        // Child branch
        const parent = stack[stack.length - 1];
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(branch);
      }
      
      stack.push(branch);
    }
  }
  
  return {
    name,
    root,
    branches
  };
}

/**
 * Parse a single branch line
 * @param {string} line - Branch line
 * @returns {Object|null} Parsed branch or null
 */
function parseBranchLine(line) {
  // Calculate indentation level
  const indent = line.search(/\S/);
  if (indent === -1) return null;
  
  const level = Math.floor(indent / 2);
  
  // Remove tree characters and trim
  let content = line.replace(/^[\s│]*[├└]─\s*/, '').trim();
  if (!content) return null;
  
  // Extract condition [IF: ...] or [ELSE]
  let condition = null;
  const ifMatch = content.match(/^\[IF:\s*([^\]]+)\]/);
  if (ifMatch) {
    condition = ifMatch[1].trim();
    content = content.replace(/^\[IF:\s*[^\]]+\]\s*/, '');
  } else if (content.startsWith('[ELSE]')) {
    condition = 'ELSE';
    content = content.replace(/^\[ELSE\]\s*/, '');
  }
  
  // Extract metadata
  const metadata = {};
  
  // Weight
  const weightMatch = content.match(/\[weight:\s*(\d+)\]/i);
  if (weightMatch) {
    metadata.weight = parseInt(weightMatch[1], 10);
    content = content.replace(/\[weight:\s*\d+\]/i, '');
  }
  
  // Priority
  const priorityMatch = content.match(/\[priority:\s*(high|medium|low)\]/i);
  if (priorityMatch) {
    metadata.priority = priorityMatch[1].toLowerCase();
    content = content.replace(/\[priority:\s*(?:high|medium|low)\]/i, '');
  }
  
  // Risk
  const riskMatch = content.match(/\[risk:\s*(high|medium|low)\]/i);
  if (riskMatch) {
    metadata.risk = riskMatch[1].toLowerCase();
    content = content.replace(/\[risk:\s*(?:high|medium|low)\]/i, '');
  }
  
  // Complexity
  const complexityMatch = content.match(/\[complexity:\s*(high|medium|low)\]/i);
  if (complexityMatch) {
    metadata.complexity = complexityMatch[1].toLowerCase();
    content = content.replace(/\[complexity:\s*(?:high|medium|low)\]/i, '');
  }
  
  // Cost
  const costMatch = content.match(/\[cost:\s*(high|medium|low)\]/i);
  if (costMatch) {
    metadata.cost = costMatch[1].toLowerCase();
    content = content.replace(/\[cost:\s*(?:high|medium|low)\]/i, '');
  }
  
  // Recommended
  if (content.match(/\[recommended\]/i)) {
    metadata.recommended = true;
    content = content.replace(/\[recommended\]/i, '');
  }
  
  // Extract outcome (text after →)
  let outcome = null;
  const outcomeMatch = content.match(/→\s*(.+)$/);
  if (outcomeMatch) {
    outcome = outcomeMatch[1].trim();
    content = content.replace(/→\s*.+$/, '');
  }
  
  // Clean up extra whitespace
  content = content.trim();
  
  const branch = {
    text: content,
    level,
    children: []
  };
  
  if (condition) branch.condition = condition;
  if (Object.keys(metadata).length > 0) branch.metadata = metadata;
  if (outcome) branch.outcome = outcome;
  
  return branch;
}

/**
 * Validate tree structure and semantics
 * @param {Object} tree - Parsed tree object
 * @returns {Object} Validation result with errors and warnings
 */
function validateTree(tree) {
  const errors = [];
  const warnings = [];
  const suggestions = [];
  
  if (!tree || !tree.root) {
    errors.push('Tree must have a root question');
    return { valid: false, errors, warnings, suggestions };
  }
  
  if (!tree.branches || tree.branches.length === 0) {
    errors.push('Tree must have at least one branch');
    return { valid: false, errors, warnings, suggestions };
  }
  
  // Check for cycles
  if (detectCycles(tree)) {
    errors.push('Circular reference detected in tree structure');
  }
  
  // Check for orphaned branches
  const orphans = findOrphanedBranches(tree);
  if (orphans.length > 0) {
    errors.push(`Found ${orphans.length} orphaned branch(es)`);
  }
  
  // Check tree balance (warning only)
  const balance = checkTreeBalance(tree);
  if (balance.unbalanced) {
    warnings.push(`Tree is unbalanced: max depth ${balance.maxDepth}, min depth ${balance.minDepth}`);
  }
  
  // Check for incomplete conditionals
  const incompleteConditionals = findIncompleteConditionals(tree);
  if (incompleteConditionals.length > 0) {
    warnings.push(`Found ${incompleteConditionals.length} [IF:] without corresponding [ELSE]`);
  }
  
  // Validate metadata values
  const metadataErrors = validateMetadata(tree);
  errors.push(...metadataErrors);
  
  // Suggestions for improvement
  if (!hasRecommendation(tree)) {
    suggestions.push('Consider adding [recommended] to guide users');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    suggestions
  };
}

/**
 * Detect circular references in tree
 * @param {Object} tree - Tree object
 * @returns {boolean} True if cycles detected
 */
function detectCycles(tree) {
  const visited = new Set();
  
  function dfs(branch, path) {
    const id = branch.text;
    
    if (path.has(id)) {
      return true; // Cycle detected
    }
    
    if (visited.has(id)) {
      return false; // Already checked this branch
    }
    
    visited.add(id);
    path.add(id);
    
    for (const child of (branch.children || [])) {
      if (dfs(child, new Set(path))) {
        return true;
      }
    }
    
    path.delete(id);
    return false;
  }
  
  for (const branch of tree.branches) {
    if (dfs(branch, new Set())) {
      return true;
    }
  }
  
  return false;
}

/**
 * Find orphaned branches
 * @param {Object} tree - Tree object
 * @returns {Array} List of orphaned branches
 */
function findOrphanedBranches(tree) {
  // In our parser, orphans are prevented by structure
  // This is a placeholder for more advanced validation
  return [];
}

/**
 * Check tree balance
 * @param {Object} tree - Tree object
 * @returns {Object} Balance information
 */
function checkTreeBalance(tree) {
  let maxDepth = 0;
  let minDepth = Infinity;
  
  function measureDepth(branches, depth = 1) {
    for (const branch of branches) {
      if (!branch.children || branch.children.length === 0) {
        maxDepth = Math.max(maxDepth, depth);
        minDepth = Math.min(minDepth, depth);
      } else {
        measureDepth(branch.children, depth + 1);
      }
    }
  }
  
  measureDepth(tree.branches);
  
  return {
    maxDepth,
    minDepth,
    unbalanced: maxDepth - minDepth > 2
  };
}

/**
 * Find IF statements without ELSE
 * @param {Object} tree - Tree object
 * @returns {Array} List of incomplete conditionals
 */
function findIncompleteConditionals(tree) {
  const incomplete = [];
  
  function checkBranches(branches, parentText) {
    let hasIf = false;
    let hasElse = false;
    
    for (const branch of branches) {
      if (branch.condition && branch.condition !== 'ELSE') {
        hasIf = true;
      }
      if (branch.condition === 'ELSE') {
        hasElse = true;
      }
      
      if (branch.children) {
        checkBranches(branch.children, branch.text);
      }
    }
    
    if (hasIf && !hasElse) {
      incomplete.push(parentText);
    }
  }
  
  checkBranches(tree.branches, tree.root);
  return incomplete;
}

/**
 * Validate metadata values
 * @param {Object} tree - Tree object
 * @returns {Array} List of validation errors
 */
function validateMetadata(tree) {
  const errors = [];
  
  function checkBranch(branch) {
    if (branch.metadata) {
      const { weight, priority, risk, complexity, cost } = branch.metadata;
      
      if (weight !== undefined && (weight < 1 || weight > 10)) {
        errors.push(`Invalid weight ${weight} in "${branch.text}": must be 1-10`);
      }
      
      const validLevels = ['high', 'medium', 'low'];
      if (priority && !validLevels.includes(priority)) {
        errors.push(`Invalid priority "${priority}" in "${branch.text}"`);
      }
      if (risk && !validLevels.includes(risk)) {
        errors.push(`Invalid risk "${risk}" in "${branch.text}"`);
      }
      if (complexity && !validLevels.includes(complexity)) {
        errors.push(`Invalid complexity "${complexity}" in "${branch.text}"`);
      }
      if (cost && !validLevels.includes(cost)) {
        errors.push(`Invalid cost "${cost}" in "${branch.text}"`);
      }
    }
    
    if (branch.children) {
      branch.children.forEach(checkBranch);
    }
  }
  
  tree.branches.forEach(checkBranch);
  return errors;
}

/**
 * Check if tree has at least one recommendation
 * @param {Object} tree - Tree object
 * @returns {boolean} True if recommendation exists
 */
function hasRecommendation(tree) {
  function checkBranch(branch) {
    if (branch.metadata && branch.metadata.recommended) {
      return true;
    }
    if (branch.children) {
      return branch.children.some(checkBranch);
    }
    return false;
  }
  
  return tree.branches.some(checkBranch);
}

/**
 * Evaluate a condition against project context
 * @param {string} condition - Condition string
 * @param {Object} context - Project context
 * @returns {boolean} True if condition is met
 */
function evaluateCondition(condition, context = {}) {
  if (condition === 'ELSE') {
    return true; // ELSE is evaluated separately
  }
  
  // Parse boolean operators
  if (condition.includes(' AND ')) {
    const parts = condition.split(' AND ').map(p => p.trim());
    return parts.every(part => evaluateCondition(part, context));
  }
  
  if (condition.includes(' OR ')) {
    const parts = condition.split(' OR ').map(p => p.trim());
    return parts.some(part => evaluateCondition(part, context));
  }
  
  if (condition.startsWith('NOT ')) {
    const subCondition = condition.substring(4).trim();
    return !evaluateCondition(subCondition, context);
  }
  
  // Simple condition lookup
  return context[condition] === true;
}

/**
 * Load project context from PROJECT.md and package.json
 * @param {string} projectRoot - Project root directory
 * @returns {Object} Context object
 */
function loadProjectContext(projectRoot = '.') {
  const context = {};
  
  // Read PROJECT.md
  const projectMdPath = path.join(projectRoot, '.planning', 'PROJECT.md');
  if (fs.existsSync(projectMdPath)) {
    const content = fs.readFileSync(projectMdPath, 'utf-8');
    
    // Extract context from PROJECT.md
    context.has_database = /database|postgres|mysql|mongodb/i.test(content);
    context.has_api = /api|endpoint|rest|graphql/i.test(content);
    context.serverless = /serverless|lambda|cloud function/i.test(content);
    context.monorepo = /monorepo|workspace/i.test(content);
  }
  
  // Read package.json
  const packageJsonPath = path.join(projectRoot, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      
      context.typescript = 'typescript' in deps;
      context.has_tests = 'mocha' in deps || 'jest' in deps || 'vitest' in deps;
      context.has_database = context.has_database || 
        'pg' in deps || 'mysql' in deps || 'mongodb' in deps;
      context.has_api = context.has_api ||
        'express' in deps || 'fastify' in deps || 'koa' in deps;
    } catch (e) {
      // Ignore parse errors
    }
  }
  
  return context;
}

module.exports = {
  parseDecisionTrees,
  validateTree,
  detectCycles,
  evaluateCondition,
  loadProjectContext
};
