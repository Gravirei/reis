/**
 * Unit tests for SolutionDesigner
 * Tests solution design and implementation step generation
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { SolutionDesigner } from '../../solution-designer.js';
import { testIssues } from '../fixtures/test-issues.js';
import type { DebugAnalysis } from '../../types.js';

describe('SolutionDesigner', () => {
  let designer: SolutionDesigner;

  beforeEach(() => {
    designer = new SolutionDesigner();
  });

  describe('Solution Design', () => {
    it('should design solution for syntax errors', () => {
      const analysis: DebugAnalysis = {
        classification: {
          type: 'syntax-error',
          confidence: 0.9,
          primaryCause: 'undefined-access',
          indicators: ['error-in-description'],
        },
        rootCause: 'Attempting to access property "map" on undefined data parameter',
        affectedComponents: ['src/utils.ts'],
        recommendedSolutions: [
          {
            approach: 'Add null check before accessing data.map',
            confidence: 0.9,
            estimatedEffort: 'low',
          },
        ],
        context: testIssues.syntaxError.context,
      };

      const solution = designer.design(analysis);

      expect(solution.approach).toContain('null');
      expect(solution.steps.length).toBeGreaterThan(0);
      expect(solution.estimatedEffort).toBe('low');
    });

    it('should design solution for logic errors', () => {
      const analysis: DebugAnalysis = {
        classification: {
          type: 'logic-error',
          confidence: 0.75,
          primaryCause: 'inverted-condition',
          indicators: ['behavioral-issue'],
        },
        rootCause: 'Password validation condition is inverted',
        affectedComponents: ['src/auth/auth.ts'],
        recommendedSolutions: [
          {
            approach: 'Correct the inverted boolean condition in validatePassword',
            confidence: 0.85,
            estimatedEffort: 'low',
          },
        ],
        context: testIssues.logicError.context,
      };

      const solution = designer.design(analysis);

      expect(solution.approach).toMatch(/condition|logic|boolean/i);
      expect(solution.steps).toContainEqual(
        expect.objectContaining({
          action: expect.stringMatching(/review|fix|correct/i),
        })
      );
    });

    it('should design solution for integration issues', () => {
      const analysis: DebugAnalysis = {
        classification: {
          type: 'integration-issue',
          confidence: 0.85,
          primaryCause: 'api-contract-mismatch',
          indicators: ['multiple-files'],
        },
        rootCause: 'API endpoint path mismatch between frontend and backend',
        affectedComponents: ['src/api/client.ts', 'src/components/UserList.tsx'],
        recommendedSolutions: [
          {
            approach: 'Align API endpoint paths across frontend and backend',
            confidence: 0.8,
            estimatedEffort: 'medium',
          },
        ],
        context: testIssues.integrationIssue.context,
      };

      const solution = designer.design(analysis);

      expect(solution.approach).toMatch(/API|endpoint|path/i);
      expect(solution.estimatedEffort).toBe('medium');
      expect(solution.steps.length).toBeGreaterThan(1);
    });

    it('should design solution for environment issues', () => {
      const analysis: DebugAnalysis = {
        classification: {
          type: 'environment-issue',
          confidence: 0.8,
          primaryCause: 'missing-env-var',
          indicators: ['environment-specific'],
        },
        rootCause: 'Missing DATABASE_URL environment variable in production',
        affectedComponents: ['configuration'],
        recommendedSolutions: [
          {
            approach: 'Set DATABASE_URL environment variable in production',
            confidence: 0.9,
            estimatedEffort: 'low',
          },
        ],
        context: testIssues.environmentIssue.context,
      };

      const solution = designer.design(analysis);

      expect(solution.approach).toMatch(/environment|variable|config/i);
      expect(solution.requiresManualIntervention).toBe(true);
    });

    it('should design solution for performance issues', () => {
      const analysis: DebugAnalysis = {
        classification: {
          type: 'performance-issue',
          confidence: 0.7,
          primaryCause: 'n-plus-one-queries',
          indicators: ['has-metrics'],
        },
        rootCause: 'N+1 query pattern in user avatar fetching',
        affectedComponents: ['src/components/UserList.tsx'],
        recommendedSolutions: [
          {
            approach: 'Use eager loading or batch query for user avatars',
            confidence: 0.75,
            estimatedEffort: 'medium',
          },
        ],
        context: testIssues.performanceIssue.context,
      };

      const solution = designer.design(analysis);

      expect(solution.approach).toMatch(/batch|eager|optimize/i);
      expect(solution.estimatedEffort).toBe('medium');
    });

    it('should design solution for dependency conflicts', () => {
      const analysis: DebugAnalysis = {
        classification: {
          type: 'dependency-conflict',
          confidence: 0.95,
          primaryCause: 'peer-dependency-mismatch',
          indicators: ['dependency-keyword'],
        },
        rootCause: 'React v18 incompatible with some-package@2.0.0 peer dependency',
        affectedComponents: ['package.json'],
        recommendedSolutions: [
          {
            approach: 'Update some-package to version compatible with React 18',
            confidence: 0.85,
            estimatedEffort: 'low',
          },
        ],
        context: testIssues.dependencyConflict.context,
      };

      const solution = designer.design(analysis);

      expect(solution.approach).toMatch(/update|upgrade|dependency/i);
      expect(solution.affectedFiles).toContain('package.json');
    });

    it('should design solution for incomplete implementations', () => {
      const analysis: DebugAnalysis = {
        classification: {
          type: 'incomplete-implementation',
          confidence: 0.85,
          primaryCause: 'executor-skip',
          indicators: ['plan-reference'],
          incompleteDetails: {
            cause: 'executor-skip',
            indicators: ['TODO comments', 'stub implementations'],
          },
        },
        rootCause: 'Authentication endpoint implementation incomplete with TODO markers',
        affectedComponents: ['src/api/auth/login.ts'],
        recommendedSolutions: [
          {
            approach: 'Complete authentication implementation as per plan 3-2-auth-endpoints',
            confidence: 0.8,
            estimatedEffort: 'medium',
          },
        ],
        context: testIssues.incompleteImplementation.context,
      };

      const solution = designer.design(analysis);

      expect(solution.approach).toMatch(/complete|implement|TODO/i);
      expect(solution.preventionStrategy).toContain('plan');
    });
  });

  describe('Implementation Steps', () => {
    it('should generate ordered implementation steps', () => {
      const analysis: DebugAnalysis = {
        classification: {
          type: 'syntax-error',
          confidence: 0.9,
          primaryCause: 'undefined-access',
          indicators: [],
        },
        rootCause: 'Undefined access',
        affectedComponents: ['src/utils.ts'],
        recommendedSolutions: [
          {
            approach: 'Add null check',
            confidence: 0.9,
            estimatedEffort: 'low',
          },
        ],
        context: { recentChanges: [], affectedFiles: ['src/utils.ts'] },
      };

      const solution = designer.design(analysis);

      expect(solution.steps.length).toBeGreaterThan(0);
      solution.steps.forEach((step, index) => {
        expect(step.order).toBe(index + 1);
        expect(step.action).toBeDefined();
        expect(step.files).toBeDefined();
      });
    });

    it('should include file paths in steps', () => {
      const analysis: DebugAnalysis = {
        classification: {
          type: 'integration-issue',
          confidence: 0.85,
          primaryCause: 'api-contract-mismatch',
          indicators: [],
        },
        rootCause: 'API mismatch',
        affectedComponents: ['src/api/client.ts', 'src/components/UserList.tsx'],
        recommendedSolutions: [
          {
            approach: 'Align endpoints',
            confidence: 0.8,
            estimatedEffort: 'medium',
          },
        ],
        context: {
          recentChanges: [],
          affectedFiles: ['src/api/client.ts', 'src/components/UserList.tsx'],
        },
      };

      const solution = designer.design(analysis);

      const allFiles = solution.steps.flatMap((step) => step.files);
      expect(allFiles).toContain('src/api/client.ts');
    });

    it('should include verification steps', () => {
      const analysis: DebugAnalysis = {
        classification: {
          type: 'logic-error',
          confidence: 0.75,
          primaryCause: 'inverted-condition',
          indicators: [],
        },
        rootCause: 'Inverted condition',
        affectedComponents: ['src/auth/auth.ts'],
        recommendedSolutions: [
          {
            approach: 'Fix condition',
            confidence: 0.85,
            estimatedEffort: 'low',
          },
        ],
        context: { recentChanges: [], affectedFiles: ['src/auth/auth.ts'] },
      };

      const solution = designer.design(analysis);

      const hasVerificationStep = solution.steps.some((step) =>
        step.action.toLowerCase().includes('test') ||
        step.action.toLowerCase().includes('verify')
      );
      expect(hasVerificationStep).toBe(true);
    });
  });

  describe('Effort Estimation', () => {
    it('should estimate low effort for simple fixes', () => {
      const analysis: DebugAnalysis = {
        classification: {
          type: 'syntax-error',
          confidence: 0.9,
          primaryCause: 'undefined-access',
          indicators: [],
        },
        rootCause: 'Undefined access',
        affectedComponents: ['src/utils.ts'],
        recommendedSolutions: [
          {
            approach: 'Add null check',
            confidence: 0.9,
            estimatedEffort: 'low',
          },
        ],
        context: { recentChanges: [], affectedFiles: ['src/utils.ts'] },
      };

      const solution = designer.design(analysis);

      expect(solution.estimatedEffort).toBe('low');
    });

    it('should estimate medium effort for multi-file changes', () => {
      const analysis: DebugAnalysis = {
        classification: {
          type: 'integration-issue',
          confidence: 0.85,
          primaryCause: 'api-contract-mismatch',
          indicators: [],
        },
        rootCause: 'API mismatch',
        affectedComponents: ['src/api/client.ts', 'src/components/UserList.tsx'],
        recommendedSolutions: [
          {
            approach: 'Align endpoints',
            confidence: 0.8,
            estimatedEffort: 'medium',
          },
        ],
        context: {
          recentChanges: [],
          affectedFiles: ['src/api/client.ts', 'src/components/UserList.tsx'],
        },
      };

      const solution = designer.design(analysis);

      expect(solution.estimatedEffort).toBe('medium');
    });

    it('should estimate high effort for complex refactoring', () => {
      const analysis: DebugAnalysis = {
        classification: {
          type: 'performance-issue',
          confidence: 0.7,
          primaryCause: 'n-plus-one-queries',
          indicators: [],
        },
        rootCause: 'N+1 queries requiring database optimization',
        affectedComponents: [
          'src/components/UserList.tsx',
          'src/api/users.ts',
          'src/db/queries.ts',
        ],
        recommendedSolutions: [
          {
            approach: 'Refactor data fetching layer',
            confidence: 0.7,
            estimatedEffort: 'high',
          },
        ],
        context: {
          recentChanges: [],
          affectedFiles: ['src/components/UserList.tsx', 'src/api/users.ts'],
        },
      };

      const solution = designer.design(analysis);

      expect(['medium', 'high']).toContain(solution.estimatedEffort);
    });
  });

  describe('Manual Intervention Detection', () => {
    it('should flag environment issues as requiring manual intervention', () => {
      const analysis: DebugAnalysis = {
        classification: {
          type: 'environment-issue',
          confidence: 0.8,
          primaryCause: 'missing-env-var',
          indicators: [],
        },
        rootCause: 'Missing environment variable',
        affectedComponents: ['configuration'],
        recommendedSolutions: [
          {
            approach: 'Set environment variable',
            confidence: 0.9,
            estimatedEffort: 'low',
          },
        ],
        context: { recentChanges: [], affectedFiles: [] },
      };

      const solution = designer.design(analysis);

      expect(solution.requiresManualIntervention).toBe(true);
    });

    it('should flag dependency conflicts as requiring manual intervention', () => {
      const analysis: DebugAnalysis = {
        classification: {
          type: 'dependency-conflict',
          confidence: 0.95,
          primaryCause: 'peer-dependency-mismatch',
          indicators: [],
        },
        rootCause: 'Dependency version conflict',
        affectedComponents: ['package.json'],
        recommendedSolutions: [
          {
            approach: 'Update dependencies',
            confidence: 0.85,
            estimatedEffort: 'low',
          },
        ],
        context: { recentChanges: [], affectedFiles: ['package.json'] },
      };

      const solution = designer.design(analysis);

      expect(solution.requiresManualIntervention).toBe(true);
    });

    it('should not flag code fixes as requiring manual intervention', () => {
      const analysis: DebugAnalysis = {
        classification: {
          type: 'syntax-error',
          confidence: 0.9,
          primaryCause: 'undefined-access',
          indicators: [],
        },
        rootCause: 'Undefined access',
        affectedComponents: ['src/utils.ts'],
        recommendedSolutions: [
          {
            approach: 'Add null check',
            confidence: 0.9,
            estimatedEffort: 'low',
          },
        ],
        context: { recentChanges: [], affectedFiles: ['src/utils.ts'] },
      };

      const solution = designer.design(analysis);

      expect(solution.requiresManualIntervention).toBe(false);
    });
  });

  describe('Prevention Strategies', () => {
    it('should include prevention strategy for incomplete implementations', () => {
      const analysis: DebugAnalysis = {
        classification: {
          type: 'incomplete-implementation',
          confidence: 0.85,
          primaryCause: 'executor-skip',
          indicators: [],
          incompleteDetails: {
            cause: 'executor-skip',
            indicators: ['TODO comments'],
          },
        },
        rootCause: 'Incomplete implementation',
        affectedComponents: ['src/api/auth/login.ts'],
        recommendedSolutions: [
          {
            approach: 'Complete implementation',
            confidence: 0.8,
            estimatedEffort: 'medium',
          },
        ],
        context: { recentChanges: [], affectedFiles: ['src/api/auth/login.ts'] },
      };

      const solution = designer.design(analysis);

      expect(solution.preventionStrategy).toBeDefined();
      expect(solution.preventionStrategy).not.toBe('');
    });

    it('should suggest testing for logic errors', () => {
      const analysis: DebugAnalysis = {
        classification: {
          type: 'logic-error',
          confidence: 0.75,
          primaryCause: 'inverted-condition',
          indicators: [],
        },
        rootCause: 'Inverted condition',
        affectedComponents: ['src/auth/auth.ts'],
        recommendedSolutions: [
          {
            approach: 'Fix condition',
            confidence: 0.85,
            estimatedEffort: 'low',
          },
        ],
        context: { recentChanges: [], affectedFiles: ['src/auth/auth.ts'] },
      };

      const solution = designer.design(analysis);

      expect(solution.preventionStrategy?.toLowerCase()).toMatch(/test|unit test/);
    });

    it('should suggest contract validation for integration issues', () => {
      const analysis: DebugAnalysis = {
        classification: {
          type: 'integration-issue',
          confidence: 0.85,
          primaryCause: 'api-contract-mismatch',
          indicators: [],
        },
        rootCause: 'API mismatch',
        affectedComponents: ['src/api/client.ts'],
        recommendedSolutions: [
          {
            approach: 'Align endpoints',
            confidence: 0.8,
            estimatedEffort: 'medium',
          },
        ],
        context: { recentChanges: [], affectedFiles: ['src/api/client.ts'] },
      };

      const solution = designer.design(analysis);

      expect(solution.preventionStrategy?.toLowerCase()).toMatch(
        /contract|schema|validation|api/
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle analysis with no recommended solutions', () => {
      const analysis: DebugAnalysis = {
        classification: {
          type: 'syntax-error',
          confidence: 0.5,
          primaryCause: 'unknown',
          indicators: [],
        },
        rootCause: 'Unknown error',
        affectedComponents: [],
        recommendedSolutions: [],
        context: { recentChanges: [], affectedFiles: [] },
      };

      const solution = designer.design(analysis);

      expect(solution).toBeDefined();
      expect(solution.approach).toBeDefined();
      expect(solution.steps.length).toBeGreaterThan(0);
    });

    it('should handle analysis with empty affected components', () => {
      const analysis: DebugAnalysis = {
        classification: {
          type: 'logic-error',
          confidence: 0.7,
          primaryCause: 'unknown',
          indicators: [],
        },
        rootCause: 'Logic error',
        affectedComponents: [],
        recommendedSolutions: [
          {
            approach: 'Fix logic',
            confidence: 0.7,
            estimatedEffort: 'medium',
          },
        ],
        context: { recentChanges: [], affectedFiles: [] },
      };

      const solution = designer.design(analysis);

      expect(solution).toBeDefined();
      expect(solution.affectedFiles).toBeDefined();
    });
  });
});
