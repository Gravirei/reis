# Plan: 2-1 - Debug Command Implementation

## Objective
Implement the `reis debug` CLI command that spawns the debugger subagent with proper input handling.

## Context
The debug command is triggered after verification failures or on demand. It:
- Loads DEBUG_INPUT.md from verifier
- Spawns reis_debugger subagent
- Generates DEBUG_REPORT.md and FIX_PLAN.md
- Handles both bugs and incomplete implementations (FR2.1)

## Dependencies
- Plan 1-1 (debugger specification exists)
- Plan 1-2 (templates exist)

## Tasks

<task type="auto">
<name>Implement reis debug CLI command</name>
<files>lib/commands/debug.js</files>
<action>
Create debug command implementation:

```javascript
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { spawnSubagent } from '../subagents/spawn.js';
import { loadProjectContext } from '../utils/context-loader.js';

export async function debugCommand(options = {}) {
  console.log(chalk.blue('\n🔍 REIS Debugger\n'));

  // 1. Locate DEBUG_INPUT.md
  const inputPath = options.input || '.planning/DEBUG_INPUT.md';
  
  if (!fs.existsSync(inputPath)) {
    console.error(chalk.red(`✗ DEBUG_INPUT.md not found at: ${inputPath}`));
    console.log(chalk.yellow('\nRun "reis verify [plan]" first to generate debug input.'));
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
  const prompt = buildDebuggerPrompt(debugInput, context, options);

  // 5. Spawn debugger subagent
  console.log(chalk.blue('\nSpawning debugger subagent...\n'));
  
  const result = await spawnSubagent('reis_debugger', {
    prompt,
    conversational: options.interactive || false,
    outputDir: '.planning/debug'
  });

  // 6. Validate outputs
  if (!result.success) {
    console.error(chalk.red('\n✗ Debugger failed'));
    console.error(result.error);
    process.exit(1);
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
 * Build prompt for debugger subagent
 */
function buildDebuggerPrompt(debugInput, context, options) {
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
 * Display summary of debug report
 */
function displayReportSummary(reportPath) {
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
  const content = fs.readFileSync(fixPlanPath, 'utf-8');
  
  // Extract objective
  const objMatch = content.match(/## Objective\n(.+)/);
  if (objMatch) {
    console.log('  Objective:', objMatch[1]);
  }

  // Extract wave count
  const waves = content.match(/## Wave/g);
  if (waves) {
    console.log('  Waves:', waves.length);
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

// CLI argument parsing
export function registerDebugCommand(program) {
  program
    .command('debug')
    .description('Analyze verification failures and generate fix plans')
    .option('-i, --input <path>', 'Path to DEBUG_INPUT.md', '.planning/DEBUG_INPUT.md')
    .option('--interactive', 'Run in interactive mode', false)
    .option('--focus <area>', 'Focus analysis on specific area')
    .action(debugCommand);
}
```

**What to avoid:**
- Starting analysis without DEBUG_INPUT.md
- Missing issue type detection (especially incomplete implementations)
- Spawning without proper context
- Generic prompts (need specific instructions for incomplete implementations)

**Why:**
- Issue type detection enables proper handling (bugs vs missing features)
- Proper context ensures accurate analysis
- Specific instructions ensure debugger follows FR2.1 protocol
</action>
<verify>
```bash
# Check file exists
test -f lib/commands/debug.js && echo "✓ debug.js created"

# Verify incomplete implementation detection
grep -q "incomplete-implementation" lib/commands/debug.js && echo "✓ Incomplete implementation detection included"

# Check for issue type detection function
grep -q "detectIssueType" lib/commands/debug.js && echo "✓ Issue type detection function exists"

# Verify targeted fix messaging
grep -q "only missing features" lib/commands/debug.js && echo "✓ Targeted fix messaging included"

# Test basic syntax
node -c lib/commands/debug.js && echo "✓ Syntax valid"
```
</verify>
<done>
- lib/commands/debug.js created with full implementation
- Issue type detection includes incomplete-implementation
- Proper FR2.1 protocol instructions in debugger prompt
- Summary display distinguishes bugs from missing features
- Targeted fix approach highlighted for incomplete implementations
- CLI argument parsing included
</done>
</task>

## Success Criteria
- ✅ `reis debug` command implemented
- ✅ Detects issue types including incomplete implementations
- ✅ Spawns debugger subagent with proper context
- ✅ Generates DEBUG_REPORT.md and FIX_PLAN.md
- ✅ Displays summaries with FR2.1 awareness
- ✅ Provides clear next steps

## Verification
```bash
# Command file exists
test -f lib/commands/debug.js && echo "✓ Debug command implemented"

# Has FR2.1 support
grep -c "incomplete-implementation" lib/commands/debug.js
# Should find 5+ occurrences

# Syntax valid
node -c lib/commands/debug.js && echo "✓ Valid JavaScript"

# Can be imported
node -e "import('./lib/commands/debug.js').then(() => console.log('✓ Module loads'))"
```
