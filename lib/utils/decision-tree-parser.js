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
  const stack = []; // Track parent branches for hierarchy with their indentation
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const branch = parseBranchLine(line);
    if (branch) {
      // Get actual indentation from the line
      // For lines with continuation character │, use the position of the branch marker (├ or └)
      // Otherwise use the position of the first non-space character
      const branchMatch = line.match(/[├└]─/);
      const indent = branchMatch ? line.indexOf(branchMatch[0]) : line.search(/\S/);
      
      // Determine parent based on indentation comparison
      // Pop stack until we find a parent with less indentation
      while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
        stack.pop();
      }
      
      if (stack.length === 0) {
        // Top-level branch
        branches.push(branch);
      } else {
        // Child branch
        const parent = stack[stack.length - 1].branch;
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(branch);
      }
      
      // Push this branch onto the stack with its indentation
      stack.push({ branch, indent });
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
  
  // Skip lines that are only continuation characters (│)
  if (!content || /^[│\s]*$/.test(line)) return null;
  
  // Extract condition [IF: ...] or [ELSE]
  let condition = null;
  const ifMatch = content.match(/^\[IF:\s*([^\]]+)\]/);
  if (ifMatch) {
    condition = ifMatch[1].trim();
    content = content.replace(/^\[IF:\s*[^\]]+\]\s*/, '').trim();
  } else if (content.startsWith('[ELSE]')) {
    condition = 'ELSE';
    content = content.replace(/^\[ELSE\]\s*/, '').trim();
  }
  
  // If content is empty after extracting condition, this might be a parent branch with only condition
  // Keep the condition line but mark it appropriately
  if (!content && condition) {
    // For lines like "├─ [IF: has_database]" with children, we need to handle this
    // We'll keep processing but the text will be empty for now
    content = '';
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
  
  // For branches with only conditions and no text, use an empty string
  // This handles cases like "├─ [IF: has_database]" which acts as a conditional parent
  const branch = {
    text: content || '',
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
    errors.push('No branches found in tree');
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
  
  // Validate conditional syntax
  const invalidConditionals = validateConditionalSyntax(tree);
  if (invalidConditionals.length > 0) {
    warnings.push(`Found ${invalidConditionals.length} branch(es) with invalid condition syntax`);
  }
  
  // Validate metadata values
  const metadataResult = validateMetadata(tree);
  errors.push(...metadataResult.errors);
  warnings.push(...metadataResult.warnings);
  
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
  // Check if any branches have inconsistent level jumps that indicate orphaning
  const orphans = [];
  
  function checkBranches(branches, parentLevel = 0) {
    for (const branch of branches) {
      // Check if branch level is more than 1 greater than parent level
      if (branch.level !== undefined && branch.level > parentLevel + 1) {
        orphans.push(branch);
      }
      
      if (branch.children && branch.children.length > 0) {
        checkBranches(branch.children, branch.level || parentLevel + 1);
      }
    }
  }
  
  checkBranches(tree.branches);
  return orphans;
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
    unbalanced: maxDepth - minDepth >= 2
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
 * @returns {Array} List of validation errors and warnings
 */
function validateMetadata(tree) {
  const errors = [];
  const warnings = [];
  
  function checkBranch(branch) {
    if (branch.metadata) {
      const { weight, priority, risk, complexity, cost } = branch.metadata;
      
      if (weight !== undefined && (weight < 1 || weight > 10)) {
        warnings.push(`Invalid weight ${weight} in "${branch.text}": must be 1-10`);
      }
      
      const validLevels = ['high', 'medium', 'low'];
      if (priority && !validLevels.includes(priority)) {
        warnings.push(`Invalid priority "${priority}" in "${branch.text}"`);
      }
      if (risk && !validLevels.includes(risk)) {
        warnings.push(`Invalid risk "${risk}" in "${branch.text}"`);
      }
      if (complexity && !validLevels.includes(complexity)) {
        warnings.push(`Invalid complexity "${complexity}" in "${branch.text}"`);
      }
      if (cost && !validLevels.includes(cost)) {
        warnings.push(`Invalid cost "${cost}" in "${branch.text}"`);
      }
    }
    
    if (branch.children) {
      branch.children.forEach(checkBranch);
    }
  }
  
  tree.branches.forEach(checkBranch);
  return { errors, warnings };
}

/**
 * Validate conditional syntax
 * @param {Object} tree - Tree object
 * @returns {Array} List of branches with invalid conditions
 */
function validateConditionalSyntax(tree) {
  const invalid = [];
  
  function checkBranch(branch) {
    if (branch.condition && branch.condition !== 'ELSE') {
      // Check for obviously invalid syntax
      // Valid conditions should be alphanumeric with underscores, or boolean expressions
      const validPattern = /^[a-zA-Z_][a-zA-Z0-9_]*(\s+(AND|OR)\s+[a-zA-Z_][a-zA-Z0-9_]*)*$|^NOT\s+[a-zA-Z_][a-zA-Z0-9_]*$/;
      const hasParens = /[()]/.test(branch.condition);
      
      // Allow parentheses for complex expressions or check basic pattern
      if (!hasParens && !validPattern.test(branch.condition)) {
        invalid.push(branch);
      }
    }
    
    if (branch.children) {
      branch.children.forEach(checkBranch);
    }
  }
  
  tree.branches.forEach(checkBranch);
  return invalid;
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
  // Handle null or undefined context
  if (!context || typeof context !== 'object') {
    return false;
  }
  
  if (condition === 'ELSE') {
    return true; // ELSE is evaluated separately
  }
  
  condition = condition.trim();
  
  // Handle parentheses - find outermost parens and evaluate inside
  if (condition.startsWith('(') && condition.endsWith(')')) {
    // Remove outer parens and re-evaluate
    return evaluateCondition(condition.substring(1, condition.length - 1), context);
  }
  
  // Handle NOT operator (highest precedence)
  if (condition.startsWith('NOT ')) {
    const subCondition = condition.substring(4).trim();
    return !evaluateCondition(subCondition, context);
  }
  
  // Parse OR operators (lowest precedence, evaluate last)
  // Find OR outside of parentheses
  let parenDepth = 0;
  for (let i = 0; i < condition.length - 3; i++) {
    if (condition[i] === '(') parenDepth++;
    if (condition[i] === ')') parenDepth--;
    
    if (parenDepth === 0 && condition.substring(i, i + 4) === ' OR ') {
      const left = condition.substring(0, i).trim();
      const right = condition.substring(i + 4).trim();
      return evaluateCondition(left, context) || evaluateCondition(right, context);
    }
  }
  
  // Parse AND operators (higher precedence than OR)
  parenDepth = 0;
  for (let i = 0; i < condition.length - 4; i++) {
    if (condition[i] === '(') parenDepth++;
    if (condition[i] === ')') parenDepth--;
    
    if (parenDepth === 0 && condition.substring(i, i + 5) === ' AND ') {
      const left = condition.substring(0, i).trim();
      const right = condition.substring(i + 5).trim();
      return evaluateCondition(left, context) && evaluateCondition(right, context);
    }
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
