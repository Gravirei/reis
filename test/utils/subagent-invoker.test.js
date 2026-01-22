/**
 * Tests for REIS Subagent Invoker
 */

const assert = require('assert');
const path = require('path');
const {
  loadSubagentDefinition,
  listSubagents,
  validateDefinition,
  buildExecutionContext,
  invokeSubagent,
  invokeWithRetry,
  createInvoker,
  SubagentInvoker,
  SubagentDefinition,
  ExecutionContext,
  InvocationResult,
  SubagentNotFoundError,
  InvalidDefinitionError,
  TimeoutError,
  parseYamlFrontmatter
} = require('../../lib/utils/subagent-invoker');

describe('Subagent Invoker', () => {
  
  // =========================================================================
  // loadSubagentDefinition Tests
  // =========================================================================
  
  describe('loadSubagentDefinition', () => {
    it('should load valid subagent definition', () => {
      const def = loadSubagentDefinition('reis_executor');
      assert.strictEqual(def.name, 'reis_executor');
      assert.ok(def.tools.includes('bash'));
      assert.ok(def.systemPrompt.length > 100);
    });

    it('should throw SubagentNotFoundError for nonexistent subagent', () => {
      assert.throws(
        () => loadSubagentDefinition('nonexistent_agent'),
        SubagentNotFoundError
      );
    });

    it('should include available subagents in error message', () => {
      try {
        loadSubagentDefinition('nonexistent_agent');
        assert.fail('Expected error to be thrown');
      } catch (e) {
        assert.ok(e.message.includes('Available'));
        assert.ok(e.message.includes('reis_executor'));
      }
    });

    it('should load all standard subagents', () => {
      const subagents = ['reis_executor', 'reis_verifier', 'reis_debugger', 'reis_planner', 'reis_project_mapper'];
      
      for (const name of subagents) {
        const def = loadSubagentDefinition(name);
        assert.ok(def instanceof SubagentDefinition);
        assert.strictEqual(def.name, name);
        assert.ok(def.description);
        assert.ok(Array.isArray(def.tools));
      }
    });
  });

  // =========================================================================
  // listSubagents Tests
  // =========================================================================

  describe('listSubagents', () => {
    it('should return array of subagent names', () => {
      const agents = listSubagents();
      assert.ok(Array.isArray(agents));
      assert.ok(agents.length >= 5);
    });

    it('should include all standard subagents', () => {
      const agents = listSubagents();
      assert.ok(agents.includes('reis_executor'));
      assert.ok(agents.includes('reis_verifier'));
      assert.ok(agents.includes('reis_debugger'));
      assert.ok(agents.includes('reis_planner'));
      assert.ok(agents.includes('reis_project_mapper'));
    });

    it('should return names without .md extension', () => {
      const agents = listSubagents();
      for (const name of agents) {
        assert.ok(!name.includes('.md'));
      }
    });
  });

  // =========================================================================
  // validateDefinition Tests
  // =========================================================================

  describe('validateDefinition', () => {
    it('should validate correct definition', () => {
      const def = loadSubagentDefinition('reis_executor');
      const result = validateDefinition(def);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    it('should reject null definition', () => {
      const result = validateDefinition(null);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.length > 0);
    });

    it('should reject definition without name', () => {
      const def = new SubagentDefinition(null, 'description', [], 'prompt content here');
      const result = validateDefinition(def);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('name')));
    });

    it('should reject definition without description', () => {
      const def = new SubagentDefinition('name', null, [], 'prompt content here');
      const result = validateDefinition(def);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('description')));
    });

    it('should reject definition with short system prompt', () => {
      const def = new SubagentDefinition('name', 'desc', [], 'short');
      const result = validateDefinition(def);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('prompt')));
    });
  });

  // =========================================================================
  // parseYamlFrontmatter Tests
  // =========================================================================

  describe('parseYamlFrontmatter', () => {
    it('should parse valid frontmatter', () => {
      const content = `---
name: test_agent
description: A test agent
tools:
- bash
- create_file
---

# Body content here`;
      
      const { frontmatter, body } = parseYamlFrontmatter(content);
      
      assert.strictEqual(frontmatter.name, 'test_agent');
      assert.strictEqual(frontmatter.description, 'A test agent');
      assert.deepStrictEqual(frontmatter.tools, ['bash', 'create_file']);
      assert.strictEqual(body.trim(), '# Body content here');
    });

    it('should handle missing frontmatter', () => {
      const content = '# Just markdown\n\nNo frontmatter here';
      const { frontmatter, body } = parseYamlFrontmatter(content);
      
      assert.strictEqual(frontmatter, null);
      assert.strictEqual(body, content);
    });

    it('should handle empty tools array', () => {
      const content = `---
name: test
description: test
tools:
---

Body`;
      
      const { frontmatter } = parseYamlFrontmatter(content);
      assert.ok(Array.isArray(frontmatter.tools));
    });
  });

  // =========================================================================
  // buildExecutionContext Tests
  // =========================================================================

  describe('buildExecutionContext', () => {
    it('should create valid context', () => {
      const ctx = buildExecutionContext('reis_executor', {});
      
      assert.ok(ctx instanceof ExecutionContext);
      assert.strictEqual(ctx.subagent.name, 'reis_executor');
      assert.strictEqual(ctx.timeout, 300000); // Default 5 min
    });

    it('should load project state automatically', () => {
      const ctx = buildExecutionContext('reis_executor', {});
      // Project state should be loaded from .planning/STATE.md
      assert.ok(ctx.projectState !== null);
    });

    it('should respect custom timeout', () => {
      const ctx = buildExecutionContext('reis_executor', { timeout: 60000 });
      assert.strictEqual(ctx.timeout, 60000);
    });

    it('should load plan content when planPath provided', () => {
      const ctx = buildExecutionContext('reis_executor', {
        planPath: '.planning/priority-1/phase-1-subagent-api/1-1-subagent-invoker.PLAN.md'
      });
      
      assert.ok(ctx.planPath);
      assert.ok(ctx.planContent);
      assert.ok(ctx.planContent.includes('Subagent Invocation API'));
    });

    it('should handle missing plan file gracefully', () => {
      const ctx = buildExecutionContext('reis_executor', {
        planPath: 'nonexistent/path.md'
      });
      
      assert.strictEqual(ctx.planPath, 'nonexistent/path.md');
      assert.ok(!ctx.planContent);
    });
  });

  // =========================================================================
  // ExecutionContext.buildPrompt Tests
  // =========================================================================

  describe('ExecutionContext.buildPrompt', () => {
    it('should include subagent name', () => {
      const ctx = buildExecutionContext('reis_executor', {});
      const prompt = ctx.buildPrompt();
      
      assert.ok(prompt.includes('# Subagent: reis_executor'));
    });

    it('should include system instructions', () => {
      const ctx = buildExecutionContext('reis_executor', {});
      const prompt = ctx.buildPrompt();
      
      assert.ok(prompt.includes('## System Instructions'));
      assert.ok(prompt.includes('REIS Executor Agent'));
    });

    it('should include project context section', () => {
      const ctx = buildExecutionContext('reis_executor', {});
      const prompt = ctx.buildPrompt();
      
      assert.ok(prompt.includes('## Project Context'));
      assert.ok(prompt.includes('**Project State:**'));
      assert.ok(prompt.includes('**Configuration:**'));
    });

    it('should include task context when plan provided', () => {
      const ctx = buildExecutionContext('reis_executor', {
        planContent: '# My Test Plan\n\nDo the thing.'
      });
      const prompt = ctx.buildPrompt();
      
      assert.ok(prompt.includes('## Task Context'));
      assert.ok(prompt.includes('# My Test Plan'));
    });

    it('should include additional context', () => {
      const ctx = buildExecutionContext('reis_executor', {
        additionalContext: {
          'Special Instructions': 'Be careful with the database'
        }
      });
      const prompt = ctx.buildPrompt();
      
      assert.ok(prompt.includes('## Additional Instructions'));
      assert.ok(prompt.includes('Special Instructions'));
      assert.ok(prompt.includes('Be careful with the database'));
    });

    it('should end with execution instruction', () => {
      const ctx = buildExecutionContext('reis_executor', {});
      const prompt = ctx.buildPrompt();
      
      assert.ok(prompt.includes('Execute the task as described above.'));
    });
  });

  // =========================================================================
  // SubagentInvoker Tests
  // =========================================================================

  describe('SubagentInvoker', () => {
    it('should extend EventEmitter', () => {
      const invoker = new SubagentInvoker();
      assert.strictEqual(typeof invoker.on, 'function');
      assert.strictEqual(typeof invoker.emit, 'function');
    });

    it('should emit start event', async () => {
      const invoker = new SubagentInvoker();
      const ctx = buildExecutionContext('reis_executor', { timeout: 5000 });
      
      let startEvent = null;
      invoker.on('start', (data) => { startEvent = data; });
      
      await invoker.invoke(ctx);
      
      assert.ok(startEvent !== null);
      assert.strictEqual(startEvent.subagent, 'reis_executor');
    });

    it('should emit progress events', async () => {
      const invoker = new SubagentInvoker();
      const ctx = buildExecutionContext('reis_executor', { timeout: 5000 });
      
      const progressEvents = [];
      invoker.on('progress', (data) => { progressEvents.push(data); });
      
      await invoker.invoke(ctx);
      
      assert.ok(progressEvents.length > 0);
      assert.ok(progressEvents.some(e => e.percent === 100));
    });

    it('should emit complete event', async () => {
      const invoker = new SubagentInvoker();
      const ctx = buildExecutionContext('reis_executor', { timeout: 5000 });
      
      let completeEvent = null;
      invoker.on('complete', (data) => { completeEvent = data; });
      
      await invoker.invoke(ctx);
      
      assert.ok(completeEvent !== null);
      assert.ok(completeEvent.result !== undefined);
    });

    it('should return InvocationResult', async () => {
      const invoker = new SubagentInvoker();
      const ctx = buildExecutionContext('reis_executor', { timeout: 5000 });
      
      const result = await invoker.invoke(ctx);
      
      assert.ok(result instanceof InvocationResult);
      assert.strictEqual(result.success, true);
      assert.ok(result.duration >= 0);
    });

    it('should include metadata in result', async () => {
      const invoker = new SubagentInvoker();
      const ctx = buildExecutionContext('reis_executor', { timeout: 5000 });
      
      const result = await invoker.invoke(ctx);
      
      assert.strictEqual(result.metadata.mode, 'prompt');
      assert.strictEqual(result.metadata.subagent, 'reis_executor');
    });
  });

  // =========================================================================
  // invokeSubagent Convenience Function Tests
  // =========================================================================

  describe('invokeSubagent', () => {
    it('should invoke subagent and return result', async () => {
      const result = await invokeSubagent('reis_executor', { timeout: 5000 });
      
      assert.strictEqual(result.success, true);
      assert.ok(result.output.length > 0);
    });

    it('should reject nonexistent subagent', async () => {
      try {
        await invokeSubagent('nonexistent_agent');
        assert.fail('Expected error to be thrown');
      } catch (e) {
        assert.ok(e instanceof SubagentNotFoundError);
      }
    });
  });

  // =========================================================================
  // invokeWithRetry Tests
  // =========================================================================

  describe('invokeWithRetry', () => {
    it('should succeed on first try', async () => {
      const result = await invokeWithRetry('reis_executor', { 
        timeout: 5000,
        maxRetries: 3 
      });
      
      assert.strictEqual(result.success, true);
    });

    it('should not retry SubagentNotFoundError', async () => {
      const result = await invokeWithRetry('nonexistent_agent', {
        maxRetries: 3,
        retryDelay: 10
      });
      
      // Should fail immediately without retrying
      assert.strictEqual(result.success, false);
      assert.ok(result.error instanceof SubagentNotFoundError);
    });
  });

  // =========================================================================
  // createInvoker Factory Tests
  // =========================================================================

  describe('createInvoker', () => {
    it('should create SubagentInvoker instance', () => {
      const invoker = createInvoker();
      assert.ok(invoker instanceof SubagentInvoker);
    });

    it('should pass options to invoker', () => {
      const invoker = createInvoker({ verbose: true });
      assert.strictEqual(invoker.verbose, true);
    });
  });

  // =========================================================================
  // InvocationResult Tests
  // =========================================================================

  describe('InvocationResult', () => {
    it('should create successful result with success()', () => {
      const result = InvocationResult.success({
        output: 'test output',
        duration: 100
      });
      
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.output, 'test output');
      assert.strictEqual(result.duration, 100);
      assert.strictEqual(result.error, null);
    });

    it('should create failed result with failure()', () => {
      const error = new Error('test error');
      const result = InvocationResult.failure(error, { duration: 50 });
      
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.error, error);
      assert.strictEqual(result.duration, 50);
    });

    it('should return serializable object from toJSON()', () => {
      const result = InvocationResult.success({
        output: 'test',
        duration: 100
      });
      
      const json = result.toJSON();
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.outputLength, 4);
      assert.strictEqual(json.duration, 100);
    });
  });

  // =========================================================================
  // Integration Tests
  // =========================================================================

  describe('Integration', () => {
    it('should complete full workflow: list -> load -> build -> invoke', async () => {
      // List available subagents
      const agents = listSubagents();
      assert.ok(agents.includes('reis_executor'));
      
      // Load a definition
      const def = loadSubagentDefinition('reis_executor');
      assert.strictEqual(def.name, 'reis_executor');
      
      // Build context
      const ctx = buildExecutionContext('reis_executor', { timeout: 5000 });
      assert.strictEqual(ctx.subagent.name, 'reis_executor');
      
      // Invoke
      const result = await invokeSubagent('reis_executor', { timeout: 5000 });
      assert.strictEqual(result.success, true);
    });

    it('should support parallel invocation', async () => {
      const invoker = new SubagentInvoker();
      
      const contexts = [
        buildExecutionContext('reis_executor', { timeout: 5000 }),
        buildExecutionContext('reis_verifier', { timeout: 5000 })
      ];
      
      const results = await invoker.invokeParallel(contexts);
      
      assert.strictEqual(results.length, 2);
      assert.strictEqual(results[0].success, true);
      assert.strictEqual(results[1].success, true);
    });
  });
});
