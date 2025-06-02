module.exports = {
  // Test environment for browser-like testing
  testEnvironment: 'jsdom',
  
  // Test only client files
  testMatch: [
    '**/tests/client/**/*.test.js'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.client.js'],
  
  // Module paths
  moduleDirectories: ['node_modules', 'src'],
  
  // Transform files
  transform: {
    '^.+\\.js$': 'babel-jest',
  }
};