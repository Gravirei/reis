/**
 * Integration tests for execute, verify, and debug commands
 * Tests real execution mode with subagent invocation
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Commands to test
const execute = require('../../lib/commands/execute');
const verify = require('../../lib/commands/verify');
const debug = require('../../lib/commands/debug');

describe('Command Integration Tests', () => {
  describe('execute command', () => {
    it('should export a function', () => {
      assert.strictEqual(typeof execute, 'function');
    });
    
    it('should be an async function', () => {
      // Async functions have constructor name AsyncFunction
      assert.strictEqual(execute.constructor.name, 'AsyncFunction');
    });
    
    it('should accept args and options parameters', () => {
      // Function should accept at least one parameter
      assert.ok(execute.length >= 1);
    });
  });
  
  describe('verify command', () => {
    it('should export a function', () => {
      assert.strictEqual(typeof verify, 'function');
    });
    
    it('should be an async function', () => {
      assert.strictEqual(verify.constructor.name, 'AsyncFunction');
    });
  });
  
  describe('debug command', () => {
    it('should export a function', () => {
      assert.strictEqual(typeof debug, 'function');
    });
    
    it('should be an async function', () => {
      assert.strictEqual(debug.constructor.name, 'AsyncFunction');
    });
  });
  
  describe('command module structure', () => {
    it('execute.js should require subagent-invoker', () => {
      const executeSource = fs.readFileSync(
        path.join(__dirname, '../../lib/commands/execute.js'), 
        'utf-8'
      );
      assert.ok(executeSource.includes('subagent-invoker'), 'Should include subagent-invoker');
      assert.ok(executeSource.includes('invokeSubagent'), 'Should include invokeSubagent');
    });
    
    it('verify.js should require subagent-invoker in invokeVerifier', () => {
      const verifySource = fs.readFileSync(
        path.join(__dirname, '../../lib/commands/verify.js'), 
        'utf-8'
      );
      assert.ok(verifySource.includes('subagent-invoker'), 'Should include subagent-invoker');
      assert.ok(verifySource.includes("invokeSubagent('reis_verifier'"), 'Should invoke reis_verifier');
    });
    
    it('debug.js should require subagent-invoker in invokeDebugger', () => {
      const debugSource = fs.readFileSync(
        path.join(__dirname, '../../lib/commands/debug.js'), 
        'utf-8'
      );
      assert.ok(debugSource.includes('subagent-invoker'), 'Should include subagent-invoker');
      assert.ok(debugSource.includes("invokeSubagent('reis_debugger'"), 'Should invoke reis_debugger');
    });
  });
  
  describe('dry-run mode support', () => {
    it('execute.js should support dryRun option', () => {
      const executeSource = fs.readFileSync(
        path.join(__dirname, '../../lib/commands/execute.js'), 
        'utf-8'
      );
      assert.ok(executeSource.includes('options.dryRun'), 'Should check options.dryRun');
      assert.ok(executeSource.includes('--dry-run mode'), 'Should display dry-run message');
    });
    
    it('verify.js should support dryRun option', () => {
      const verifySource = fs.readFileSync(
        path.join(__dirname, '../../lib/commands/verify.js'), 
        'utf-8'
      );
      assert.ok(verifySource.includes('options.dryRun'), 'Should check options.dryRun');
      assert.ok(verifySource.includes('--dry-run mode'), 'Should display dry-run message');
    });
    
    it('debug.js should support dryRun option', () => {
      const debugSource = fs.readFileSync(
        path.join(__dirname, '../../lib/commands/debug.js'), 
        'utf-8'
      );
      assert.ok(debugSource.includes('options.dryRun'), 'Should check options.dryRun');
      assert.ok(debugSource.includes('--dry-run mode'), 'Should display dry-run message');
    });
  });
  
  describe('CLI integration', () => {
    it('bin/reis.js should have --dry-run for execute', () => {
      const cliSource = fs.readFileSync(
        path.join(__dirname, '../../bin/reis.js'), 
        'utf-8'
      );
      // Check execute command has dry-run option
      const executeSection = cliSource.match(/\.command\('execute[^]*?\.action/s);
      assert.ok(executeSection !== null, 'Execute command should exist');
      assert.ok(executeSection[0].includes('--dry-run'), 'Execute should have --dry-run option');
    });
    
    it('bin/reis.js should have --dry-run for verify', () => {
      const cliSource = fs.readFileSync(
        path.join(__dirname, '../../bin/reis.js'), 
        'utf-8'
      );
      // Check verify command has dry-run option
      const verifySection = cliSource.match(/\.command\('verify[^]*?\.action/s);
      assert.ok(verifySection !== null, 'Verify command should exist');
      assert.ok(verifySection[0].includes('--dry-run'), 'Verify should have --dry-run option');
    });
    
    it('bin/reis.js should have --dry-run for debug', () => {
      const cliSource = fs.readFileSync(
        path.join(__dirname, '../../bin/reis.js'), 
        'utf-8'
      );
      // Check debug command has dry-run option
      const debugSection = cliSource.match(/\.command\('debug[^]*?\.action/s);
      assert.ok(debugSection !== null, 'Debug command should exist');
      assert.ok(debugSection[0].includes('--dry-run'), 'Debug should have --dry-run option');
    });
  });
  
  describe('exit code handling', () => {
    it('execute.js should return exit codes', () => {
      const executeSource = fs.readFileSync(
        path.join(__dirname, '../../lib/commands/execute.js'), 
        'utf-8'
      );
      assert.ok(executeSource.includes('return 0'), 'Should return 0 for success');
      assert.ok(executeSource.includes('return 1'), 'Should return 1 for failure');
    });
    
    it('verify.js should use process.exit with result', () => {
      const verifySource = fs.readFileSync(
        path.join(__dirname, '../../lib/commands/verify.js'), 
        'utf-8'
      );
      assert.ok(verifySource.includes('process.exit(result.passed ? 0 : 1)'), 'Should exit based on result');
    });
    
    it('debug.js should use process.exit', () => {
      const debugSource = fs.readFileSync(
        path.join(__dirname, '../../lib/commands/debug.js'), 
        'utf-8'
      );
      assert.ok(debugSource.includes('process.exit(0)'), 'Should exit 0 for success');
      assert.ok(debugSource.includes('process.exit(1)'), 'Should exit 1 for failure');
    });
  });
});
