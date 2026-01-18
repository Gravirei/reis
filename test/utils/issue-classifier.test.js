/**
 * Tests for IssueClassifier
 */

const assert = require('assert');
const { IssueClassifier } = require('../../lib/utils/issue-classifier.js');

describe('IssueClassifier', function() {
  let classifier;

  beforeEach(function() {
    classifier = new IssueClassifier();
  });

  describe('FR2.1: Incomplete Implementation Detection', function() {
    it('should detect incomplete implementation from task completion', function() {
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
- POST /api/auth/reset route missing
      `;

      const result = classifier.classify(input);

      assert.strictEqual(result.type, 'incomplete-implementation');
      assert.strictEqual(result.incompleteness.completeness, 66);
      assert.strictEqual(result.incompleteness.completed, 2);
      assert.strictEqual(result.incompleteness.total, 3);
      assert.ok(result.incompleteness.missing.includes('Task 2: Password Reset'));
      assert.ok(result.confidence > 0.9);
    });

    it('should detect incomplete from NOT FOUND markers', function() {
      const input = `
VERIFICATION FAILED

Evidence:
- src/api/auth/reset.ts NOT FOUND
- tests/auth/reset.test.js NOT FOUND
      `;

      const result = classifier.classify(input);

      assert.strictEqual(result.type, 'incomplete-implementation');
      assert.ok(result.incompleteness.missing.length > 0);
    });

    it('should distinguish incomplete from test failures', function() {
      const incompleteteInput = `Tasks: 2/3 complete`;
      const testFailureInput = `Test failed: expected true but got false`;

      const incomplete = classifier.classify(incompleteteInput);
      const testFail = classifier.classify(testFailureInput);

      assert.strictEqual(incomplete.type, 'incomplete-implementation');
      assert.strictEqual(testFail.type, 'test-failure');
    });

    it('should extract completed tasks', function() {
      const input = `
Completed:
- Task 1: Login endpoint ✓
- Task 3: Session management ✅

Missing:
- Task 2: Password reset
      `;

      const result = classifier.classify(input);

      assert.ok(result.incompleteness.completedTasks.includes('Task 1: Login endpoint'));
      assert.ok(result.incompleteness.completedTasks.includes('Task 3: Session management'));
    });
  });

  describe('Test Failure Classification', function() {
    it('should detect test failures', function() {
      const input = `
npm test

FAIL tests/auth/login.test.js
  ✓ should accept valid credentials
  ✗ should reject invalid credentials
    Expected: 401
    Received: 500

Tests: 1 failed, 1 passed, 2 total
      `;

      const result = classifier.classify(input);

      assert.strictEqual(result.type, 'test-failure');
      assert.ok(result.confidence > 0.5);
    });
  });

  describe('Quality Issue Classification', function() {
    it('should detect ESLint errors', function() {
      const input = `
ESLint errors:
  src/api/auth.js
    10:5  error  'password' is not defined  no-undef
    15:3  error  Missing semicolon  semi
      `;

      const result = classifier.classify(input);

      assert.strictEqual(result.type, 'quality-issue');
    });
  });

  describe('Severity Classification', function() {
    it('should classify incomplete as critical if core features missing', function() {
      const input = `Tasks: 0/3 complete - core feature missing`;
      const result = classifier.classify(input);

      assert.strictEqual(result.severity, 'critical');
    });

    it('should classify incomplete as major if some features missing', function() {
      const input = `Tasks: 1/3 complete - feature missing`;
      const result = classifier.classify(input);

      assert.strictEqual(result.severity, 'major');
    });

    it('should classify incomplete as minor if mostly complete', function() {
      const input = `Tasks: 4/5 complete`;
      const result = classifier.classify(input);

      assert.strictEqual(result.severity, 'minor');
    });
  });

  describe('Scope Classification', function() {
    it('should classify incomplete scope based on completeness', function() {
      const widespread = `Tasks: 0/5 complete`;
      const localized = `Tasks: 2/5 complete`;
      const isolated = `Tasks: 4/5 complete`;

      assert.strictEqual(classifier.classify(widespread).scope, 'widespread');
      assert.strictEqual(classifier.classify(localized).scope, 'localized');
      assert.strictEqual(classifier.classify(isolated).scope, 'isolated');
    });
  });
});
