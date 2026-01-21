/**
 * Decision Tree Differ for REIS v2.0
 * Provides tree comparison and diffing capabilities
 */

const chalk = require('chalk');

/**
 * Compare two decision trees and generate a diff
 * @param {Object} tree1 - First tree (base/old version)
 * @param {Object} tree2 - Second tree (new version)
 * @returns {Object} Diff object with changes
 */
function diffTrees(tree1, tree2) {
  if (!tree1 || !tree2) {
    throw new Error('Both trees are required for comparison');
  }

  const diff = {
    name: tree2.name || tree1.name,
    rootChanged: tree1.root !== tree2.root,
    oldRoot: tree1.root,
    newRoot: tree2.root,
    changes: []
  };

  // Compare branches recursively
  const tree1Branches = tree1.branches || [];
  const tree2Branches = tree2.branches || [];

  // Create maps for easier comparison
  const tree1Map = createBranchMap(tree1Branches);
  const tree2Map = createBranchMap(tree2Branches);

  // Find added, removed, and modified branches
  const allKeys = new Set([...tree1Map.keys(), ...tree2Map.keys()]);

  for (const key of allKeys) {
    const branch1 = tree1Map.get(key);
    const branch2 = tree2Map.get(key);

    if (!branch1 && branch2) {
      // Branch added
      diff.changes.push({
        type: 'added',
        path: getBranchPath(branch2),
        branch: branch2,
        text: branch2.text
      });
    } else if (branch1 && !branch2) {
      // Branch removed
      diff.changes.push({
        type: 'removed',
        path: getBranchPath(branch1),
        branch: branch1,
        text: branch1.text
      });
    } else if (branch1 && branch2) {
      // Check if modified
      const modifications = compareBranches(branch1, branch2);
      if (modifications.length > 0) {
        diff.changes.push({
          type: 'modified',
          path: getBranchPath(branch2),
          branch: branch2,
          oldBranch: branch1,
          modifications,
          text: branch2.text
        });
      }
    }
  }

  // Count statistics
  diff.stats = {
    added: diff.changes.filter(c => c.type === 'added').length,
    removed: diff.changes.filter(c => c.type === 'removed').length,
    modified: diff.changes.filter(c => c.type === 'modified').length,
    unchanged: Math.max(tree1Branches.length, tree2Branches.length) - 
              diff.changes.filter(c => c.type !== 'modified').length
  };

  return diff;
}

/**
 * Create a map of branches for easier comparison
 * @param {Array} branches - Array of branches
 * @param {string} prefix - Path prefix for nested branches
 * @returns {Map} Map of branch paths to branch objects
 */
function createBranchMap(branches, prefix = '') {
  const map = new Map();

  branches.forEach((branch, index) => {
    const path = prefix ? `${prefix}/${branch.text}` : branch.text;
    map.set(path, { ...branch, _path: path, _index: index });

    // Recursively add children
    if (branch.children && branch.children.length > 0) {
      const childMap = createBranchMap(branch.children, path);
      childMap.forEach((value, key) => map.set(key, value));
    }
  });

  return map;
}

/**
 * Get the full path of a branch (breadcrumb)
 * @param {Object} branch - Branch object with _path property
 * @returns {string} Full path
 */
function getBranchPath(branch) {
  return branch._path || branch.text;
}

/**
 * Compare two branches and find modifications
 * @param {Object} branch1 - Original branch
 * @param {Object} branch2 - New branch
 * @returns {Array} List of modifications
 */
function compareBranches(branch1, branch2) {
  const modifications = [];

  // Compare text
  if (branch1.text !== branch2.text) {
    modifications.push({
      field: 'text',
      oldValue: branch1.text,
      newValue: branch2.text
    });
  }

  // Compare outcome
  if (branch1.outcome !== branch2.outcome) {
    modifications.push({
      field: 'outcome',
      oldValue: branch1.outcome || null,
      newValue: branch2.outcome || null
    });
  }

  // Compare condition
  if (branch1.condition !== branch2.condition) {
    modifications.push({
      field: 'condition',
      oldValue: branch1.condition || null,
      newValue: branch2.condition || null
    });
  }

  // Compare metadata
  const metadata1 = branch1.metadata || {};
  const metadata2 = branch2.metadata || {};
  const metadataKeys = new Set([...Object.keys(metadata1), ...Object.keys(metadata2)]);

  for (const key of metadataKeys) {
    if (metadata1[key] !== metadata2[key]) {
      modifications.push({
        field: `metadata.${key}`,
        oldValue: metadata1[key],
        newValue: metadata2[key]
      });
    }
  }

  return modifications;
}

/**
 * Format diff output for terminal display
 * @param {Object} diff - Diff object from diffTrees()
 * @param {Object} options - Formatting options
 * @param {boolean} [options.verbose=false] - Show detailed modifications
 * @param {boolean} [options.colors=true] - Enable color coding
 * @returns {string} Formatted diff output
 */
function formatDiff(diff, options = {}) {
  const { verbose = false, colors = true } = options;

  if (!diff) {
    return 'No diff data available';
  }

  const lines = [];

  // Header
  lines.push('');
  lines.push(colors ? chalk.bold.cyan(`Tree Diff: ${diff.name}`) : `Tree Diff: ${diff.name}`);
  lines.push('');

  // Root change
  if (diff.rootChanged) {
    lines.push(colors ? chalk.yellow('~ Root question changed:') : '~ Root question changed:');
    lines.push(colors ? chalk.red(`  - ${diff.oldRoot}`) : `  - ${diff.oldRoot}`);
    lines.push(colors ? chalk.green(`  + ${diff.newRoot}`) : `  + ${diff.newRoot}`);
    lines.push('');
  }

  // Statistics
  lines.push('Summary:');
  lines.push(`  ${colors ? chalk.green('+') : '+'} ${diff.stats.added} added`);
  lines.push(`  ${colors ? chalk.red('-') : '-'} ${diff.stats.removed} removed`);
  lines.push(`  ${colors ? chalk.yellow('~') : '~'} ${diff.stats.modified} modified`);
  lines.push(`  ${colors ? chalk.gray('=') : '='} ${diff.stats.unchanged} unchanged`);
  lines.push('');

  // Changes
  if (diff.changes.length === 0) {
    lines.push(colors ? chalk.gray('No changes detected') : 'No changes detected');
  } else {
    lines.push('Changes:');
    lines.push('');

    // Sort changes by type and path
    const sortedChanges = [...diff.changes].sort((a, b) => {
      const typeOrder = { removed: 0, modified: 1, added: 2 };
      const typeCompare = typeOrder[a.type] - typeOrder[b.type];
      if (typeCompare !== 0) return typeCompare;
      return a.path.localeCompare(b.path);
    });

    sortedChanges.forEach(change => {
      switch (change.type) {
        case 'added':
          if (colors) {
            lines.push(chalk.green('+ ') + change.path);
            if (verbose && change.branch.metadata) {
              const metadata = formatMetadata(change.branch.metadata, colors);
              if (metadata) lines.push(chalk.gray('  ' + metadata));
            }
          } else {
            lines.push(`+ ${change.path}`);
          }
          break;

        case 'removed':
          if (colors) {
            lines.push(chalk.red('- ') + change.path);
            if (verbose && change.branch.metadata) {
              const metadata = formatMetadata(change.branch.metadata, colors);
              if (metadata) lines.push(chalk.gray('  ' + metadata));
            }
          } else {
            lines.push(`- ${change.path}`);
          }
          break;

        case 'modified':
          if (colors) {
            lines.push(chalk.yellow('~ ') + change.path);
            if (verbose && change.modifications) {
              change.modifications.forEach(mod => {
                lines.push(chalk.gray(`    ${mod.field}:`));
                lines.push(chalk.red(`      - ${mod.oldValue || '(none)'}`));
                lines.push(chalk.green(`      + ${mod.newValue || '(none)'}`));
              });
            }
          } else {
            lines.push(`~ ${change.path}`);
            if (verbose && change.modifications) {
              change.modifications.forEach(mod => {
                lines.push(`    ${mod.field}:`);
                lines.push(`      - ${mod.oldValue || '(none)'}`);
                lines.push(`      + ${mod.newValue || '(none)'}`);
              });
            }
          }
          break;
      }
    });
  }

  lines.push('');
  return lines.join('\n');
}

/**
 * Format metadata for display
 * @param {Object} metadata - Metadata object
 * @param {boolean} colors - Enable colors
 * @returns {string} Formatted metadata string
 */
function formatMetadata(metadata, colors = true) {
  const parts = [];

  if (metadata.recommended) {
    parts.push(colors ? chalk.bgGreen.black(' RECOMMENDED ') : '[RECOMMENDED]');
  }
  if (metadata.weight) {
    parts.push(colors ? chalk.yellow(`[weight: ${metadata.weight}]`) : `[weight: ${metadata.weight}]`);
  }
  if (metadata.priority) {
    parts.push(colors ? chalk.yellow(`[priority: ${metadata.priority}]`) : `[priority: ${metadata.priority}]`);
  }
  if (metadata.risk) {
    parts.push(colors ? chalk.yellow(`[risk: ${metadata.risk}]`) : `[risk: ${metadata.risk}]`);
  }

  return parts.join(' ');
}

/**
 * Generate a patch that can transform tree1 into tree2
 * @param {Object} diff - Diff object from diffTrees()
 * @returns {Object} Patch object with operations
 */
function generatePatch(diff) {
  if (!diff) {
    throw new Error('Diff object is required');
  }

  const patch = {
    version: '1.0',
    name: diff.name,
    rootChange: diff.rootChanged ? {
      from: diff.oldRoot,
      to: diff.newRoot
    } : null,
    operations: []
  };

  // Convert changes to patch operations
  diff.changes.forEach(change => {
    switch (change.type) {
      case 'added':
        patch.operations.push({
          op: 'add',
          path: change.path,
          value: {
            text: change.branch.text,
            outcome: change.branch.outcome,
            condition: change.branch.condition,
            metadata: change.branch.metadata
          }
        });
        break;

      case 'removed':
        patch.operations.push({
          op: 'remove',
          path: change.path
        });
        break;

      case 'modified':
        change.modifications.forEach(mod => {
          patch.operations.push({
            op: 'replace',
            path: `${change.path}/${mod.field}`,
            oldValue: mod.oldValue,
            newValue: mod.newValue
          });
        });
        break;
    }
  });

  return patch;
}

/**
 * Apply a patch to a tree
 * @param {Object} tree - Original tree
 * @param {Object} patch - Patch object from generatePatch()
 * @returns {Object} Patched tree
 */
function applyPatch(tree, patch) {
  if (!tree || !patch) {
    throw new Error('Both tree and patch are required');
  }

  // Deep clone the tree
  const patchedTree = JSON.parse(JSON.stringify(tree));

  // Apply root change
  if (patch.rootChange) {
    patchedTree.root = patch.rootChange.to;
  }

  // Apply operations (simplified - full implementation would handle nested paths)
  patch.operations.forEach(op => {
    // Note: This is a basic implementation
    // Full implementation would require path parsing and tree traversal
    console.warn('applyPatch() is a simplified implementation');
  });

  return patchedTree;
}

module.exports = {
  diffTrees,
  formatDiff,
  generatePatch,
  applyPatch
};
