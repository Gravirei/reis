/**
 * Decision Tree Linter for REIS v2.0
 * Provides semantic validation and linting for decision trees
 */

const chalk = require('chalk');

/**
 * Lint a decision tree with semantic validation rules
 * @param {Object} tree - Parsed tree structure
 * @returns {Object} Lint results with errors, warnings, and suggestions
 */
function lintTree(tree) {
  if (!tree || !tree.branches) {
    return {
      valid: false,
      errors: ['Invalid tree structure'],
      warnings: [],
      suggestions: []
    };
  }

  const results = {
    valid: true,
    errors: [],
    warnings: [],
    suggestions: []
  };

  // Run all linting rules
  checkCircularReferences(tree, results);
  checkOrphanBranches(tree, results);
  checkUnbalancedTree(tree, results);
  checkMissingCommonOptions(tree, results);
  checkMetadataConsistency(tree, results);
  validateConditionalSyntax(tree, results);

  // Set valid flag based on errors
  results.valid = results.errors.length === 0;

  return results;
}

/**
 * Check for circular references in conditional branches
 * @param {Object} tree - Tree structure
 * @param {Object} results - Results object to populate
 */
function checkCircularReferences(tree, results) {
  const visited = new Set();
  const stack = new Set();

  const detectCycle = (branch, path) => {
    const branchId = getBranchIdentifier(branch);
    
    if (stack.has(branchId)) {
      results.errors.push(
        `Circular reference detected: "${branch.text}" references itself in the path: ${path.join(' → ')}`
      );
      return true;
    }

    if (visited.has(branchId)) {
      return false;
    }

    visited.add(branchId);
    stack.add(branchId);

    // Check children for cycles
    if (branch.children && branch.children.length > 0) {
      for (const child of branch.children) {
        if (detectCycle(child, [...path, branch.text])) {
          return true;
        }
      }
    }

    stack.delete(branchId);
    return false;
  };

  if (tree.branches) {
    tree.branches.forEach(branch => {
      detectCycle(branch, [tree.root]);
    });
  }
}

/**
 * Get a unique identifier for a branch
 * @param {Object} branch - Branch object
 * @returns {string} Unique identifier
 */
function getBranchIdentifier(branch) {
  return `${branch.text}|${branch.outcome || ''}|${branch.condition || ''}`;
}

/**
 * Check for orphan branches (unreachable nodes)
 * @param {Object} tree - Tree structure
 * @param {Object} results - Results object to populate
 */
function checkOrphanBranches(tree, results) {
  // For now, we assume all branches are reachable from root
  // In a more complex implementation, we would track conditional paths
  
  const allBranches = [];
  const collectBranches = (branches) => {
    branches.forEach(branch => {
      allBranches.push(branch);
      if (branch.children && branch.children.length > 0) {
        collectBranches(branch.children);
      }
    });
  };

  if (tree.branches) {
    collectBranches(tree.branches);
  }

  // Check for branches with impossible conditions
  allBranches.forEach(branch => {
    if (branch.condition && branch.condition !== 'ELSE') {
      // Check for mutually exclusive conditions at same level
      const parent = findParent(tree, branch);
      if (parent) {
        const siblings = parent.children || tree.branches;
        const ifConditions = siblings
          .filter(b => b.condition && b.condition !== 'ELSE')
          .map(b => b.condition);
        
        // Simple check: warn if multiple branches have same condition
        const conditionCounts = {};
        ifConditions.forEach(cond => {
          conditionCounts[cond] = (conditionCounts[cond] || 0) + 1;
        });
        
        Object.entries(conditionCounts).forEach(([cond, count]) => {
          if (count > 1) {
            results.warnings.push(
              `Duplicate condition "${cond}" found ${count} times - may indicate redundant branches`
            );
          }
        });
      }
    }
  });
}

/**
 * Find parent of a branch in tree
 * @param {Object} tree - Tree structure
 * @param {Object} targetBranch - Branch to find parent for
 * @returns {Object|null} Parent branch or null
 */
function findParent(tree, targetBranch) {
  let parent = null;

  const search = (branches) => {
    for (const branch of branches) {
      if (branch.children && branch.children.includes(targetBranch)) {
        parent = branch;
        return true;
      }
      if (branch.children) {
        if (search(branch.children)) return true;
      }
    }
    return false;
  };

  if (tree.branches) {
    search(tree.branches);
  }

  return parent;
}

/**
 * Check for unbalanced trees (one path much deeper than others)
 * @param {Object} tree - Tree structure
 * @param {Object} results - Results object to populate
 */
function checkUnbalancedTree(tree, results) {
  const depths = [];

  const getDepth = (branch, currentDepth = 0) => {
    if (!branch.children || branch.children.length === 0) {
      depths.push(currentDepth);
      return;
    }

    branch.children.forEach(child => {
      getDepth(child, currentDepth + 1);
    });
  };

  if (tree.branches) {
    tree.branches.forEach(branch => getDepth(branch, 1));
  }

  if (depths.length === 0) return;

  const maxDepth = Math.max(...depths);
  const minDepth = Math.min(...depths);
  const avgDepth = depths.reduce((a, b) => a + b, 0) / depths.length;

  // Warn if max depth is more than 2x the average
  if (maxDepth > avgDepth * 2) {
    results.warnings.push(
      `Unbalanced tree detected: deepest path is ${maxDepth} levels while average is ${avgDepth.toFixed(1)} levels. Consider restructuring for better readability.`
    );
  }

  // Warn if difference between max and min is very large
  if (maxDepth - minDepth > 4) {
    results.warnings.push(
      `Large depth variance: deepest path (${maxDepth}) is ${maxDepth - minDepth} levels deeper than shallowest (${minDepth}). This may confuse users.`
    );
  }
}

/**
 * Check for missing common options
 * @param {Object} tree - Tree structure
 * @param {Object} results - Results object to populate
 */
function checkMissingCommonOptions(tree, results) {
  if (!tree.branches || tree.branches.length === 0) return;

  const topLevelTexts = tree.branches.map(b => b.text.toLowerCase());

  // Common options that are often useful
  const commonOptions = [
    { texts: ['none', 'none of the above', 'skip', 'not applicable'], name: '"None of the above"' },
    { texts: ['other', 'custom', 'manual'], name: '"Other/Custom"' },
    { texts: ['not sure', 'undecided', 'need help'], name: '"Not sure/Need help"' }
  ];

  // Check if tree is asking a question that might benefit from these options
  const rootLower = tree.root.toLowerCase();
  const isQuestion = rootLower.includes('?') || rootLower.includes('which') || 
                     rootLower.includes('what') || rootLower.includes('how');

  if (isQuestion && tree.branches.length >= 3) {
    commonOptions.forEach(option => {
      const hasOption = option.texts.some(text => 
        topLevelTexts.some(branch => branch.includes(text))
      );

      if (!hasOption) {
        results.suggestions.push(
          `Consider adding a ${option.name} option for users who don't fit the listed choices`
        );
      }
    });
  }
}

/**
 * Check metadata consistency across branches
 * @param {Object} tree - Tree structure
 * @param {Object} results - Results object to populate
 */
function checkMetadataConsistency(tree, results) {
  const allBranches = [];
  const collectBranches = (branches) => {
    branches.forEach(branch => {
      allBranches.push(branch);
      if (branch.children && branch.children.length > 0) {
        collectBranches(branch.children);
      }
    });
  };

  if (tree.branches) {
    collectBranches(tree.branches);
  }

  // Check if some branches have metadata but not all
  const branchesWithWeight = allBranches.filter(b => b.metadata && b.metadata.weight);
  const branchesWithPriority = allBranches.filter(b => b.metadata && b.metadata.priority);
  const branchesWithRisk = allBranches.filter(b => b.metadata && b.metadata.risk);

  const totalBranches = allBranches.length;

  // Warn if only some branches have weights
  if (branchesWithWeight.length > 0 && branchesWithWeight.length < totalBranches * 0.5) {
    results.warnings.push(
      `Inconsistent weight metadata: only ${branchesWithWeight.length} of ${totalBranches} branches have weights. Consider adding weights to all branches or removing them.`
    );
  }

  // Suggest adding priority if many branches but no priorities
  if (totalBranches >= 5 && branchesWithPriority.length === 0) {
    results.suggestions.push(
      `Consider adding priority metadata to help users understand which options to consider first`
    );
  }

  // Suggest adding risk assessment if this is a technical decision
  if (totalBranches >= 3 && branchesWithRisk.length === 0) {
    const rootLower = tree.root.toLowerCase();
    const technicalKeywords = ['database', 'api', 'deployment', 'architecture', 'implementation', 'technology'];
    const isTechnical = technicalKeywords.some(keyword => rootLower.includes(keyword));

    if (isTechnical) {
      results.suggestions.push(
        `Consider adding risk metadata to help users understand the trade-offs of each option`
      );
    }
  }

  // Check for multiple recommended branches
  const recommendedBranches = allBranches.filter(b => b.metadata && b.metadata.recommended);
  if (recommendedBranches.length > 1) {
    results.warnings.push(
      `Multiple branches marked as recommended (${recommendedBranches.length}). Consider having only one recommended option per level.`
    );
  }
}

/**
 * Validate conditional syntax
 * @param {Object} tree - Tree structure
 * @param {Object} results - Results object to populate
 */
function validateConditionalSyntax(tree, results) {
  const allBranches = [];
  const collectBranches = (branches) => {
    branches.forEach(branch => {
      allBranches.push(branch);
      if (branch.children && branch.children.length > 0) {
        collectBranches(branch.children);
      }
    });
  };

  if (tree.branches) {
    collectBranches(tree.branches);
  }

  // Check conditional syntax
  allBranches.forEach(branch => {
    if (branch.condition && branch.condition !== 'ELSE') {
      // Check for valid condition syntax
      const condition = branch.condition;

      // Simple validation: check for basic patterns
      const validPatterns = [
        /^[a-z_][a-z0-9_]*$/i, // Simple variable: has_database
        /^[a-z_][a-z0-9_]*\s+(AND|OR)\s+[a-z_][a-z0-9_]*$/i, // Simple boolean: has_database AND typescript
        /^[a-z_][a-z0-9_]*\s+(AND|OR)\s+[a-z_][a-z0-9_]*(\s+(AND|OR)\s+[a-z_][a-z0-9_]*)*$/i // Multiple: a AND b OR c
      ];

      const isValid = validPatterns.some(pattern => pattern.test(condition));

      if (!isValid) {
        results.warnings.push(
          `Potentially invalid conditional syntax: "${condition}" in branch "${branch.text}". Use simple conditions like "has_database" or "serverless AND typescript".`
        );
      }
    }
  });

  // Check for ELSE without IF
  const branchGroups = groupBranchesByLevel(tree);
  branchGroups.forEach((branches, level) => {
    const hasElse = branches.some(b => b.condition === 'ELSE');
    const hasIf = branches.some(b => b.condition && b.condition !== 'ELSE');

    if (hasElse && !hasIf) {
      results.warnings.push(
        `[ELSE] branch found without corresponding [IF:] condition at level ${level}. ELSE should only be used as a fallback for conditional branches.`
      );
    }
  });
}

/**
 * Group branches by their depth level
 * @param {Object} tree - Tree structure
 * @returns {Map} Map of level to branches at that level
 */
function groupBranchesByLevel(tree) {
  const groups = new Map();

  const traverse = (branches, level) => {
    if (!groups.has(level)) {
      groups.set(level, []);
    }

    branches.forEach(branch => {
      groups.get(level).push(branch);
      if (branch.children && branch.children.length > 0) {
        traverse(branch.children, level + 1);
      }
    });
  };

  if (tree.branches) {
    traverse(tree.branches, 1);
  }

  return groups;
}

/**
 * Format lint results for display
 * @param {Object} results - Lint results from lintTree()
 * @param {Object} options - Formatting options
 * @param {boolean} [options.colors=true] - Enable color coding
 * @param {boolean} [options.showSuggestions=true] - Show suggestions
 * @returns {string} Formatted lint results
 */
function formatLintResults(results, options = {}) {
  const { colors = true, showSuggestions = true } = options;

  if (!results) {
    return 'No lint results available';
  }

  const lines = [];

  // Summary
  const totalIssues = results.errors.length + results.warnings.length;
  
  if (totalIssues === 0) {
    const message = '✓ No issues found';
    lines.push('');
    lines.push(colors ? chalk.green(message) : message);
    
    if (showSuggestions && results.suggestions.length > 0) {
      lines.push('');
      lines.push(colors ? chalk.cyan(`💡 ${results.suggestions.length} suggestion(s):`) : `Suggestions (${results.suggestions.length}):`);
      results.suggestions.forEach((sug, i) => {
        lines.push(colors ? chalk.dim(`  ${i + 1}. ${sug}`) : `  ${i + 1}. ${sug}`);
      });
    }
    
    lines.push('');
    return lines.join('\n');
  }

  // Header
  lines.push('');
  const summary = `Found ${results.errors.length} error(s) and ${results.warnings.length} warning(s)`;
  lines.push(colors ? chalk.bold(summary) : summary);
  lines.push('');

  // Errors
  if (results.errors.length > 0) {
    lines.push(colors ? chalk.red.bold('Errors:') : 'Errors:');
    results.errors.forEach((error, i) => {
      lines.push(colors ? chalk.red(`  ${i + 1}. ${error}`) : `  ${i + 1}. ${error}`);
    });
    lines.push('');
  }

  // Warnings
  if (results.warnings.length > 0) {
    lines.push(colors ? chalk.yellow.bold('Warnings:') : 'Warnings:');
    results.warnings.forEach((warning, i) => {
      lines.push(colors ? chalk.yellow(`  ${i + 1}. ${warning}`) : `  ${i + 1}. ${warning}`);
    });
    lines.push('');
  }

  // Suggestions
  if (showSuggestions && results.suggestions.length > 0) {
    lines.push(colors ? chalk.cyan.bold('Suggestions:') : 'Suggestions:');
    results.suggestions.forEach((sug, i) => {
      lines.push(colors ? chalk.cyan(`  ${i + 1}. ${sug}`) : `  ${i + 1}. ${sug}`);
    });
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Get severity level for a lint result
 * @param {Object} result - Individual lint result
 * @returns {string} Severity level: 'error', 'warning', or 'info'
 */
function getLintSeverity(result) {
  if (!result) return 'info';

  // Determine severity based on message content
  const message = result.message || result.toString();
  const messageLower = message.toLowerCase();

  if (messageLower.includes('circular') || 
      messageLower.includes('invalid') ||
      messageLower.includes('error')) {
    return 'error';
  }

  if (messageLower.includes('warn') ||
      messageLower.includes('unbalanced') ||
      messageLower.includes('inconsistent') ||
      messageLower.includes('multiple')) {
    return 'warning';
  }

  return 'info';
}

module.exports = {
  lintTree,
  formatLintResults,
  getLintSeverity
};
