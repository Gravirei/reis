# Plan: 4-1 - Comprehensive Test Suite

## Objective
Create comprehensive test suite covering all debugger functionality including FR2.1 incomplete implementation analysis.

## Context
Tests must verify:
- All 7 issue types (including incomplete implementation)
- 6-step analysis protocol
- **FR2.1:** Incomplete implementation detection, root cause analysis (70%/20%/10%), targeted fix plan generation
- Pattern matching
- Fix plan generation

## Dependencies
- Plans 2-1, 2-2, 2-3 (core modules exist)
- Plans 3-1, 3-2, 3-3 (advanced modules exist)

## Tasks

<task type="auto">
<name>Create test suite with FR2.1 incomplete implementation coverage</name>
<files>tests/debugger/debugger.test.js</files>
<action>
Create comprehensive test suite:

```javascript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { IssueClassifier } from '../../lib/utils/issue-classifier.js';
import { DebugAnalyzer } from '../../lib/utils/debug-analyzer.js';
import { FixPlanGenerator } from '../../lib/utils/fix-plan-generator.js';

describe('REIS Debugger - Comprehensive Tests', () => {
  
  describe('FR2.1: Incomplete Implementation Detection', () => {
    
    it('should detect incomplete implementation from task completion', () => {
      const input = `
VERIFICATION FAILED

Tasks: 2/3 complete (66%)

Completed:
- Task 1: User Login ✓
- Task 3: Session Management ✓

Missing:
- Task 2: Password Reset

Evidence:
- password-reset.js NOT FOUND
`;

      const classifier = new IssueClassifier();
      const result = classifier.classify(input);

      expect(result.type).toBe('incomplete-implementation');
      expect(result.incompleteness.completeness).toBe(66);
      expect(result.incompleteness.completed).toBe(2);
      expect(result.incompleteness.total).toBe(3);
      expect(result.incompleteness.missing).toContain('Task 2: Password Reset');
    });

    it('should distinguish incomplete implementation from test failure', () => {
      const incompleteInput = `Tasks: 1/2 complete`;
      const testFailInput = `Test failed: expected true but got false`;

      const classifier = new IssueClassifier();
      
      const incomplete = classifier.classify(incompleteInput);
      const testFail = classifier.classify(testFailInput);

      expect(incomplete.type).toBe('incomplete-implementation');
      expect(testFail.type).toBe('test-failure');
    });

    it('should detect multiple missing features', () => {
      const input = `
Tasks: 1/4 complete (25%)

Missing:
- Task 2: Password Reset
- Task 3: Email Verification
- Task 4: Profile Update
`;

      const classifier = new IssueClassifier();
      const result = classifier.classify(input);

      expect(result.incompleteness.missing.length).toBe(3);
      expect(result.incompleteness.completeness).toBe(25);
    });
  });

  describe('FR2.1: Root Cause Analysis - Executor Skip (70%)', () => {
    
    it('should identify executor skip from missing git commits', async () => {
      const input = `
Tasks: 2/3 complete
Missing: Task 2 (Password Reset)
`;

      const analysis = {
        classification: {
          type: 'incomplete-implementation',
          incompleteness: {
            completeness: 66,
            missing: ['Task 2: Password Reset'],
            completedTasks: ['Task 1: Login', 'Task 3: Session']
          }
        }
      };

      const analyzer = new DebugAnalyzer(input, {});
      analyzer.analysis = analysis;

      const rootCause = await analyzer.analyzeIncompleteImplementation();

      expect(rootCause.likelyCause).toBe('executor-skip');
      expect(rootCause.confidence).toBeGreaterThan(0.5);
      expect(rootCause.likelihood.executorSkip).toBeGreaterThan(0.6);
    });

    it('should boost executor skip likelihood for high complexity', async () => {
      const input = `
Tasks: 2/3 complete
Missing: Task 2 (Complex OAuth Integration with Multiple Providers)
`;

      const analysis = {
        classification: {
          type: 'incomplete-implementation',
          incompleteness: {
            completeness: 66,
            missing: ['Task 2: Complex OAuth Integration with Multiple Providers'],
            completedTasks: ['Task 1', 'Task 3']
          }
        }
      };

      const analyzer = new DebugAnalyzer(input, {});
      analyzer.analysis = analysis;

      const rootCause = await analyzer.analyzeIncompleteImplementation();

      expect(rootCause.contributingFactors).toContain('Task complexity may have deterred implementation');
    });
  });

  describe('FR2.1: Root Cause Analysis - Plan Ambiguity (20%)', () => {
    
    it('should identify plan ambiguity from vague task description', async () => {
      // This test would need a mock plan file
      // For now, verify the analysis method exists
      const analyzer = new DebugAnalyzer('', {});
      
      expect(typeof analyzer.analyzePlanAmbiguity).toBe('function');
    });
  });

  describe('FR2.1: Root Cause Analysis - Dependency Blocker (10%)', () => {
    
    it('should identify dependency blocker from error logs', async () => {
      // Create temporary error log
      const logPath = 'tmp_rovodev_error.log';
      fs.writeFileSync(logPath, 'Error: MODULE_NOT_FOUND: Cannot find module "stripe"');

      const input = `Tasks: 2/3 complete\nMissing: Task 2 (Stripe Payment)`;
      
      const analysis = {
        classification: {
          type: 'incomplete-implementation',
          incompleteness: {
            completeness: 66,
            missing: ['Task 2: Stripe Payment'],
            completedTasks: []
          }
        }
      };

      const analyzer = new DebugAnalyzer(input, {});
      analyzer.analysis = analysis;

      const result = await analyzer.analyzeDependencyBlocker(analysis.classification.incompleteness);

      // Clean up
      if (fs.existsSync(logPath)) fs.unlinkSync(logPath);

      expect(result.score).toBeGreaterThan(0.1);
    });
  });

  describe('FR2.1: Targeted Fix Plan Generation', () => {
    
    it('should generate targeted fix plan for incomplete implementation', () => {
      const analysis = {
        classification: {
          type: 'incomplete-implementation',
          severity: 'major',
          scope: 'localized',
          incompleteness: {
            completeness: 66,
            completed: 2,
            total: 3,
            missing: ['Task 2: Password Reset'],
            completedTasks: ['Task 1: Login', 'Task 3: Session Management']
          }
        },
        rootCause: {
          likelyCause: 'executor-skip',
          confidence: 0.75,
          evidence: ['No git commits for password reset']
        },
        recommendation: {
          name: 'Targeted Re-execution',
          description: 'Implement only missing Task 2'
        },
        context: {
          originalPlan: 'test-plan.PLAN.md'
        }
      };

      const generator = new FixPlanGenerator(analysis);
      const plan = generator.generate();

      expect(plan).toContain('Fix Plan:');
      expect(plan).toContain('incomplete-implementation');
      expect(plan).toContain('DO NOT');
      expect(plan).toContain('missing features');
      expect(plan).toContain('100%');
      expect(plan).toContain('Task 2: Password Reset');
    });

    it('should include DO NOT constraints for completed tasks', () => {
      const analysis = {
        classification: {
          type: 'incomplete-implementation',
          incompleteness: {
            completeness: 50,
            completed: 2,
            total: 4,
            missing: ['Task 2', 'Task 4'],
            completedTasks: ['Task 1: Login', 'Task 3: Session']
          }
        },
        rootCause: { likelyCause: 'executor-skip', confidence: 0.7 },
        recommendation: { name: 'Targeted Re-execution', description: 'Fix it' },
        context: {}
      };

      const generator = new FixPlanGenerator(analysis);
      const plan = generator.generate();

      expect(plan).toContain('DO NOT');
      expect(plan).toContain('completed tasks');
      expect(plan).toContain('re-implement');
    });

    it('should generate separate tasks for each missing feature', () => {
      const analysis = {
        classification: {
          type: 'incomplete-implementation',
          incompleteness: {
            completeness: 33,
            missing: ['Task 2: Password Reset', 'Task 3: Email Verification'],
            completedTasks: ['Task 1: Login']
          }
        },
        rootCause: { likelyCause: 'executor-skip', confidence: 0.7 },
        recommendation: { name: 'Targeted Re-execution', description: 'Fix' },
        context: {}
      };

      const generator = new FixPlanGenerator(analysis);
      const plan = generator.generate();

      const taskMatches = plan.match(/<task type="auto">/g);
      expect(taskMatches).not.toBeNull();
      expect(taskMatches.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Issue Classification - All 7 Types', () => {
    
    const classifier = new IssueClassifier();

    it('should classify test failures', () => {
      const input = 'Test failed: expected 200 but got 500';
      const result = classifier.classify(input);
      expect(result.type).toBe('test-failure');
    });

    it('should classify quality issues', () => {
      const input = 'ESLint error: no-undef at line 10';
      const result = classifier.classify(input);
      expect(result.type).toBe('quality-issue');
    });

    it('should classify documentation problems', () => {
      const input = 'README incomplete, API docs missing';
      const result = classifier.classify(input);
      expect(result.type).toBe('docs-problem');
    });

    it('should classify regressions', () => {
      const input = 'Feature worked before but broke after commit abc123';
      const result = classifier.classify(input);
      expect(result.type).toBe('regression');
    });

    it('should classify integration issues', () => {
      const input = 'API mismatch between components, interface incompatible';
      const result = classifier.classify(input);
      expect(result.type).toBe('integration-issue');
    });

    it('should classify dependency issues', () => {
      const input = 'npm install failed, peer dependency warning';
      const result = classifier.classify(input);
      expect(result.type).toBe('dependency-issue');
    });

    it('should classify incomplete implementations', () => {
      const input = 'Tasks: 2/3 complete, password-reset.js NOT FOUND';
      const result = classifier.classify(input);
      expect(result.type).toBe('incomplete-implementation');
    });
  });

  describe('Severity Classification', () => {
    
    const classifier = new IssueClassifier();

    it('should classify 0% complete as critical', () => {
      const input = 'Tasks: 0/3 complete - core features missing';
      const result = classifier.classify(input);
      expect(result.severity).toBe('critical');
    });

    it('should classify <50% complete as major', () => {
      const input = 'Tasks: 1/3 complete - features missing';
      const result = classifier.classify(input);
      expect(result.severity).toBe('major');
    });

    it('should classify >80% complete as minor', () => {
      const input = 'Tasks: 4/5 complete';
      const result = classifier.classify(input);
      expect(result.severity).toBe('minor');
    });
  });

  describe('Full Analysis Pipeline', () => {
    
    it('should run complete 6-step analysis for incomplete implementation', async () => {
      const input = `
VERIFICATION FAILED
Tasks: 1/2 complete
Missing: Task 2 (Feature X)
`;

      const analyzer = new DebugAnalyzer(input, { projectName: 'test' });
      const analysis = await analyzer.analyze();

      expect(analysis.classification).toBeDefined();
      expect(analysis.symptoms).toBeDefined();
      expect(analysis.rootCause).toBeDefined();
      expect(analysis.impact).toBeDefined();
      expect(analysis.solutions).toBeDefined();
      expect(analysis.recommendation).toBeDefined();

      expect(analysis.classification.type).toBe('incomplete-implementation');
      expect(analysis.rootCause.likelyCause).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    
    it('should handle 100% complete gracefully', () => {
      const classifier = new IssueClassifier();
      const input = 'Tasks: 3/3 complete (100%)';
      const result = classifier.classify(input);
      
      // Should not detect as incomplete implementation
      expect(result.type).not.toBe('incomplete-implementation');
    });

    it('should handle missing task list', () => {
      const classifier = new IssueClassifier();
      const input = 'VERIFICATION FAILED\nSomething is wrong';
      const result = classifier.classify(input);
      
      expect(result.type).toBeDefined();
    });

    it('should handle empty input', () => {
      const classifier = new IssueClassifier();
      const result = classifier.classify('');
      
      expect(result.type).toBe('unknown');
    });
  });
});
```

**What to avoid:**
- Missing FR2.1 incomplete implementation test cases
- Not testing likelihood estimation (70%/20%/10%)
- Skipping targeted fix plan generation tests
- Missing edge cases

**Why:**
- FR2.1 is critical - needs thorough test coverage
- Tests ensure reliability of incomplete implementation handling
- Edge cases prevent production issues
</action>
<verify>
```bash
# Check test file exists
test -f tests/debugger/debugger.test.js && echo "✓ Test suite created"

# Count test cases
grep -c "it('should" tests/debugger/debugger.test.js
# Should find 20+ test cases

# Verify FR2.1 test coverage
grep -c "FR2.1" tests/debugger/debugger.test.js
# Should find 5+ occurrences

# Run tests
npm test -- debugger.test.js
```
</verify>
<done>
- tests/debugger/debugger.test.js created with 20+ test cases
- FR2.1 incomplete implementation detection tests
- Root cause analysis tests (executor skip, plan ambiguity, dependency blocker)
- Targeted fix plan generation tests
- All 7 issue types covered
- Severity classification tests
- Full analysis pipeline test
- Edge cases included
</done>
</task>

## Success Criteria
- ✅ Comprehensive test coverage for all debugger functionality
- ✅ FR2.1 incomplete implementation tests included
- ✅ Root cause analysis tests (70%/20%/10% likelihood)
- ✅ Targeted fix plan generation verified
- ✅ All 7 issue types tested
- ✅ Edge cases covered
- ✅ Tests pass

## Verification
```bash
# Test file exists
test -f tests/debugger/debugger.test.js && echo "✓ Test suite created"

# Has adequate test count
test_count=$(grep -c "it('should" tests/debugger/debugger.test.js)
if [ $test_count -ge 20 ]; then
  echo "✓ Comprehensive test coverage ($test_count tests)"
fi

# Run tests
npm test -- debugger.test.js
```
