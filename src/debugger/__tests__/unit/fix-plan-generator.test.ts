/**
 * Unit tests for FixPlanGenerator
 * Tests fix plan generation in PLAN.md format
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { FixPlanGenerator } from '../../fix-plan-generator.js';
import type { DebugSolution } from '../../types.js';

describe('FixPlanGenerator', () => {
  let generator: FixPlanGenerator;

  beforeEach(() => {
    generator = new FixPlanGenerator();
  });

  describe('Plan Generation', () => {
    it('should generate valid PLAN.md format', () => {
      const solution: DebugSolution = {
        approach: 'Add null check before accessing data.map',
        steps: [
          {
            order: 1,
            action: 'Add null/undefined check for data parameter',
            files: ['src/utils.ts'],
            details: 'Check if data exists before calling .map()',
          },
          {
            order: 2,
            action: 'Add unit test for null data case',
            files: ['src/utils.test.ts'],
            details: 'Test that function handles null gracefully',
          },
        ],
        estimatedEffort: 'low',
        affectedFiles: ['src/utils.ts', 'src/utils.test.ts'],
        requiresManualIntervention: false,
        preventionStrategy: 'Add TypeScript strict null checks',
      };

      const plan = generator.generate(
        'syntax-error',
        'Undefined access in formatResults',
        solution
      );

      // Check structure
      expect(plan).toContain('# Plan:');
      expect(plan).toContain('## Objective');
      expect(plan).toContain('## Context');
      expect(plan).toContain('## Tasks');
      expect(plan).toContain('## Success Criteria');
      expect(plan).toContain('## Verification');
    });

    it('should include issue type in plan', () => {
      const solution: DebugSolution = {
        approach: 'Fix inverted condition',
        steps: [
          {
            order: 1,
            action: 'Correct boolean logic',
            files: ['src/auth.ts'],
            details: 'Change !isValid to isValid',
          },
        ],
        estimatedEffort: 'low',
        affectedFiles: ['src/auth.ts'],
        requiresManualIntervention: false,
      };

      const plan = generator.generate('logic-error', 'Wrong password accepted', solution);

      expect(plan).toContain('logic-error');
    });

    it('should include all implementation steps as tasks', () => {
      const solution: DebugSolution = {
        approach: 'Align API endpoints',
        steps: [
          {
            order: 1,
            action: 'Update frontend API paths',
            files: ['src/api/client.ts'],
            details: 'Change /api/users to /api/v2/users',
          },
          {
            order: 2,
            action: 'Update backend routes',
            files: ['src/routes/users.ts'],
            details: 'Ensure routes match frontend',
          },
          {
            order: 3,
            action: 'Test integration',
            files: [],
            details: 'Verify frontend can call backend',
          },
        ],
        estimatedEffort: 'medium',
        affectedFiles: ['src/api/client.ts', 'src/routes/users.ts'],
        requiresManualIntervention: false,
      };

      const plan = generator.generate(
        'integration-issue',
        'API path mismatch',
        solution
      );

      expect(plan).toContain('<task');
      expect(plan).toContain('Update frontend API paths');
      expect(plan).toContain('Update backend routes');
      expect(plan).toContain('Test integration');
    });

    it('should format tasks with XML structure', () => {
      const solution: DebugSolution = {
        approach: 'Add null check',
        steps: [
          {
            order: 1,
            action: 'Add validation',
            files: ['src/app.ts'],
            details: 'Check for null',
          },
        ],
        estimatedEffort: 'low',
        affectedFiles: ['src/app.ts'],
        requiresManualIntervention: false,
      };

      const plan = generator.generate('syntax-error', 'Null reference', solution);

      expect(plan).toContain('<task>');
      expect(plan).toContain('<name>');
      expect(plan).toContain('<type>');
      expect(plan).toContain('<files>');
      expect(plan).toContain('<action>');
      expect(plan).toContain('<verify>');
      expect(plan).toContain('<done>');
      expect(plan).toContain('</task>');
    });

    it('should include affected files in tasks', () => {
      const solution: DebugSolution = {
        approach: 'Fix bug',
        steps: [
          {
            order: 1,
            action: 'Update logic',
            files: ['src/utils.ts', 'src/helpers.ts'],
            details: 'Fix calculation',
          },
        ],
        estimatedEffort: 'low',
        affectedFiles: ['src/utils.ts', 'src/helpers.ts'],
        requiresManualIntervention: false,
      };

      const plan = generator.generate('logic-error', 'Calculation error', solution);

      expect(plan).toContain('src/utils.ts');
      expect(plan).toContain('src/helpers.ts');
    });

    it('should include verification steps', () => {
      const solution: DebugSolution = {
        approach: 'Optimize query',
        steps: [
          {
            order: 1,
            action: 'Add eager loading',
            files: ['src/db/queries.ts'],
            details: 'Use include to fetch related data',
          },
          {
            order: 2,
            action: 'Verify performance',
            files: [],
            details: 'Measure query time improvement',
          },
        ],
        estimatedEffort: 'medium',
        affectedFiles: ['src/db/queries.ts'],
        requiresManualIntervention: false,
      };

      const plan = generator.generate(
        'performance-issue',
        'Slow database queries',
        solution
      );

      expect(plan).toContain('<verify>');
      expect(plan).toContain('## Verification');
    });

    it('should include success criteria', () => {
      const solution: DebugSolution = {
        approach: 'Update dependencies',
        steps: [
          {
            order: 1,
            action: 'Update package.json',
            files: ['package.json'],
            details: 'Upgrade to compatible version',
          },
        ],
        estimatedEffort: 'low',
        affectedFiles: ['package.json'],
        requiresManualIntervention: true,
      };

      const plan = generator.generate(
        'dependency-conflict',
        'Peer dependency mismatch',
        solution
      );

      expect(plan).toContain('## Success Criteria');
      expect(plan).toContain('issue is resolved');
    });

    it('should include prevention strategy when provided', () => {
      const solution: DebugSolution = {
        approach: 'Complete implementation',
        steps: [
          {
            order: 1,
            action: 'Implement missing functionality',
            files: ['src/auth/login.ts'],
            details: 'Add password validation',
          },
        ],
        estimatedEffort: 'medium',
        affectedFiles: ['src/auth/login.ts'],
        requiresManualIntervention: false,
        preventionStrategy: 'Verify task completion criteria before committing',
      };

      const plan = generator.generate(
        'incomplete-implementation',
        'Missing validation',
        solution
      );

      expect(plan).toContain('Prevention');
      expect(plan).toContain('Verify task completion criteria before committing');
    });
  });

  describe('Task Types', () => {
    it('should use "fix" type for bug fixes', () => {
      const solution: DebugSolution = {
        approach: 'Fix syntax error',
        steps: [
          {
            order: 1,
            action: 'Add null check',
            files: ['src/app.ts'],
            details: 'Prevent undefined access',
          },
        ],
        estimatedEffort: 'low',
        affectedFiles: ['src/app.ts'],
        requiresManualIntervention: false,
      };

      const plan = generator.generate('syntax-error', 'Null reference', solution);

      expect(plan).toContain('<type>fix</type>');
    });

    it('should use "refactor" type for performance fixes', () => {
      const solution: DebugSolution = {
        approach: 'Optimize queries',
        steps: [
          {
            order: 1,
            action: 'Add eager loading',
            files: ['src/db/queries.ts'],
            details: 'Reduce query count',
          },
        ],
        estimatedEffort: 'medium',
        affectedFiles: ['src/db/queries.ts'],
        requiresManualIntervention: false,
      };

      const plan = generator.generate('performance-issue', 'Slow queries', solution);

      expect(plan).toContain('<type>refactor</type>');
    });

    it('should use "chore" type for dependency updates', () => {
      const solution: DebugSolution = {
        approach: 'Update dependencies',
        steps: [
          {
            order: 1,
            action: 'Update package.json',
            files: ['package.json'],
            details: 'Fix version conflict',
          },
        ],
        estimatedEffort: 'low',
        affectedFiles: ['package.json'],
        requiresManualIntervention: true,
      };

      const plan = generator.generate(
        'dependency-conflict',
        'Version conflict',
        solution
      );

      expect(plan).toContain('<type>chore</type>');
    });

    it('should use "feat" type for incomplete implementations', () => {
      const solution: DebugSolution = {
        approach: 'Complete feature',
        steps: [
          {
            order: 1,
            action: 'Implement missing function',
            files: ['src/auth.ts'],
            details: 'Complete authentication',
          },
        ],
        estimatedEffort: 'medium',
        affectedFiles: ['src/auth.ts'],
        requiresManualIntervention: false,
      };

      const plan = generator.generate(
        'incomplete-implementation',
        'Missing implementation',
        solution
      );

      expect(plan).toContain('<type>feat</type>');
    });
  });

  describe('Manual Intervention', () => {
    it('should add checkpoint for manual intervention', () => {
      const solution: DebugSolution = {
        approach: 'Set environment variables',
        steps: [
          {
            order: 1,
            action: 'Configure production environment',
            files: [],
            details: 'Set DATABASE_URL in hosting platform',
          },
        ],
        estimatedEffort: 'low',
        affectedFiles: [],
        requiresManualIntervention: true,
      };

      const plan = generator.generate(
        'environment-issue',
        'Missing env vars',
        solution
      );

      expect(plan).toContain('checkpoint');
      expect(plan).toContain('manual');
    });

    it('should not add checkpoint when no manual intervention needed', () => {
      const solution: DebugSolution = {
        approach: 'Fix code',
        steps: [
          {
            order: 1,
            action: 'Update logic',
            files: ['src/app.ts'],
            details: 'Fix condition',
          },
        ],
        estimatedEffort: 'low',
        affectedFiles: ['src/app.ts'],
        requiresManualIntervention: false,
      };

      const plan = generator.generate('logic-error', 'Wrong logic', solution);

      // Should not contain checkpoint for manual tasks
      const hasManualCheckpoint = plan.includes('checkpoint') && plan.includes('manual');
      expect(hasManualCheckpoint).toBe(false);
    });
  });

  describe('Effort Estimation', () => {
    it('should include effort estimation in context', () => {
      const solution: DebugSolution = {
        approach: 'Complex refactoring',
        steps: [
          {
            order: 1,
            action: 'Refactor data layer',
            files: ['src/db/queries.ts'],
            details: 'Optimize queries',
          },
        ],
        estimatedEffort: 'high',
        affectedFiles: ['src/db/queries.ts'],
        requiresManualIntervention: false,
      };

      const plan = generator.generate('performance-issue', 'Performance issue', solution);

      expect(plan).toContain('high');
    });

    it('should reflect effort in task complexity', () => {
      const lowEffort: DebugSolution = {
        approach: 'Simple fix',
        steps: [
          {
            order: 1,
            action: 'Add check',
            files: ['src/app.ts'],
            details: 'One line fix',
          },
        ],
        estimatedEffort: 'low',
        affectedFiles: ['src/app.ts'],
        requiresManualIntervention: false,
      };

      const highEffort: DebugSolution = {
        approach: 'Complex refactoring',
        steps: [
          {
            order: 1,
            action: 'Redesign architecture',
            files: ['src/db/queries.ts', 'src/api/users.ts', 'src/services/users.ts'],
            details: 'Refactor entire data layer',
          },
        ],
        estimatedEffort: 'high',
        affectedFiles: ['src/db/queries.ts', 'src/api/users.ts'],
        requiresManualIntervention: false,
      };

      const lowPlan = generator.generate('syntax-error', 'Simple error', lowEffort);
      const highPlan = generator.generate('performance-issue', 'Complex issue', highEffort);

      expect(lowPlan.length).toBeLessThan(highPlan.length);
    });
  });

  describe('Edge Cases', () => {
    it('should handle solution with no steps', () => {
      const solution: DebugSolution = {
        approach: 'Manual investigation needed',
        steps: [],
        estimatedEffort: 'unknown',
        affectedFiles: [],
        requiresManualIntervention: true,
      };

      const plan = generator.generate('syntax-error', 'Unknown error', solution);

      expect(plan).toBeDefined();
      expect(plan).toContain('## Objective');
    });

    it('should handle solution with empty affected files', () => {
      const solution: DebugSolution = {
        approach: 'Configuration change',
        steps: [
          {
            order: 1,
            action: 'Update config',
            files: [],
            details: 'Change settings',
          },
        ],
        estimatedEffort: 'low',
        affectedFiles: [],
        requiresManualIntervention: true,
      };

      const plan = generator.generate('environment-issue', 'Config issue', solution);

      expect(plan).toBeDefined();
      expect(plan).toContain('<task>');
    });

    it('should handle very long issue descriptions', () => {
      const longDescription = 'A'.repeat(500);
      const solution: DebugSolution = {
        approach: 'Fix issue',
        steps: [
          {
            order: 1,
            action: 'Apply fix',
            files: ['src/app.ts'],
            details: 'Fix the problem',
          },
        ],
        estimatedEffort: 'low',
        affectedFiles: ['src/app.ts'],
        requiresManualIntervention: false,
      };

      const plan = generator.generate('syntax-error', longDescription, solution);

      expect(plan).toBeDefined();
      expect(plan.length).toBeGreaterThan(0);
    });

    it('should handle special characters in descriptions', () => {
      const solution: DebugSolution = {
        approach: 'Fix parsing',
        steps: [
          {
            order: 1,
            action: 'Escape characters',
            files: ['src/parser.ts'],
            details: 'Handle <, >, &, etc.',
          },
        ],
        estimatedEffort: 'low',
        affectedFiles: ['src/parser.ts'],
        requiresManualIntervention: false,
      };

      const plan = generator.generate(
        'syntax-error',
        'Error with <angle> & special chars',
        solution
      );

      expect(plan).toBeDefined();
      expect(plan).toContain('<task>');
    });

    it('should handle missing prevention strategy', () => {
      const solution: DebugSolution = {
        approach: 'Fix bug',
        steps: [
          {
            order: 1,
            action: 'Apply fix',
            files: ['src/app.ts'],
            details: 'Fix issue',
          },
        ],
        estimatedEffort: 'low',
        affectedFiles: ['src/app.ts'],
        requiresManualIntervention: false,
        // preventionStrategy is optional
      };

      const plan = generator.generate('syntax-error', 'Bug', solution);

      expect(plan).toBeDefined();
      expect(plan).toContain('## Objective');
    });
  });

  describe('Plan Completeness', () => {
    it('should generate executable plan', () => {
      const solution: DebugSolution = {
        approach: 'Complete fix',
        steps: [
          {
            order: 1,
            action: 'Fix code',
            files: ['src/app.ts'],
            details: 'Correct logic',
          },
          {
            order: 2,
            action: 'Add tests',
            files: ['src/app.test.ts'],
            details: 'Verify fix',
          },
        ],
        estimatedEffort: 'low',
        affectedFiles: ['src/app.ts', 'src/app.test.ts'],
        requiresManualIntervention: false,
        preventionStrategy: 'Add unit tests',
      };

      const plan = generator.generate('logic-error', 'Logic bug', solution);

      // Verify all required sections
      expect(plan).toContain('# Plan:');
      expect(plan).toContain('## Objective');
      expect(plan).toContain('## Context');
      expect(plan).toContain('## Tasks');
      expect(plan).toContain('## Success Criteria');
      expect(plan).toContain('## Verification');
      
      // Verify task structure
      expect(plan).toContain('<task>');
      expect(plan).toContain('<name>');
      expect(plan).toContain('<type>');
      expect(plan).toContain('<files>');
      expect(plan).toContain('<action>');
      expect(plan).toContain('<verify>');
      expect(plan).toContain('<done>');
      expect(plan).toContain('</task>');
    });
  });
});
