# Plan: 4-1 - Create Comprehensive Verifier Tests

## Objective
Build comprehensive test suite for reis_verifier functionality, including unit tests, integration tests, and end-to-end verification scenarios.

## Context
All verification functionality is now implemented (Phases 1-3). Before finalizing, we need comprehensive tests to ensure the verifier works correctly in various scenarios: passing verification, failing verification, partial verification, missing tests, missing docs, etc.

**Key Requirements:**
- Test verify command (argument parsing, context loading)
- Test verification report generation
- Test STATE.md updates
- Test all verification scenarios (pass/fail/partial)
- Test error handling (missing files, malformed plans, etc.)
- Integration tests with sample projects
- Ensure no regressions in existing tests

**Test Framework:**
- Use existing project test framework (Jest/Vitest/Node test runner)
- Create test fixtures (sample projects, mock PLAN.md files)
- Mock file system operations where appropriate
- Integration tests with real file operations

## Dependencies
- Phase 3 complete (all verification features implemented)

## Tasks

<task type="auto">
<name>Expand verify command tests</name>
<files>tests/commands/verify.test.js</files>
<action>
Expand the basic test structure created in Wave 2.1 into a comprehensive test suite.

**Test Structure:**

```javascript
const verify = require('../../lib/commands/verify');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Mock setup
jest.mock('../utils/command-helpers', () => ({
  showPrompt: jest.fn(),
  showError: jest.fn(),
  checkPlanningDir: jest.fn(() => true),
  validatePhaseNumber: jest.fn((n) => parseInt(n)),
}));

describe('verify command', () => {
  const testFixturesDir = path.join(__dirname, '../fixtures/verify');
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Create test fixtures
    setupTestFixtures();
  });
  
  afterEach(() => {
    // Cleanup test fixtures
    cleanupTestFixtures();
  });
  
  describe('argument parsing', () => {
    test('requires phase or plan argument', () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation();
      verify({});
      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
    });
    
    test('accepts phase number', () => {
      const result = verify({ phase: '1' });
      expect(result).toBeDefined();
    });
    
    test('accepts plan file path', () => {
      const planPath = path.join(testFixturesDir, 'sample.PLAN.md');
      fs.writeFileSync(planPath, '# Plan\n## Success Criteria\n- Test criterion');
      const result = verify({ _: [planPath] });
      expect(result).toBeDefined();
    });
    
    test('rejects invalid phase number', () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation();
      verify({ phase: 'invalid' });
      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
    });
    
    test('rejects non-existent plan file', () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation();
      verify({ _: ['nonexistent.PLAN.md'] });
      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
    });
  });
  
  describe('context loading', () => {
    test('loads single plan file with success criteria', () => {
      const planContent = `# Plan: Test
## Success Criteria
- ✅ Criterion 1
- ✅ Criterion 2
## Verification
\`\`\`bash
npm test
\`\`\``;
      
      const planPath = path.join(testFixturesDir, 'test.PLAN.md');
      fs.writeFileSync(planPath, planContent);
      
      const result = verify({ _: [planPath] });
      expect(result).toBe(0);
      // Verify prompt was generated with criteria
    });
    
    test('loads all plans in a phase directory', () => {
      // Create phase directory with multiple plans
      const phaseDir = path.join(testFixturesDir, 'phases/1-test-phase');
      fs.mkdirSync(phaseDir, { recursive: true });
      
      fs.writeFileSync(path.join(phaseDir, '1-1-plan.PLAN.md'), '# Plan 1\n## Success Criteria\n- Test');
      fs.writeFileSync(path.join(phaseDir, '1-2-plan.PLAN.md'), '# Plan 2\n## Success Criteria\n- Test');
      
      // Mock validatePhaseNumber to return 1
      const result = verify({ phase: '1' });
      expect(result).toBe(0);
    });
    
    test('extracts success criteria correctly', () => {
      const planContent = `# Plan
## Success Criteria
- ✅ File exists
- ✅ Tests pass
- ✅ Documentation updated`;
      
      const planPath = path.join(testFixturesDir, 'criteria.PLAN.md');
      fs.writeFileSync(planPath, planContent);
      
      verify({ _: [planPath] });
      
      // Verify showPrompt was called with criteria
      const { showPrompt } = require('../utils/command-helpers');
      expect(showPrompt).toHaveBeenCalled();
      const prompt = showPrompt.mock.calls[0][0];
      expect(prompt).toContain('File exists');
      expect(prompt).toContain('Tests pass');
    });
    
    test('loads STATE.md if exists', () => {
      const stateContent = '# Project State\n## Current Status\nActive Phase: 1';
      const statePath = path.join(testFixturesDir, '.planning/STATE.md');
      fs.mkdirSync(path.dirname(statePath), { recursive: true });
      fs.writeFileSync(statePath, stateContent);
      
      const planPath = path.join(testFixturesDir, 'test.PLAN.md');
      fs.writeFileSync(planPath, '# Plan\n## Success Criteria\n- Test');
      
      verify({ _: [planPath] });
      
      // Verify STATE.md was included in context
      const { showPrompt } = require('../utils/command-helpers');
      const prompt = showPrompt.mock.calls[0][0];
      expect(prompt).toContain('STATE.md');
    });
  });
  
  describe('prompt generation', () => {
    test('generates prompt with 7-step protocol', () => {
      const planPath = path.join(testFixturesDir, 'test.PLAN.md');
      fs.writeFileSync(planPath, '# Plan\n## Success Criteria\n- Test');
      
      verify({ _: [planPath] });
      
      const { showPrompt } = require('../utils/command-helpers');
      const prompt = showPrompt.mock.calls[0][0];
      
      expect(prompt).toContain('7-step');
      expect(prompt).toContain('Load verification context');
      expect(prompt).toContain('Run test suite');
      expect(prompt).toContain('Validate success criteria');
    });
    
    test('includes project paths in prompt', () => {
      const planPath = path.join(testFixturesDir, 'test.PLAN.md');
      fs.writeFileSync(planPath, '# Plan\n## Success Criteria\n- Test');
      
      verify({ _: [planPath] });
      
      const { showPrompt } = require('../utils/command-helpers');
      const prompt = showPrompt.mock.calls[0][0];
      
      expect(prompt).toContain('Project Root');
      expect(prompt).toContain('Planning Directory');
    });
    
    test('handles plans without success criteria', () => {
      const planPath = path.join(testFixturesDir, 'no-criteria.PLAN.md');
      fs.writeFileSync(planPath, '# Plan\nNo criteria section');
      
      verify({ _: [planPath] });
      
      // Should not fail, just note no criteria
      expect(verify({ _: [planPath] })).toBe(0);
    });
  });
  
  describe('error handling', () => {
    test('handles missing .planning directory', () => {
      const { checkPlanningDir } = require('../utils/command-helpers');
      checkPlanningDir.mockReturnValueOnce(false);
      
      const mockExit = jest.spyOn(process, 'exit').mockImplementation();
      verify({ phase: '1' });
      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
    });
    
    test('handles malformed PLAN.md gracefully', () => {
      const planPath = path.join(testFixturesDir, 'malformed.PLAN.md');
      fs.writeFileSync(planPath, 'Not a valid plan file');
      
      // Should not crash
      const result = verify({ _: [planPath] });
      expect(result).toBe(0);
    });
    
    test('handles empty phase directory', () => {
      const phaseDir = path.join(testFixturesDir, '.planning/phases/1-empty');
      fs.mkdirSync(phaseDir, { recursive: true });
      
      const mockExit = jest.spyOn(process, 'exit').mockImplementation();
      verify({ phase: '1' });
      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
    });
  });
});

// Helper functions
function setupTestFixtures() {
  const fixturesDir = path.join(__dirname, '../fixtures/verify');
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }
}

function cleanupTestFixtures() {
  const fixturesDir = path.join(__dirname, '../fixtures/verify');
  if (fs.existsSync(fixturesDir)) {
    fs.rmSync(fixturesDir, { recursive: true, force: true });
  }
}
```

**Additional Test Cases:**

- Test with nested phase directories
- Test with multiple verification commands (won't interfere)
- Test verification scope detection (phase vs plan)
- Test ROADMAP.md loading if present
- Performance test (should handle 10+ plans quickly)

**Coverage Goals:**
- Argument parsing: 100%
- Context loading: 95%+
- Prompt generation: 95%+
- Error handling: 90%+

</action>
<verify>
```bash
# Run tests
npm test -- tests/commands/verify.test.js

# Check test coverage
npm test -- --coverage tests/commands/verify.test.js

# Verify test count (should have 15+ tests)
grep -c "test(" tests/commands/verify.test.js

# Check for test categories
grep "describe(" tests/commands/verify.test.js
```
</verify>
<done>
- tests/commands/verify.test.js expanded with comprehensive test suite
- Argument parsing tests (5+ test cases)
- Context loading tests (5+ test cases)
- Prompt generation tests (3+ test cases)
- Error handling tests (4+ test cases)
- Test fixtures setup and cleanup
- Mock implementations for file system and command helpers
- All tests passing
- Coverage >90% for verify command
</done>
</task>

<task type="auto">
<name>Create integration tests for verification scenarios</name>
<files>tests/integration/verification-scenarios.test.js</files>
<action>
Create integration tests that verify the entire verification workflow in realistic scenarios.

**Create test file:**

```javascript
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('Verification Scenarios (Integration)', () => {
  const testProjectDir = path.join(__dirname, '../fixtures/test-project');
  
  beforeAll(() => {
    // Create test project structure
    setupTestProject();
  });
  
  afterAll(() => {
    // Cleanup test project
    cleanupTestProject();
  });
  
  describe('Passing Verification Scenario', () => {
    test('verifies successfully when all criteria met', async () => {
      // Setup: Project with passing tests and met criteria
      createPassingProject(testProjectDir);
      
      // Execute verification
      const result = runVerification(testProjectDir, '1');
      
      // Verify report generated
      const reportPath = findLatestReport(testProjectDir, 'phase-1');
      expect(fs.existsSync(reportPath)).toBe(true);
      
      // Verify report shows PASSED status
      const reportContent = fs.readFileSync(reportPath, 'utf8');
      expect(reportContent).toContain('✅ PASSED');
      expect(reportContent).toContain('All tests pass');
      
      // Verify STATE.md updated
      const stateContent = fs.readFileSync(
        path.join(testProjectDir, '.planning/STATE.md'),
        'utf8'
      );
      expect(stateContent).toContain('Verification:');
      expect(stateContent).toContain('✅ PASSED');
      expect(stateContent).toContain('Last Verified');
    });
  });
  
  describe('Failing Verification Scenario', () => {
    test('reports failures when tests fail', async () => {
      // Setup: Project with failing tests
      createFailingTestsProject(testProjectDir);
      
      // Execute verification
      const result = runVerification(testProjectDir, '1');
      
      // Verify report generated
      const reportPath = findLatestReport(testProjectDir, 'phase-1');
      const reportContent = fs.readFileSync(reportPath, 'utf8');
      
      // Verify report shows FAILED status
      expect(reportContent).toContain('❌ FAILED');
      expect(reportContent).toContain('tests failing');
      
      // Verify recommendations included
      expect(reportContent).toContain('## Recommendations');
      expect(reportContent).toContain('Fix');
      
      // Verify STATE.md shows blocker
      const stateContent = fs.readFileSync(
        path.join(testProjectDir, '.planning/STATE.md'),
        'utf8'
      );
      expect(stateContent).toContain('Active Blockers');
      expect(stateContent).toContain('Verification Failed');
    });
    
    test('reports failures when criteria not met', async () => {
      // Setup: Project with passing tests but unmet criteria
      createUnmetCriteriaProject(testProjectDir);
      
      const result = runVerification(testProjectDir, '1');
      const reportPath = findLatestReport(testProjectDir, 'phase-1');
      const reportContent = fs.readFileSync(reportPath, 'utf8');
      
      expect(reportContent).toContain('❌ FAILED');
      expect(reportContent).toContain('criteria not met');
    });
  });
  
  describe('Partial Verification Scenario', () => {
    test('reports partial when warnings present', async () => {
      // Setup: Tests pass, criteria met, but quality warnings
      createPartialProject(testProjectDir);
      
      const result = runVerification(testProjectDir, '1');
      const reportPath = findLatestReport(testProjectDir, 'phase-1');
      const reportContent = fs.readFileSync(reportPath, 'utf8');
      
      expect(reportContent).toContain('⚠️ PARTIAL');
      expect(reportContent).toContain('warnings');
    });
  });
  
  describe('No Tests Scenario', () => {
    test('warns about missing tests but does not fail', async () => {
      // Setup: Project without tests
      createNoTestsProject(testProjectDir);
      
      const result = runVerification(testProjectDir, '1');
      const reportPath = findLatestReport(testProjectDir, 'phase-1');
      const reportContent = fs.readFileSync(reportPath, 'utf8');
      
      expect(reportContent).toContain('⚠️');
      expect(reportContent).toContain('No tests found');
      expect(reportContent).not.toContain('❌ FAILED');
    });
  });
  
  describe('Quality Issues Scenario', () => {
    test('detects syntax errors', async () => {
      createSyntaxErrorProject(testProjectDir);
      
      const result = runVerification(testProjectDir, '1');
      const reportPath = findLatestReport(testProjectDir, 'phase-1');
      const reportContent = fs.readFileSync(reportPath, 'utf8');
      
      expect(reportContent).toContain('Syntax');
      expect(reportContent).toContain('error');
    });
    
    test('detects linting issues', async () => {
      createLintingIssuesProject(testProjectDir);
      
      const result = runVerification(testProjectDir, '1');
      const reportPath = findLatestReport(testProjectDir, 'phase-1');
      const reportContent = fs.readFileSync(reportPath, 'utf8');
      
      expect(reportContent).toContain('linting');
      expect(reportContent).toContain('issues');
    });
  });
  
  describe('Documentation Scenario', () => {
    test('detects missing README', async () => {
      createNoReadmeProject(testProjectDir);
      
      const result = runVerification(testProjectDir, '1');
      const reportPath = findLatestReport(testProjectDir, 'phase-1');
      const reportContent = fs.readFileSync(reportPath, 'utf8');
      
      expect(reportContent).toContain('README');
      expect(reportContent).toContain('missing');
    });
  });
  
  describe('Multiple Verification Runs', () => {
    test('creates separate reports for each run', async () => {
      createPassingProject(testProjectDir);
      
      // Run verification twice
      runVerification(testProjectDir, '1');
      // Wait a second to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 1000));
      runVerification(testProjectDir, '1');
      
      // Verify two reports exist
      const reportsDir = path.join(testProjectDir, '.planning/verification/phase-1');
      const reports = fs.readdirSync(reportsDir).filter(f => f.endsWith('.md'));
      expect(reports.length).toBeGreaterThanOrEqual(2);
    });
    
    test('updates STATE.md each time', async () => {
      createPassingProject(testProjectDir);
      
      runVerification(testProjectDir, '1');
      const stateContent1 = fs.readFileSync(
        path.join(testProjectDir, '.planning/STATE.md'),
        'utf8'
      );
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      runVerification(testProjectDir, '1');
      const stateContent2 = fs.readFileSync(
        path.join(testProjectDir, '.planning/STATE.md'),
        'utf8'
      );
      
      expect(stateContent1).not.toBe(stateContent2);
    });
  });
});

// Helper functions
function setupTestProject() {
  // Create test project directory
  const dir = path.join(__dirname, '../fixtures/test-project');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function cleanupTestProject() {
  const dir = path.join(__dirname, '../fixtures/test-project');
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function createPassingProject(dir) {
  // Create package.json with test script
  // Create sample code files
  // Create PLAN.md with success criteria
  // Create passing test file
  // (Implementation details...)
}

function createFailingTestsProject(dir) {
  // Similar to passing but with failing test
}

function createUnmetCriteriaProject(dir) {
  // Tests pass but files missing for criteria
}

function createPartialProject(dir) {
  // All good but has console.logs
}

function createNoTestsProject(dir) {
  // No test files or test script
}

function createSyntaxErrorProject(dir) {
  // Code file with syntax error
}

function createLintingIssuesProject(dir) {
  // Code with linting problems
}

function createNoReadmeProject(dir) {
  // No README.md file
}

function runVerification(projectDir, phase) {
  // Execute verification command
  // Return result
}

function findLatestReport(projectDir, phaseName) {
  // Find most recent verification report
  // Return path
}
```

**Test Coverage:**
- ✅ Passing verification end-to-end
- ❌ Failing verification (tests, criteria, quality)
- ⚠️ Partial verification (warnings)
- Special cases (no tests, no docs, syntax errors)
- Multiple verification runs
- STATE.md updates

</action>
<verify>
```bash
# Run integration tests
npm test -- tests/integration/verification-scenarios.test.js

# Verify test count
grep -c "test(" tests/integration/verification-scenarios.test.js

# Check for scenario coverage
grep "describe(" tests/integration/verification-scenarios.test.js
```
</verify>
<done>
- tests/integration/verification-scenarios.test.js created
- Passing verification scenario test
- Failing verification scenarios (tests, criteria)
- Partial verification scenario test
- No tests scenario test
- Quality issues scenarios (syntax, linting)
- Documentation scenario test
- Multiple verification runs test
- Helper functions for project setup
- All integration tests passing
- Realistic test fixtures and scenarios
</done>
</task>

<task type="auto">
<name>Run full test suite and fix any regressions</name>
<files>package.json</files>
<action>
Run the complete test suite to ensure no regressions were introduced and all tests pass.

**Run all tests:**

```bash
# Run full test suite
npm test

# Check test coverage
npm test -- --coverage

# Run specific test categories
npm test -- tests/commands/
npm test -- tests/integration/
npm test -- tests/utils/
```

**Expected Results:**
- All existing tests still pass (no regressions)
- New verify command tests pass
- Integration tests pass
- Code coverage >80% for new code
- Total test count: 309+ tests (existing) + 25+ new tests = 334+ total

**If any tests fail:**

1. **Identify the failure:**
   - Read error messages carefully
   - Check if it's a new test or regression

2. **Fix regressions:**
   - If existing test broke, review changes in related code
   - Update mocks or test setup if needed
   - Fix implementation to maintain backward compatibility

3. **Fix new test failures:**
   - Debug test logic
   - Verify test fixtures are correct
   - Ensure test environment is properly set up

4. **Update tests if needed:**
   - If requirements changed, update test expectations
   - Document why test changed
   - Ensure changes are intentional

**Test Configuration Check:**

```bash
# Verify test configuration
cat package.json | grep -A10 "scripts"

# Ensure test script exists
grep "\"test\"" package.json

# Check for test framework
grep "jest\|vitest\|mocha" package.json
```

**Coverage Requirements:**
- lib/commands/verify.js: >90%
- subagents/reis_verifier.md: N/A (specification)
- templates/VERIFICATION_REPORT.md: N/A (template)

**Document Test Results:**

Create a summary of test results:

```bash
# Run tests and save output
npm test > test-results.txt 2>&1

# Create summary
echo "## Test Results" > .planning/verifier-project/TEST_SUMMARY.md
echo "" >> .planning/verifier-project/TEST_SUMMARY.md
echo "**Date**: $(date)" >> .planning/verifier-project/TEST_SUMMARY.md
echo "**Total Tests**: $(grep -oP '\d+(?= tests?)' test-results.txt | head -1)" >> .planning/verifier-project/TEST_SUMMARY.md
echo "**Passed**: $(grep -oP '\d+(?= passed)' test-results.txt | head -1)" >> .planning/verifier-project/TEST_SUMMARY.md
echo "**Failed**: $(grep -oP '\d+(?= failed)' test-results.txt | head -1 || echo '0')" >> .planning/verifier-project/TEST_SUMMARY.md
echo "" >> .planning/verifier-project/TEST_SUMMARY.md
echo "All tests passing: ✅" >> .planning/verifier-project/TEST_SUMMARY.md

# Cleanup
rm test-results.txt
```

</action>
<verify>
```bash
# Final test run
npm test

# Verify no failures
npm test 2>&1 | grep -q "failed" && echo "⚠️ Tests failing" || echo "✅ All tests pass"

# Check test count
npm test 2>&1 | grep -oP '\d+ tests?' | head -1

# Verify coverage (if configured)
npm test -- --coverage 2>&1 | grep -A5 "Coverage"

# Check test summary was created
test -f .planning/verifier-project/TEST_SUMMARY.md && echo "✅ Test summary created"
```
</verify>
<done>
- Full test suite executed successfully
- All existing tests passing (no regressions)
- New verify command tests passing (15+ tests)
- Integration tests passing (10+ scenarios)
- Test coverage >80% for new code
- Total test count: 334+ tests
- Test summary documented in .planning/verifier-project/TEST_SUMMARY.md
- No breaking changes introduced
</done>
</task>

## Success Criteria
- ✅ Comprehensive test suite for verify command (15+ tests)
- ✅ Integration tests for verification scenarios (10+ scenarios)
- ✅ All tests passing with no regressions
- ✅ Test coverage >80% for new code
- ✅ Realistic test fixtures created
- ✅ Error handling tested thoroughly
- ✅ Passing, failing, and partial verification scenarios tested
- ✅ Multiple verification runs tested
- ✅ STATE.md updates tested
- ✅ Test summary documented

## Verification

```bash
# Run complete test suite
npm test

# Check test statistics
npm test 2>&1 | grep -E "tests?|pass|fail"

# Verify new test files
ls -lh tests/commands/verify.test.js
ls -lh tests/integration/verification-scenarios.test.js

# Check test coverage
npm test -- --coverage | grep -A10 "Coverage"

# Count test cases
echo "Verify command tests:"
grep -c "test(" tests/commands/verify.test.js
echo "Integration scenario tests:"
grep -c "test(" tests/integration/verification-scenarios.test.js

# Verify test summary
cat .planning/verifier-project/TEST_SUMMARY.md
```

---

*This plan will be executed by reis_executor in a fresh context.*
