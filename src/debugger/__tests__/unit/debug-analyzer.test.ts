/**
 * Unit tests for DebugAnalyzer
 * Tests root cause analysis and solution recommendation
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { DebugAnalyzer } from '../../debug-analyzer.js';
import { testIssues } from '../fixtures/test-issues.js';
import type { IssueClassification } from '../../types.js';

describe('DebugAnalyzer', () => {
  let analyzer: DebugAnalyzer;

  beforeEach(() => {
    analyzer = new DebugAnalyzer();
  });

  describe('Root Cause Analysis', () => {
    it('should identify undefined access as root cause for TypeError', () => {
      const classification: IssueClassification = {
        type: 'syntax-error',
        confidence: 0.9,
        primaryCause: 'undefined-access',
        indicators: ['error-in-description', 'stack-trace'],
      };

      const analysis = analyzer.analyze(
        testIssues.syntaxError.description,
        testIssues.syntaxError.error,
        testIssues.syntaxError.context,
        classification
      );

      expect(analysis.rootCause).toContain('undefined');
      expect(analysis.affectedComponents).toContain('src/utils.ts');
    });

    it('should identify inverted condition as root cause for logic errors', () => {
      const classification: IssueClassification = {
        type: 'logic-error',
        confidence: 0.75,
        primaryCause: 'inverted-condition',
        indicators: ['behavioral-issue'],
      };

      const analysis = analyzer.analyze(
        testIssues.logicError.description,
        testIssues.logicError.error,
        testIssues.logicError.context,
        classification
      );

      expect(analysis.rootCause).toContain('condition');
      expect(analysis.affectedComponents).toContain('src/auth/auth.ts');
    });

    it('should identify API contract mismatch for integration issues', () => {
      const classification: IssueClassification = {
        type: 'integration-issue',
        confidence: 0.85,
        primaryCause: 'api-contract-mismatch',
        indicators: ['multiple-files', 'cross-component'],
      };

      const analysis = analyzer.analyze(
        testIssues.integrationIssue.description,
        testIssues.integrationIssue.error,
        testIssues.integrationIssue.context,
        classification
      );

      expect(analysis.rootCause).toMatch(/API|endpoint|path/i);
      expect(analysis.affectedComponents.length).toBeGreaterThan(1);
    });

    it('should identify missing configuration for environment issues', () => {
      const classification: IssueClassification = {
        type: 'environment-issue',
        confidence: 0.8,
        primaryCause: 'missing-env-var',
        indicators: ['environment-specific'],
      };

      const analysis = analyzer.analyze(
        testIssues.environmentIssue.description,
        testIssues.environmentIssue.error,
        testIssues.environmentIssue.context,
        classification
      );

      expect(analysis.rootCause).toMatch(/environment|config|variable/i);
      expect(analysis.context.environment).toBe('production');
    });

    it('should identify N+1 queries for performance issues', () => {
      const classification: IssueClassification = {
        type: 'performance-issue',
        confidence: 0.7,
        primaryCause: 'n-plus-one-queries',
        indicators: ['has-metrics', 'performance-degradation'],
      };

      const analysis = analyzer.analyze(
        testIssues.performanceIssue.description,
        testIssues.performanceIssue.error,
        testIssues.performanceIssue.context,
        classification
      );

      expect(analysis.rootCause).toMatch(/query|queries|database/i);
      expect(analysis.context.metrics).toBeDefined();
    });

    it('should identify version conflicts for dependency issues', () => {
      const classification: IssueClassification = {
        type: 'dependency-conflict',
        confidence: 0.95,
        primaryCause: 'peer-dependency-mismatch',
        indicators: ['dependency-keyword', 'package-json'],
      };

      const analysis = analyzer.analyze(
        testIssues.dependencyConflict.description,
        testIssues.dependencyConflict.error,
        testIssues.dependencyConflict.context,
        classification
      );

      expect(analysis.rootCause).toMatch(/dependency|version|peer/i);
      expect(analysis.affectedComponents).toContain('package.json');
    });

    it('should identify executor skip for incomplete implementations', () => {
      const classification: IssueClassification = {
        type: 'incomplete-implementation',
        confidence: 0.85,
        primaryCause: 'executor-skip',
        indicators: ['plan-reference', 'todo-markers'],
        incompleteDetails: {
          cause: 'executor-skip',
          indicators: ['TODO comments', 'stub implementations'],
        },
      };

      const analysis = analyzer.analyze(
        testIssues.incompleteImplementation.description,
        testIssues.incompleteImplementation.error,
        testIssues.incompleteImplementation.context,
        classification
      );

      expect(analysis.rootCause).toMatch(/incomplete|not implemented|TODO/i);
      expect(analysis.context.planReference).toBe('3-2-auth-endpoints');
    });
  });

  describe('Solution Recommendations', () => {
    it('should recommend null check for undefined access', () => {
      const classification: IssueClassification = {
        type: 'syntax-error',
        confidence: 0.9,
        primaryCause: 'undefined-access',
        indicators: ['error-in-description'],
      };

      const analysis = analyzer.analyze(
        testIssues.syntaxError.description,
        testIssues.syntaxError.error,
        testIssues.syntaxError.context,
        classification
      );

      expect(analysis.recommendedSolutions).toContainEqual(
        expect.objectContaining({
          approach: expect.stringContaining('null'),
          confidence: expect.any(Number),
        })
      );
    });

    it('should recommend logic review for inverted conditions', () => {
      const classification: IssueClassification = {
        type: 'logic-error',
        confidence: 0.75,
        primaryCause: 'inverted-condition',
        indicators: ['behavioral-issue'],
      };

      const analysis = analyzer.analyze(
        testIssues.logicError.description,
        testIssues.logicError.error,
        testIssues.logicError.context,
        classification
      );

      expect(analysis.recommendedSolutions).toContainEqual(
        expect.objectContaining({
          approach: expect.stringMatching(/logic|condition|boolean/i),
        })
      );
    });

    it('should recommend endpoint alignment for API mismatches', () => {
      const classification: IssueClassification = {
        type: 'integration-issue',
        confidence: 0.85,
        primaryCause: 'api-contract-mismatch',
        indicators: ['multiple-files'],
      };

      const analysis = analyzer.analyze(
        testIssues.integrationIssue.description,
        testIssues.integrationIssue.error,
        testIssues.integrationIssue.context,
        classification
      );

      expect(analysis.recommendedSolutions).toContainEqual(
        expect.objectContaining({
          approach: expect.stringMatching(/endpoint|API|path/i),
        })
      );
    });

    it('should recommend environment setup for config issues', () => {
      const classification: IssueClassification = {
        type: 'environment-issue',
        confidence: 0.8,
        primaryCause: 'missing-env-var',
        indicators: ['environment-specific'],
      };

      const analysis = analyzer.analyze(
        testIssues.environmentIssue.description,
        testIssues.environmentIssue.error,
        testIssues.environmentIssue.context,
        classification
      );

      expect(analysis.recommendedSolutions).toContainEqual(
        expect.objectContaining({
          approach: expect.stringMatching(/environment|variable|config/i),
        })
      );
    });

    it('should recommend query optimization for N+1 issues', () => {
      const classification: IssueClassification = {
        type: 'performance-issue',
        confidence: 0.7,
        primaryCause: 'n-plus-one-queries',
        indicators: ['has-metrics'],
      };

      const analysis = analyzer.analyze(
        testIssues.performanceIssue.description,
        testIssues.performanceIssue.error,
        testIssues.performanceIssue.context,
        classification
      );

      expect(analysis.recommendedSolutions).toContainEqual(
        expect.objectContaining({
          approach: expect.stringMatching(/query|optimize|batch/i),
        })
      );
    });

    it('should recommend dependency updates for version conflicts', () => {
      const classification: IssueClassification = {
        type: 'dependency-conflict',
        confidence: 0.95,
        primaryCause: 'peer-dependency-mismatch',
        indicators: ['dependency-keyword'],
      };

      const analysis = analyzer.analyze(
        testIssues.dependencyConflict.description,
        testIssues.dependencyConflict.error,
        testIssues.dependencyConflict.context,
        classification
      );

      expect(analysis.recommendedSolutions).toContainEqual(
        expect.objectContaining({
          approach: expect.stringMatching(/dependency|version|update/i),
        })
      );
    });

    it('should recommend implementation completion for incomplete work', () => {
      const classification: IssueClassification = {
        type: 'incomplete-implementation',
        confidence: 0.85,
        primaryCause: 'executor-skip',
        indicators: ['plan-reference'],
        incompleteDetails: {
          cause: 'executor-skip',
          indicators: ['TODO comments'],
        },
      };

      const analysis = analyzer.analyze(
        testIssues.incompleteImplementation.description,
        testIssues.incompleteImplementation.error,
        testIssues.incompleteImplementation.context,
        classification
      );

      expect(analysis.recommendedSolutions).toContainEqual(
        expect.objectContaining({
          approach: expect.stringMatching(/implement|complete|TODO/i),
        })
      );
    });

    it('should rank solutions by confidence', () => {
      const classification: IssueClassification = {
        type: 'syntax-error',
        confidence: 0.9,
        primaryCause: 'undefined-access',
        indicators: ['error-in-description'],
      };

      const analysis = analyzer.analyze(
        testIssues.syntaxError.description,
        testIssues.syntaxError.error,
        testIssues.syntaxError.context,
        classification
      );

      const confidences = analysis.recommendedSolutions.map((s) => s.confidence);
      const sortedConfidences = [...confidences].sort((a, b) => b - a);
      expect(confidences).toEqual(sortedConfidences);
    });

    it('should provide multiple solution approaches', () => {
      const classification: IssueClassification = {
        type: 'logic-error',
        confidence: 0.75,
        primaryCause: 'inverted-condition',
        indicators: ['behavioral-issue'],
      };

      const analysis = analyzer.analyze(
        testIssues.logicError.description,
        testIssues.logicError.error,
        testIssues.logicError.context,
        classification
      );

      expect(analysis.recommendedSolutions.length).toBeGreaterThanOrEqual(1);
      expect(analysis.recommendedSolutions.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Context Enrichment', () => {
    it('should preserve all context fields', () => {
      const classification: IssueClassification = {
        type: 'integration-issue',
        confidence: 0.85,
        primaryCause: 'api-contract-mismatch',
        indicators: ['multiple-files'],
      };

      const analysis = analyzer.analyze(
        testIssues.integrationIssue.description,
        testIssues.integrationIssue.error,
        testIssues.integrationIssue.context,
        classification
      );

      expect(analysis.context.recentChanges).toEqual(
        testIssues.integrationIssue.context.recentChanges
      );
      expect(analysis.context.affectedFiles).toEqual(
        testIssues.integrationIssue.context.affectedFiles
      );
      expect(analysis.context.symptoms).toEqual(
        testIssues.integrationIssue.context.symptoms
      );
    });

    it('should extract plan reference for incomplete implementations', () => {
      const classification: IssueClassification = {
        type: 'incomplete-implementation',
        confidence: 0.85,
        primaryCause: 'executor-skip',
        indicators: ['plan-reference'],
        incompleteDetails: {
          cause: 'executor-skip',
          indicators: ['TODO comments'],
        },
      };

      const analysis = analyzer.analyze(
        testIssues.incompleteImplementation.description,
        testIssues.incompleteImplementation.error,
        testIssues.incompleteImplementation.context,
        classification
      );

      expect(analysis.context.planReference).toBe('3-2-auth-endpoints');
    });

    it('should include environment information when available', () => {
      const classification: IssueClassification = {
        type: 'environment-issue',
        confidence: 0.8,
        primaryCause: 'missing-env-var',
        indicators: ['environment-specific'],
      };

      const analysis = analyzer.analyze(
        testIssues.environmentIssue.description,
        testIssues.environmentIssue.error,
        testIssues.environmentIssue.context,
        classification
      );

      expect(analysis.context.environment).toBe('production');
    });

    it('should include performance metrics when available', () => {
      const classification: IssueClassification = {
        type: 'performance-issue',
        confidence: 0.7,
        primaryCause: 'n-plus-one-queries',
        indicators: ['has-metrics'],
      };

      const analysis = analyzer.analyze(
        testIssues.performanceIssue.description,
        testIssues.performanceIssue.error,
        testIssues.performanceIssue.context,
        classification
      );

      expect(analysis.context.metrics).toBeDefined();
      expect(analysis.context.metrics?.before).toBe('200ms');
      expect(analysis.context.metrics?.after).toBe('5s');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing context gracefully', () => {
      const classification: IssueClassification = {
        type: 'syntax-error',
        confidence: 0.8,
        primaryCause: 'unknown',
        indicators: [],
      };

      const analysis = analyzer.analyze(
        'Some error',
        'Error: something',
        { recentChanges: [], affectedFiles: [] },
        classification
      );

      expect(analysis).toBeDefined();
      expect(analysis.rootCause).toBeDefined();
      expect(analysis.recommendedSolutions.length).toBeGreaterThan(0);
    });

    it('should handle unknown issue types', () => {
      const classification: IssueClassification = {
        type: 'syntax-error',
        confidence: 0.5,
        primaryCause: 'unknown',
        indicators: [],
      };

      const analysis = analyzer.analyze(
        'Unknown issue',
        null,
        { recentChanges: [], affectedFiles: [] },
        classification
      );

      expect(analysis).toBeDefined();
      expect(analysis.recommendedSolutions.length).toBeGreaterThan(0);
    });

    it('should handle null error field', () => {
      const classification: IssueClassification = {
        type: 'logic-error',
        confidence: 0.7,
        primaryCause: 'inverted-condition',
        indicators: ['behavioral-issue'],
      };

      const analysis = analyzer.analyze(
        'Logic issue without error',
        null,
        { recentChanges: ['Changed logic'], affectedFiles: ['app.ts'] },
        classification
      );

      expect(analysis).toBeDefined();
      expect(analysis.rootCause).toBeDefined();
    });
  });
});
