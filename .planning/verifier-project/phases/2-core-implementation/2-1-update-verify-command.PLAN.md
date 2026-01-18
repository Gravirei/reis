# Plan: 2-1 - Update verify Command with reis_verifier Integration

## Objective
Transform the stub verify command into a functional command that invokes the reis_verifier subagent with proper context loading and prompt generation.

## Context
Currently, `lib/commands/verify.js` is a minimal stub that just shows a prompt. We need to upgrade it to:
1. Parse phase/plan arguments correctly
2. Load relevant PLAN.md files and success criteria
3. Detect verification scope (phase vs individual plan)
4. Generate a comprehensive prompt for reis_verifier subagent
5. Invoke the subagent through Rovo Dev's agent system

**Reference Files:**
- `lib/commands/verify.js` - Current stub implementation
- `lib/commands/plan.js` - Similar command pattern for reference
- `lib/commands/execute-plan.js` - Subagent invocation pattern
- `lib/utils/state-manager.js` - For STATE.md interaction
- `lib/utils/command-helpers.js` - Validation utilities
- `subagents/reis_verifier.md` - Specification (created in Phase 1)

**Key Design Decisions:**
- Support both `reis verify <phase>` (verify entire phase) and `reis verify <plan-file>` (verify specific plan)
- Load all relevant context (PLAN.md, success criteria, STATE.md)
- Generate rich prompt including verification checklist
- Use existing command patterns from plan/execute-plan

## Dependencies
- Phase 1 complete (subagents/reis_verifier.md and templates exist)

## Tasks

<task type="auto">
<name>Update verify command with context loading</name>
<files>lib/commands/verify.js</files>
<action>
Rewrite the verify command to properly load verification context and prepare for subagent invocation.

**Replace the current stub with:**

```javascript
const fs = require('fs');
const path = require('path');
const { showPrompt, showError, checkPlanningDir, validatePhaseNumber } = require('../utils/command-helpers');
const stateManager = require('../utils/state-manager');

module.exports = function verify(args) {
  // Check if .planning/ exists
  if (!checkPlanningDir()) {
    showError('Not a REIS project. Run "reis new" or "reis map" first.');
    process.exit(1);
  }
  
  const input = args.phase || args._?.[0];
  if (!input) {
    showError('Usage: reis verify <phase> or reis verify <plan-file>');
    console.log('\nExamples:');
    console.log('  reis verify 1           # Verify entire Phase 1');
    console.log('  reis verify path/to/PLAN.md  # Verify specific plan');
    process.exit(1);
  }
  
  // Determine verification scope
  let verificationScope;
  let targetPlans = [];
  
  if (input.endsWith('.PLAN.md') || input.endsWith('.md')) {
    // Specific plan file
    verificationScope = 'plan';
    if (!fs.existsSync(input)) {
      showError(`Plan file not found: ${input}`);
      process.exit(1);
    }
    targetPlans.push(input);
  } else {
    // Phase number
    const phaseNum = validatePhaseNumber(input);
    if (phaseNum === null) {
      process.exit(1);
    }
    
    verificationScope = 'phase';
    
    // Find phase directory
    const planningDir = path.join(process.cwd(), '.planning');
    const phaseDir = findPhaseDirectory(planningDir, phaseNum);
    
    if (!phaseDir) {
      showError(`Phase ${phaseNum} directory not found in .planning/`);
      process.exit(1);
    }
    
    // Find all PLAN.md files in phase
    targetPlans = findPlanFiles(phaseDir);
    
    if (targetPlans.length === 0) {
      showError(`No PLAN.md files found in phase ${phaseNum}`);
      process.exit(1);
    }
  }
  
  // Load verification context
  const context = loadVerificationContext(targetPlans, verificationScope);
  
  // Generate verification prompt
  const prompt = generateVerificationPrompt(context);
  
  // Show the prompt (Rovo Dev will invoke reis_verifier)
  showPrompt(prompt);
  
  return 0;
};

// Helper: Find phase directory
function findPhaseDirectory(planningDir, phaseNum) {
  const phasesDir = path.join(planningDir, 'phases');
  if (!fs.existsSync(phasesDir)) {
    const entries = fs.readdirSync(planningDir);
    const phaseDir = entries.find(e => {
      const match = e.match(/^(\d+)-/);
      return match && parseInt(match[1]) === phaseNum;
    });
    return phaseDir ? path.join(planningDir, phaseDir) : null;
  }
  
  const entries = fs.readdirSync(phasesDir);
  const phaseDir = entries.find(e => {
    const match = e.match(/^(\d+)-/);
    return match && parseInt(match[1]) === phaseNum;
  });
  return phaseDir ? path.join(phasesDir, phaseDir) : null;
}

// Helper: Find all PLAN.md files recursively
function findPlanFiles(dir) {
  const plans = [];
  
  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith('.PLAN.md') || entry.name === 'PLAN.md') {
        plans.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return plans;
}

// Helper: Load verification context
function loadVerificationContext(planFiles, scope) {
  const context = {
    scope,
    plans: [],
    projectRoot: process.cwd(),
    planningDir: path.join(process.cwd(), '.planning'),
  };
  
  // Load each plan
  for (const planFile of planFiles) {
    const content = fs.readFileSync(planFile, 'utf8');
    const planInfo = parsePlanFile(content, planFile);
    context.plans.push(planInfo);
  }
  
  // Load STATE.md if exists
  const statePath = path.join(context.planningDir, 'STATE.md');
  if (fs.existsSync(statePath)) {
    context.stateContent = fs.readFileSync(statePath, 'utf8');
  }
  
  // Load ROADMAP.md if exists
  const roadmapPath = path.join(context.planningDir, 'ROADMAP.md');
  if (fs.existsSync(roadmapPath)) {
    context.roadmapContent = fs.readFileSync(roadmapPath, 'utf8');
  }
  
  return context;
}

// Helper: Parse plan file for key information
function parsePlanFile(content, filePath) {
  const plan = {
    path: filePath,
    content,
    successCriteria: [],
    verification: '',
    tasks: [],
  };
  
  // Extract success criteria section
  const criteriaMatch = content.match(/## Success Criteria\s+([\s\S]*?)(?=\n##|\n---|\z)/);
  if (criteriaMatch) {
    const criteriaText = criteriaMatch[1];
    const criteria = criteriaText.match(/^[-*]\s+(.+)$/gm);
    if (criteria) {
      plan.successCriteria = criteria.map(c => c.replace(/^[-*]\s+/, '').trim());
    }
  }
  
  // Extract verification section
  const verifyMatch = content.match(/## Verification\s+([\s\S]*?)(?=\n##|\n---|\z)/);
  if (verifyMatch) {
    plan.verification = verifyMatch[1].trim();
  }
  
  // Extract tasks
  const taskMatches = content.matchAll(/<task[^>]*>[\s\S]*?<\/task>/g);
  for (const match of taskMatches) {
    const taskContent = match[0];
    const nameMatch = taskContent.match(/<name>([^<]+)<\/name>/);
    const verifyMatch = taskContent.match(/<verify>([^<]+)<\/verify>/);
    const doneMatch = taskContent.match(/<done>([^<]+)<\/done>/);
    
    plan.tasks.push({
      name: nameMatch ? nameMatch[1].trim() : 'Unknown task',
      verify: verifyMatch ? verifyMatch[1].trim() : '',
      done: doneMatch ? doneMatch[1].trim() : '',
    });
  }
  
  return plan;
}

// Helper: Generate verification prompt for reis_verifier
function generateVerificationPrompt(context) {
  const { scope, plans } = context;
  
  let prompt = `You are reis_verifier. Verify the following ${scope}.\n\n`;
  
  if (scope === 'phase') {
    prompt += `**Verification Scope**: Entire phase (${plans.length} plans)\n\n`;
  } else {
    prompt += `**Verification Scope**: Single plan\n\n`;
  }
  
  // Add plan details
  prompt += `## Plans to Verify\n\n`;
  for (let i = 0; i < plans.length; i++) {
    const plan = plans[i];
    prompt += `### Plan ${i + 1}: ${path.basename(plan.path)}\n\n`;
    prompt += `**Path**: \`${plan.path}\`\n\n`;
    
    if (plan.successCriteria.length > 0) {
      prompt += `**Success Criteria**:\n`;
      plan.successCriteria.forEach(c => {
        prompt += `- ${c}\n`;
      });
      prompt += `\n`;
    }
    
    if (plan.verification) {
      prompt += `**Verification Commands**:\n${plan.verification}\n\n`;
    }
  }
  
  // Add verification instructions
  prompt += `## Verification Protocol\n\n`;
  prompt += `Follow the 7-step verification protocol from subagents/reis_verifier.md:\n\n`;
  prompt += `1. Load verification context (✓ already loaded above)\n`;
  prompt += `2. Run test suite (npm test or detected framework)\n`;
  prompt += `3. Validate success criteria (check each criterion with evidence)\n`;
  prompt += `4. Check code quality (syntax, linting if available)\n`;
  prompt += `5. Verify documentation (README, CHANGELOG, code comments)\n`;
  prompt += `6. Generate verification report using templates/VERIFICATION_REPORT.md\n`;
  prompt += `7. Update STATE.md with verification results\n\n`;
  
  prompt += `## Output Requirements\n\n`;
  prompt += `- Generate comprehensive verification report\n`;
  prompt += `- Save report to \`.planning/verification/[phase-name]/[timestamp].md\`\n`;
  prompt += `- Update STATE.md with verification entry\n`;
  prompt += `- Provide clear pass/fail status with evidence\n`;
  prompt += `- Include actionable recommendations if verification fails\n\n`;
  
  prompt += `## Project Context\n\n`;
  prompt += `**Project Root**: ${context.projectRoot}\n`;
  prompt += `**Planning Directory**: ${context.planningDir}\n\n`;
  
  if (context.stateContent) {
    prompt += `**Current STATE.md** (for context):\n\`\`\`markdown\n${context.stateContent.substring(0, 500)}...\n\`\`\`\n\n`;
  }
  
  prompt += `Begin verification now.`;
  
  return prompt;
}
```

**Key Implementation Details:**
- Supports both phase numbers and plan file paths
- Recursively finds all PLAN.md files in a phase
- Parses success criteria, verification commands, and tasks from PLAN.md
- Loads STATE.md and ROADMAP.md for context
- Generates comprehensive prompt for reis_verifier subagent
- Uses existing command-helpers for validation
- Follows existing command patterns (similar to plan.js, execute-plan.js)

**What to Avoid:**
- ❌ Don't hardcode paths - use path.join() for cross-platform support
- ❌ Don't fail silently - provide clear error messages
- ❌ Don't assume file structure - validate everything exists
- ❌ Don't make the prompt too long - truncate STATE.md if needed

</action>
<verify>
```bash
# Check file was updated
test -f lib/commands/verify.js && echo "✅ File exists"

# Verify it's no longer a stub
grep -q "loadVerificationContext\|generateVerificationPrompt" lib/commands/verify.js && echo "✅ Core functions implemented"

# Check for proper error handling
grep -q "showError" lib/commands/verify.js && echo "✅ Error handling present"

# Verify helper functions exist
grep -q "function findPhaseDirectory" lib/commands/verify.js && echo "✅ Phase finder implemented"
grep -q "function parsePlanFile" lib/commands/verify.js && echo "✅ Plan parser implemented"

# Check line count (should be ~200+ lines now)
wc -l lib/commands/verify.js

# Try to run it (will show usage)
node lib/commands/verify.js 2>&1 | head -5 || echo "Command structure ready"
```
</verify>
<done>
- lib/commands/verify.js updated with full implementation
- Supports both phase number and plan file path arguments
- Loads verification context (plans, success criteria, STATE.md)
- Parses PLAN.md files to extract success criteria and verification commands
- Generates comprehensive prompt for reis_verifier subagent
- Includes helper functions: findPhaseDirectory, findPlanFiles, loadVerificationContext, parsePlanFile, generateVerificationPrompt
- Proper error handling for missing files/phases
- File is ~200-250 lines with clear structure
</done>
</task>

<task type="auto">
<name>Add verify command tests</name>
<files>tests/commands/verify.test.js</files>
<action>
Create initial test suite for the verify command to ensure context loading and argument parsing work correctly.

**Create directory if needed:**
```bash
mkdir -p tests/commands
```

**Test Structure:**

```javascript
const verify = require('../../lib/commands/verify');
const fs = require('fs');
const path = require('path');

describe('verify command', () => {
  const mockPlanningDir = path.join(__dirname, '../fixtures/mock-planning');
  
  beforeAll(() => {
    // Create mock planning directory structure
    // This will be expanded in Phase 4, for now just basic structure
  });
  
  afterAll(() => {
    // Cleanup mock directories
  });
  
  describe('argument parsing', () => {
    test('requires phase or plan argument', () => {
      // Test that command shows error without arguments
      // Spy on process.exit and showError
    });
    
    test('accepts phase number', () => {
      // Test that phase number is parsed correctly
    });
    
    test('accepts plan file path', () => {
      // Test that plan file path is accepted
    });
    
    test('validates phase number is valid', () => {
      // Test that invalid phase numbers are rejected
    });
  });
  
  describe('context loading', () => {
    test('loads single plan file', () => {
      // Test loading a specific plan file
    });
    
    test('loads all plans in a phase', () => {
      // Test loading multiple plans from phase directory
    });
    
    test('extracts success criteria from plan', () => {
      // Test that success criteria are parsed correctly
    });
    
    test('extracts verification commands from plan', () => {
      // Test that verification section is extracted
    });
    
    test('loads STATE.md if exists', () => {
      // Test STATE.md loading
    });
  });
  
  describe('prompt generation', () => {
    test('generates prompt with plan context', () => {
      // Test that prompt includes success criteria
    });
    
    test('includes verification protocol steps', () => {
      // Test that 7-step protocol is in prompt
    });
    
    test('includes project paths', () => {
      // Test that project root and planning dir are included
    });
  });
});
```

**Implementation Notes:**
- Use Jest or Node test runner (match existing test framework)
- Create minimal fixtures for testing (mock PLAN.md files)
- Focus on unit testing the helper functions
- Integration tests will come in Phase 4
- Use mocks/spies for fs operations and process.exit
- Keep tests simple and focused for now

**Test Fixtures Needed:**
Create `tests/fixtures/mock-planning/` with:
- Sample PLAN.md with success criteria
- Mock STATE.md
- Phase directory structure

**Note:** These are basic structural tests. Comprehensive tests will be added in Wave 4.1.

</action>
<verify>
```bash
# Check test file created
test -f tests/commands/verify.test.js && echo "✅ Test file created"

# Verify test structure
grep -q "describe('verify command'" tests/commands/verify.test.js && echo "✅ Test suite defined"
grep -q "argument parsing\|context loading\|prompt generation" tests/commands/verify.test.js && echo "✅ Test categories present"

# Check for test cases
grep -c "test(" tests/commands/verify.test.js

# Try running tests (may skip if fixtures not ready)
npm test -- tests/commands/verify.test.js 2>&1 | head -20 || echo "Tests defined (fixtures needed)"
```
</verify>
<done>
- tests/commands/verify.test.js created with test structure
- Test categories: argument parsing, context loading, prompt generation
- At least 8 test cases defined
- Uses appropriate test framework (Jest/Node)
- Includes basic fixtures setup/teardown
- Tests are ready to expand in Phase 4
</done>
</task>

## Success Criteria
- ✅ lib/commands/verify.js updated from stub to full implementation
- ✅ Command accepts both phase numbers and plan file paths
- ✅ Loads verification context (plans, success criteria, STATE.md)
- ✅ Parses PLAN.md files correctly (success criteria, verification commands)
- ✅ Generates comprehensive prompt for reis_verifier subagent
- ✅ Proper error handling for missing files/invalid arguments
- ✅ Helper functions implemented (findPhaseDirectory, parsePlanFile, etc.)
- ✅ Basic test suite created in tests/commands/verify.test.js
- ✅ Command ready to invoke reis_verifier subagent

## Verification

```bash
# Verify implementation
cat lib/commands/verify.js | grep "^function " | head -10

# Check file size (should be ~200+ lines)
wc -l lib/commands/verify.js

# Test command help
node -e "const verify = require('./lib/commands/verify'); verify({});" 2>&1 | head -10

# Verify test file
ls -lh tests/commands/verify.test.js

# Run tests (may skip some without fixtures)
npm test -- tests/commands/verify.test.js || echo "Tests defined, fixtures needed"

# Check for proper structure
grep -c "function.*(" lib/commands/verify.js
```

---

*This plan will be executed by reis_executor in a fresh context.*
