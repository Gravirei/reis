# Plan: 4-1 - Verifier Testing

## Objective
Create comprehensive test suite for the verify command and reis_verifier subagent, including FR4.1 feature completeness validation tests.

## Context
Testing validates that the verifier works correctly, especially the critical FR4.1 feature completeness detection. We need tests for various scenarios including incomplete tasks.

**Key Test Scenarios:**
- All tasks complete (100%) → PASS
- Some tasks incomplete (<100%) → FAIL (FR4.1 catches)
- Tests pass but features missing → FAIL (FR4.1 catches)
- Tests fail + features complete → FAIL
- No tests but features complete → PASS with warnings

## Dependencies
- Phase 3 complete (all verification components implemented)

## Tasks

<task type="auto">
<name>Create test suite for verify command</name>
<files>test/commands/verify.test.js</files>
<action>
Create comprehensive test suite for the verify command with FR4.1 scenarios.

**Test Structure:**

```javascript
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const verify = require('../../lib/commands/verify');

describe('verify command', () => {
  const testDir = path.join(__dirname, '../fixtures/verify-test');
  
  before(() => {
    // Set up test fixtures
    setupTestFixtures();
  });
  
  after(() => {
    // Clean up test fixtures
    cleanupTestFixtures();
  });
  
  describe('plan resolution', () => {
    it('resolves phase number to PLAN.md', () => {
      // Test: reis verify 1
      const planPath = resolvePlanPath('1');
      assert(planPath.includes('phase-1'));
    });
    
    it('resolves phase name to PLAN.md', () => {
      // Test: reis verify design-and-specification
      const planPath = resolvePlanPath('design-and-specification');
      assert(planPath.endsWith('.PLAN.md'));
    });
    
    it('accepts direct PLAN.md path', () => {
      // Test: reis verify path/to/plan.PLAN.md
      const planPath = resolvePlanPath('test.PLAN.md');
      assert(planPath === path.resolve('test.PLAN.md'));
    });
  });
  
  describe('PLAN.md parsing', () => {
    it('extracts objective', () => {
      const content = '## Objective\nTest objective\n';
      const parsed = parsePlan(content);
      assert.strictEqual(parsed.objective, 'Test objective');
    });
    
    it('extracts tasks with files', () => {
      const content = `
<task type="auto">
<name>Build Feature X</name>
<files>src/feature-x.js, test/feature-x.test.js</files>
</task>`;
      const parsed = parsePlan(content);
      assert.strictEqual(parsed.tasks.length, 1);
      assert.strictEqual(parsed.tasks[0].name, 'Build Feature X');
      assert.strictEqual(parsed.tasks[0].files.length, 2);
    });
    
    it('extracts success criteria', () => {
      const content = `## Success Criteria
- ✅ Feature X works
- ✅ Tests pass
## Next`;
      const parsed = parsePlan(content);
      assert.strictEqual(parsed.successCriteria.length, 2);
    });
  });
  
  describe('FR4.1: Feature Completeness Validation', () => {
    it('detects all tasks complete (100%)', async () => {
      // Scenario: All 3 tasks have deliverables present
      const plan = createTestPlan([
        { name: 'Task 1', files: ['src/a.js'], complete: true },
        { name: 'Task 2', files: ['src/b.js'], complete: true },
        { name: 'Task 3', files: ['src/c.js'], complete: true }
      ]);
      
      const result = await validateFeatureCompleteness(plan);
      
      assert.strictEqual(result.percentage, 100);
      assert.strictEqual(result.status, 'PASS');
      assert.strictEqual(result.complete, 3);
      assert.strictEqual(result.incomplete, 0);
    });
    
    it('detects incomplete tasks (<100%)', async () => {
      // Scenario: Task 2 missing (FR4.1 critical test)
      const plan = createTestPlan([
        { name: 'Task 1', files: ['src/a.js'], complete: true },
        { name: 'Task 2', files: ['src/b.js'], complete: false }, // MISSING
        { name: 'Task 3', files: ['src/c.js'], complete: true }
      ]);
      
      const result = await validateFeatureCompleteness(plan);
      
      assert.strictEqual(result.percentage, 66); // 2/3 = 66%
      assert.strictEqual(result.status, 'FAIL');
      assert.strictEqual(result.complete, 2);
      assert.strictEqual(result.incomplete, 1);
      
      // Verify missing task details
      const incompleteTask = result.tasks.find(t => t.name === 'Task 2');
      assert.strictEqual(incompleteTask.status, 'INCOMPLETE');
      assert(incompleteTask.missing.length > 0);
    });
    
    it('reports missing deliverables with evidence', async () => {
      const plan = createTestPlan([
        { name: 'Build Login', files: ['src/auth/login.js'], complete: false }
      ]);
      
      const result = await validateFeatureCompleteness(plan);
      const task = result.tasks[0];
      
      assert.strictEqual(task.status, 'INCOMPLETE');
      assert(task.missing.some(m => m.deliverable.path === 'src/auth/login.js'));
      assert(task.missing[0].searchAttempts.length > 0);
    });
    
    it('extracts deliverables from task action text', () => {
      const task = {
        name: 'Build API',
        files: [],
        action: 'Implement authenticateUser() function and create UserModel class. Build POST /api/login endpoint.'
      };
      
      const deliverables = extractDeliverables(task.name, task.files, task.action);
      
      const functionDeliverable = deliverables.find(d => d.type === 'function');
      assert(functionDeliverable);
      assert.strictEqual(functionDeliverable.name, 'authenticateUser');
      
      const classDeliverable = deliverables.find(d => d.type === 'class');
      assert(classDeliverable);
      assert.strictEqual(classDeliverable.name, 'UserModel');
      
      const endpointDeliverable = deliverables.find(d => d.type === 'endpoint');
      assert(endpointDeliverable);
      assert.strictEqual(endpointDeliverable.path, '/api/login');
    });
  });
  
  describe('verification scenarios', () => {
    it('passes when all checks pass (100% complete, tests pass)', async () => {
      const results = {
        tests: { metrics: { passed: 10, failed: 0 } },
        featureCompleteness: { percentage: 100, status: 'PASS' },
        successCriteria: { met: 5, unmet: 0 },
        codeQuality: { status: 'PASS' }
      };
      
      const status = calculateOverallStatus(results);
      
      assert.strictEqual(status.status, 'PASS');
    });
    
    it('fails when feature incomplete (<100%) even if tests pass', async () => {
      const results = {
        tests: { metrics: { passed: 10, failed: 0 } }, // All tests pass
        featureCompleteness: { percentage: 66, status: 'FAIL', incomplete: 1 }, // FR4.1: incomplete
        successCriteria: { met: 5, unmet: 0 },
        codeQuality: { status: 'PASS' }
      };
      
      const status = calculateOverallStatus(results);
      
      assert.strictEqual(status.status, 'FAIL');
      assert(status.reason.includes('Feature completeness'));
      assert(status.reason.includes('66%'));
    });
    
    it('fails when tests fail', async () => {
      const results = {
        tests: { metrics: { passed: 9, failed: 1 } },
        featureCompleteness: { percentage: 100, status: 'PASS' },
        successCriteria: { met: 5, unmet: 0 },
        codeQuality: { status: 'PASS' }
      };
      
      const status = calculateOverallStatus(results);
      
      assert.strictEqual(status.status, 'FAIL');
      assert(status.reason.includes('tests failing'));
    });
    
    it('passes with warnings when no tests but features complete', async () => {
      const results = {
        tests: { metrics: { passed: 0, failed: 0, total: 0 } },
        featureCompleteness: { percentage: 100, status: 'PASS' },
        successCriteria: { met: 5, unmet: 0 },
        codeQuality: { status: 'PASS' }
      };
      
      const status = calculateOverallStatus(results);
      
      assert.strictEqual(status.status, 'PASS_WITH_WARNINGS');
      assert(status.warnings.includes('No tests configured'));
    });
  });
  
  describe('report generation', () => {
    it('generates report with FR4.1 section', () => {
      const reportData = {
        featureCompleteness: {
          percentage: 66,
          complete: 2,
          total: 3,
          tasks: [
            { name: 'Task 1', status: 'COMPLETE', evidence: [] },
            { name: 'Task 2', status: 'INCOMPLETE', missing: [] },
            { name: 'Task 3', status: 'COMPLETE', evidence: [] }
          ]
        }
      };
      
      const report = generateFeatureCompletenessSection(reportData.featureCompleteness);
      
      assert(report.includes('Feature Completeness (FR4.1)'));
      assert(report.includes('66%'));
      assert(report.includes('2/3'));
      assert(report.includes('Task 1'));
      assert(report.includes('Task 2'));
      assert(report.includes('INCOMPLETE'));
    });
  });
});

// Helper functions
function setupTestFixtures() {
  // Create test directory structure
  // Create sample PLAN.md files
  // Create sample source files
}

function cleanupTestFixtures() {
  // Remove test fixtures
}

function createTestPlan(tasks) {
  // Create mock plan with tasks
  // Set up file system for complete/incomplete tasks
}
```

**Test Coverage:**
- ✅ Plan resolution (phase number, name, path)
- ✅ PLAN.md parsing (objective, tasks, criteria)
- ✅ FR4.1: 100% task completion detection
- ✅ FR4.1: Incomplete task detection (<100%)
- ✅ FR4.1: Missing deliverable reporting
- ✅ FR4.1: Deliverable extraction from action text
- ✅ Overall status calculation with FR4.1
- ✅ Scenario: Tests pass + features incomplete → FAIL
- ✅ Scenario: No tests + features complete → PASS with warnings
- ✅ Report generation with FR4.1 section

Create file at `test/commands/verify.test.js`
</action>
<verify>
```bash
# Check test file exists
test -f test/commands/verify.test.js && echo "✅ Test file created"

# Verify FR4.1 test coverage
grep -q "FR4.1.*Feature Completeness" test/commands/verify.test.js && echo "✅ FR4.1 tests present"

# Check for key test scenarios
grep -q "all tasks complete.*100" test/commands/verify.test.js && echo "✅ 100% completion test"
grep -q "incomplete tasks.*<100" test/commands/verify.test.js && echo "✅ Incomplete detection test"
grep -q "tests pass.*features incomplete" test/commands/verify.test.js && echo "✅ Tests pass + incomplete scenario"

# Verify test count
grep -c "it('.*'," test/commands/verify.test.js
```
</verify>
<done>
- test/commands/verify.test.js created with comprehensive test suite
- Tests for plan resolution (phase number, name, path)
- Tests for PLAN.md parsing (tasks, criteria extraction)
- FR4.1 test: 100% task completion detection
- FR4.1 test: Incomplete task detection (<100%)
- FR4.1 test: Missing deliverable reporting with evidence
- FR4.1 test: Deliverable extraction from action text
- Scenario tests: Tests pass + incomplete features → FAIL
- Scenario tests: No tests + complete features → PASS with warnings
- Report generation tests with FR4.1 section
- ~200+ lines of test coverage
</done>
</task>

## Success Criteria
- ✅ test/commands/verify.test.js created
- ✅ Tests for plan resolution and parsing
- ✅ FR4.1 feature completeness validation tests
- ✅ Test: 100% completion → PASS
- ✅ Test: <100% completion → FAIL
- ✅ Test: Missing deliverables reported with evidence
- ✅ Test: Tests pass but features incomplete → FAIL
- ✅ Test: No tests but features complete → PASS with warnings
- ✅ Report generation tests include FR4.1 section
- ✅ All critical scenarios covered

## Verification

```bash
# Run tests
npm test test/commands/verify.test.js

# Check test coverage
grep -c "describe\|it" test/commands/verify.test.js

# Verify FR4.1 coverage
grep -n "FR4.1" test/commands/verify.test.js
```

---

*This plan will be executed by reis_executor in a fresh context.*
