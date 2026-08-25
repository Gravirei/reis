const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Mock the command-helpers module
let mockPlanningDir = true;
let mockCapturedPrompt = null;
let mockCapturedError = null;

jest.mock('../../lib/utils/command-helpers', () => ({
  showPrompt: (prompt) => { mockCapturedPrompt = prompt; },
  showError: (msg) => { mockCapturedError = msg; },
  showSuccess: (msg) => {},
  showWarning: (msg) => {},
  showInfo: (msg) => {},
  checkPlanningDir: () => mockPlanningDir,
  getVersion: () => '2.7.0'
}));

// Mock kanban renderer to avoid hanging
jest.mock('../../lib/utils/kanban-renderer', () => ({
  showKanbanBoard: () => {},
  renderKanban: () => {}
}));

// Mock subagent invoker used for real (non-dry-run) debugger invocation
const mockInvokeSubagent = jest.fn();
class MockSubagentInvoker {
  on() { return this; }
}
jest.mock('../../lib/utils/subagent-invoker', () => ({
  invokeSubagent: (...args) => mockInvokeSubagent(...args),
  SubagentInvoker: MockSubagentInvoker
}));

// bin/reis.ts registers `.command('debug [target]')` and calls
// `await debugCmd(target, options)`. The command locates
// .planning/DEBUG_INPUT.md (or target/options.input), builds a debugger
// prompt, and terminates via process.exit (intercepted by jest.setup.js,
// which throws Error('process.exit(<code>)')).
const debug = require('../../lib/commands/debug');

describe('Debug Command', () => {
  const testDir = path.join(os.tmpdir(), 'reis-debug-test-' + Date.now());
  const planningDir = path.join(testDir, '.planning');
  const debugDir = path.join(planningDir, 'debug');
  const originalCwd = process.cwd();

  beforeAll(() => {
    fs.mkdirSync(planningDir, { recursive: true });
    // Create mock project context files read by loadProjectContext()
    fs.writeFileSync(path.join(planningDir, 'PROJECT.md'), `# Test Project

## Overview
A test project for REIS.
`);
    fs.writeFileSync(path.join(planningDir, 'STATE.md'), `# Project State

## Current Phase
**Phase 2: Core Features**

## Last Execution
## 2026-01-26
`);
    // Create a default DEBUG_INPUT.md describing test failures
    fs.writeFileSync(path.join(planningDir, 'DEBUG_INPUT.md'), `# Debug Input

Test Results:
- FAIL src/utils/helper.test.js
- 2 tests failing

AssertionError: Expected true but got false
`);
  });

  afterAll(() => {
    process.chdir(originalCwd);
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  let consoleLogSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    mockPlanningDir = true;
    mockCapturedPrompt = null;
    mockCapturedError = null;
    mockInvokeSubagent.mockReset();
    process.chdir(testDir);
    fs.rmSync(debugDir, { recursive: true, force: true });
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Validation', () => {
    it('should exit(1) when not a REIS project', async () => {
      mockPlanningDir = false;
      await expect(debug(undefined, {})).rejects.toThrow('process.exit(1)');
      assert.ok(mockCapturedError && mockCapturedError.includes('Not a REIS project'));
    });

    it('should exit(1) when the debug input file is missing', async () => {
      await expect(debug('nonexistent-input.md', {})).rejects.toThrow('process.exit(1)');
      assert.ok(
        consoleErrorSpy.mock.calls.some(call =>
          call.some(arg => String(arg).includes('DEBUG_INPUT.md not found'))
        )
      );
    });
  });

  describe('Debug Analysis (dry run)', () => {
    it('should build a debugger prompt and save it to DEBUGGER_PROMPT.txt', async () => {
      // NOTE: debug.ts wraps its whole flow in try/catch, so its own
      // success exit(0) is caught and converted to an outer exit(1)
      // with message "Debug command failed: process.exit(0)".
      await expect(debug(undefined, { dryRun: true })).rejects.toThrow('process.exit(1)');
      assert.ok(
        mockCapturedError && mockCapturedError.includes('Debug command failed: process.exit(0)'),
        'inner exit should have been exit(0) (success)'
      );

      const promptPath = path.join(debugDir, 'DEBUGGER_PROMPT.txt');
      assert.ok(fs.existsSync(promptPath), 'DEBUGGER_PROMPT.txt should be written');
      const savedPrompt = fs.readFileSync(promptPath, 'utf-8');
      assert.ok(savedPrompt.includes('REIS Debugger Analysis Request'));
      assert.ok(savedPrompt.includes('FIX_PLAN.md'), 'prompt should request FIX_PLAN.md output');
      assert.ok(
        savedPrompt.includes('2 tests failing'),
        'prompt should embed the debug input content'
      );
    });

    it('should include project context from .planning/ files', async () => {
      await expect(debug(undefined, { dryRun: true })).rejects.toThrow('process.exit(1)');

      const savedPrompt = fs.readFileSync(path.join(debugDir, 'DEBUGGER_PROMPT.txt'), 'utf-8');
      assert.ok(savedPrompt.includes('Project: Test Project'));
      assert.ok(savedPrompt.includes('Phase: Core Features'));
    });

    it('should detect incomplete-implementation issue type', async () => {
      const inputPath = path.join(testDir, 'incomplete-input.md');
      fs.writeFileSync(inputPath, `Tasks:
- Task 1 done
3/5 complete
`);
      await expect(debug(inputPath, { dryRun: true })).rejects.toThrow('process.exit(1)');
      assert.ok(
        consoleLogSpy.mock.calls.some(call =>
          call.some(arg => String(arg).includes('Issue type detected: incomplete-implementation'))
        )
      );
    });

    it('should detect test-failure issue type', async () => {
      await expect(debug(undefined, { dryRun: true })).rejects.toThrow('process.exit(1)');
      assert.ok(
        consoleLogSpy.mock.calls.some(call =>
          call.some(arg => String(arg).includes('Issue type detected: test-failure'))
        )
      );
    });

    it('should include --focus content in the prompt', async () => {
      await expect(debug(undefined, { dryRun: true, focus: 'auth module' })).rejects.toThrow('process.exit(1)');
      const savedPrompt = fs.readFileSync(path.join(debugDir, 'DEBUGGER_PROMPT.txt'), 'utf-8');
      assert.ok(savedPrompt.includes('Focus Area'));
      assert.ok(savedPrompt.includes('auth module'));
    });
  });

  describe('Input Options', () => {
    it('should handle a target plan/input file path as first argument', async () => {
      const customInput = path.join(testDir, 'custom-input.md');
      fs.writeFileSync(customInput, `Test Results:\nFAIL everything\n`);

      await expect(debug(customInput, { dryRun: true })).rejects.toThrow('process.exit(1)');
      const savedPrompt = fs.readFileSync(path.join(debugDir, 'DEBUGGER_PROMPT.txt'), 'utf-8');
      assert.ok(savedPrompt.includes('FAIL everything'));
    });

    it('should handle --input option pointing at a report file', async () => {
      const reportPath = path.join(testDir, 'custom-report.md');
      fs.writeFileSync(reportPath, `Quality Issues:\nESLint errors\n`);

      await expect(debug(undefined, { input: reportPath, dryRun: true })).rejects.toThrow('process.exit(1)');
      const savedPrompt = fs.readFileSync(path.join(debugDir, 'DEBUGGER_PROMPT.txt'), 'utf-8');
      assert.ok(savedPrompt.includes('ESLint errors'));
    });
  });

  describe('Subagent Invocation', () => {
    it('should invoke the reis_debugger subagent with the built prompt', async () => {
      mockInvokeSubagent.mockResolvedValue({
        success: true,
        output: 'analysis complete',
        metadata: {}
      });

      await expect(debug(undefined, {})).rejects.toThrow('process.exit(1)');
      assert.ok(
        mockCapturedError && mockCapturedError.includes('Debug command failed: process.exit(0)'),
        'inner exit should have been exit(0) (success)'
      );

      assert.strictEqual(mockInvokeSubagent.mock.calls.length, 1);
      const [subagentName, payload] = mockInvokeSubagent.mock.calls[0];
      assert.strictEqual(subagentName, 'reis_debugger');
      assert.ok(payload.additionalContext.debugPrompt.includes('REIS Debugger Analysis Request'));
    });

    it('should exit(1) when the debugger subagent fails', async () => {
      mockInvokeSubagent.mockResolvedValue({
        success: false,
        error: 'subagent crashed',
        metadata: {}
      });

      await expect(debug(undefined, {})).rejects.toThrow('process.exit(1)');
      assert.ok(
        consoleErrorSpy.mock.calls.some(call =>
          call.some(arg => String(arg).includes('Debugger failed'))
        )
      );
    });
  });

  describe('Return Values', () => {
    it('should exit(0) after successful analysis', async () => {
      mockInvokeSubagent.mockResolvedValue({
        success: true,
        output: 'done',
        metadata: {}
      });

      await expect(debug(undefined, {})).rejects.toThrow('process.exit(1)');
      assert.ok(
        mockCapturedError && mockCapturedError.includes('process.exit(0)'),
        'inner exit should have been exit(0) (success)'
      );
    });

    it('should exit(0) on dry runs without invoking the subagent', async () => {
      await expect(debug(undefined, { dryRun: true })).rejects.toThrow('process.exit(1)');
      assert.ok(
        mockCapturedError && mockCapturedError.includes('process.exit(0)'),
        'inner exit should have been exit(0) (success)'
      );
      assert.strictEqual(mockInvokeSubagent.mock.calls.length, 0);
    });

    it('should exit(1) when not a REIS project', async () => {
      mockPlanningDir = false;
      await expect(debug(undefined, {})).rejects.toThrow('process.exit(1)');
    });
  });
});
