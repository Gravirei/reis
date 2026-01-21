/**
 * Tree Command
 * 
 * Command-line interface for decision tree management:
 * - Show tree from file
 * - Create tree from template
 * - List available templates
 * - Validate tree syntax
 * - Export trees to various formats
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { parseDecisionTrees, validateTree } = require('../utils/decision-tree-parser');
const { renderDecisionTree } = require('../utils/visualizer');
const { exportToHTML, exportToSVG, exportToMermaid, exportAll } = require('../utils/decision-tree-exporter');
const { selectBranch, showDecisionSummary } = require('../utils/decision-tree-interactive');
const { diffTrees, formatDiff } = require('../utils/decision-tree-differ');
const { lintTree, formatLintResults } = require('../utils/decision-tree-linter');

const TEMPLATES_DIR = path.join(__dirname, '../../templates/decision-trees');

/**
 * Show tree from file
 * @param {string} filePath - Path to markdown file
 * @param {Object} options - Command options
 */
async function showTree(filePath, options = {}) {
  const { depth, metadata = true, interactive = false, context: contextStr, noColor = false, highContrast = false, asciiOnly = false } = options;
  
  if (!fs.existsSync(filePath)) {
    console.log(chalk.red(`✗ File not found: ${filePath}`));
    return;
  }
  
  // Read file
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Parse trees
  const trees = parseDecisionTrees(content);
  
  if (trees.length === 0) {
    console.log(chalk.yellow('⚠ No decision trees found in file'));
    console.log(chalk.dim('Trees must start with "## Decision Tree: [Name]"'));
    return;
  }
  
  // Parse context if provided
  let context = {};
  if (contextStr) {
    try {
      context = JSON.parse(contextStr);
    } catch (e) {
      console.log(chalk.yellow('⚠ Invalid context JSON, ignoring'));
    }
  }
  
  // Interactive mode
  if (interactive) {
    const { selectFromMultipleTrees } = require('../utils/decision-tree-interactive');
    
    try {
      const result = await selectFromMultipleTrees(trees, { 
        context,
        showMetadata: metadata 
      });
      
      showDecisionSummary(result.selection);
      
      // Ask if user wants to record decision
      const inquirer = require('inquirer');
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Record this decision?',
          default: true
        }
      ]);
      
      if (confirm) {
        const { recordDecision } = require('../utils/decision-tree-interactive');
        const decision = recordDecision(result.tree.name, result.selection, context);
        console.log(chalk.green(`✓ Decision recorded: ${decision.id.substring(0, 8)}`));
      }
    } catch (error) {
      console.log(chalk.red(`✗ Error: ${error.message}`));
    }
    
    return;
  }
  
  // Display mode
  for (const tree of trees) {
    const rendered = renderDecisionTree(tree, {
      depth: depth ? parseInt(depth) : Infinity,
      showMetadata: metadata,
      evaluateConditions: false,
      context,
      noColor,
      highContrast,
      asciiOnly
    });
    
    console.log(rendered);
  }
}

/**
 * Create new tree from template
 * @param {string} templateName - Template name
 * @param {Object} options - Command options
 */
function createFromTemplate(templateName, options = {}) {
  const { output } = options;
  
  // Find template
  const templatePath = path.join(TEMPLATES_DIR, `${templateName}.md`);
  
  if (!fs.existsSync(templatePath)) {
    console.log(chalk.red(`✗ Template not found: ${templateName}`));
    console.log(chalk.dim('Use "reis tree list" to see available templates'));
    return;
  }
  
  // Determine output path
  const outputPath = output || path.join('decision-trees', `${templateName}.md`);
  
  // Create directory if needed
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Copy template
  fs.copyFileSync(templatePath, outputPath);
  
  console.log(chalk.green(`✓ Created decision tree: ${outputPath}`));
  console.log(chalk.dim(`  From template: ${templateName}`));
  console.log('');
  console.log(chalk.cyan('Next steps:'));
  console.log(`  1. Edit the file: ${outputPath}`);
  console.log(`  2. View it: reis tree show ${outputPath}`);
  console.log(`  3. Use interactively: reis tree show ${outputPath} --interactive`);
}

/**
 * List available templates
 * @param {Object} options - Command options
 */
function listTemplates(options = {}) {
  if (!fs.existsSync(TEMPLATES_DIR)) {
    console.log(chalk.yellow('⚠ Templates directory not found'));
    return;
  }
  
  const templates = fs.readdirSync(TEMPLATES_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace('.md', ''));
  
  if (templates.length === 0) {
    console.log(chalk.yellow('⚠ No templates found'));
    return;
  }
  
  console.log('');
  console.log(chalk.bold.cyan(`Decision Tree Templates (${templates.length})`));
  console.log('');
  
  templates.forEach(template => {
    const templatePath = path.join(TEMPLATES_DIR, `${template}.md`);
    const content = fs.readFileSync(templatePath, 'utf-8');
    
    // Extract first line after title for description
    const lines = content.split('\n');
    const titleLine = lines.find(l => l.startsWith('# '));
    const title = titleLine ? titleLine.replace('# ', '') : template;
    
    console.log(chalk.bold(`  ${template}`));
    console.log(chalk.dim(`    ${title}`));
    console.log('');
  });
  
  console.log(chalk.cyan('Usage:'));
  console.log(`  reis tree new <template-name>`);
  console.log('');
  console.log(chalk.dim('Examples:'));
  console.log(chalk.dim('  reis tree new auth'));
  console.log(chalk.dim('  reis tree new database --output my-decisions/db.md'));
}

/**
 * Lint tree for semantic issues
 * @param {string} filePath - Path to markdown file
 * @param {Object} options - Command options
 */
function lintTreeFile(filePath, options = {}) {
  const { strict = false, verbose = true } = options;
  
  if (!fs.existsSync(filePath)) {
    console.log(chalk.red(`✗ File not found: ${filePath}`));
    return;
  }
  
  // Read file
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Parse trees
  const trees = parseDecisionTrees(content);
  
  if (trees.length === 0) {
    console.log(chalk.red('✗ No decision trees found in file'));
    return;
  }
  
  console.log('');
  console.log(chalk.bold.cyan(`Linting ${trees.length} tree(s)...`));
  console.log('');
  
  let hasErrors = false;
  let hasWarnings = false;
  
  for (const tree of trees) {
    console.log(chalk.bold(`Tree: ${tree.name}`));
    
    const lintResults = lintTree(tree);
    const formatted = formatLintResults(lintResults, { 
      colors: true, 
      showSuggestions: verbose 
    });
    
    console.log(formatted);
    
    if (lintResults.errors.length > 0) {
      hasErrors = true;
    }
    if (lintResults.warnings.length > 0) {
      hasWarnings = true;
    }
  }
  
  // Exit code handling
  if (hasErrors) {
    process.exitCode = 2;
  } else if (strict && hasWarnings) {
    console.log(chalk.yellow('⚠ Lint failed in strict mode due to warnings'));
    process.exitCode = 1;
  } else if (hasWarnings) {
    console.log(chalk.yellow('⚠ Warnings found but passing (use --strict to fail on warnings)'));
  }
}

/**
 * Diff two decision trees
 * @param {string} file1 - Path to first markdown file
 * @param {string} file2 - Path to second markdown file
 * @param {Object} options - Command options
 */
function diffTreeFiles(file1, file2, options = {}) {
  const { verbose = false } = options;
  
  if (!fs.existsSync(file1)) {
    console.log(chalk.red(`✗ First file not found: ${file1}`));
    return;
  }
  
  if (!fs.existsSync(file2)) {
    console.log(chalk.red(`✗ Second file not found: ${file2}`));
    return;
  }
  
  // Read files
  const content1 = fs.readFileSync(file1, 'utf-8');
  const content2 = fs.readFileSync(file2, 'utf-8');
  
  // Parse trees
  const trees1 = parseDecisionTrees(content1);
  const trees2 = parseDecisionTrees(content2);
  
  if (trees1.length === 0) {
    console.log(chalk.red(`✗ No decision trees found in: ${file1}`));
    return;
  }
  
  if (trees2.length === 0) {
    console.log(chalk.red(`✗ No decision trees found in: ${file2}`));
    return;
  }
  
  // If multiple trees, try to match by name
  let tree1, tree2;
  
  if (trees1.length === 1 && trees2.length === 1) {
    tree1 = trees1[0];
    tree2 = trees2[0];
  } else {
    // Try to find matching tree names
    tree1 = trees1[0];
    tree2 = trees2.find(t => t.name === tree1.name) || trees2[0];
    
    if (tree1.name !== tree2.name) {
      console.log(chalk.yellow('⚠ Comparing trees with different names:'));
      console.log(chalk.dim(`  ${file1}: ${tree1.name}`));
      console.log(chalk.dim(`  ${file2}: ${tree2.name}`));
      console.log('');
    }
  }
  
  // Generate diff
  try {
    const diff = diffTrees(tree1, tree2);
    const formatted = formatDiff(diff, { verbose, colors: true });
    console.log(formatted);
    
    // Exit code based on changes
    if (diff.changes.length > 0) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.log(chalk.red(`✗ Error diffing trees: ${error.message}`));
  }
}

/**
 * Validate tree syntax
 * @param {string} filePath - Path to markdown file
 * @param {Object} options - Command options
 */
function validateTreeFile(filePath, options = {}) {
  const { verbose = false, fix = false } = options;
  
  if (!fs.existsSync(filePath)) {
    console.log(chalk.red(`✗ File not found: ${filePath}`));
    return;
  }
  
  // Read file
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Parse trees
  const trees = parseDecisionTrees(content);
  
  if (trees.length === 0) {
    console.log(chalk.red('✗ No decision trees found in file'));
    return;
  }
  
  console.log('');
  console.log(chalk.bold.cyan(`Validating ${trees.length} tree(s)...`));
  console.log('');
  
  let allValid = true;
  
  for (const tree of trees) {
    const result = validateTree(tree);
    
    if (result.valid) {
      console.log(chalk.green(`✓ ${tree.name}: Valid`));
    } else {
      console.log(chalk.red(`✗ ${tree.name}: Invalid`));
      allValid = false;
    }
    
    // Show errors
    if (result.errors.length > 0) {
      console.log(chalk.red('  Errors:'));
      result.errors.forEach(err => {
        console.log(chalk.red(`    • ${err}`));
      });
    }
    
    // Show warnings if verbose
    if (verbose && result.warnings.length > 0) {
      console.log(chalk.yellow('  Warnings:'));
      result.warnings.forEach(warn => {
        console.log(chalk.yellow(`    • ${warn}`));
      });
    }
    
    // Show suggestions if verbose
    if (verbose && result.suggestions.length > 0) {
      console.log(chalk.cyan('  Suggestions:'));
      result.suggestions.forEach(sug => {
        console.log(chalk.cyan(`    • ${sug}`));
      });
    }
    
    console.log('');
  }
  
  if (allValid) {
    console.log(chalk.green('✓ All trees are valid'));
  } else {
    console.log(chalk.red('✗ Some trees have errors'));
  }
  
  if (fix) {
    console.log(chalk.yellow('⚠ Auto-fix is not yet implemented'));
  }
}

/**
 * Export tree to various formats
 * @param {string} filePath - Path to markdown file
 * @param {Object} options - Command options
 */
function exportTree(filePath, options = {}) {
  const { format = 'html', output } = options;
  
  if (!fs.existsSync(filePath)) {
    console.log(chalk.red(`✗ File not found: ${filePath}`));
    return;
  }
  
  // Read file
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Parse trees
  const trees = parseDecisionTrees(content);
  
  if (trees.length === 0) {
    console.log(chalk.yellow('⚠ No decision trees found in file'));
    return;
  }
  
  // Export each tree
  for (const tree of trees) {
    const baseName = tree.name.toLowerCase().replace(/\s+/g, '-');
    const baseOutput = output || baseName;
    
    try {
      switch (format.toLowerCase()) {
        case 'html':
          exportToHTML(tree, baseOutput + '.html');
          console.log(chalk.green(`✓ Exported to HTML: ${baseOutput}.html`));
          break;
          
        case 'svg':
          exportToSVG(tree, baseOutput + '.svg');
          console.log(chalk.green(`✓ Exported to SVG: ${baseOutput}.svg`));
          break;
          
        case 'mermaid':
          const mermaid = exportToMermaid(tree);
          fs.writeFileSync(baseOutput + '.mmd', mermaid, 'utf-8');
          console.log(chalk.green(`✓ Exported to Mermaid: ${baseOutput}.mmd`));
          break;
          
        case 'json':
          fs.writeFileSync(baseOutput + '.json', JSON.stringify(tree, null, 2), 'utf-8');
          console.log(chalk.green(`✓ Exported to JSON: ${baseOutput}.json`));
          break;
          
        case 'all':
          const paths = exportAll(tree, baseOutput);
          console.log(chalk.green(`✓ Exported to all formats:`));
          Object.values(paths).forEach(p => {
            console.log(chalk.dim(`    ${p}`));
          });
          break;
          
        default:
          console.log(chalk.red(`✗ Unknown format: ${format}`));
          console.log(chalk.dim('Supported formats: html, svg, mermaid, json, all'));
          return;
      }
    } catch (error) {
      console.log(chalk.red(`✗ Export failed: ${error.message}`));
    }
  }
}

/**
 * Main command handler
 * @param {string} subcommand - Subcommand (show, new, list, validate, export)
 * @param {Array} args - Command arguments
 * @param {Object} options - Command options
 */
async function treeCommand(subcommand, args = [], options = {}) {
  switch (subcommand) {
    case 'show':
      if (args.length === 0) {
        console.log(chalk.red('✗ File path required'));
        console.log(chalk.dim('Usage: reis tree show <file>'));
        return;
      }
      await showTree(args[0], options);
      break;
      
    case 'new':
      if (args.length === 0) {
        console.log(chalk.red('✗ Template name required'));
        console.log(chalk.dim('Usage: reis tree new <template>'));
        console.log(chalk.dim('See available templates: reis tree list'));
        return;
      }
      createFromTemplate(args[0], options);
      break;
      
    case 'list':
      listTemplates(options);
      break;
      
    case 'validate':
      if (args.length === 0) {
        console.log(chalk.red('✗ File path required'));
        console.log(chalk.dim('Usage: reis tree validate <file>'));
        return;
      }
      validateTreeFile(args[0], options);
      break;
      
    case 'export':
      if (args.length === 0) {
        console.log(chalk.red('✗ File path required'));
        console.log(chalk.dim('Usage: reis tree export <file> --format <format>'));
        return;
      }
      exportTree(args[0], options);
      break;
      
    case 'diff':
      if (args.length < 2) {
        console.log(chalk.red('✗ Two file paths required'));
        console.log(chalk.dim('Usage: reis tree diff <file1> <file2>'));
        console.log(chalk.dim('Options: --verbose (show detailed changes)'));
        return;
      }
      diffTreeFiles(args[0], args[1], options);
      break;
      
    case 'lint':
      if (args.length === 0) {
        console.log(chalk.red('✗ File path required'));
        console.log(chalk.dim('Usage: reis tree lint <file>'));
        console.log(chalk.dim('Options: --strict (fail on warnings)'));
        return;
      }
      lintTreeFile(args[0], options);
      break;
      
    default:
      // Default to list
      listTemplates(options);
  }
}

module.exports = treeCommand;
module.exports.showTree = showTree;
module.exports.createFromTemplate = createFromTemplate;
module.exports.listTemplates = listTemplates;
module.exports.validateTreeFile = validateTreeFile;
module.exports.exportTree = exportTree;
module.exports.diffTreeFiles = diffTreeFiles;
module.exports.lintTreeFile = lintTreeFile;
