/**
 * Test setup and global configuration
 */

import { beforeAll, afterAll } from '@jest/globals';

// Global test setup
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.REIS_TEST = 'true';
  
  // Suppress console output during tests (optional)
  // Uncomment if you want quieter test runs
  // global.console = {
  //   ...console,
  //   log: jest.fn(),
  //   debug: jest.fn(),
  //   info: jest.fn(),
  //   warn: jest.fn(),
  // };
});

// Global test teardown
afterAll(() => {
  // Cleanup test environment
  delete process.env.REIS_TEST;
});

// Custom matchers (if needed)
expect.extend({
  toContainPattern(received: string, pattern: string | RegExp) {
    const pass = typeof pattern === 'string' 
      ? received.includes(pattern)
      : pattern.test(received);
    
    if (pass) {
      return {
        message: () =>
          `expected "${received}" not to contain pattern "${pattern}"`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected "${received}" to contain pattern "${pattern}"`,
        pass: false,
      };
    }
  },
});

// Extend Jest matchers type
declare global {
  namespace jest {
    interface Matchers<R> {
      toContainPattern(pattern: string | RegExp): R;
    }
  }
}
