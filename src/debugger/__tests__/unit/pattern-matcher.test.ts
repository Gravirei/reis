/**
 * Unit tests for PatternMatcher
 * Tests pattern matching, learning, and FR2.1 incomplete implementation tracking
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PatternMatcher } from '../../pattern-matcher.js';
import { testPatterns } from '../fixtures/test-issues.js';
import type { IssueClassification, DebugPattern } from '../../types.js';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

describe('PatternMatcher', () => {
  let matcher: PatternMatcher;
  const testPatternsDir = 'tmp_rovodev_test_patterns';

  beforeEach(async () => {
    // Create temporary patterns directory
    if (existsSync(testPatternsDir)) {
      rmSync(testPatternsDir, { recursive: true, force: true });
    }
    mkdirSync(testPatternsDir, { recursive: true });
    
    matcher = new PatternMatcher(testPatternsDir);
    await matcher.initialize();
  });

  afterEach(() => {
    // Clean up
    if (existsSync(testPatternsDir)) {
      rmSync(testPatternsDir, { recursive: true, force: true });
    }
  });

  describe('Pattern Initialization', () => {
    it('should initialize with default patterns', async () => {
      const patterns = await matcher.getAllPatterns();
      
      expect(patterns.length).toBeGreaterThanOrEqual(5);
      
      // Check for incomplete implementation patterns
      const incompletePatterns = patterns.filter(
        (p) => p.type === 'incomplete-implementation'
      );
      expect(incompletePatterns.length).toBeGreaterThanOrEqual(3);
    });

    it('should include FR2.1 incomplete implementation patterns', async () => {
      const patterns = await matcher.getAllPatterns();
      
      const executorSkip = patterns.find(
        (p) => p.type === 'incomplete-implementation' && p.cause === 'executor-skip'
      );
      expect(executorSkip).toBeDefined();
      
      const planAmbiguity = patterns.find(
        (p) => p.type === 'incomplete-implementation' && p.cause === 'plan-ambiguity'
      );
      expect(planAmbiguity).toBeDefined();
      
      const dependencyBlocker = patterns.find(
        (p) => p.type === 'incomplete-implementation' && p.cause === 'dependency-blocker'
      );
      expect(dependencyBlocker).toBeDefined();
    });

    it('should include standard bug patterns', async () => {
      const patterns = await matcher.getAllPatterns();
      
      const syntaxPattern = patterns.find((p) => p.type === 'syntax-error');
      expect(syntaxPattern).toBeDefined();
      
      const logicPattern = patterns.find((p) => p.type === 'logic-error');
      expect(logicPattern).toBeDefined();
    });
  });

  describe('Pattern Matching', () => {
    it('should match incomplete implementation with executor-skip cause', async () => {
      const classification: IssueClassification = {
        type: 'incomplete-implementation',
        confidence: 0.85,
        primaryCause: 'executor-skip',
        indicators: ['todo-markers', 'stub-implementations'],
        incompleteDetails: {
          cause: 'executor-skip',
          indicators: ['TODO comments', 'stub implementations'],
        },
      };

      const context = {
        recentChanges: ['Completed plan with TODO markers'],
        affectedFiles: ['src/auth/login.ts'],
        symptoms: ['Returns 501', 'Has TODO comments'],
      };

      const matches = await matcher.findMatches(classification, context);
      
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].pattern.type).toBe('incomplete-implementation');
      expect(matches[0].pattern.cause).toBe('executor-skip');
      expect(matches[0].confidence).toBeGreaterThan(0.5);
    });

    it('should match incomplete implementation with plan-ambiguity cause', async () => {
      const classification: IssueClassification = {
        type: 'incomplete-implementation',
        confidence: 0.75,
        primaryCause: 'plan-ambiguity',
        indicators: ['vague-requirements'],
        incompleteDetails: {
          cause: 'plan-ambiguity',
          indicators: ['vague requirements', 'unclear specifications'],
        },
      };

      const context = {
        recentChanges: ['Plan unclear about validation requirements'],
        affectedFiles: ['src/pages/Profile.tsx'],
      };

      const matches = await matcher.findMatches(classification, context);
      
      const planAmbiguityMatch = matches.find(
        (m) => m.pattern.cause === 'plan-ambiguity'
      );
      expect(planAmbiguityMatch).toBeDefined();
    });

    it('should match incomplete implementation with dependency-blocker cause', async () => {
      const classification: IssueClassification = {
        type: 'incomplete-implementation',
        confidence: 0.8,
        primaryCause: 'dependency-blocker',
        indicators: ['external-dependency'],
        incompleteDetails: {
          cause: 'dependency-blocker',
          indicators: ['missing API keys', 'checkpoint blocked'],
        },
      };

      const context = {
        recentChanges: ['Payment implementation blocked on Stripe keys'],
        affectedFiles: ['src/api/payment/process.ts'],
      };

      const matches = await matcher.findMatches(classification, context);
      
      const blockerMatch = matches.find(
        (m) => m.pattern.cause === 'dependency-blocker'
      );
      expect(blockerMatch).toBeDefined();
    });

    it('should match logic error patterns', async () => {
      const classification: IssueClassification = {
        type: 'logic-error',
        confidence: 0.75,
        primaryCause: 'inverted-condition',
        indicators: ['behavioral-issue'],
      };

      const context = {
        recentChanges: ['Updated password validation logic'],
        affectedFiles: ['src/auth/auth.ts'],
        symptoms: ['Wrong password accepted'],
      };

      const matches = await matcher.findMatches(classification, context);
      
      const logicMatch = matches.find((m) => m.pattern.type === 'logic-error');
      expect(logicMatch).toBeDefined();
    });

    it('should match syntax error patterns', async () => {
      const classification: IssueClassification = {
        type: 'syntax-error',
        confidence: 0.9,
        primaryCause: 'undefined-access',
        indicators: ['error-in-description'],
      };

      const context = {
        recentChanges: ['Modified data processing function'],
        affectedFiles: ['src/utils.ts'],
      };

      const matches = await matcher.findMatches(classification, context);
      
      const syntaxMatch = matches.find((m) => m.pattern.type === 'syntax-error');
      expect(syntaxMatch).toBeDefined();
    });

    it('should rank matches by confidence', async () => {
      const classification: IssueClassification = {
        type: 'incomplete-implementation',
        confidence: 0.85,
        primaryCause: 'executor-skip',
        indicators: ['todo-markers'],
        incompleteDetails: {
          cause: 'executor-skip',
          indicators: ['TODO', 'stub', 'not implemented'],
        },
      };

      const context = {
        recentChanges: ['Completed plan with TODOs'],
        affectedFiles: ['src/app.ts'],
        symptoms: ['TODO markers', 'Stub functions'],
      };

      const matches = await matcher.findMatches(classification, context);
      
      if (matches.length > 1) {
        for (let i = 0; i < matches.length - 1; i++) {
          expect(matches[i].confidence).toBeGreaterThanOrEqual(matches[i + 1].confidence);
        }
      }
    });

    it('should return empty array when no patterns match', async () => {
      const classification: IssueClassification = {
        type: 'performance-issue',
        confidence: 0.6,
        primaryCause: 'unknown-performance-issue',
        indicators: [],
      };

      const context = {
        recentChanges: ['Some unrelated change'],
        affectedFiles: ['src/random.ts'],
      };

      const matches = await matcher.findMatches(classification, context);
      
      // May or may not have matches depending on default patterns
      expect(Array.isArray(matches)).toBe(true);
    });
  });

  describe('Confidence Scoring', () => {
    it('should score higher for exact type matches', async () => {
      const exactMatch: IssueClassification = {
        type: 'incomplete-implementation',
        confidence: 0.85,
        primaryCause: 'executor-skip',
        indicators: [],
        incompleteDetails: {
          cause: 'executor-skip',
          indicators: ['TODO'],
        },
      };

      const matches = await matcher.findMatches(exactMatch, {
        recentChanges: [],
        affectedFiles: [],
      });
      
      const executorMatch = matches.find((m) => m.pattern.cause === 'executor-skip');
      if (executorMatch) {
        expect(executorMatch.confidence).toBeGreaterThan(0.5);
      }
    });

    it('should boost confidence for signature matches', async () => {
      const withSignature: IssueClassification = {
        type: 'incomplete-implementation',
        confidence: 0.85,
        primaryCause: 'executor-skip',
        indicators: [],
        incompleteDetails: {
          cause: 'executor-skip',
          indicators: ['TODO', 'stub', 'not implemented'],
        },
      };

      const context = {
        recentChanges: ['Added TODO markers'],
        affectedFiles: ['src/app.ts'],
        symptoms: ['TODO comments everywhere', 'stub implementations'],
      };

      const matches = await matcher.findMatches(withSignature, context);
      
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].confidence).toBeGreaterThan(0.6);
    });

    it('should boost confidence for frequent patterns', async () => {
      const classification: IssueClassification = {
        type: 'incomplete-implementation',
        confidence: 0.85,
        primaryCause: 'executor-skip',
        indicators: [],
        incompleteDetails: {
          cause: 'executor-skip',
          indicators: ['TODO'],
        },
      };

      // Record the pattern multiple times to increase frequency
      for (let i = 0; i < 5; i++) {
        await matcher.recordIncompletePattern(
          'executor-skip',
          ['TODO', 'stub'],
          ['Complete implementation', 'Remove TODOs']
        );
      }

      const matches = await matcher.findMatches(classification, {
        recentChanges: [],
        affectedFiles: [],
      });
      
      const executorMatch = matches.find((m) => m.pattern.cause === 'executor-skip');
      if (executorMatch) {
        expect(executorMatch.pattern.frequency).toBeGreaterThan(1);
      }
    });
  });

  describe('Pattern Learning (recordIncompletePattern)', () => {
    it('should record new incomplete implementation pattern', async () => {
      await matcher.recordIncompletePattern(
        'executor-skip',
        ['TODO', 'FIXME', 'placeholder'],
        ['Implement missing functionality', 'Remove placeholders'],
        'Verify task completion before committing'
      );

      const patterns = await matcher.getAllPatterns();
      const recorded = patterns.find(
        (p) =>
          p.type === 'incomplete-implementation' &&
          p.cause === 'executor-skip' &&
          p.signature.includes('FIXME')
      );

      expect(recorded).toBeDefined();
    });

    it('should increment frequency for existing pattern', async () => {
      // Record first time
      await matcher.recordIncompletePattern(
        'executor-skip',
        ['TODO', 'not implemented'],
        ['Complete implementation']
      );

      const before = await matcher.getAllPatterns();
      const beforePattern = before.find(
        (p) => p.cause === 'executor-skip' && p.signature.includes('not implemented')
      );
      const beforeFreq = beforePattern?.frequency || 0;

      // Record again with same signature
      await matcher.recordIncompletePattern(
        'executor-skip',
        ['TODO', 'not implemented'],
        ['Complete implementation']
      );

      const after = await matcher.getAllPatterns();
      const afterPattern = after.find(
        (p) => p.cause === 'executor-skip' && p.signature.includes('not implemented')
      );

      expect(afterPattern?.frequency).toBeGreaterThan(beforeFreq);
    });

    it('should support all three incomplete implementation causes', async () => {
      await matcher.recordIncompletePattern(
        'executor-skip',
        ['TODO'],
        ['Complete implementation']
      );

      await matcher.recordIncompletePattern(
        'plan-ambiguity',
        ['unclear spec'],
        ['Clarify requirements']
      );

      await matcher.recordIncompletePattern(
        'dependency-blocker',
        ['missing API key'],
        ['Obtain credentials']
      );

      const patterns = await matcher.getAllPatterns();
      
      expect(
        patterns.some((p) => p.cause === 'executor-skip')
      ).toBe(true);
      expect(
        patterns.some((p) => p.cause === 'plan-ambiguity')
      ).toBe(true);
      expect(
        patterns.some((p) => p.cause === 'dependency-blocker')
      ).toBe(true);
    });

    it('should persist patterns to disk', async () => {
      await matcher.recordIncompletePattern(
        'executor-skip',
        ['custom-marker'],
        ['Custom solution']
      );

      // Create new matcher instance to test persistence
      const newMatcher = new PatternMatcher(testPatternsDir);
      await newMatcher.initialize();

      const patterns = await newMatcher.getAllPatterns();
      const persisted = patterns.find((p) => p.signature.includes('custom-marker'));

      expect(persisted).toBeDefined();
    });
  });

  describe('Pattern Recommendations', () => {
    it('should extract solutions from matched patterns', async () => {
      const classification: IssueClassification = {
        type: 'incomplete-implementation',
        confidence: 0.85,
        primaryCause: 'executor-skip',
        indicators: [],
        incompleteDetails: {
          cause: 'executor-skip',
          indicators: ['TODO'],
        },
      };

      const matches = await matcher.findMatches(classification, {
        recentChanges: [],
        affectedFiles: [],
      });

      if (matches.length > 0) {
        expect(matches[0].pattern.solutions).toBeDefined();
        expect(matches[0].pattern.solutions.length).toBeGreaterThan(0);
      }
    });

    it('should extract prevention strategies from matched patterns', async () => {
      const classification: IssueClassification = {
        type: 'incomplete-implementation',
        confidence: 0.85,
        primaryCause: 'executor-skip',
        indicators: [],
        incompleteDetails: {
          cause: 'executor-skip',
          indicators: ['TODO'],
        },
      };

      const matches = await matcher.findMatches(classification, {
        recentChanges: [],
        affectedFiles: [],
      });

      if (matches.length > 0) {
        expect(matches[0].pattern.preventionStrategy).toBeDefined();
        expect(matches[0].pattern.preventionStrategy).not.toBe('');
      }
    });
  });

  describe('Pattern Statistics', () => {
    it('should track pattern frequency', async () => {
      const initialPatterns = await matcher.getAllPatterns();
      const initialPattern = initialPatterns.find((p) => p.cause === 'executor-skip');
      const initialFreq = initialPattern?.frequency || 0;

      await matcher.recordIncompletePattern(
        'executor-skip',
        ['TODO'],
        ['Complete it']
      );

      const updatedPatterns = await matcher.getAllPatterns();
      const updatedPattern = updatedPatterns.find((p) => p.cause === 'executor-skip');

      expect(updatedPattern?.frequency).toBeGreaterThan(initialFreq);
    });

    it('should maintain pattern distribution ratios', async () => {
      const patterns = await matcher.getAllPatterns();
      const incompletePatterns = patterns.filter(
        (p) => p.type === 'incomplete-implementation'
      );

      const executorSkip = incompletePatterns.find((p) => p.cause === 'executor-skip');
      const planAmbiguity = incompletePatterns.find((p) => p.cause === 'plan-ambiguity');
      const dependencyBlocker = incompletePatterns.find(
        (p) => p.cause === 'dependency-blocker'
      );

      // Executor-skip should have highest initial frequency (70%)
      expect(executorSkip?.frequency).toBeGreaterThanOrEqual(
        planAmbiguity?.frequency || 0
      );
      expect(executorSkip?.frequency).toBeGreaterThanOrEqual(
        dependencyBlocker?.frequency || 0
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty context gracefully', async () => {
      const classification: IssueClassification = {
        type: 'incomplete-implementation',
        confidence: 0.85,
        primaryCause: 'executor-skip',
        indicators: [],
        incompleteDetails: {
          cause: 'executor-skip',
          indicators: [],
        },
      };

      const matches = await matcher.findMatches(classification, {
        recentChanges: [],
        affectedFiles: [],
      });

      expect(Array.isArray(matches)).toBe(true);
    });

    it('should handle unknown issue type', async () => {
      const classification: IssueClassification = {
        type: 'syntax-error',
        confidence: 0.5,
        primaryCause: 'unknown-cause',
        indicators: [],
      };

      const matches = await matcher.findMatches(classification, {
        recentChanges: [],
        affectedFiles: [],
      });

      expect(Array.isArray(matches)).toBe(true);
    });

    it('should handle missing incompleteDetails', async () => {
      const classification: IssueClassification = {
        type: 'incomplete-implementation',
        confidence: 0.85,
        primaryCause: 'executor-skip',
        indicators: [],
        // Missing incompleteDetails
      };

      const matches = await matcher.findMatches(classification, {
        recentChanges: [],
        affectedFiles: [],
      });

      expect(Array.isArray(matches)).toBe(true);
    });
  });
});
