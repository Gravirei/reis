/**
 * Review Command - Review plans against codebase
 * @module lib/commands/review
 */

const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const { PlanReviewer } = require('../utils/plan-reviewer');
const { loadConfig } = require('../utils/config');

/**
 * Review plans against codebase
 * @param {string} target - Plan file or directory path
 * @param {Object} options - Command options
 */
async function reviewCommand(target, options = {}) {
  console.log(chalk.cyan('\n📋 REIS Plan Review\n'));

  const config = loadConfig();
  const reviewConfig = config?.review || {};
  
  const reviewOptions = {
    autoFix: options.autoFix || reviewConfig.autoFix || false,
    strict: options.strict || reviewConfig.strict || false,
    verbose: options.verbose || false
  };
  
  const reviewer = new PlanReviewer(process.cwd(), reviewOptions);
  
  // Determine target path
  let targetPath = target;
  if (!targetPath) {
    // Default to .planning directory
    targetPath = path.join(process.cwd(), '.planning');
    if (!fs.existsSync(targetPath)) {
      console.log(chalk.yellow('No .planning directory found.'));
      console.log(chalk.gray('Usage: reis review <plan-file-or-directory>'));
      return;
    }
  }
  
  try {
    let result;
    const fullPath = path.resolve(targetPath);
    
    if (fs.statSync(fullPath).isDirectory()) {
      console.log(chalk.gray(`Reviewing plans in: ${fullPath}\n`));
      result = await reviewer.reviewAllPlans(fullPath);
    } else {
      console.log(chalk.gray(`Reviewing: ${fullPath}\n`));
      result = await reviewer.reviewPlan(fullPath);
    }
    
    // Display results
    if (result.report) {
      console.log(result.report);
    }
    
    // Summary
    const issues = result.issues || [];
    const critical = issues.filter(i => i.severity === 'critical').length;
    const warnings = issues.filter(i => i.severity === 'warning').length;
    const fixed = issues.filter(i => i.fixed).length;
    
    console.log('\n' + '─'.repeat(50));
    if (critical > 0) {
      console.log(chalk.red(`❌ ${critical} critical issue(s) found`));
    }
    if (warnings > 0) {
      console.log(chalk.yellow(`⚠️  ${warnings} warning(s) found`));
    }
    if (fixed > 0) {
      console.log(chalk.green(`✅ ${fixed} issue(s) auto-fixed`));
    }
    if (critical === 0 && warnings === 0) {
      console.log(chalk.green('✅ All plans validated successfully'));
    }
    
    // Save report if requested
    if (options.report) {
      const reportPath = typeof options.report === 'string' 
        ? options.report 
        : 'REVIEW_REPORT.md';
      fs.writeFileSync(reportPath, result.report || '');
      console.log(chalk.gray(`\nReport saved to: ${reportPath}`));
    }
    
    // Exit with error if strict and issues found
    if (reviewOptions.strict && (critical > 0 || warnings > 0)) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error(chalk.red(`\n❌ Review failed: ${error.message}`));
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

module.exports = { reviewCommand };
