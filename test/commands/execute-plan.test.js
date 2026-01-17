/**
 * Tests for REIS v2.0 Execute-Plan Command
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const executePlan = require('../../lib/commands/execute-plan');

describe('Execute-Plan Command', () => {
  let testDir;
  let originalCwd;

  beforeEach(() => {
    // Create temp test directory
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reis-test-'));
    originalCwd = process.cwd();
    process.chdir(testDir);

    // Create .planning directory
    fs.mkdirSync('.planning', { recursive: true });
    fs.writeFileSync('.planning/STATE.md', '# Test State\n');
    fs.writeFileSync('.planning/PROJECT.md', '# Test Project\n');
  });

  afterEach(() => {
    // Cleanup
    process.chdir(originalCwd);
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Backward Compatibility (no --wave flag)', () => {
    it('should use prompt-based behavior when --wave flag not provided', async () => {
      const planPath = path.join(testDir, 'test.PLAN.md');
      fs.writeFileSync(planPath, '# Test Plan\n');

      // Capture console output
      let output = '';
      const originalLog = console.log;
      console.log = (...args) => { output += args.join(' ') + '\n'; };

      const exitCode = await executePlan({ path: planPath });

      console.log = originalLog;

      assert.strictEqual(exitCode, 0);
      assert(output.includes('Execute the specific plan'), 'Should show prompt with plan path');
      assert(output.includes('reis_executor subagent'), 'Should mention subagent');
    });

    it('should fail gracefully when plan file does not exist (legacy mode)', async () => {
      const planPath = path.join(testDir, 'nonexistent.PLAN.md');

      let output = '';
      const originalError = console.error;
      console.error = (...args) => { output += args.join(' ') + '\n'; };

      const exitCode = await executePlan({ path: planPath });

      console.error = originalError;

      assert.strictEqual(exitCode, 0); // Legacy mode just shows prompt
    });
  });

  describe('Wave Execution Mode (--wave flag)', () => {
    it('should validate plan file exists', async () => {
      const planPath = path.join(testDir, 'nonexistent.PLAN.md');

      let output = '';
      const originalLog = console.log;
      const originalError = console.error;
      console.log = (...args) => { output += args.join(' ') + '\n'; };
      console.error = (...args) => { output += args.join(' ') + '\n'; };

      const exitCode = await executePlan({ path: planPath, wave: true });

      console.log = originalLog;
      console.error = originalError;

      assert.strictEqual(exitCode, 1);
      assert(output.includes('Plan file not found'), 'Should show error for missing file');
    });

    it('should parse and display plan structure', async () => {
      const planPath = path.join(testDir, 'test.PLAN.md');
      const planContent = `# Test Plan

## Tasks

<task type="feat" wave="1">
<name>Task 1</name>
<files>test.js</files>
<action>Create test file</action>
</task>

<task type="feat" wave="1">
<name>Task 2</name>
<files>test2.js</files>
<action>Create another test file</action>
</task>
`;
      fs.writeFileSync(planPath, planContent);

      // Create default config
      fs.writeFileSync('reis.config.js', `
module.exports = {
  git: { autoCommit: false },
  execution: { dryRun: false }
};
`);

      let output = '';
      const originalLog = console.log;
      console.log = (...args) => { output += args.join(' ') + '\n'; };

      const exitCode = await executePlan({ path: planPath, wave: true, dryRun: true });

      console.log = originalLog;

      assert.strictEqual(exitCode, 0);
      assert(output.includes('Parsing plan'), 'Should show parsing message');
      assert(output.includes('Found 1 wave'), 'Should show wave count');
      assert(output.includes('Task 1'), 'Should show task names');
      assert(output.includes('Task 2'), 'Should show task names');
    });

    it('should handle empty plan gracefully', async () => {
      const planPath = path.join(testDir, 'empty.PLAN.md');
      fs.writeFileSync(planPath, '# Empty Plan\n\nNo tasks here.\n');

      fs.writeFileSync('reis.config.js', `
module.exports = {
  git: { autoCommit: false },
  execution: { dryRun: false }
};
`);

      let output = '';
      const originalLog = console.log;
      const originalError = console.error;
      console.log = (...args) => { output += args.join(' ') + '\n'; };
      console.error = (...args) => { output += args.join(' ') + '\n'; };

      const exitCode = await executePlan({ path: planPath, wave: true });

      console.log = originalLog;
      console.error = originalError;

      assert.strictEqual(exitCode, 1);
      assert(output.includes('No waves found'), 'Should show error for empty plan');
    });

    it('should support dry-run mode', async () => {
      const planPath = path.join(testDir, 'test.PLAN.md');
      const planContent = `# Test Plan

<task type="feat" wave="1">
<name>Task 1</name>
<files>test.js</files>
<action>Create test file</action>
</task>
`;
      fs.writeFileSync(planPath, planContent);

      fs.writeFileSync('reis.config.js', `
module.exports = {
  git: { autoCommit: false },
  execution: { dryRun: false }
};
`);

      let output = '';
      const originalLog = console.log;
      console.log = (...args) => { output += args.join(' ') + '\n'; };

      const exitCode = await executePlan({ path: planPath, wave: true, dryRun: true });

      console.log = originalLog;

      assert.strictEqual(exitCode, 0);
      assert(output.includes('Dry run mode'), 'Should indicate dry run');
      assert(output.includes('no changes will be made'), 'Should warn no changes');
    });
  });

  describe('Configuration Integration', () => {
    it('should load config from project root', async () => {
      const planPath = path.join(testDir, 'test.PLAN.md');
      const planContent = `# Test Plan

<task type="feat" wave="1">
<name>Task 1</name>
<files>test.js</files>
<action>Create test file</action>
</task>
`;
      fs.writeFileSync(planPath, planContent);

      // Create custom config
      fs.writeFileSync('reis.config.js', `
module.exports = {
  git: { autoCommit: true },
  execution: { dryRun: false },
  planning: { directory: '.planning' }
};
`);

      let output = '';
      const originalLog = console.log;
      console.log = (...args) => { output += args.join(' ') + '\n'; };

      const exitCode = await executePlan({ path: planPath, wave: true, dryRun: true });

      console.log = originalLog;

      // Should not error when config loads
      assert.strictEqual(exitCode, 0);
    });

    it('should use defaults when config file missing', async () => {
      const planPath = path.join(testDir, 'test.PLAN.md');
      const planContent = `# Test Plan

<task type="feat" wave="1">
<name>Task 1</name>
<files>test.js</files>
<action>Create test file</action>
</task>
`;
      fs.writeFileSync(planPath, planContent);

      // No config file - should use defaults

      let output = '';
      const originalLog = console.log;
      console.log = (...args) => { output += args.join(' ') + '\n'; };

      const exitCode = await executePlan({ path: planPath, wave: true, dryRun: true });

      console.log = originalLog;

      // Should work with default config
      assert.strictEqual(exitCode, 0);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing path argument', async () => {
      let output = '';
      let exitCalled = false;
      const originalExit = process.exit;
      process.exit = (code) => {
        exitCalled = true;
        throw new Error(`process.exit(${code})`);
      };
      const originalError = console.error;
      console.error = (...args) => { output += args.join(' ') + '\n'; };

      try {
        await executePlan({});
      } catch (e) {
        // Expected
      }

      process.exit = originalExit;
      console.error = originalError;

      assert(exitCalled || output.includes('required'), 'Should error on missing path');
    });

    it('should handle plan parse errors gracefully', async () => {
      const planPath = path.join(testDir, 'invalid.PLAN.md');
      // Create plan with invalid XML that will fail parsing
      fs.writeFileSync(planPath, `# Invalid Plan

<task type="feat" wave="1">
<name>Unclosed task
<action>Missing closing tags
`);

      fs.writeFileSync('reis.config.js', `
module.exports = {
  git: { autoCommit: false },
  execution: { dryRun: false }
};
`);

      let output = '';
      const originalLog = console.log;
      const originalError = console.error;
      console.log = (...args) => { output += args.join(' ') + '\n'; };
      console.error = (...args) => { output += args.join(' ') + '\n'; };

      const exitCode = await executePlan({ path: planPath, wave: true });

      console.log = originalLog;
      console.error = originalError;

      // Should handle parse errors gracefully - in this case, no waves were found
      // because the parser is lenient and skips malformed tasks
      assert.strictEqual(exitCode, 1);
      assert(output.includes('No waves found') || output.includes('error'), 'Should show error');
    });

    it('should require .planning directory', async () => {
      // Remove .planning directory
      fs.rmSync('.planning', { recursive: true, force: true });

      const planPath = path.join(testDir, 'test.PLAN.md');
      fs.writeFileSync(planPath, '# Test Plan\n');

      let exitCalled = false;
      const originalExit = process.exit;
      process.exit = (code) => {
        exitCalled = true;
        throw new Error(`process.exit(${code})`);
      };

      try {
        await executePlan({ path: planPath, wave: true });
      } catch (e) {
        // Expected
      }

      process.exit = originalExit;

      assert(exitCalled, 'Should exit when .planning directory missing');
    });
  });

  describe('Git Integration', () => {
    it('should warn about uncommitted changes', async () => {
      const planPath = path.join(testDir, 'test.PLAN.md');
      const planContent = `# Test Plan

<task type="feat" wave="1">
<name>Task 1</name>
<files>test.js</files>
<action>Create test file</action>
</task>
`;
      fs.writeFileSync(planPath, planContent);

      // Initialize git repo with changes
      const { execSync } = require('child_process');
      try {
        execSync('git init', { cwd: testDir, stdio: 'ignore' });
        execSync('git config user.email "test@test.com"', { cwd: testDir, stdio: 'ignore' });
        execSync('git config user.name "Test"', { cwd: testDir, stdio: 'ignore' });
        fs.writeFileSync(path.join(testDir, 'uncommitted.txt'), 'changes');
        execSync('git add .', { cwd: testDir, stdio: 'ignore' });
      } catch (e) {
        // Git may not be available - skip test
        this.skip();
        return;
      }

      fs.writeFileSync('reis.config.js', `
module.exports = {
  git: { autoCommit: false },
  execution: { dryRun: false }
};
`);

      let output = '';
      const originalLog = console.log;
      console.log = (...args) => { output += args.join(' ') + '\n'; };

      await executePlan({ path: planPath, wave: true, dryRun: true });

      console.log = originalLog;

      // Should warn but not block
      assert(output.includes('Warning') || output.includes('uncommitted'), 'Should warn about uncommitted changes');
    });
  });

  describe('Progress Display', () => {
    it('should show wave progress indicators', async () => {
      const planPath = path.join(testDir, 'multi-wave.PLAN.md');
      const planContent = `# Multi-Wave Plan

<task type="feat" wave="1">
<name>Wave 1 Task</name>
<files>test1.js</files>
<action>Create test file</action>
</task>

<task type="feat" wave="2">
<name>Wave 2 Task</name>
<files>test2.js</files>
<action>Create another test file</action>
</task>
`;
      fs.writeFileSync(planPath, planContent);

      fs.writeFileSync('reis.config.js', `
module.exports = {
  git: { autoCommit: false },
  execution: { dryRun: false }
};
`);

      let output = '';
      const originalLog = console.log;
      console.log = (...args) => { output += args.join(' ') + '\n'; };

      await executePlan({ path: planPath, wave: true, dryRun: true });

      console.log = originalLog;

      assert(output.includes('Found 2 wave'), 'Should show total waves');
      assert(output.includes('Wave 1'), 'Should list wave 1');
      assert(output.includes('Wave 2'), 'Should list wave 2');
    });
  });
});
