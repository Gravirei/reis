/**
 * Unit tests for IssueClassifier
 * Tests classification of all 7 issue types with confidence scoring
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { IssueClassifier } from '../../issue-classifier.js';
import { testIssues } from '../fixtures/test-issues.js';

describe('IssueClassifier', () => {
  let classifier: IssueClassifier;

  beforeEach(() => {
    classifier = new IssueClassifier();
  });

  describe('Type 1: Syntax Errors', () => {
    it('should classify TypeError as syntax-error', () => {
      const result = classifier.classify(
        testIssues.syntaxError.description,
        testIssues.syntaxError.error,
        testIssues.syntaxError.context
      );

      expect(result.type).toBe('syntax-error');
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
      expect(result.indicators).toContain('error-in-description');
    });

    it('should identify undefined access as primary cause', () => {
      const result = classifier.classify(
        testIssues.syntaxError.description,
        testIssues.syntaxError.error,
        testIssues.syntaxError.context
      );

      expect(result.primaryCause).toContain('undefined');
    });

    it('should have high confidence for stack trace errors', () => {
      const result = classifier.classify(
        'ReferenceError: foo is not defined',
        'ReferenceError: foo is not defined\n    at bar (/app/src/test.ts:10:5)',
        { recentChanges: ['Modified test.ts'], affectedFiles: ['test.ts'] }
      );

      expect(result.type).toBe('syntax-error');
      expect(result.confidence).toBeGreaterThanOrEqual(0.85);
    });
  });

  describe('Type 2: Logic Errors', () => {
    it('should classify authentication bug as logic-error', () => {
      const result = classifier.classify(
        testIssues.logicError.description,
        testIssues.logicError.error,
        testIssues.logicError.context
      );

      expect(result.type).toBe('logic-error');
      expect(result.confidence).toBeGreaterThanOrEqual(0.7);
    });

    it('should detect behavioral issues without errors', () => {
      const result = classifier.classify(
        'Calculation returns wrong result: expected 100, got 50',
        null,
        {
          recentChanges: ['Updated calculation formula'],
          affectedFiles: ['src/calculator.ts'],
          symptoms: ['Wrong output'],
        }
      );

      expect(result.type).toBe('logic-error');
      expect(result.indicators).toContain('behavioral-issue');
    });

    it('should identify inverted conditions', () => {
      const result = classifier.classify(
        testIssues.logicError.description,
        testIssues.logicError.error,
        testIssues.logicError.context
      );

      expect(result.primaryCause).toContain('condition');
    });
  });

  describe('Type 3: Integration Issues', () => {
    it('should classify API mismatch as integration-issue', () => {
      const result = classifier.classify(
        testIssues.integrationIssue.description,
        testIssues.integrationIssue.error,
        testIssues.integrationIssue.context
      );

      expect(result.type).toBe('integration-issue');
      expect(result.confidence).toBeGreaterThanOrEqual(0.75);
    });

    it('should detect cross-component issues', () => {
      const result = classifier.classify(
        'Frontend and backend data format mismatch',
        null,
        {
          recentChanges: ['Updated API response format'],
          affectedFiles: ['src/api/users.ts', 'src/components/UserList.tsx'],
        }
      );

      expect(result.type).toBe('integration-issue');
      expect(result.indicators).toContain('multiple-files');
    });

    it('should identify API contract mismatches', () => {
      const result = classifier.classify(
        testIssues.integrationIssue.description,
        testIssues.integrationIssue.error,
        testIssues.integrationIssue.context
      );

      expect(result.primaryCause).toMatch(/api|endpoint|path/i);
    });
  });

  describe('Type 4: Environment Issues', () => {
    it('should classify connection failure as environment-issue', () => {
      const result = classifier.classify(
        testIssues.environmentIssue.description,
        testIssues.environmentIssue.error,
        testIssues.environmentIssue.context
      );

      expect(result.type).toBe('environment-issue');
      expect(result.confidence).toBeGreaterThanOrEqual(0.75);
    });

    it('should detect environment-specific failures', () => {
      const result = classifier.classify(
        'Works locally but fails in production',
        'Error: ECONNREFUSED',
        {
          recentChanges: ['Deployed to production'],
          environment: 'production',
          symptoms: ['Works in development'],
        }
      );

      expect(result.type).toBe('environment-issue');
      expect(result.indicators).toContain('environment-specific');
    });

    it('should identify missing environment variables', () => {
      const result = classifier.classify(
        'Database connection fails',
        'Error: DATABASE_URL is not defined',
        {
          recentChanges: ['Updated database config'],
          environment: 'production',
        }
      );

      expect(result.type).toBe('environment-issue');
      expect(result.primaryCause).toContain('env');
    });
  });

  describe('Type 5: Performance Issues', () => {
    it('should classify slow queries as performance-issue', () => {
      const result = classifier.classify(
        testIssues.performanceIssue.description,
        testIssues.performanceIssue.error,
        testIssues.performanceIssue.context
      );

      expect(result.type).toBe('performance-issue');
      expect(result.confidence).toBeGreaterThanOrEqual(0.65);
    });

    it('should detect performance degradation from metrics', () => {
      const result = classifier.classify(
        'Page load time degraded significantly',
        null,
        {
          recentChanges: ['Added data fetching'],
          metrics: { before: '100ms', after: '3s' },
        }
      );

      expect(result.type).toBe('performance-issue');
      expect(result.indicators).toContain('has-metrics');
    });

    it('should identify N+1 query patterns', () => {
      const result = classifier.classify(
        testIssues.performanceIssue.description,
        testIssues.performanceIssue.error,
        testIssues.performanceIssue.context
      );

      expect(result.primaryCause).toMatch(/query|queries/i);
    });
  });

  describe('Type 6: Dependency Conflicts', () => {
    it('should classify npm errors as dependency-conflict', () => {
      const result = classifier.classify(
        testIssues.dependencyConflict.description,
        testIssues.dependencyConflict.error,
        testIssues.dependencyConflict.context
      );

      expect(result.type).toBe('dependency-conflict');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('should detect peer dependency issues', () => {
      const result = classifier.classify(
        'Build fails with peer dependency error',
        'npm ERR! peer dep missing',
        {
          recentChanges: ['Updated dependencies'],
          affectedFiles: ['package.json'],
        }
      );

      expect(result.type).toBe('dependency-conflict');
      expect(result.indicators).toContain('dependency-keyword');
    });

    it('should identify version mismatches', () => {
      const result = classifier.classify(
        testIssues.dependencyConflict.description,
        testIssues.dependencyConflict.error,
        testIssues.dependencyConflict.context
      );

      expect(result.primaryCause).toContain('peer');
    });
  });

  describe('Type 7: Incomplete Implementation (FR2.1)', () => {
    it('should classify TODO markers as incomplete-implementation', () => {
      const result = classifier.classify(
        testIssues.incompleteImplementation.description,
        testIssues.incompleteImplementation.error,
        testIssues.incompleteImplementation.context
      );

      expect(result.type).toBe('incomplete-implementation');
      expect(result.confidence).toBeGreaterThanOrEqual(0.75);
    });

    it('should detect executor-skip cause', () => {
      const result = classifier.classify(
        testIssues.incompleteImplementation.description,
        testIssues.incompleteImplementation.error,
        testIssues.incompleteImplementation.context
      );

      expect(result.incompleteDetails?.cause).toBe('executor-skip');
      expect(result.incompleteDetails?.indicators).toContain('TODO comments');
    });

    it('should detect plan-ambiguity cause', () => {
      const result = classifier.classify(
        testIssues.incompleteImplementationPlanAmbiguity.description,
        testIssues.incompleteImplementationPlanAmbiguity.error,
        testIssues.incompleteImplementationPlanAmbiguity.context
      );

      expect(result.type).toBe('incomplete-implementation');
      expect(result.incompleteDetails?.cause).toBe('plan-ambiguity');
    });

    it('should detect dependency-blocker cause', () => {
      const result = classifier.classify(
        testIssues.incompleteImplementationDependencyBlocker.description,
        testIssues.incompleteImplementationDependencyBlocker.error,
        testIssues.incompleteImplementationDependencyBlocker.context
      );

      expect(result.type).toBe('incomplete-implementation');
      expect(result.incompleteDetails?.cause).toBe('dependency-blocker');
    });

    it('should identify plan references', () => {
      const result = classifier.classify(
        testIssues.incompleteImplementation.description,
        testIssues.incompleteImplementation.error,
        testIssues.incompleteImplementation.context
      );

      expect(result.indicators).toContain('plan-reference');
    });

    it('should detect stub implementations', () => {
      const result = classifier.classify(
        'Function returns placeholder data',
        null,
        {
          recentChanges: ['Completed plan 2-1-data-layer'],
          planReference: '2-1-data-layer',
          symptoms: ['Returns mock data', 'Not connected to database'],
        }
      );

      expect(result.type).toBe('incomplete-implementation');
      expect(result.incompleteDetails?.indicators).toContain('stub implementations');
    });
  });

  describe('Confidence Scoring', () => {
    it('should return higher confidence for clear syntax errors', () => {
      const syntaxResult = classifier.classify(
        'TypeError: Cannot read property',
        'TypeError: Cannot read property "foo" of undefined',
        { recentChanges: [], affectedFiles: [] }
      );

      const logicResult = classifier.classify(
        'Wrong calculation result',
        null,
        { recentChanges: [], affectedFiles: [] }
      );

      expect(syntaxResult.confidence).toBeGreaterThan(logicResult.confidence);
    });

    it('should lower confidence when context is minimal', () => {
      const richResult = classifier.classify(
        'Bug in authentication',
        null,
        {
          recentChanges: ['Updated auth.ts', 'Modified login flow'],
          affectedFiles: ['src/auth.ts'],
          symptoms: ['Users cannot login', 'Wrong password accepted'],
        }
      );

      const minimalResult = classifier.classify(
        'Bug in authentication',
        null,
        {
          recentChanges: [],
          affectedFiles: [],
        }
      );

      expect(richResult.confidence).toBeGreaterThan(minimalResult.confidence);
    });

    it('should return confidence between 0 and 1', () => {
      const result = classifier.classify(
        'Some issue',
        null,
        { recentChanges: [], affectedFiles: [] }
      );

      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null error gracefully', () => {
      const result = classifier.classify(
        'Issue without error',
        null,
        { recentChanges: ['Changed something'], affectedFiles: ['file.ts'] }
      );

      expect(result).toBeDefined();
      expect(result.type).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should handle empty context', () => {
      const result = classifier.classify(
        'Some error occurred',
        'Error: Something went wrong',
        { recentChanges: [], affectedFiles: [] }
      );

      expect(result).toBeDefined();
      expect(result.type).toBeDefined();
    });

    it('should handle minimal description', () => {
      const result = classifier.classify(
        'Bug',
        null,
        { recentChanges: ['Updated code'], affectedFiles: ['src/app.ts'] }
      );

      expect(result).toBeDefined();
      expect(result.confidence).toBeLessThan(0.7); // Lower confidence for vague descriptions
    });
  });
});
