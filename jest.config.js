module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Coverage collection
  collectCoverageFrom: [
    'src/**/*.js',
    'server.js',
    '!src/client/**/*.js', // Client tests need jsdom environment
    '!**/node_modules/**'
  ],
  
  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Module paths
  moduleDirectories: ['node_modules', 'src'],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Transform files
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};