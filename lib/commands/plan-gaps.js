/**
 * REIS Plan Gaps Command
 * Generate fix plans for audit-identified gaps and tech debt
 * 
 * After running `reis audit`, this command analyzes gaps and creates
 * targeted fix plans for addressing tech debt before milestone completion.
 * 
 * Usage:
 *   reis plan-gaps <milestone>
 *   reis plan-gaps v1.0
 *   reis plan-gaps --priority high v1.0
 *   reis plan-gaps --from-audit audit-v1.0.md v1.0
 *   reis plan-gaps --dry-run v1.0
 *   reis plan-gaps --max-plans 5 v1.0
 */

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { showPrompt, showError, showSuccess, showWarning, showInfo, checkPlanningDir } = require('../utils/command-helpers');

/**
 * Plan Gaps command - Generate fix plans for audit-identified gaps
 * @param {Object} args - Command arguments
 * @param {string[]} args._ - Positional arguments (milestone identifier)
 * @param {string} args.milestone - Milestone to plan gaps for
 * @param {string} args.priority - Filter gaps by priority (high/medium/low/all)
 * @param {string} args['from-audit'] - Specific audit file to use
 * @param {boolean} args['dry-run'] - Show gaps without generating plans
 * @param {number} args['max-plans'] - Limit number of plans generated
 * @param {boolean} args.verbose - Detailed output
 * @returns {number} Exit code
 */
function planGaps(args) {
  // Validate .planning/ exists
  if (!checkPlanningDir()) {
    showError('Not a REIS project. Run "reis new" or "reis map" first.');
    return 1;
  }

  // Parse arguments
  const milestone = args.milestone || (args._ && args._[0]);
  
  if (!milestone) {
    showError('Milestone is required. Usage: reis plan-gaps <milestone>');
    console.log();
    console.log(chalk.gray('Examples:'));
    console.log(chalk.gray('  reis plan-gaps v1.0'));
    console.log(chalk.gray('  reis plan-gaps --priority high v1.0'));
    console.log(chalk.gray('  reis plan-gaps --from-audit audit-report.md v1.0'));
    console.log(chalk.gray('  reis plan-gaps --dry-run v1.0'));
    return 1;
  }

  const priority = args.priority || 'all';
  const fromAudit = args['from-audit'];
  const dryRun = args['dry-run'] || false;
  const maxPlans = args['max-plans'] || null;
  const verbose = args.verbose || false;

  // Validate priority if specified
  const validPriorities = ['high', 'medium', 'low', 'all'];
  if (!validPriorities.includes(priority)) {
    showError(`Invalid priority: "${priority}". Must be one of: ${validPriorities.join(', ')}`);
    return 1;
  }

  // Show banner
  console.log();
  console.log(chalk.blue('╔═══════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue('║  📋 REIS Plan Gaps - Gap Resolution Planning              ║'));
  console.log(chalk.blue('╚═══════════════════════════════════════════════════════════╝'));
  console.log();

  // Show configuration
  console.log(chalk.cyan('📋 Gap Planning Configuration:'));
  console.log(chalk.gray(`   Milestone: ${milestone}`));
  console.log(chalk.gray(`   Priority Filter: ${priority}`));
  console.log(chalk.gray(`   Mode: ${dryRun ? 'Dry Run (preview only)' : 'Generate Plans'}`));
  if (maxPlans) {
    console.log(chalk.gray(`   Max Plans: ${maxPlans}`));
  }
  if (fromAudit) {
    console.log(chalk.gray(`   Audit Source: ${fromAudit}`));
  }
  console.log(chalk.gray(`   Verbose: ${verbose ? 'Yes' : 'No'}`));
  console.log();

  // Determine audit file path
  const auditDir = path.join(process.cwd(), '.planning', 'audits');
  let auditFilePath;

  if (fromAudit) {
    // Use specified audit file
    auditFilePath = path.isAbsolute(fromAudit) 
      ? fromAudit 
      : path.join(process.cwd(), fromAudit);
  } else {
    // Try to find audit file for this milestone
    auditFilePath = findAuditFile(auditDir, milestone);
  }

  // Check if audit file exists
  if (auditFilePath && fs.existsSync(auditFilePath)) {
    showInfo(`📄 Using audit file: ${path.relative(process.cwd(), auditFilePath)}`);
  } else {
    showWarning(`No audit file found for milestone "${milestone}".`);
    showInfo(`Run "reis audit ${milestone}" first to generate audit results.`);
    console.log();
  }

  // Determine output directory for gap plans
  const gapsDir = path.join(process.cwd(), '.planning', 'phases', `${milestone}-gaps`);
  console.log(chalk.gray(`   Output Directory: ${path.relative(process.cwd(), gapsDir)}`));
  console.log();

  // Generate the prompt
  const prompt = generateGapPlanningPrompt({
    milestone,
    priority,
    fromAudit: auditFilePath,
    dryRun,
    maxPlans,
    verbose,
    gapsDir
  });

  showPrompt(prompt);

  return 0;
}

/**
 * Find the most recent audit file for a milestone
 * @param {string} auditDir - Directory containing audit files
 * @param {string} milestone - Milestone to find audit for
 * @returns {string|null} Path to audit file or null
 */
function findAuditFile(auditDir, milestone) {
  if (!fs.existsSync(auditDir)) {
    return null;
  }

  const files = fs.readdirSync(auditDir)
    .filter(f => f.startsWith(`audit-${milestone}`) && f.endsWith('.md'))
    .sort()
    .reverse(); // Most recent first (assuming date-based naming)

  if (files.length > 0) {
    return path.join(auditDir, files[0]);
  }

  // Also check for generic audit file
  const genericAudit = path.join(auditDir, `audit-${milestone}.md`);
  if (fs.existsSync(genericAudit)) {
    return genericAudit;
  }

  return null;
}

/**
 * Generate the gap planning prompt
 * @param {Object} options - Gap planning options
 * @returns {string} The generated prompt
 */
function generateGapPlanningPrompt(options) {
  const { milestone, priority, fromAudit, dryRun, maxPlans, verbose, gapsDir } = options;

  const prompt = `## Plan Gap Closure for Milestone "${milestone}"

### Overview

Analyze audit results and generate targeted fix plans for addressing gaps and tech debt.

### Step 1: Read Audit Results

${fromAudit ? 
`1. Read audit file: \`${path.relative(process.cwd(), fromAudit)}\`
2. Extract all identified gaps, issues, and tech debt items` :
`1. Read from \`.planning/audits/audit-${milestone}.md\` (if exists)
2. If no audit exists, run \`reis audit ${milestone}\` first
3. Alternatively, analyze current milestone state manually`}

### Step 2: Categorize Gaps

Classify each gap into one of these categories:

| Symbol | Category | Description |
|--------|----------|-------------|
| 🔴 | Missing Features | Required deliverables not implemented |
| 🟡 | Incomplete Implementations | Stubs, TODOs, partial code |
| 🔵 | Tech Debt | Working but needs refactoring |
| 📝 | Documentation | Missing or outdated docs |

### Step 3: Prioritize Gaps

${priority !== 'all' ? 
`**Filter:** Only include ${priority} priority gaps.

` : ''}For each gap, assess:

- **Impact:** How critical is this for milestone completion?
- **Effort:** Estimated time/complexity to fix
- **Dependencies:** Does this block other work?

Priority Matrix:
| Impact \\ Effort | Low Effort | High Effort |
|------------------|------------|-------------|
| High Impact      | 🔴 HIGH    | 🟡 MEDIUM   |
| Low Impact       | 🟢 LOW     | 🟢 LOW      |

### Step 4: ${dryRun ? 'Preview Gaps (Dry Run)' : 'Generate Fix Plans'}

${dryRun ? 
`**Dry Run Mode:** Show gaps without generating plans.

Output a summary showing:
- Total gaps found by category
- Gap priority breakdown
- Estimated total effort
- What plans WOULD be generated` :
`For each gap, create a targeted fix plan:

1. Create output directory: \`${path.relative(process.cwd(), gapsDir)}/\`

2. For each gap, generate: \`gap-{N}-{slug}.PLAN.md\`
${maxPlans ? `\n   **Limit:** Generate at most ${maxPlans} plans (highest priority first)\n` : ''}
3. Each plan should follow this template:

\`\`\`markdown
# Plan: Gap-{N} - {Gap Title}

## Objective
{One-line description of what this fixes}

## Context
- **Category:** {🔴/🟡/🔵/📝} {Category Name}
- **Priority:** {High/Medium/Low}
- **Estimated Effort:** {X hours/days}
- **Source:** audit-${milestone}.md

## Tasks

<task type="auto">
<name>{Specific task name}</name>
<files>{files to modify}</files>
<action>
{Detailed instructions for the fix}
</action>
<verify>
- {Verification step 1}
- {Verification step 2}
</verify>
<done>{Completion criteria}</done>
</task>

## Success Criteria
- {What "done" looks like}

## Verification
\\\`\\\`\\\`bash
{Commands to verify the fix}
\\\`\\\`\\\`
\`\`\`

4. Keep plans small and focused (1-2 tasks each)
5. Include specific file paths from audit
6. Add clear verification steps`}

### Step 5: Generate Gap Summary

Create summary at: \`${path.relative(process.cwd(), gapsDir)}/GAP_SUMMARY.md\`

\`\`\`markdown
# Gap Summary: ${milestone}

**Generated:** ${new Date().toISOString().split('T')[0]}
**Priority Filter:** ${priority}
${maxPlans ? `**Max Plans:** ${maxPlans}` : ''}

## Overview

| Category | Count | High | Medium | Low |
|----------|-------|------|--------|-----|
| 🔴 Missing Features | X | X | X | X |
| 🟡 Incomplete | X | X | X | X |
| 🔵 Tech Debt | X | X | X | X |
| 📝 Documentation | X | X | X | X |
| **Total** | **X** | **X** | **X** | **X** |

## Estimated Effort

- **Total:** X hours/days
- **Critical Path:** X hours/days

## Recommended Execution Order

1. gap-1-{slug}.PLAN.md - {reason}
2. gap-2-{slug}.PLAN.md - {reason}
...

## Gap Details

### Gap 1: {Title}
- **Category:** {Category}
- **Priority:** {Priority}
- **Plan:** gap-1-{slug}.PLAN.md
- **Effort:** X hours

### Gap 2: {Title}
...

## Next Steps

1. Execute plans in recommended order
2. Re-run \`reis audit ${milestone}\` after completion
3. Verify all gaps resolved
\`\`\`

${verbose ? `
### Verbose Output

Include detailed information about:
- Each gap found with full context
- Files affected by each gap
- Dependencies between gaps
- Reasoning for prioritization
` : ''}
`;

  return prompt;
}

module.exports = planGaps;
