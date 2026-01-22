const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { showError, showSuccess, showInfo, checkPlanningDir } = require('../utils/command-helpers.js');

/**
 * Debug command - Analyze verification failures and generate fix plans
 * @param {string} target - Optional path to DEBUG_INPUT.md or plan file
 * @param {Object} options - Command options
 */
async function debugCommand(target, options = {}) {
  console.log(chalk.blue('\n🔍 REIS Debugger\n'));

  // Validate REIS project
  if (!checkPlanningDir()) {
    showError('Not a REIS project. Run "reis new" or "reis map" first.');
    process.exit(1);
  }

  try {
    // 1. Locate DEBUG_INPUT.md
    const inputPath = target || options.input || '.planning/DEBUG_INPUT.md';
    
    if (!fs.existsSync(inputPath)) {
      console.error(chalk.red(`✗ DEBUG_INPUT.md not found at: ${inputPath}`));
      console.log(chalk.yellow('\nRun "reis verify [plan]" first to generate debug input.'));
      console.log(chalk.gray('Or provide a plan file to analyze: reis debug <plan-file>'));
      process.exit(1);
    }

    console.log(chalk.gray(`Reading: ${inputPath}`));
    const debugInput = fs.readFileSync(inputPath, 'utf-8');

    // 2. Parse input to determine issue type
    const issueType = detectIssueType(debugInput);
    console.log(chalk.cyan(`Issue type detected: ${issueType}`));

    if (issueType === 'incomplete-implementation') {
      console.log(chalk.yellow('⚠️  Missing features detected (not a bug)\n'));
    }

    // 3. Load project context
    console.log(chalk.gray('Loading project context...'));
    const context = await loadProjectContext();

    // 4. Prepare debugger prompt
    const prompt = buildDebuggerPrompt(debugInput, context, issueType, options);

    // 5. Invoke debugger subagent
    console.log(chalk.blue('\nSpawning debugger subagent...\n'));
    
    const result = await invokeDebugger(prompt, options);

    // 6. Validate outputs
    if (!result.success) {
      console.error(chalk.red('\n✗ Debugger failed'));
      console.error(result.error);
      process.exit(1);
    }

    // Handle dry-run case
    if (result.dryRun) {
      console.log(chalk.yellow('\n⚠️  Dry run complete - no actual debugging performed'));
      console.log(chalk.gray('Run without --dry-run to perform actual analysis'));
      process.exit(0);
    }

    // 7. Display results
    console.log(chalk.green('\n✅ Analysis complete!\n'));
    
    const reportPath = result.outputs.report || '.planning/debug/DEBUG_REPORT.md';
    const fixPlanPath = result.outputs.fixPlan || '.planning/debug/FIX_PLAN.md';

    if (fs.existsSync(reportPath)) {
      console.log(chalk.cyan('📄 Debug Report:'), reportPath);
      displayReportSummary(reportPath);
    }

    if (fs.existsSync(fixPlanPath)) {
      console.log(chalk.cyan('\n🔧 Fix Plan:'), fixPlanPath);
      displayFixPlanSummary(fixPlanPath, issueType);
    }

    // 8. Next steps
    console.log(chalk.blue('\n📋 Next Steps:'));
    console.log('  1. Review debug report:', chalk.cyan(reportPath));
    console.log('  2. Review fix plan:', chalk.cyan(fixPlanPath));
    console.log('  3. Execute fix:', chalk.yellow(`reis execute-plan ${fixPlanPath}`));
    console.log('  4. Re-verify:', chalk.yellow('reis verify [original-plan]'));
    
    process.exit(0);
  } catch (error) {
    showError(`Debug command failed: ${error.message}`);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * Detect issue type from DEBUG_INPUT.md content
 */
function detectIssueType(inputContent) {
  // Check for incomplete implementation markers
  if (inputContent.includes('Tasks:') && inputContent.match(/\d+\/\d+ complete/)) {
    const match = inputContent.match(/(\d+)\/(\d+) complete/);
    if (match) {
      const [_, completed, total] = match;
      if (parseInt(completed) < parseInt(total)) {
        return 'incomplete-implementation';
      }
    }
  }

  // Check for missing deliverables
  if (inputContent.includes('NOT FOUND') || inputContent.includes('MISSING')) {
    return 'incomplete-implementation';
  }

  // Check for test failures
  if (inputContent.includes('Test Results:') && inputContent.includes('FAIL')) {
    return 'test-failure';
  }

  // Check for quality issues
  if (inputContent.includes('Quality Issues:') || inputContent.includes('ESLint')) {
    return 'quality-issue';
  }

  // Check for integration issues
  if (inputContent.includes('Integration') || inputContent.includes('API mismatch')) {
    return 'integration-issue';
  }

  // Default
  return 'unknown';
}

/**
 * Load project context from .planning/ files
 */
async function loadProjectContext() {
  const context = {
    projectName: 'Unknown',
    currentPhase: 'Unknown',
    lastExecution: 'Unknown'
  };

  try {
    // Load PROJECT.md
    const projectPath = path.join(process.cwd(), '.planning', 'PROJECT.md');
    if (fs.existsSync(projectPath)) {
      const projectContent = fs.readFileSync(projectPath, 'utf-8');
      const nameMatch = projectContent.match(/# (.+)/);
      if (nameMatch) {
        context.projectName = nameMatch[1];
      }
    }

    // Load STATE.md
    const statePath = path.join(process.cwd(), '.planning', 'STATE.md');
    if (fs.existsSync(statePath)) {
      const stateContent = fs.readFileSync(statePath, 'utf-8');
      
      // Extract current phase
      const phaseMatch = stateContent.match(/## Current Phase\n\*\*Phase \d+: (.+)\*\*/);
      if (phaseMatch) {
        context.currentPhase = phaseMatch[1];
      }

      // Extract last execution date
      const dateMatch = stateContent.match(/## (\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        context.lastExecution = dateMatch[1];
      }
    }
  } catch (error) {
    console.warn(chalk.yellow('Warning: Could not fully load project context'));
  }

  return context;
}

/**
 * Build prompt for debugger subagent
 */
function buildDebuggerPrompt(debugInput, context, issueType, options) {
  let prompt = `# REIS Debugger Analysis Request\n\n`;
  
  prompt += `## Debug Input\n\n${debugInput}\n\n`;
  
  prompt += `## Project Context\n\n`;
  prompt += `- Project: ${context.projectName}\n`;
  prompt += `- Phase: ${context.currentPhase}\n`;
  prompt += `- Last execution: ${context.lastExecution}\n\n`;

  prompt += `## Instructions\n\n`;
  prompt += `Perform systematic 6-step analysis:\n\n`;
  prompt += `1. **Issue Classification** - Identify type (test/quality/docs/regression/integration/dependency/incomplete-implementation), severity, scope\n`;
  prompt += `2. **Symptom Analysis** - Document what failed, where, when, how\n`;
  prompt += `3. **Root Cause Investigation** - Determine WHY it failed\n`;
  prompt += `   - For incomplete implementations: Analyze why features were skipped (executor skip 70%, plan ambiguity 20%, dependency blocker 10%)\n`;
  prompt += `   - For bugs: Analyze git history, dependencies, code logic\n`;
  prompt += `4. **Impact Assessment** - Severity, scope, dependencies, urgency\n`;
  prompt += `5. **Solution Design** - Generate 3-5 options with pros/cons\n`;
  prompt += `   - For incomplete implementations: Recommend targeted re-execution (only missing features)\n`;
  prompt += `6. **Fix Planning** - Create executable FIX_PLAN.md\n`;
  prompt += `   - For incomplete implementations: Scope only missing deliverables, DO NOT re-implement completed features\n\n`;

  prompt += `## Output Requirements\n\n`;
  prompt += `Generate two files:\n`;
  prompt += `1. DEBUG_REPORT.md - Complete analysis following template\n`;
  prompt += `2. FIX_PLAN.md - Executable fix plan in PLAN.md format\n\n`;

  if (options.focus) {
    prompt += `## Focus Area\n\n${options.focus}\n\n`;
  }

  return prompt;
}

/**
 * Invoke debugger subagent via Rovo Dev
 * @param {string} prompt - Debug prompt
 * @param {object} options - Command options
 * @returns {Promise<object>} Debug results
 */
async function invokeDebugger(prompt, options) {
  const debugDir = path.join(process.cwd(), '.planning', 'debug');
  
  // Ensure debug directory exists
  if (!fs.existsSync(debugDir)) {
    fs.mkdirSync(debugDir, { recursive: true });
  }
  
  // Dry run mode - show prompt only
  if (options.dryRun) {
    console.log(chalk.yellow('--dry-run mode: Showing prompt that would be sent\n'));
    console.log(chalk.gray('─'.repeat(60)));
    console.log(prompt.substring(0, 2000) + '...');
    console.log(chalk.gray('─'.repeat(60)));
    
    // Save prompt for reference
    const promptPath = path.join(debugDir, 'DEBUGGER_PROMPT.txt');
    fs.writeFileSync(promptPath, prompt, 'utf-8');
    console.log(chalk.gray(`\nPrompt saved to: ${promptPath}`));
    
    return {
      success: true,
      dryRun: true,
      outputs: {
        report: path.join(debugDir, 'DEBUG_REPORT.md'),
        fixPlan: path.join(debugDir, 'FIX_PLAN.md')
      }
    };
  }
  
  // Real execution mode
  const { invokeSubagent, SubagentInvoker } = require('../utils/subagent-invoker');
  
  const invoker = new SubagentInvoker({ verbose: options.verbose });
  
  invoker.on('progress', (data) => {
    console.log(chalk.gray(`  ${data.message}`));
  });
  
  invoker.on('artifact', (data) => {
    console.log(chalk.green(`  ✓ Generated: ${data.path}`));
  });
  
  try {
    const result = await invokeSubagent('reis_debugger', {
      verbose: options.verbose,
      timeout: options.timeout || 300000,
      additionalContext: {
        debugPrompt: prompt,
        focusArea: options.focus || null
      }
    });
    
    // Determine output paths
    let reportPath = path.join(debugDir, 'DEBUG_REPORT.md');
    let fixPlanPath = path.join(debugDir, 'FIX_PLAN.md');
    
    if (result.metadata) {
      reportPath = result.metadata.reportPath || reportPath;
      fixPlanPath = result.metadata.fixPlanPath || fixPlanPath;
    }
    
    return {
      success: result.success,
      outputs: {
        report: reportPath,
        fixPlan: fixPlanPath
      },
      output: result.output,
      error: result.error
    };
    
  } catch (error) {
    return {
      success: false,
      error: error,
      outputs: {
        report: path.join(debugDir, 'DEBUG_REPORT.md'),
        fixPlan: path.join(debugDir, 'FIX_PLAN.md')
      }
    };
  }
}

/**
 * Display summary of debug report
 */
function displayReportSummary(reportPath) {
  if (!fs.existsSync(reportPath)) {
    console.log(chalk.yellow('  Report not yet generated (pending subagent execution)'));
    return;
  }

  const content = fs.readFileSync(reportPath, 'utf-8');
  
  // Extract issue type
  const typeMatch = content.match(/\*\*Type:\*\* (.+)/);
  if (typeMatch) {
    const type = typeMatch[1];
    console.log('  Type:', type);
    
    if (type.includes('incomplete-implementation')) {
      console.log(chalk.yellow('  ⚠️  This is NOT a bug - features are simply missing'));
    }
  }

  // Extract severity
  const severityMatch = content.match(/\*\*Severity:\*\* (.+)/);
  if (severityMatch) {
    console.log('  Severity:', severityMatch[1]);
  }

  // Extract root cause
  const causeMatch = content.match(/### Primary Cause\n(.+)/);
  if (causeMatch) {
    console.log('  Cause:', causeMatch[1].substring(0, 80) + '...');
  }

  // For incomplete implementations, show what's missing
  if (content.includes('incomplete-implementation')) {
    const missingMatch = content.match(/\*\*Missing Features:\*\*\n([\s\S]+?)\*\*/);
    if (missingMatch) {
      console.log(chalk.yellow('\n  Missing:'));
      const missing = missingMatch[1].trim().split('\n');
      missing.forEach(item => {
        if (item.trim()) console.log(chalk.yellow('    ' + item.trim()));
      });
    }
  }
}

/**
 * Display summary of fix plan
 */
function displayFixPlanSummary(fixPlanPath, issueType) {
  if (!fs.existsSync(fixPlanPath)) {
    console.log(chalk.yellow('  Fix plan not yet generated (pending subagent execution)'));
    return;
  }

  const content = fs.readFileSync(fixPlanPath, 'utf-8');
  
  // Extract objective
  const objMatch = content.match(/## Objective\n(.+)/);
  if (objMatch) {
    console.log('  Objective:', objMatch[1]);
  }

  // Extract task count
  const tasks = content.match(/<task/g);
  if (tasks) {
    console.log('  Tasks:', tasks.length);
  }

  // For incomplete implementations, highlight targeted approach
  if (issueType === 'incomplete-implementation') {
    console.log(chalk.green('\n  ✅ Targeted fix: Only missing features will be implemented'));
    console.log(chalk.green('  ✅ Completed features will NOT be touched'));
  }

  // Extract time estimate
  const timeMatch = content.match(/\*\*Time Estimate:\*\* (.+)/);
  if (timeMatch) {
    console.log('  Estimated time:', timeMatch[1]);
  }
}

module.exports = debugCommand;
