const { showPrompt, showError, showInfo, checkPlanningDir, validatePhaseNumber } = require('../utils/command-helpers');
const { parseDecisionTrees, toJSON } = require('../utils/decision-tree-parser');
const { renderDecisionTree } = require('../utils/visualizer');
const { showKanbanBoard } = require('../utils/kanban-renderer');
const fs = require('fs');
const path = require('path');

module.exports = function plan(args, options = {}) {
  // Show kanban board (unless disabled)
  showKanbanBoard({ noKanban: options?.noKanban });
  // Check if .planning/ exists
  if (!checkPlanningDir()) {
    showError('Not a REIS project. Run "reis new" or "reis map" first.');
    process.exit(1);
  }
  
  // Validate phase argument
  const phase = args.phase;
  if (!phase) {
    showError('Phase number is required. Usage: reis plan <phase>');
    process.exit(1);
  }
  
  // Validate phase is a valid positive number
  const validatedPhase = validatePhaseNumber(phase);
  if (validatedPhase === null) {
    process.exit(1);
  }
  
  // Check for flags
  const showTrees = args.showTrees || args['show-trees'];
  const treesJson = args.treesJson || args['trees-json'];
  const depth = args.depth ? parseInt(args.depth, 10) : Infinity;
  
  // If showing trees or JSON, look for existing plan files
  if (showTrees || treesJson) {
    const phasePath = path.join(process.cwd(), '.planning', 'phases');
    const trees = findAndParseTrees(phasePath, validatedPhase);
    
    if (trees.length === 0) {
      showInfo('No decision trees found in existing plans for this phase.');
    } else {
      if (treesJson) {
        // Output JSON format
        const jsonOutput = trees.map(tree => toJSON(tree));
        console.log(JSON.stringify(jsonOutput, null, 2));
        return 0;
      }
      
      if (showTrees) {
        // Display trees in terminal
        showInfo(`Found ${trees.length} decision tree(s) in phase ${validatedPhase}:\n`);
        trees.forEach(tree => {
          console.log(renderDecisionTree(tree, { depth }));
        });
        return 0;
      }
    }
  }
  
  // Standard planning prompt with tree awareness
  let prompt = `Plan phase ${validatedPhase} using REIS methodology. Use the reis_planner subagent to break down the phase into 2-3 task plans with clear dependencies, success criteria, and verification steps. Save plans to .planning/phases/${validatedPhase}-{name}/`;
  
  // Add note about decision trees
  prompt += `\n\nNote: Consider including decision trees in the plan to guide implementation choices. Use the syntax documented in docs/DECISION_TREES.md.`;
  
  showPrompt(prompt);
  
  return 0;
};

/**
 * Find and parse decision trees from plan files
 * @param {string} phasePath - Path to phases directory
 * @param {number} phase - Phase number
 * @returns {Array} Array of parsed trees
 */
function findAndParseTrees(phasePath, phase) {
  const trees = [];
  
  try {
    if (!fs.existsSync(phasePath)) {
      return trees;
    }
    
    // Look for phase directories
    const dirs = fs.readdirSync(phasePath);
    const phaseDirs = dirs.filter(dir => {
      return dir.startsWith(`${phase}-`) || dir === String(phase);
    });
    
    // Parse PLAN.md files in each directory
    for (const dir of phaseDirs) {
      const planPath = path.join(phasePath, dir, 'PLAN.md');
      if (fs.existsSync(planPath)) {
        const content = fs.readFileSync(planPath, 'utf8');
        const parsedTrees = parseDecisionTrees(content);
        trees.push(...parsedTrees);
      }
    }
  } catch (error) {
    // Silently handle errors - trees are optional
  }
  
  return trees;
}
