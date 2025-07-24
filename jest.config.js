module.exports = {
  projects: [
    {
      displayName: 'backend',
      testMatch: ['<rootDir>/tests/api/**/*.test.js'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/tests/setup/backend-setup.js']
    },
    {
      displayName: 'frontend',
      testMatch: ['<rootDir>/tests/frontend/**/*.test.js'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/tests/setup/frontend-setup.js']
    }
  ],
  collectCoverageFrom: [
    'server.js',
    'public/scripts/site.js',
    '!tests/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html']
};