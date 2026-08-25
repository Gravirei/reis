module.exports = {
  forceExit: true,
  projects: [
    {
      displayName: 'suite',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/test/**/*.test.js'],
      testPathIgnorePatterns: ['<rootDir>/test/performance/'],
      testTimeout: 5000,
      setupFiles: ['<rootDir>/test/jest.setup.js']
    },
    {
      displayName: 'perf',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/test/performance/**/*.test.js'],
      testTimeout: 30000,
      setupFiles: ['<rootDir>/test/jest.setup.js']
    }
  ]
};
