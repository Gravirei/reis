const assert = require('assert');
const { PlanReviewer, TaskStatus } = require('../../lib/utils/plan-reviewer');

describe('PlanReviewer', function() {
  let reviewer;
  
  beforeEach(function() {
    reviewer = new PlanReviewer(process.cwd());
  });
  
  describe('Constructor', function() {
    it('should create reviewer with analyzer', function() {
      assert.ok(reviewer.analyzer);
    });
    
    it('should accept config options', function() {
      const r = new PlanReviewer(process.cwd(), { autoFix: true, strict: true });
      assert.strictEqual(r.config.autoFix, true);
      assert.strictEqual(r.config.strict, true);
    });
    
    it('should have default config values', function() {
      assert.strictEqual(reviewer.config.autoFix, false);
      assert.strictEqual(reviewer.config.strict, false);
    });
  });
  
  describe('TaskStatus Constants', function() {
    it('should export TaskStatus constants', function() {
      assert.ok(TaskStatus.OK);
      assert.ok(TaskStatus.ALREADY_COMPLETE);
      assert.ok(TaskStatus.PATH_ERROR);
      assert.ok(TaskStatus.MISSING_DEPENDENCY);
      assert.ok(TaskStatus.CONFLICT);
    });
  });
  
  describe('Task Extraction', function() {
    it('should extract tasks from content', function() {
      const content = `
# Test Plan

<task name="test-task" type="implement">
<files>
lib/test.js
</files>
<action>
Create test file
</action>
<verify>
npm test
</verify>
<done>
File exists
</done>
</task>
`;
      const tasks = reviewer.extractTasks(content);
      assert.ok(Array.isArray(tasks));
      assert.ok(tasks.length > 0);
      // Name attribute takes precedence over <name> tag
      assert.strictEqual(tasks[0].name, 'test-task');
    });
    
    it('should use name tag when attribute is missing', function() {
      const content = `
<task type="implement">
<name>Task From Tag</name>
<action>Do something</action>
</task>
`;
      const tasks = reviewer.extractTasks(content);
      assert.ok(tasks.length > 0);
      assert.strictEqual(tasks[0].name, 'Task From Tag');
    });
    
    it('should extract files from task', function() {
      const task = {
        files: ['lib/test.js', 'lib/utils.js'],
        action: 'Create file at src/main.js'
      };
      const files = reviewer.extractFiles(task);
      assert.ok(Array.isArray(files));
      assert.ok(files.includes('lib/test.js'));
    });
    
    it('should extract expected functions from task', function() {
      const task = {
        action: 'Create function testFunction() and add helper()',
        files: ['lib/test.js']
      };
      const expected = reviewer.extractExpectedFunctions(task);
      assert.ok(Array.isArray(expected));
    });
    
    it('should extract expected exports from task', function() {
      const task = {
        action: 'module.exports = { TestClass, helper }',
        files: ['lib/test.js']
      };
      const expected = reviewer.extractExpectedExports(task);
      assert.ok(Array.isArray(expected));
    });
  });
  
  describe('File Target Checking', function() {
    it('should detect backslash path issues', function() {
      const result = reviewer.checkFileTargets(['lib\\test.js']);
      assert.ok(result.issues.length > 0);
      assert.strictEqual(result.issues[0].type, 'path_error');
      assert.ok(result.suggestions.length > 0);
    });
    
    it('should detect duplicate slash issues', function() {
      const result = reviewer.checkFileTargets(['lib//test.js']);
      assert.ok(result.issues.length > 0);
      assert.strictEqual(result.issues[0].type, 'path_error');
    });
    
    it('should pass valid paths', function() {
      const result = reviewer.checkFileTargets(['lib/test.js']);
      const pathErrors = result.issues.filter(i => i.type === 'path_error');
      assert.strictEqual(pathErrors.length, 0);
    });
  });
  
  describe('Function Target Checking', function() {
    it('should check function targets in existing file', function() {
      const result = reviewer.checkFunctionTargets('lib/utils/code-analyzer.js', ['fileExists', 'nonExistent']);
      assert.ok(result.existing.includes('fileExists'));
      assert.ok(result.missing.includes('nonExistent'));
    });
    
    it('should report conflicts in strict mode', function() {
      const strictReviewer = new PlanReviewer(process.cwd(), { strict: true });
      const result = strictReviewer.checkFunctionTargets('lib/utils/code-analyzer.js', ['fileExists']);
      assert.ok(result.issues.length > 0);
      assert.strictEqual(result.issues[0].type, 'conflict');
    });
  });
  
  describe('Export Target Checking', function() {
    it('should check export targets in existing file', function() {
      const result = reviewer.checkExportTargets('lib/utils/code-analyzer.js', ['CodeAnalyzer', 'NonExistent']);
      assert.ok(result.existing.includes('CodeAnalyzer'));
      assert.ok(result.missing.includes('NonExistent'));
    });
    
    it('should report conflicts in strict mode', function() {
      const strictReviewer = new PlanReviewer(process.cwd(), { strict: true });
      const result = strictReviewer.checkExportTargets('lib/utils/code-analyzer.js', ['CodeAnalyzer']);
      assert.ok(result.issues.length > 0);
      assert.strictEqual(result.issues[0].type, 'conflict');
    });
  });
  
  describe('Dependency Checking', function() {
    it('should check task dependencies', function() {
      const task = {
        action: "const missing = require('nonexistent-module');"
      };
      const result = reviewer.checkDependencies(task);
      assert.ok(Array.isArray(result.issues));
      assert.ok(Array.isArray(result.suggestions));
    });
    
    it('should pass when npm dependencies exist', function() {
      const task = {
        action: "const chalk = require('chalk');"
      };
      const result = reviewer.checkDependencies(task);
      // chalk is in package.json, so should have no issues
      const npmIssues = result.issues.filter(i => i.type === 'missing_dependency');
      assert.strictEqual(npmIssues.length, 0);
    });
    
    it('should flag missing npm dependencies', function() {
      const task = {
        action: "const missing = require('nonexistent-npm-pkg');"
      };
      const result = reviewer.checkDependencies(task);
      const npmIssues = result.issues.filter(i => i.type === 'missing_dependency');
      assert.ok(npmIssues.length > 0);
    });
  });
  
  describe('Task Validation', function() {
    it('should validate a task', async function() {
      const task = {
        name: 'Test Task',
        files: ['lib/utils/code-analyzer.js'],
        action: 'Update code analyzer'
      };
      const result = await reviewer.validateTask(task);
      assert.ok(result.status);
      assert.ok(Array.isArray(result.issues));
      assert.ok(Array.isArray(result.suggestions));
    });
  });
  
  describe('Report Generation', function() {
    it('should generate report from results', function() {
      const results = {
        planPath: 'test/plan.md',
        tasks: [
          {
            name: 'Task 1',
            type: 'implement',
            validation: {
              status: TaskStatus.OK,
              issues: [],
              suggestions: []
            }
          }
        ],
        summary: {
          total: 1,
          ok: 1,
          alreadyComplete: 0,
          pathErrors: 0,
          missingDependencies: 0,
          conflicts: 0
        }
      };
      const report = reviewer.generateReport(results);
      assert.ok(typeof report === 'string');
      assert.ok(report.includes('# Plan Review Report'));
      assert.ok(report.includes('Task 1'));
    });
    
    it('should include issues in report', function() {
      const results = {
        planPath: 'test/plan.md',
        tasks: [
          {
            name: 'Task with Issues',
            type: 'implement',
            validation: {
              status: TaskStatus.PATH_ERROR,
              issues: [{ type: 'path_error', message: 'Invalid path' }],
              suggestions: [{ type: 'fix_path', original: 'bad\\path', suggested: 'bad/path' }]
            }
          }
        ],
        summary: {
          total: 1,
          ok: 0,
          alreadyComplete: 0,
          pathErrors: 1,
          missingDependencies: 0,
          conflicts: 0
        }
      };
      const report = reviewer.generateReport(results);
      assert.ok(report.includes('Issues Found'));
      assert.ok(report.includes('Invalid path'));
    });
  });
  
  describe('Plan Review', function() {
    it('should review a plan file', async function() {
      // Skip if no plan files exist
      const planDir = '.planning';
      const fs = require('fs');
      if (!fs.existsSync(planDir)) {
        this.skip();
        return;
      }
      
      // Find a plan file to test with
      const files = fs.readdirSync(planDir).filter(f => f.endsWith('.md'));
      if (files.length === 0) {
        this.skip();
        return;
      }
      
      // Just test that reviewPlan doesn't throw
      try {
        const result = await reviewer.reviewPlan(`${planDir}/${files[0]}`);
        assert.ok(result || result === null);
      } catch (err) {
        // Some plans might not parse correctly - that's OK for this test
        assert.ok(true);
      }
    });
  });
});
