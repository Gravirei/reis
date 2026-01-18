# Plan: 2-1 - Update verify Command

## Objective
Update `lib/commands/verify.js` to integrate with the reis_verifier subagent, including support for FR4.1 Feature Completeness validation.

## Context
Currently, `lib/commands/verify.js` is a stub. We need to transform it into a fully functional command that loads PLAN.md files, invokes the reis_verifier subagent, and coordinates the verification process.

**Key Integration Points:**
- Load PLAN.md from phase or plan argument
- Extract success criteria and tasks (for FR4.1)
- Invoke reis_verifier subagent via Rovo Dev
- Handle verification results
- Display summary to user

**Reference Files:**
- `lib/commands/plan.js` - Similar subagent invocation pattern
- `lib/commands/execute-plan.js` - Plan loading logic
- `subagents/reis_verifier.md` - Subagent specification (from Wave 1.1)
- `lib/utils/state-manager.js` - STATE.md integration

## Dependencies
- Wave 1.1 (reis_verifier.md specification must exist)
- Wave 1.2 (Templates must exist for reference)

## Tasks

<task type="auto">
<name>Update verify command with subagent integration</name>
<files>lib/commands/verify.js</files>
<action>
Completely rewrite the verify command to integrate with reis_verifier subagent.

**Current State:** Stub function that prints a message.

**Target State:** Full command that:
1. Parses phase/plan argument
2. Loads PLAN.md file
3. Extracts success criteria and tasks
4. Generates verification prompt for Rovo Dev
5. Invokes reis_verifier subagent
6. Displays results

**Implementation:**

```javascript
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

    const result = await invokeVerifier(verificationPrompt, options);

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
 * @param {string} prompt - Verification prompt
 * @param {object} options - Command options
 * @returns {Promise<object>} Verification results
 */
async function invokeVerifier(prompt, options) {
  // TODO: Integrate with Rovo Dev API or CLI
  // For now, this is a placeholder that would invoke the subagent
  
  // In real implementation, this would:
  // 1. Call Rovo Dev with reis_verifier subagent
  // 2. Pass the verification prompt
  // 3. Wait for completion
  // 4. Parse and return results
  
  console.log(chalk.yellow('⚠️  Note: Subagent invocation pending Rovo Dev integration'));
  console.log(chalk.gray('The verification prompt has been generated and would be sent to reis_verifier.'));
  console.log();
  
  return {
    passed: false,
    message: 'Verification system pending integration',
    tasks: [],
    tests: {},
    criteria: {}
  };
}

/**
 * Display verification results to user
 * @param {object} result - Verification results
 */
function displayResults(result) {
  console.log(chalk.bold('Verification Results:'));
  console.log();
  
  if (result.passed) {
    console.log(chalk.green('✅ VERIFICATION PASSED'));
    console.log();
    console.log(chalk.gray('All checks passed:'));
    console.log(chalk.gray('  ✅ Tests passing'));
    console.log(chalk.gray('  ✅ Feature completeness: 100%'));
    console.log(chalk.gray('  ✅ Success criteria met'));
    console.log(chalk.gray('  ✅ Code quality acceptable'));
  } else {
    console.log(chalk.red('❌ VERIFICATION FAILED'));
    console.log();
    console.log(chalk.yellow('Issues found:'));
    console.log(chalk.gray('  See verification report for details'));
  }
  
  console.log();
  console.log(chalk.gray('Report: .planning/verification/[phase]/VERIFICATION_REPORT.md'));
}

module.exports = verify;
```

**Key Features:**
- ✅ Flexible target resolution (phase number, name, or file path)
- ✅ PLAN.md parsing (objective, tasks, success criteria)
- ✅ Task extraction for FR4.1 validation
- ✅ Verification prompt generation with FR4.1 instructions
- ✅ Subagent invocation structure (ready for Rovo Dev integration)
- ✅ Clear result display

**Notes:**
- The `invokeVerifier` function is a placeholder pending Rovo Dev integration
- When integrated, it will spawn Rovo Dev with the reis_verifier subagent
- For now, it generates the correct prompt that would be sent
</action>
<verify>
```bash
# Check file was updated
test -f lib/commands/verify.js && echo "✅ verify.js exists"

# Check for key functions
grep -q "function verify" lib/commands/verify.js && echo "✅ Main verify function present"
grep -q "resolvePlanPath" lib/commands/verify.js && echo "✅ Plan resolution logic present"
grep -q "parsePlan" lib/commands/verify.js && echo "✅ Plan parsing logic present"
grep -q "generateVerificationPrompt" lib/commands/verify.js && echo "✅ Prompt generation present"

# Check for FR4.1 integration
grep -q "Feature Completeness\|FR4.1" lib/commands/verify.js && echo "✅ FR4.1 mentioned in prompts"
grep -q "completion percentage\|tasks complete" lib/commands/verify.js && echo "✅ Completion tracking included"

# Verify it exports the function
grep -q "module.exports.*verify" lib/commands/verify.js && echo "✅ Exports verify function"

# Check line count (should be substantial rewrite)
wc -l lib/commands/verify.js
```
</verify>
<done>
- lib/commands/verify.js completely rewritten
- Includes plan resolution logic (phase number/name/path)
- Parses PLAN.md for objective, tasks, success criteria
- Generates verification prompt with FR4.1 instructions
- Structures subagent invocation (ready for Rovo Dev integration)
- Displays clear results to user
- Handles errors gracefully
- ~250 lines of implementation code
</done>
</task>

<task type="auto">
<name>Update CLI to expose verify command</name>
<files>bin/reis.js</files>
<action>
Ensure the verify command is properly wired into the CLI.

**Check Current State:**
Look for existing verify command registration in `bin/reis.js`.

**If Already Present:**
Verify it's correctly configured and uses the updated command.

**If Missing:**
Add command registration:

```javascript
program
  .command('verify <target>')
  .description('Verify execution results against success criteria (uses reis_verifier subagent)')
  .option('-v, --verbose', 'Show detailed verification output')
  .option('-s, --strict', 'Fail on warnings')
  .action(async (target, options) => {
    const verify = require('../lib/commands/verify');
    await verify(target, options);
  });
```

**Expected Location:** After `execute-plan` command, before `help` or other utility commands.

**Verify Help Text:**
```bash
reis verify --help
```

Should display:
```
Usage: reis verify <target> [options]

Verify execution results against success criteria (uses reis_verifier subagent)

Arguments:
  target                 Phase number, phase name, or path to PLAN.md

Options:
  -v, --verbose         Show detailed verification output
  -s, --strict          Fail on warnings
  -h, --help            Display help for command
```
</action>
<verify>
```bash
# Check CLI file exists
test -f bin/reis.js && echo "✅ CLI file exists"

# Check for verify command registration
grep -q "\.command.*verify" bin/reis.js && echo "✅ verify command registered"

# Check for options
grep -A5 "\.command.*verify" bin/reis.js | grep -q "verbose\|strict" && echo "✅ Command options present"

# Test help output (if CLI is functional)
node bin/reis.js verify --help 2>/dev/null && echo "✅ Help text works" || echo "⚠️  CLI needs debugging"
```
</verify>
<done>
- bin/reis.js includes verify command
- Command accepts target argument (phase/plan)
- Options: --verbose, --strict
- Help text describes FR4.1 feature completeness validation
- Properly imports and invokes lib/commands/verify.js
</done>
</task>

## Success Criteria
- ✅ lib/commands/verify.js completely rewritten with subagent integration
- ✅ Plan resolution works (phase number, name, or file path)
- ✅ PLAN.md parsing extracts objective, tasks, success criteria
- ✅ Task extraction supports FR4.1 feature completeness validation
- ✅ Verification prompt generation includes FR4.1 instructions
- ✅ Subagent invocation structure ready for Rovo Dev integration
- ✅ CLI exposes verify command with proper options
- ✅ Clear user feedback and error handling
- ✅ Help text describes verification capabilities

## Verification

```bash
# Check implementation
cat lib/commands/verify.js | head -100

# Verify key functions exist
grep "^function" lib/commands/verify.js

# Check FR4.1 integration
grep -n "FR4.1\|Feature Completeness\|completion percentage" lib/commands/verify.js

# Test CLI registration
node bin/reis.js verify --help

# Verify exports
tail -5 lib/commands/verify.js
```

---

*This plan will be executed by reis_executor in a fresh context.*
