/**
 * REIS Complete Milestone Command
 * Archive completed milestones with integration verification
 * 
 * Runs reis audit (which invokes reis_integrator) before allowing completion.
 * This ensures integration checks pass before a milestone is marked complete.
 * 
 * Usage:
 *   reis complete-milestone <milestone>
 *   reis complete-milestone v1.0
 *   reis complete-milestone --tag v1.0
 *   reis complete-milestone --no-archive v1.0
 *   reis complete-milestone --skip-audit v1.0   # Dangerous: skip integration checks
 */

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { showPrompt, showError, showSuccess, showWarning, showInfo, checkPlanningDir } = require('../utils/command-helpers');
const audit = require('./audit');

/**
 * Complete Milestone command - Archive and finalize milestones
 * @param {Object} args - Command arguments
 * @param {string[]} args._ - Positional arguments (milestone identifier)
 * @param {string} args.milestone - Milestone to complete
 * @param {boolean} args.tag - Create git tag (default: true)
 * @param {boolean} args.archive - Archive artifacts (default: true)
 * @param {boolean} args.force - Complete even with audit warnings
 * @param {boolean} args['skip-audit'] - Skip audit entirely (dangerous)
 * @param {boolean} args.verbose - Detailed output
 * @returns {Promise<number>} Exit code
 */
async function completeMilestone(args) {
  // Validate .planning/ exists
  if (!checkPlanningDir()) {
    showError('Not a REIS project. Run "reis new" or "reis map" first.');
    return 1;
  }

  // Parse milestone from args
  const milestone = args.milestone || (args._ && args._[0]);
  
  if (!milestone) {
    showError('Milestone is required.');
    console.log(chalk.gray('\nUsage:'));
    console.log(chalk.gray('  reis complete-milestone <milestone>'));
    console.log(chalk.gray('  reis complete-milestone v1.0'));
    console.log(chalk.gray('  reis complete-milestone --tag v1.0'));
    console.log(chalk.gray('  reis complete-milestone --no-archive v1.0'));
    console.log(chalk.gray('  reis complete-milestone --skip-audit v1.0\n'));
    console.log(chalk.gray('Options:'));
    console.log(chalk.gray('  --tag / --no-tag        Control git tag creation (default: tag)'));
    console.log(chalk.gray('  --archive / --no-archive Control artifact archiving (default: archive)'));
    console.log(chalk.gray('  --force                 Complete even with audit warnings'));
    console.log(chalk.gray('  --skip-audit            Skip audit entirely (dangerous)\n'));
    return 1;
  }

  // Parse options
  const shouldTag = args.tag !== false && args['no-tag'] !== true;
  const shouldArchive = args.archive !== false && args['no-archive'] !== true;
  const force = args.force || false;
  const skipAudit = args['skip-audit'] || args.skipAudit || false;
  const verbose = args.verbose || false;

  // Show banner
  console.log();
  console.log(chalk.blue('╔═══════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue('║  🏁 REIS Complete Milestone                               ║'));
  console.log(chalk.blue('╚═══════════════════════════════════════════════════════════╝'));
  console.log();

  // Show configuration
  console.log(chalk.cyan('📋 Configuration:'));
  console.log(chalk.gray(`   Milestone: ${milestone}`));
  console.log(chalk.gray(`   Create Tag: ${shouldTag ? 'Yes' : 'No'}`));
  console.log(chalk.gray(`   Archive: ${shouldArchive ? 'Yes' : 'No'}`));
  console.log(chalk.gray(`   Force: ${force ? 'Yes' : 'No'}`));
  console.log(chalk.gray(`   Skip Audit: ${skipAudit ? 'Yes (⚠️  Dangerous!)' : 'No'}`));
  console.log();

  // Step 1: Run audit (unless skipped)
  let auditPassed = true;
  
  if (!skipAudit) {
    console.log(chalk.cyan(`Step 1: Running audit for milestone "${milestone}"...\n`));
    
    try {
      const auditResult = await audit({ 
        _: [milestone], 
        strict: !force,
        verbose: verbose 
      });
      
      if (auditResult !== 0) {
        auditPassed = false;
        showError(`Audit failed for milestone "${milestone}"`);
        console.log();
        console.log(chalk.yellow('Options:'));
        console.log(chalk.gray(`  • Run ${chalk.cyan(`reis debug --milestone ${milestone}`)} to analyze issues`));
        console.log(chalk.gray(`  • Run ${chalk.cyan(`reis complete-milestone --force ${milestone}`)} to ignore warnings`));
        console.log(chalk.gray(`  • Run ${chalk.cyan(`reis complete-milestone --skip-audit ${milestone}`)} to skip (dangerous)`));
        console.log();
        return 1;
      }
      
      showSuccess('Audit passed!\n');
    } catch (error) {
      showError(`Audit error: ${error.message}`);
      if (!force) {
        return 1;
      }
      showWarning('Continuing due to --force flag...\n');
    }
  } else {
    console.log(chalk.yellow('⚠️  Step 1: Skipping audit (--skip-audit specified)'));
    console.log(chalk.yellow('   Integration issues may exist!\n'));
  }

  // Step 2: Generate completion prompt
  console.log(chalk.cyan('Step 2: Generating completion instructions...\n'));

  const archivePath = path.join('.planning', 'archive', milestone);
  
  const prompt = generateCompletionPrompt({
    milestone,
    shouldTag,
    shouldArchive,
    archivePath,
    auditPassed,
    skipAudit,
    verbose
  });

  showPrompt(prompt);
  
  return 0;
}

/**
 * Generate the completion prompt
 * @param {Object} options - Completion options
 * @returns {string} The generated prompt
 */
function generateCompletionPrompt(options) {
  const { milestone, shouldTag, shouldArchive, archivePath, auditPassed, skipAudit, verbose } = options;

  let prompt = `## Complete Milestone: ${milestone}

### Pre-completion Status

- **Audit:** ${skipAudit ? '⚠️  SKIPPED' : auditPassed ? '✓ PASSED' : '⚠️  WARNINGS'}
${skipAudit ? '- **Warning:** Integration issues may exist since audit was skipped!' : ''}

### Step 1: Verify All Phases Complete

1. Read \`ROADMAP.md\` and identify all phases in milestone "${milestone}"
2. Confirm each phase shows as complete
3. If any phase is incomplete, stop and report

### Step 2: Archive Artifacts

${shouldArchive ? `
Archive milestone artifacts to \`${archivePath}/\`:

\`\`\`bash
# Create archive directory
mkdir -p ${archivePath}

# Copy relevant plans and summaries
cp -r .planning/phases/*${milestone}* ${archivePath}/ 2>/dev/null || true

# Copy relevant state snapshots
cp .planning/STATE.md ${archivePath}/STATE-snapshot.md

# Create archive manifest
echo "# Archive Manifest: ${milestone}" > ${archivePath}/MANIFEST.md
echo "Archived: $(date -u +"%Y-%m-%dT%H:%M:%SZ")" >> ${archivePath}/MANIFEST.md
\`\`\`
` : '**Archiving skipped** (--no-archive specified)'}

### Step 3: Update ROADMAP.md

Mark all phases in milestone "${milestone}" as complete:

\`\`\`markdown
## ${milestone} Milestones

- [x] Phase 1: Setup ✓ Complete
- [x] Phase 2: Core Features ✓ Complete
- [x] Phase 3: Integration ✓ Complete
...
\`\`\`

### Step 4: Update STATE.md

Add milestone completion entry:

\`\`\`markdown
## Milestone Completed: ${milestone}

**Date:** ${new Date().toISOString()}
**Status:** ✓ Complete

**Phases Completed:**
- Phase X: [description]
- Phase Y: [description]

**Integration Health:** ${skipAudit ? 'Unknown (audit skipped)' : 'Verified ✓'}

**Total Duration:** [Calculate from first to last phase]

**Key Deliverables:**
- [List major deliverables]
\`\`\`

### Step 5: Git Tag

${shouldTag ? `
Create annotated git tag:

\`\`\`bash
git tag -a ${milestone} -m "Milestone ${milestone} complete

Phases included:
- [List phases]

Key features:
- [List features]
"

# Optionally push tag
# git push origin ${milestone}
\`\`\`
` : '**Git tag skipped** (--no-tag specified)'}

### Step 6: Generate Completion Summary

Output a completion summary:

\`\`\`
╔═══════════════════════════════════════════════════════════╗
║  🎉 Milestone ${milestone} Complete!                        
╠═══════════════════════════════════════════════════════════╣
║  Phases Completed: X                                       
║  Total Duration: Y days                                    
║  Integration: ${skipAudit ? 'Not verified' : 'Healthy ✓'}                                      
║  Archived: ${shouldArchive ? 'Yes' : 'No'}                                           
║  Tagged: ${shouldTag ? milestone : 'No'}                                             
╚═══════════════════════════════════════════════════════════╝
\`\`\`

${verbose ? `
### Verbose Details

Report:
- Each file archived
- Each phase completion time
- Git commit history for milestone
- Total lines of code changed
` : ''}

### Next Steps

After completing this milestone:

1. Review the completion summary
2. ${shouldTag ? `Push the tag: \`git push origin ${milestone}\`` : 'Consider creating a release'}
3. Update any external documentation
4. Plan the next milestone with \`reis plan\`
`;

  return prompt;
}

module.exports = completeMilestone;
