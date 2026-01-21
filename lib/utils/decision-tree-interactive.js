/**
 * Interactive Decision Tree Selection
 * 
 * Provides interactive navigation and selection for decision trees:
 * - Arrow key navigation
 * - Branch selection and expansion
 * - Decision recording with context
 * - Breadcrumb path display
 */

const inquirer = require('inquirer');
const chalk = require('chalk');

/**
 * Interactive branch selection with arrow keys
 * @param {Object} tree - Parsed tree structure
 * @param {Object} options - Selection options
 * @param {Object} [options.context] - Context to pass to downstream commands
 * @param {boolean} [options.autoSelect] - Auto-select recommended option
 * @param {boolean} [options.showMetadata=true] - Show metadata during selection
 * @returns {Promise<Object>} Selected branch with full path
 */
async function selectBranch(tree, options = {}) {
  const {
    context = {},
    autoSelect = false,
    showMetadata = true
  } = options;

  if (!tree || !tree.branches || tree.branches.length === 0) {
    throw new Error('Invalid tree structure');
  }

  // Auto-select recommended if enabled
  if (autoSelect) {
    const recommended = findRecommendedBranch(tree.branches);
    if (recommended) {
      return {
        branch: recommended,
        path: [recommended.text],
        metadata: recommended.metadata || {},
        context
      };
    }
  }

  // Interactive selection
  const selectedPath = [];
  let currentBranches = tree.branches;
  let currentBranch = null;

  console.log('');
  console.log(chalk.bold.cyan(`Decision: ${tree.name}`));
  console.log(chalk.bold(tree.root));
  console.log('');
  console.log(chalk.dim('Use arrow keys to navigate, Enter to select'));
  console.log('');

  while (currentBranches && currentBranches.length > 0) {
    // Show breadcrumb
    if (selectedPath.length > 0) {
      console.log(chalk.gray('Path: ' + selectedPath.join(' → ')));
      console.log('');
    }

    // Prepare choices
    const choices = currentBranches.map(branch => {
      let name = branch.text;
      
      // Add metadata badges
      if (showMetadata && branch.metadata) {
        const badges = [];
        if (branch.metadata.recommended) {
          badges.push(chalk.green('★'));
        }
        if (branch.metadata.weight) {
          badges.push(chalk.yellow(`W:${branch.metadata.weight}`));
        }
        if (branch.metadata.risk) {
          const riskColors = { high: chalk.red, medium: chalk.yellow, low: chalk.green };
          const colorFn = riskColors[branch.metadata.risk] || chalk.gray;
          badges.push(colorFn(`R:${branch.metadata.risk}`));
        }
        
        if (badges.length > 0) {
          name = `${name} ${chalk.dim('[' + badges.join(' ') + ']')}`;
        }
      }

      // Add outcome preview
      if (branch.outcome) {
        name = `${name}\n  ${chalk.dim.italic('→ ' + branch.outcome)}`;
      }

      return {
        name,
        value: branch,
        short: branch.text
      };
    });

    // Add back option if not at root
    if (selectedPath.length > 0) {
      choices.push({
        name: chalk.dim('← Go back'),
        value: '__BACK__',
        short: 'Back'
      });
    }

    // Prompt for selection
    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'branch',
        message: selectedPath.length === 0 
          ? 'Select an option:' 
          : 'Select next step:',
        choices,
        pageSize: 15
      }
    ]);

    // Handle back navigation
    if (answer.branch === '__BACK__') {
      selectedPath.pop();
      // Reconstruct current branches (simplified - in real implementation would track history)
      currentBranches = tree.branches;
      continue;
    }

    currentBranch = answer.branch;
    selectedPath.push(currentBranch.text);

    // Check if branch has children
    if (currentBranch.children && currentBranch.children.length > 0) {
      // Ask if user wants to continue or select this branch
      const continueAnswer = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'continue',
          message: 'This option has sub-options. Continue exploring?',
          default: true
        }
      ]);

      if (continueAnswer.continue) {
        currentBranches = currentBranch.children;
      } else {
        break;
      }
    } else {
      // Leaf node reached
      break;
    }
  }

  // Confirm selection
  const confirmed = await confirmSelection(currentBranch, selectedPath);
  
  if (!confirmed) {
    // Restart selection
    return selectBranch(tree, options);
  }

  return {
    branch: currentBranch,
    path: selectedPath,
    metadata: currentBranch.metadata || {},
    outcome: currentBranch.outcome,
    context
  };
}

/**
 * Navigate tree with arrow keys (advanced navigation)
 * @param {Object} tree - Parsed tree structure
 * @returns {Promise<Object>} Navigation result
 */
async function navigateTree(tree) {
  // For now, use selectBranch
  // Future: implement more advanced navigation with expand/collapse
  return selectBranch(tree);
}

/**
 * Confirm user's selection
 * @param {Object} branch - Selected branch
 * @param {Array<string>} path - Selection path
 * @returns {Promise<boolean>} True if confirmed
 */
async function confirmSelection(branch, path) {
  console.log('');
  console.log(chalk.bold.green('✓ Selected:'));
  console.log(chalk.cyan('  ' + path.join(' → ')));
  
  if (branch.outcome) {
    console.log(chalk.dim('  Result: ' + branch.outcome));
  }
  
  if (branch.metadata) {
    console.log('');
    console.log(chalk.bold('Metadata:'));
    if (branch.metadata.weight) {
      console.log(`  Weight: ${branch.metadata.weight}/10`);
    }
    if (branch.metadata.priority) {
      console.log(`  Priority: ${branch.metadata.priority}`);
    }
    if (branch.metadata.risk) {
      console.log(`  Risk: ${branch.metadata.risk}`);
    }
  }
  
  console.log('');

  const answer = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Confirm this selection?',
      default: true
    }
  ]);

  return answer.confirm;
}

/**
 * Record decision with full context
 * @param {string} treeName - Tree name/identifier
 * @param {Object} selectedBranch - Selected branch object
 * @param {Object} context - Additional context
 * @returns {Object} Decision record
 */
function recordDecision(treeName, selectedBranch, context = {}) {
  const decisionTracker = require('./decision-tracker');
  
  const decision = {
    treeId: treeName,
    selectedPath: selectedBranch.path || [selectedBranch.text],
    metadata: selectedBranch.metadata || {},
    context: {
      ...context,
      outcome: selectedBranch.outcome
    },
    timestamp: new Date().toISOString()
  };

  const tracked = decisionTracker.trackDecision(decision);
  
  // Return in format expected by tests
  return {
    id: tracked.id,
    treeName: treeName,
    selection: selectedBranch,
    context: context,
    timestamp: tracked.timestamp
  };
}

/**
 * Find recommended branch in tree
 * @param {Array} branches - Array of branches
 * @returns {Object|null} Recommended branch or null
 */
function findRecommendedBranch(branches) {
  for (const branch of branches) {
    if (branch.metadata && branch.metadata.recommended) {
      return branch;
    }
    
    // Search children recursively
    if (branch.children && branch.children.length > 0) {
      const found = findRecommendedBranch(branch.children);
      if (found) return found;
    }
  }
  
  return null;
}

/**
 * Present multiple trees for selection
 * @param {Array<Object>} trees - Array of tree objects
 * @param {Object} options - Selection options
 * @returns {Promise<Object>} Selected tree and branch
 */
async function selectFromMultipleTrees(trees, options = {}) {
  if (!trees || trees.length === 0) {
    throw new Error('No trees provided');
  }

  if (trees.length === 1) {
    // Only one tree, select from it directly
    const selection = await selectBranch(trees[0], options);
    return {
      tree: trees[0],
      selection
    };
  }

  // Multiple trees - first select which tree
  console.log('');
  console.log(chalk.bold.cyan('Multiple decision trees found'));
  console.log('');

  const treeChoices = trees.map((tree, i) => ({
    name: `${i + 1}. ${tree.name}\n   ${chalk.dim(tree.root)}`,
    value: tree,
    short: tree.name
  }));

  const treeAnswer = await inquirer.prompt([
    {
      type: 'list',
      name: 'tree',
      message: 'Select a decision tree:',
      choices: treeChoices,
      pageSize: 10
    }
  ]);

  const selection = await selectBranch(treeAnswer.tree, options);
  
  return {
    tree: treeAnswer.tree,
    selection
  };
}

/**
 * Show decision summary after selection
 * @param {Object} selection - Selection result from selectBranch
 */
function showDecisionSummary(selection) {
  console.log('');
  console.log(chalk.bold.green('═'.repeat(60)));
  console.log(chalk.bold.green('Decision Summary'));
  console.log(chalk.bold.green('═'.repeat(60)));
  console.log('');
  
  console.log(chalk.bold('Selected Path:'));
  selection.path.forEach((step, i) => {
    const prefix = i === selection.path.length - 1 ? '  └─' : '  ├─';
    console.log(`${prefix} ${step}`);
  });
  
  if (selection.outcome) {
    console.log('');
    console.log(chalk.bold('Expected Outcome:'));
    console.log(`  ${selection.outcome}`);
  }
  
  if (selection.metadata && Object.keys(selection.metadata).length > 0) {
    console.log('');
    console.log(chalk.bold('Metadata:'));
    Object.entries(selection.metadata).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
  }
  
  console.log('');
  console.log(chalk.bold.green('═'.repeat(60)));
  console.log('');
}

module.exports = {
  selectBranch,
  navigateTree,
  confirmSelection,
  recordDecision,
  findRecommendedBranch,
  selectFromMultipleTrees,
  showDecisionSummary
};
