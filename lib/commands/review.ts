/**
 * Review Command - Review plans against codebase
 * @module lib/commands/review
 */

import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import { PlanReviewer } from '../utils/plan-reviewer.js';
import { loadConfig } from '../utils/config.js';

interface ReviewOptions {
  autoFix?: boolean;
  strict?: boolean | string;
  verbose?: boolean;
  report?: boolean | string;
  [key: string]: unknown;
}

/**
 * Review plans against codebase
 * @param target - Plan file or directory path
 * @param options - Command options
 */
export async function reviewCommand(target: string | undefined, options: ReviewOptions = {}): Promise<void> {
  console.log(chalk.cyan('\n📋 REIS Plan Review\n'));

  const config = loadConfig();
  const reviewConfig: any = config?.review || {};

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
    let result: any;
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
    const critical = issues.filter((i: any) => i.severity === 'critical').length;
    const warnings = issues.filter((i: any) => i.severity === 'warning').length;
    const fixed = issues.filter((i: any) => i.fixed).length;

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
    console.error(chalk.red(`\n❌ Review failed: ${(error as Error).message}`));
    if (options.verbose) {
      console.error((error as Error).stack);
    }
    process.exit(1);
  }
}
