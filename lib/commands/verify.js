const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const chalk = require('chalk');

/**
 * Verify command - Runs reis_verifier subagent
 * @param {string} target - Phase number, phase name, or path to PLAN.md
 * @param {object} options - Command options
 */
async function verify(target, options = {}) {
  console.log(chalk.blue('🔍 REIS Verifier'));
  console.log();

  try {
    // Step 1: Resolve target to PLAN.md file
    const planPath = resolvePlanPath(target);
    
    if (!fs.existsSync(planPath)) {
      console.error(chalk.red(`❌ Error: Plan file not found: ${planPath}`));
      console.log(chalk.yellow('Usage: reis verify <phase-number|phase-name|plan-file>'));
      process.exit(1);
    }

    console.log(chalk.gray(`📄 Plan: ${planPath}`));
    console.log();

    // Step 2: Load and parse PLAN.md
    const planContent = fs.readFileSync(planPath, 'utf8');
    const planData = parsePlan(planContent);

    // Step 3: Display what will be verified
    console.log(chalk.bold('Verification Scope:'));
    console.log(chalk.gray(`  Objective: ${planData.objective}`));
    console.log(chalk.gray(`  Tasks: ${planData.tasks.length}`));
    console.log(chalk.gray(`  Success Criteria: ${planData.successCriteria.length}`));
    console.log();

    // Step 4: Generate verification prompt
    const verificationPrompt = generateVerificationPrompt(planPath, planData, options);

    // Step 5: Invoke reis_verifier via Rovo Dev
    console.log(chalk.blue('🔄 Running verification...'));
    console.log();

    const result = await invokeVerifier(verificationPrompt, planPath, planData, options);

    // Step 6: Display results summary
    displayResults(result);

    // Exit with appropriate code
    process.exit(result.passed ? 0 : 1);

  } catch (error) {
    console.error(chalk.red(`❌ Verification failed: ${error.message}`));
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * Resolve target argument to PLAN.md file path
 * @param {string} target - Phase number, name, or file path
 * @returns {string} Absolute path to PLAN.md
 */
function resolvePlanPath(target) {
  // If target is a file path, use it directly
  if (target.endsWith('.PLAN.md') || target.endsWith('.md')) {
    return path.resolve(target);
  }

  // Look in .planning/ directory
  const planningDir = path.join(process.cwd(), '.planning');
  
  // Try phase number (e.g., "1" or "phase-1")
  const phaseMatch = target.match(/^(?:phase-)?(\d+)$/);
  if (phaseMatch) {
    const phaseNum = phaseMatch[1];
    // Find phase directory
    const phaseDirs = fs.readdirSync(planningDir)
      .filter(d => d.startsWith(`${phaseNum}-`));
    
    if (phaseDirs.length > 0) {
      const phaseDir = path.join(planningDir, phaseDirs[0]);
      // Return first PLAN.md found (for single-plan phases)
      const plans = fs.readdirSync(phaseDir).filter(f => f.endsWith('.PLAN.md'));
      if (plans.length > 0) {
        return path.join(phaseDir, plans[0]);
      }
    }
  }

  // Try phase name (e.g., "design-and-specification")
  const phaseDir = path.join(planningDir, target);
  if (fs.existsSync(phaseDir)) {
    const plans = fs.readdirSync(phaseDir).filter(f => f.endsWith('.PLAN.md'));
    if (plans.length > 0) {
      return path.join(phaseDir, plans[0]);
    }
  }

  // Not found
  return target; // Return as-is, will fail with clear error
}

/**
 * Parse PLAN.md file
 * @param {string} content - PLAN.md content
 * @returns {object} Parsed plan data
 */
function parsePlan(content) {
  // Extract objective
  const objectiveMatch = content.match(/## Objective\n([^\n]+)/);
  const objective = objectiveMatch ? objectiveMatch[1].trim() : 'Unknown';

  // Extract tasks (count <task> tags)
  const taskMatches = content.match(/<task type="[^"]+">[\s\S]*?<\/task>/g) || [];
  const tasks = taskMatches.map((taskXml, index) => {
    const nameMatch = taskXml.match(/<name>([^<]+)<\/name>/);
    const filesMatch = taskXml.match(/<files>([^<]+)<\/files>/);
    return {
      index: index + 1,
      name: nameMatch ? nameMatch[1].trim() : `Task ${index + 1}`,
      files: filesMatch ? filesMatch[1].split(',').map(f => f.trim()) : []
    };
  });

  // Extract success criteria
  const criteriaMatch = content.match(/## Success Criteria\n([\s\S]*?)\n##/);
  const criteriaText = criteriaMatch ? criteriaMatch[1] : '';
  const successCriteria = criteriaText
    .split('\n')
    .filter(line => line.trim().startsWith('-') || line.trim().startsWith('✅'))
    .map(line => line.replace(/^[-✅]\s*/, '').trim())
    .filter(Boolean);

  return { objective, tasks, successCriteria };
}

/**
 * Generate verification prompt for reis_verifier
 * @param {string} planPath - Path to PLAN.md
 * @param {object} planData - Parsed plan data
 * @param {object} options - Command options
 * @returns {string} Verification prompt
 */
function generateVerificationPrompt(planPath, planData, options) {
  return `You are the reis_verifier subagent. Verify the execution results for this plan.

**Plan File:** ${planPath}

**Objective:** ${planData.objective}

**Tasks to Verify (${planData.tasks.length}):**
${planData.tasks.map(t => `${t.index}. ${t.name} (files: ${t.files.join(', ') || 'see plan'})`).join('\n')}

**Success Criteria (${planData.successCriteria.length}):**
${planData.successCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

---

**CRITICAL: Feature Completeness Validation (FR4.1)**

You MUST verify that ALL ${planData.tasks.length} tasks were actually implemented:
- Parse each task's expected deliverables
- Check file existence, code patterns, tests
- Report missing implementations with evidence
- Calculate completion: ${planData.tasks.length}/${planData.tasks.length} (100%) = PASS, less = FAIL

---

**Verification Protocol:**

1. Load PLAN.md and parse all tasks and deliverables
2. Run test suite (npm test)
3. Validate code quality (syntax, linting)
4. **Validate Feature Completeness (FR4.1) - CRITICAL**
   - For each task, verify all deliverables exist
   - Check files, functions, tests, endpoints
   - Calculate completion percentage
   - Report missing features with evidence
5. Verify documentation
6. Generate VERIFICATION_REPORT.md in .planning/verification/
7. Update STATE.md

**Output:** Generate comprehensive verification report with clear PASS/FAIL status.

${options.verbose ? '\n**Mode:** Verbose - Include detailed output' : ''}
${options.strict ? '\n**Mode:** Strict - Fail on any warnings' : ''}
`;
}

/**
 * Invoke reis_verifier subagent via Rovo Dev
 * @param {string} prompt - Verification prompt (used in dry-run)
 * @param {string} planPath - Path to plan file
 * @param {object} planData - Parsed plan data
 * @param {object} options - Command options
 * @returns {Promise<object>} Verification results
 */
async function invokeVerifier(prompt, planPath, planData, options) {
  // Dry run mode - show prompt only
  if (options.dryRun) {
    console.log(chalk.yellow('--dry-run mode: Showing prompt that would be sent\n'));
    console.log(chalk.gray('─'.repeat(60)));
    console.log(prompt.substring(0, 2000) + '...');
    console.log(chalk.gray('─'.repeat(60)));
    
    return {
      passed: false,
      message: 'Dry run - no actual verification',
      dryRun: true
    };
  }
  
  // Real execution mode
  const { invokeSubagent, SubagentInvoker } = require('../utils/subagent-invoker');
  
  const invoker = new SubagentInvoker({ verbose: options.verbose });
  
  invoker.on('progress', (data) => {
    console.log(chalk.gray(`  ${data.message}`));
  });
  
  try {
    const result = await invokeSubagent('reis_verifier', {
      planPath,
      verbose: options.verbose,
      timeout: options.timeout || 300000,
      additionalContext: {
        planData,
        strictMode: options.strict || false,
        expectedTasks: planData.tasks.length,
        successCriteria: planData.successCriteria
      }
    });
    
    // Parse verification result
    let passed = false;
    let completeness = 0;
    let tasks = [];
    let issues = [];
    
    if (result.success && result.metadata) {
      passed = result.metadata.passed || false;
      completeness = result.metadata.completeness || 0;
      tasks = result.metadata.tasks || [];
      issues = result.metadata.issues || [];
    }
    
    // Try to parse from output if metadata not available
    if (result.output) {
      const completeMatch = result.output.match(/(\d+)%\s*complete/i);
      if (completeMatch) {
        completeness = parseInt(completeMatch[1]);
        passed = completeness >= 100;
      }
      
      const passMatch = result.output.match(/VERIFICATION (PASSED|FAILED)/i);
      if (passMatch) {
        passed = passMatch[1].toUpperCase() === 'PASSED';
      }
    }
    
    return {
      passed,
      completeness,
      message: passed ? 'Verification passed' : 'Verification failed',
      tasks,
      issues,
      output: result.output
    };
    
  } catch (error) {
    return {
      passed: false,
      message: `Verification error: ${error.message}`,
      error
    };
  }
}

/**
 * Display verification results to user
 * @param {object} result - Verification results
 */
function displayResults(result) {
  // Handle dry-run case
  if (result.dryRun) {
    console.log(chalk.yellow('\n⚠️  Dry run complete - no actual verification performed'));
    return;
  }
  
  console.log(chalk.bold('Verification Results:'));
  console.log();
  
  if (result.passed) {
    console.log(chalk.green('✅ VERIFICATION PASSED'));
    console.log();
    console.log(chalk.gray('All checks passed:'));
    console.log(chalk.gray('  ✅ Tests passing'));
    console.log(chalk.gray(`  ✅ Feature completeness: ${result.completeness || 100}%`));
    console.log(chalk.gray('  ✅ Success criteria met'));
    console.log(chalk.gray('  ✅ Code quality acceptable'));
  } else {
    console.log(chalk.red('❌ VERIFICATION FAILED'));
    console.log();
    
    // Show completeness if available
    if (result.completeness !== undefined) {
      console.log(chalk.yellow(`  Completeness: ${result.completeness}%`));
    }
    
    // Show issues if available
    if (result.issues && result.issues.length > 0) {
      console.log(chalk.yellow('Issues found:'));
      result.issues.forEach(issue => {
        console.log(chalk.gray(`  - ${issue}`));
      });
    } else {
      console.log(chalk.yellow('Issues found:'));
      console.log(chalk.gray('  See verification report for details'));
    }
    
    // Show message
    if (result.message) {
      console.log(chalk.gray(`\n  ${result.message}`));
    }
  }
  
  console.log();
  console.log(chalk.gray('Report: .planning/verification/[phase]/VERIFICATION_REPORT.md'));
}

module.exports = verify;
