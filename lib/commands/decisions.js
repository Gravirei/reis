/**
 * Decisions Command
 * 
 * Command-line interface for decision tracking:
 * - List decisions
 * - Show decision details
 * - Revert decisions
 * - Export decisions
 * - View statistics
 */

const chalk = require('chalk');
const decisionTracker = require('../utils/decision-tracker');
const { createTable, formatTimestamp } = require('../utils/visualizer');
const fs = require('fs');
const path = require('path');

/**
 * List all decisions with optional filtering
 * @param {Object} options - Command options
 */
function listDecisions(options = {}) {
  const { tree, phase, reverted, limit } = options;
  
  // Build filters
  const filters = {};
  if (tree) filters.treeId = tree;
  if (phase) filters.phase = phase;
  if (reverted !== undefined) filters.reverted = reverted;
  
  let decisions = decisionTracker.getDecisions(filters);
  
  // Sort by timestamp (most recent first)
  decisions = decisions.sort((a, b) => 
    new Date(b.timestamp) - new Date(a.timestamp)
  );
  
  // Apply limit
  if (limit) {
    decisions = decisions.slice(0, limit);
  }
  
  if (decisions.length === 0) {
    console.log(chalk.yellow('No decisions found'));
    return;
  }
  
  console.log('');
  console.log(chalk.bold.cyan(`Decisions (${decisions.length})`));
  console.log('');
  
  // Create table
  const headers = ['ID', 'Tree', 'Path', 'Date', 'Status'];
  const rows = decisions.map(d => [
    d.id.substring(0, 8),
    d.treeId,
    d.selectedPath.join(' → '),
    formatTimestamp(new Date(d.timestamp)),
    d.reverted ? chalk.red('Reverted') : chalk.green('Active')
  ]);
  
  const table = createTable(headers, rows, { borders: true, colors: true });
  console.log(table);
  console.log('');
  console.log(chalk.dim(`Tip: Use 'reis decisions show <id>' to see details`));
  console.log('');
}

/**
 * Show detailed information about a decision
 * @param {string} decisionId - Decision ID (can be partial)
 * @param {Object} options - Command options
 */
function showDecision(decisionId, options = {}) {
  // Find decision by full or partial ID
  const allDecisions = decisionTracker.getDecisions();
  const decision = allDecisions.find(d => 
    d.id === decisionId || d.id.startsWith(decisionId)
  );
  
  if (!decision) {
    console.log(chalk.red(`✗ Decision not found: ${decisionId}`));
    return;
  }
  
  console.log('');
  console.log(chalk.bold.cyan('═'.repeat(60)));
  console.log(chalk.bold.cyan('Decision Details'));
  console.log(chalk.bold.cyan('═'.repeat(60)));
  console.log('');
  
  // Basic info
  console.log(chalk.bold('ID:'), decision.id);
  console.log(chalk.bold('Tree:'), decision.treeId);
  console.log(chalk.bold('Timestamp:'), formatTimestamp(new Date(decision.timestamp)));
  console.log(chalk.bold('Status:'), decision.reverted ? chalk.red('Reverted') : chalk.green('Active'));
  
  if (decision.reverted) {
    console.log(chalk.bold('Reverted At:'), formatTimestamp(new Date(decision.revertedAt)));
    if (decision.revertReason) {
      console.log(chalk.bold('Revert Reason:'), decision.revertReason);
    }
  }
  
  console.log('');
  console.log(chalk.bold('Selected Path:'));
  decision.selectedPath.forEach((step, i) => {
    const prefix = i === decision.selectedPath.length - 1 ? '  └─' : '  ├─';
    console.log(`${prefix} ${step}`);
  });
  
  // Metadata
  if (decision.metadata && Object.keys(decision.metadata).length > 0) {
    console.log('');
    console.log(chalk.bold('Metadata:'));
    Object.entries(decision.metadata).forEach(([key, value]) => {
      if (key === 'recommended' && value === true) {
        console.log(`  ${key}: ${chalk.green('★ Yes')}`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    });
  }
  
  // Context
  if (decision.context && Object.keys(decision.context).length > 0) {
    console.log('');
    console.log(chalk.bold('Context:'));
    Object.entries(decision.context).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
  }
  
  console.log('');
  console.log(chalk.bold.cyan('═'.repeat(60)));
  console.log('');
}

/**
 * Revert a decision
 * @param {string} decisionId - Decision ID (can be partial)
 * @param {Object} options - Command options
 */
function revertDecision(decisionId, options = {}) {
  const { reason } = options;
  
  // Find decision
  const allDecisions = decisionTracker.getDecisions();
  const decision = allDecisions.find(d => 
    d.id === decisionId || d.id.startsWith(decisionId)
  );
  
  if (!decision) {
    console.log(chalk.red(`✗ Decision not found: ${decisionId}`));
    return;
  }
  
  if (decision.reverted) {
    console.log(chalk.yellow(`⚠ Decision already reverted`));
    return;
  }
  
  // Revert it
  const success = decisionTracker.revertDecision(decision.id, reason);
  
  if (success) {
    console.log(chalk.green(`✓ Decision reverted: ${decision.id.substring(0, 8)}`));
    console.log(chalk.dim(`  Tree: ${decision.treeId}`));
    console.log(chalk.dim(`  Path: ${decision.selectedPath.join(' → ')}`));
    if (reason) {
      console.log(chalk.dim(`  Reason: ${reason}`));
    }
  } else {
    console.log(chalk.red(`✗ Failed to revert decision`));
  }
}

/**
 * Export decisions to file
 * @param {Object} options - Command options
 */
function exportDecisions(options = {}) {
  const { format = 'json', output, tree, phase } = options;
  
  // Build filters
  const filters = {};
  if (tree) filters.treeId = tree;
  if (phase) filters.phase = phase;
  
  let data;
  let extension;
  
  if (format === 'csv') {
    data = decisionTracker.exportToCSV(filters);
    extension = 'csv';
  } else {
    data = decisionTracker.exportToJSON(filters);
    extension = 'json';
  }
  
  // Determine output path
  const outputPath = output || `decisions-export-${Date.now()}.${extension}`;
  
  // Write file
  fs.writeFileSync(outputPath, data, 'utf-8');
  
  console.log(chalk.green(`✓ Decisions exported to: ${outputPath}`));
  console.log(chalk.dim(`  Format: ${format.toUpperCase()}`));
  
  const decisions = decisionTracker.getDecisions(filters);
  console.log(chalk.dim(`  Records: ${decisions.length}`));
}

/**
 * Show decision statistics
 * @param {Object} options - Command options
 */
function showStatistics(options = {}) {
  const stats = decisionTracker.getStatistics();
  
  console.log('');
  console.log(chalk.bold.cyan('Decision Statistics'));
  console.log('');
  
  console.log(chalk.bold('Overview:'));
  console.log(`  Total Decisions:    ${stats.total}`);
  console.log(`  Active:             ${chalk.green(stats.active)}`);
  console.log(`  Reverted:           ${chalk.red(stats.reverted)}`);
  console.log(`  Recent (7 days):    ${stats.recentCount}`);
  
  if (Object.keys(stats.byTree).length > 0) {
    console.log('');
    console.log(chalk.bold('By Tree:'));
    Object.entries(stats.byTree)
      .sort(([, a], [, b]) => b - a)
      .forEach(([tree, count]) => {
        console.log(`  ${tree.padEnd(30)} ${count}`);
      });
  }
  
  if (Object.keys(stats.byPhase).length > 0) {
    console.log('');
    console.log(chalk.bold('By Phase:'));
    Object.entries(stats.byPhase)
      .sort(([, a], [, b]) => b - a)
      .forEach(([phase, count]) => {
        console.log(`  ${phase.padEnd(30)} ${count}`);
      });
  }
  
  console.log('');
}

/**
 * Delete a decision
 * @param {string} decisionId - Decision ID (can be partial)
 * @param {Object} options - Command options
 */
function deleteDecision(decisionId, options = {}) {
  // Find decision
  const allDecisions = decisionTracker.getDecisions();
  const decision = allDecisions.find(d => 
    d.id === decisionId || d.id.startsWith(decisionId)
  );
  
  if (!decision) {
    console.log(chalk.red(`✗ Decision not found: ${decisionId}`));
    return;
  }
  
  console.log(chalk.yellow('⚠ Warning: This will permanently delete the decision'));
  console.log(chalk.dim(`  ID: ${decision.id}`));
  console.log(chalk.dim(`  Tree: ${decision.treeId}`));
  console.log(chalk.dim(`  Path: ${decision.selectedPath.join(' → ')}`));
  console.log('');
  
  // In a real implementation, we'd ask for confirmation
  // For now, we'll just delete
  const success = decisionTracker.deleteDecision(decision.id);
  
  if (success) {
    console.log(chalk.green(`✓ Decision deleted`));
  } else {
    console.log(chalk.red(`✗ Failed to delete decision`));
  }
}

/**
 * Main command handler
 * @param {string} subcommand - Subcommand (list, show, revert, export, stats)
 * @param {Array} args - Command arguments
 * @param {Object} options - Command options
 */
function decisionsCommand(subcommand, args = [], options = {}) {
  switch (subcommand) {
    case 'list':
      listDecisions(options);
      break;
      
    case 'show':
      if (args.length === 0) {
        console.log(chalk.red('✗ Decision ID required'));
        console.log(chalk.dim('Usage: reis decisions show <id>'));
        return;
      }
      showDecision(args[0], options);
      break;
      
    case 'revert':
      if (args.length === 0) {
        console.log(chalk.red('✗ Decision ID required'));
        console.log(chalk.dim('Usage: reis decisions revert <id> [--reason "reason"]'));
        return;
      }
      revertDecision(args[0], options);
      break;
      
    case 'export':
      exportDecisions(options);
      break;
      
    case 'stats':
    case 'statistics':
      showStatistics(options);
      break;
      
    case 'delete':
      if (args.length === 0) {
        console.log(chalk.red('✗ Decision ID required'));
        console.log(chalk.dim('Usage: reis decisions delete <id>'));
        return;
      }
      deleteDecision(args[0], options);
      break;
      
    default:
      // Default to list
      listDecisions(options);
  }
}

module.exports = decisionsCommand;
module.exports.listDecisions = listDecisions;
module.exports.showDecision = showDecision;
module.exports.revertDecision = revertDecision;
module.exports.exportDecisions = exportDecisions;
module.exports.showStatistics = showStatistics;
module.exports.deleteDecision = deleteDecision;
