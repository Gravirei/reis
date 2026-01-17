/**
 * Tests for REIS v2.0 Config System
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { loadConfig, validateConfig, getWaveSize, DEFAULT_CONFIG } = require('../../lib/utils/config');

describe('Config System', () => {
  describe('validateConfig', () => {
    it('should validate default config', () => {
      const result = validateConfig(DEFAULT_CONFIG);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    it('should reject invalid wave size', () => {
      const config = {
        waves: { defaultSize: 'invalid' }
      };
      const result = validateConfig(config);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('Invalid defaultSize')));
    });

    it('should reject invalid maxTasks', () => {
      const config = {
        waves: {
          sizes: {
            small: { maxTasks: -1, estimatedMinutes: 30 }
          }
        }
      };
      const result = validateConfig(config);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('maxTasks')));
    });

    it('should reject invalid git.autoCommit type', () => {
      const config = {
        git: { autoCommit: 'yes' }
      };
      const result = validateConfig(config);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('autoCommit')));
    });

    it('should reject invalid llm.provider', () => {
      const config = {
        llm: { provider: 'invalid-provider' }
      };
      const result = validateConfig(config);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('llm.provider')));
    });
  });

  describe('getWaveSize', () => {
    it('should return specified wave size', () => {
      const size = getWaveSize(DEFAULT_CONFIG, 'small');
      assert.strictEqual(size.maxTasks, 3);
      assert.strictEqual(size.estimatedMinutes, 30);
    });

    it('should return default wave size when not specified', () => {
      const size = getWaveSize(DEFAULT_CONFIG);
      assert.strictEqual(size.maxTasks, 5);
      assert.strictEqual(size.estimatedMinutes, 60);
    });

    it('should fallback to medium for invalid size', () => {
      const size = getWaveSize(DEFAULT_CONFIG, 'invalid');
      assert.strictEqual(size.maxTasks, 5);
    });
  });

  describe('loadConfig', () => {
    it('should load default config when no file exists', () => {
      const config = loadConfig('/nonexistent/path');
      assert.ok(config.waves);
      assert.ok(config.git);
      assert.strictEqual(config.waves.defaultSize, 'medium');
    });
  });
});
