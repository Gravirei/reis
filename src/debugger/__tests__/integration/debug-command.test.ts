/**
 * Integration tests for debug command
 * Tests end-to-end flow from issue description to fix plan
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { IssueClassifier } from '../../issue-classifier.js';
import { DebugAnalyzer } from '../../debug-analyzer.js';
import { SolutionDesigner } from '../../solution-designer.js';
import { PatternMatcher } from '../../pattern-matcher.js';
import { FixPlanGenerator } from '../../fix-plan-generator.js';
import { testIssues } from '../fixtures/test-issues.js';
import { mkdirSync, rmSync, existsSync } from 'fs';

describe('Debug Command Integration', () => {
  let classifier: IssueClassifier;
  let analyzer: DebugAnalyzer;
  let designer: SolutionDesigner;
  let matcher: PatternMatcher;
  let generator: FixPlanGenerator;
  const testPatternsDir = 'tmp_rovodev_integration_patterns';

  beforeEach(async () => {
    if (existsSync(testPatternsDir)) {
      rmSync(testPatternsDir, { recursive: true, force: true });
    }
    mkdirSync(testPatternsDir, { recursive: true });

    classifier = new IssueClassifier();
    analyzer = new DebugAnalyzer();
    designer = new SolutionDesigner();
    matcher = new PatternMatcher(testPatternsDir);
    generator = new FixPlanGenerator();

    await matcher.initialize();
  });

  afterEach(() => {
    if (existsSync(testPatternsDir)) {
      rmSync(testPatternsDir, { recursive: true, force: true });
    }
  });

  describe('End-to-End Flow', () => {
    it('should process syntax error from classification to fix plan', async () => {
      const issue = testIssues.syntaxError;

      // Step 1: Classify
      const classification = classifier.classify(
        issue.description,
        issue.error,
        issue.context
      );

      expect(classification.type).toBe('syntax-error');

      // Step 2: Analyze
      const analysis = analyzer.analyze(
        issue.description,
        issue.error,
        issue.context,
        classification
      );

      expect(analysis.rootCause).toBeDefined();
      expect(analysis.recommendedSolutions.length).toBeGreaterThan(0);

      // Step 3: Find patterns
      const patterns = await matcher.findMatches(classification, issue.context);
      expect(Array.isArray(patterns)).toBe(true);

      // Step 4: Design solution
      const solution = designer.design(analysis);

      expect(solution.approach).toBeDefined();
      expect(solution.steps.length).toBeGreaterThan(0);

      // Step 5: Generate fix plan
      const plan = generator.generate(classification.type, issue.description, solution);

      expect(plan).toContain('# Plan:');
      expect(plan).toContain('## Tasks');
      expect(plan).toContain('<task>');
    });

    it('should process logic error from classification to fix plan', async () => {
      const issue = testIssues.logicError;

      const classification = classifier.classify(
        issue.description,
        issue.error,
        issue.context
      );
      const analysis = analyzer.analyze(
        issue.description,
        issue.error,
        issue.context,
        classification
      );
      const solution = designer.design(analysis);
      const plan = generator.generate(classification.type, issue.description, solution);

      expect(classification.type).toBe('logic-error');
      expect(plan).toContain('fix');
      expect(solution.estimatedEffort).toBeDefined();
    });

    it('should process integration issue from classification to fix plan', async () => {
      const issue = testIssues.integrationIssue;

      const classification = classifier.classify(
        issue.description,
        issue.error,
        issue.context
      );
      const analysis = analyzer.analyze(
        issue.description,
        issue.error,
        issue.context,
        classification
      );
      const solution = designer.design(analysis);
      const plan = generator.generate(classification.type, issue.description, solution);

      expect(classification.type).toBe('integration-issue');
      expect(analysis.affectedComponents.length).toBeGreaterThan(1);
      expect(plan).toContain('API');
    });

    it('should process environment issue from classification to fix plan', async () => {
      const issue = testIssues.environmentIssue;

      const classification = classifier.classify(
        issue.description,
        issue.error,
        issue.context
      );
      const analysis = analyzer.analyze(
        issue.description,
        issue.error,
        issue.context,
        classification
      );
      const solution = designer.design(analysis);
      const plan = generator.generate(classification.type, issue.description, solution);

      expect(classification.type).toBe('environment-issue');
      expect(solution.requiresManualIntervention).toBe(true);
      expect(plan).toContain('checkpoint');
    });

    it('should process performance issue from classification to fix plan', async () => {
      const issue = testIssues.performanceIssue;

      const classification = classifier.classify(
        issue.description,
        issue.error,
        issue.context
      );
      const analysis = analyzer.analyze(
        issue.description,
        issue.error,
        issue.context,
        classification
      );
      const solution = designer.design(analysis);
      const plan = generator.generate(classification.type, issue.description, solution);

      expect(classification.type).toBe('performance-issue');
      expect(solution.estimatedEffort).not.toBe('low');
      expect(plan).toContain('refactor');
    });

    it('should process dependency conflict from classification to fix plan', async () => {
      const issue = testIssues.dependencyConflict;

      const classification = classifier.classify(
        issue.description,
        issue.error,
        issue.context
      );
      const analysis = analyzer.analyze(
        issue.description,
        issue.error,
        issue.context,
        classification
      );
      const solution = designer.design(analysis);
      const plan = generator.generate(classification.type, issue.description, solution);

      expect(classification.type).toBe('dependency-conflict');
      expect(solution.affectedFiles).toContain('package.json');
      expect(plan).toContain('chore');
    });

    it('should process incomplete implementation from classification to fix plan', async () => {
      const issue = testIssues.incompleteImplementation;

      const classification = classifier.classify(
        issue.description,
        issue.error,
        issue.context
      );
      const analysis = analyzer.analyze(
        issue.description,
        issue.error,
        issue.context,
        classification
      );
      const solution = designer.design(analysis);
      const plan = generator.generate(classification.type, issue.description, solution);

      expect(classification.type).toBe('incomplete-implementation');
      expect(classification.incompleteDetails?.cause).toBe('executor-skip');
      expect(solution.preventionStrategy).toBeDefined();
      expect(plan).toContain('feat');
    });
  });

  describe('Pattern Matching Integration', () => {
    it('should use matched patterns to enhance solutions', async () => {
      const issue = testIssues.incompleteImplementation;

      // First, record a pattern
      await matcher.recordIncompletePattern(
        'executor-skip',
        ['TODO', 'stub', 'not implemented'],
        ['Complete all TODO items', 'Remove stub implementations', 'Add proper error handling'],
        'Verify each task completion criteria before committing'
      );

      const classification = classifier.classify(
        issue.description,
        issue.error,
        issue.context
      );

      // Find patterns
      const patterns = await matcher.findMatches(classification, issue.context);

      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0].pattern.solutions.length).toBeGreaterThan(0);

      const analysis = analyzer.analyze(
        issue.description,
        issue.error,
        issue.context,
        classification
      );
      const solution = designer.design(analysis);

      // Solution should benefit from pattern knowledge
      expect(solution.approach).toBeDefined();
      expect(solution.preventionStrategy).toBeDefined();
    });

    it('should handle issues with no matching patterns', async () => {
      const issue = {
        description: 'Unique error that has never been seen before',
        error: 'Error: UNIQUE_ERROR_12345',
        context: {
          recentChanges: ['Made unique change'],
          affectedFiles: ['src/unique.ts'],
        },
      };

      const classification = classifier.classify(
        issue.description,
        issue.error,
        issue.context
      );

      const patterns = await matcher.findMatches(classification, issue.context);

      // Should still work even without patterns
      const analysis = analyzer.analyze(
        issue.description,
        issue.error,
        issue.context,
        classification
      );
      const solution = designer.design(analysis);
      const plan = generator.generate(classification.type, issue.description, solution);

      expect(plan).toBeDefined();
      expect(plan).toContain('# Plan:');
    });
  });

  describe('FR2.1 Incomplete Implementation Handling', () => {
    it('should detect and handle executor-skip incomplete implementations', async () => {
      const issue = testIssues.incompleteImplementation;

      const classification = classifier.classify(
        issue.description,
        issue.error,
        issue.context
      );

      expect(classification.type).toBe('incomplete-implementation');
      expect(classification.incompleteDetails?.cause).toBe('executor-skip');

      const analysis = analyzer.analyze(
        issue.description,
        issue.error,
        issue.context,
        classification
      );

      expect(analysis.context.planReference).toBe('3-2-auth-endpoints');

      const solution = designer.design(analysis);

      expect(solution.preventionStrategy).toContain('plan');

      const plan = generator.generate(classification.type, issue.description, solution);

      expect(plan).toContain('feat');
      expect(plan).toContain('Complete');
    });

    it('should detect and handle plan-ambiguity incomplete implementations', async () => {
      const issue = testIssues.incompleteImplementationPlanAmbiguity;

      const classification = classifier.classify(
        issue.description,
        issue.error,
        issue.context
      );

      expect(classification.type).toBe('incomplete-implementation');
      expect(classification.incompleteDetails?.cause).toBe('plan-ambiguity');

      const analysis = analyzer.analyze(
        issue.description,
        issue.error,
        issue.context,
        classification
      );
      const solution = designer.design(analysis);
      const plan = generator.generate(classification.type, issue.description, solution);

      expect(plan).toBeDefined();
      expect(solution.preventionStrategy?.toLowerCase()).toMatch(/plan|requirement|spec/);
    });

    it('should detect and handle dependency-blocker incomplete implementations', async () => {
      const issue = testIssues.incompleteImplementationDependencyBlocker;

      const classification = classifier.classify(
        issue.description,
        issue.error,
        issue.context
      );

      expect(classification.type).toBe('incomplete-implementation');
      expect(classification.incompleteDetails?.cause).toBe('dependency-blocker');

      const analysis = analyzer.analyze(
        issue.description,
        issue.error,
        issue.context,
        classification
      );
      const solution = designer.design(analysis);

      expect(solution.requiresManualIntervention).toBe(true);

      const plan = generator.generate(classification.type, issue.description, solution);

      expect(plan).toContain('checkpoint');
    });

    it('should learn from resolved incomplete implementations', async () => {
      const issue = testIssues.incompleteImplementation;

      const classification = classifier.classify(
        issue.description,
        issue.error,
        issue.context
      );

      // Record pattern after resolution
      await matcher.recordIncompletePattern(
        'executor-skip',
        ['TODO', 'not implemented', '501'],
        ['Review plan requirements', 'Implement missing logic', 'Remove TODO markers'],
        'Check all functions are fully implemented before committing'
      );

      const patternsAfter = await matcher.getAllPatterns();
      const recordedPattern = patternsAfter.find(
        (p) => p.cause === 'executor-skip' && p.signature.includes('501')
      );

      expect(recordedPattern).toBeDefined();
      expect(recordedPattern?.solutions.length).toBeGreaterThan(0);
    });
  });

  describe('Multi-Module Coordination', () => {
    it('should coordinate all modules for complex issue', async () => {
      const issue = {
        description: 'API endpoint fails with 500 error after recent refactoring',
        error: 'TypeError: Cannot read property "userId" of undefined at /api/users',
        context: {
          recentChanges: [
            'Refactored user authentication',
            'Updated database schema',
            'Changed API response format',
          ],
          affectedFiles: [
            'src/api/users.ts',
            'src/auth/middleware.ts',
            'src/db/schema.ts',
          ],
          symptoms: ['500 errors', 'Undefined userId', 'Auth middleware broken'],
        },
      };

      // Full pipeline
      const classification = classifier.classify(
        issue.description,
        issue.error,
        issue.context
      );

      expect(classification.confidence).toBeGreaterThan(0);

      const patterns = await matcher.findMatches(classification, issue.context);

      const analysis = analyzer.analyze(
        issue.description,
        issue.error,
        issue.context,
        classification
      );

      expect(analysis.affectedComponents.length).toBeGreaterThan(0);
      expect(analysis.recommendedSolutions.length).toBeGreaterThan(0);

      const solution = designer.design(analysis);

      expect(solution.steps.length).toBeGreaterThan(0);
      expect(solution.affectedFiles.length).toBeGreaterThan(0);

      const plan = generator.generate(classification.type, issue.description, solution);

      expect(plan).toContain('# Plan:');
      expect(plan).toContain('## Tasks');
      expect(plan.split('<task>').length - 1).toBeGreaterThan(0);
    });

    it('should handle cascading issues across modules', async () => {
      const issue = {
        description: 'Database migration fails, breaking API and frontend',
        error: 'Migration error: column "email" already exists',
        context: {
          recentChanges: [
            'Added email column to users table',
            'Updated API to use email field',
            'Changed frontend to display email',
          ],
          affectedFiles: [
            'migrations/001_add_email.sql',
            'src/api/users.ts',
            'src/components/UserProfile.tsx',
          ],
          symptoms: [
            'Migration fails',
            'API returns old data format',
            'Frontend shows undefined',
          ],
        },
      };

      const classification = classifier.classify(
        issue.description,
        issue.error,
        issue.context
      );
      const analysis = analyzer.analyze(
        issue.description,
        issue.error,
        issue.context,
        classification
      );
      const solution = designer.design(analysis);
      const plan = generator.generate(classification.type, issue.description, solution);

      // Should produce comprehensive plan
      expect(solution.affectedFiles.length).toBeGreaterThan(1);
      expect(solution.steps.length).toBeGreaterThan(1);
      expect(plan).toContain('## Tasks');
    });
  });

  describe('Error Handling', () => {
    it('should handle minimal issue information', async () => {
      const minimalIssue = {
        description: 'Something is broken',
        error: null,
        context: {
          recentChanges: [],
          affectedFiles: [],
        },
      };

      const classification = classifier.classify(
        minimalIssue.description,
        minimalIssue.error,
        minimalIssue.context
      );
      const analysis = analyzer.analyze(
        minimalIssue.description,
        minimalIssue.error,
        minimalIssue.context,
        classification
      );
      const solution = designer.design(analysis);
      const plan = generator.generate(
        classification.type,
        minimalIssue.description,
        solution
      );

      expect(plan).toBeDefined();
      expect(classification.confidence).toBeLessThan(0.8);
    });

    it('should handle missing context fields', async () => {
      const issue = {
        description: 'Error occurred',
        error: 'Error: Something failed',
        context: {
          recentChanges: ['Made a change'],
          affectedFiles: [],
          // Missing other optional fields
        },
      };

      const classification = classifier.classify(
        issue.description,
        issue.error,
        issue.context
      );
      const analysis = analyzer.analyze(
        issue.description,
        issue.error,
        issue.context,
        classification
      );
      const solution = designer.design(analysis);

      expect(solution).toBeDefined();
      expect(solution.steps.length).toBeGreaterThan(0);
    });

    it('should handle malformed error messages', async () => {
      const issue = {
        description: 'Strange error',
        error: '!@#$%^&*()',
        context: {
          recentChanges: ['Updated code'],
          affectedFiles: ['src/app.ts'],
        },
      };

      const classification = classifier.classify(
        issue.description,
        issue.error,
        issue.context
      );
      const analysis = analyzer.analyze(
        issue.description,
        issue.error,
        issue.context,
        classification
      );
      const solution = designer.design(analysis);
      const plan = generator.generate(classification.type, issue.description, solution);

      expect(plan).toBeDefined();
      expect(plan).toContain('# Plan:');
    });
  });
});
