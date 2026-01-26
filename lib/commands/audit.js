/**
 * REIS Audit Command
 * Milestone completion verification with integration checks
 * 
 * Invokes reis_integrator subagent for cross-phase wiring verification.
 * This is the PRIMARY entry point for integration verification.
 * 
 * Usage:
 *   reis audit [milestone]
 *   reis audit v1.0
 *   reis audit --strict v2.0
 *   reis audit --output audit-report.md v1.0
 *   reis audit                           # Audit all completed phases
 *   reis audit --phase 3                 # Audit single phase integration
 */

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { showPrompt, showError, showSuccess, showWarning, showInfo, checkPlanningDir } = require('../utils/command-helpers');
const { invokeSubagent } = require('../utils/subagent-invoker');

/**
 * Audit command - Milestone completion verification
 * @param {Object} args - Command arguments
 * @param {string[]} args._ - Positional arguments (milestone identifier)
 * @param {string} args.milestone - Milestone to audit
 * @param {number} args.phase - Single phase to audit
 * @param {boolean} args.strict - Fail on any incomplete item
 * @param {string} args.output - Custom output location
 * @param {boolean} args.verbose - Detailed verification output
 * @returns {Promise<number>} Exit code
 */
async function audit(args) {
  // Validate .planning/ exists
  if (!checkPlanningDir()) {
    showError('Not a REIS project. Run "reis new" or "reis map" first.');
    return 1;
  }

  // Parse arguments
  const milestone = args.milestone || (args._ && args._[0]);
  const phase = args.phase;
  const strict = args.strict || false;
  const verbose = args.verbose || false;
  const outputPath = args.output;

  // Determine scope
  let scope = 'all completed phases';
  let auditTarget = 'all';
  
  if (milestone) {
    scope = `milestone "${milestone}"`;
    auditTarget = milestone;
  }
  if (phase) {
    scope = `phase ${phase}`;
    auditTarget = `phase-${phase}`;
  }

  // Show banner
  console.log();
  console.log(chalk.blue('╔═══════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue('║  🔍 REIS Audit - Integration & Completion Verification    ║'));
  console.log(chalk.blue('╚═══════════════════════════════════════════════════════════╝'));
  console.log();

  // Show audit configuration
  console.log(chalk.cyan('📋 Audit Configuration:'));
  console.log(chalk.gray(`   Scope: ${scope}`));
  console.log(chalk.gray(`   Mode: ${strict ? 'Strict (fail on any issue)' : 'Standard'}`));
  console.log(chalk.gray(`   Verbose: ${verbose ? 'Yes' : 'No'}`));
  
  // Determine output file path
  const defaultOutputPath = path.join(
    process.cwd(), 
    '.planning', 
    'audits', 
    `audit-${auditTarget}-${new Date().toISOString().split('T')[0]}.md`
  );
  const finalOutputPath = outputPath || defaultOutputPath;
  console.log(chalk.gray(`   Output: ${finalOutputPath}`));
  console.log();

  // Ensure audits directory exists
  const auditsDir = path.join(process.cwd(), '.planning', 'audits');
  if (!fs.existsSync(auditsDir)) {
    fs.mkdirSync(auditsDir, { recursive: true });
  }

  showInfo(`🔍 Auditing ${scope}...\n`);

  // Step 1: Invoke reis_integrator for integration verification
  console.log(chalk.cyan('Step 1: Running integration checks via reis_integrator...\n'));
  
  let integrationResult = { success: true, issues: [] };
  
  try {
    integrationResult = await invokeSubagent('reis_integrator', {
      milestone: milestone,
      phase: phase,
      strict: strict,
      verbose: verbose,
      additionalContext: {
        outputPath: finalOutputPath,
        mode: 'audit'
      }
    });
  } catch (error) {
    // If subagent invocation fails, continue with prompt-based approach
    showWarning(`Subagent invocation error: ${error.message}`);
    showInfo('Continuing with prompt-based audit...\n');
    integrationResult = { success: false, issues: ['Subagent invocation failed'], fallback: true };
  }

  // Step 2: Generate audit prompt for completion checks
  console.log(chalk.cyan('Step 2: Generating completion verification prompt...\n'));

  const prompt = generateAuditPrompt({
    scope,
    milestone,
    phase,
    strict,
    verbose,
    outputPath: finalOutputPath,
    integrationResult
  });

  showPrompt(prompt);

  // Return status based on integration result
  if (integrationResult.fallback) {
    // Fallback mode - let the prompt execution determine success
    return 0;
  }
  
  return integrationResult.success ? 0 : 1;
}

/**
 * Generate the audit prompt
 * @param {Object} options - Audit options
 * @returns {string} The generated prompt
 */
function generateAuditPrompt(options) {
  const { scope, milestone, phase, strict, verbose, outputPath, integrationResult } = options;

  let prompt = `## Audit: ${scope}

### Overview

Perform a comprehensive audit of ${scope} to verify completion and integration health.

### Step 1: Read Project Structure

1. Read \`ROADMAP.md\` to identify all phases${milestone ? ` in milestone "${milestone}"` : ''}${phase ? ` (focus on phase ${phase})` : ''}
2. Read \`STATE.md\` to understand current progress
3. Identify all deliverables expected for this scope

### Step 2: Verify Deliverables

For each phase in scope, verify:

- [ ] All planned deliverables exist
- [ ] All tests pass (\`npm test\` or equivalent)
- [ ] No stub/placeholder implementations
- [ ] Documentation is complete
- [ ] Code follows project patterns

### Step 3: Integration Verification

${integrationResult.fallback ? 
`**Note:** reis_integrator subagent unavailable. Perform manual integration checks:

- [ ] Cross-phase imports/exports work correctly
- [ ] API contracts are satisfied
- [ ] No broken references between phases
- [ ] Data flows correctly between components` : 
`Review integration report from reis_integrator:

- Cross-phase wiring issues: ${integrationResult.issues?.length || 0} found
- API contract violations: Check report
- Missing exports/imports: Check report`}

### Step 4: Generate Audit Report

Create audit report at: \`${outputPath}\`

Report should include:

\`\`\`markdown
# Audit Report: ${scope}

**Date:** ${new Date().toISOString().split('T')[0]}
**Mode:** ${strict ? 'Strict' : 'Standard'}

## Summary

- **Status:** [PASS/FAIL/PARTIAL]
- **Completion:** [X]%
- **Integration Health:** [HEALTHY/WARNINGS/ISSUES]

## Phases Audited

| Phase | Status | Deliverables | Tests | Integration |
|-------|--------|--------------|-------|-------------|
| P1    | ✓/✗    | X/Y          | Pass  | OK          |

## Issues Found

### Critical (Blockers)
- [List any blocking issues]

### Warnings
- [List any warnings]

### Tech Debt
- [List identified tech debt]

## Recommendations

1. [Action item 1]
2. [Action item 2]

## Next Steps

- [What to do next based on audit results]
\`\`\`

${strict ? `
### Strict Mode

In strict mode, audit fails if:
- Any deliverable is missing
- Any test fails
- Any stub implementation exists
- Any integration issue found
` : ''}

${verbose ? `
### Verbose Output

Report detailed information about:
- Each file checked
- Each test result
- Each integration point verified
- Time taken for each check
` : ''}
`;

  return prompt;
}

module.exports = audit;
