// Jest setup file for common test configurations

// Mock timers for testing game loops
global.mockTimers = () => {
  jest.useFakeTimers();
};

global.restoreTimers = () => {
  jest.useRealTimers();
};

// Common test utilities
global.createMockSocket = () => ({
  id: 'mock-socket-id',
  emit: jest.fn(),
  on: jest.fn(),
  join: jest.fn(),
  to: jest.fn(() => ({ emit: jest.fn() })),
  roomId: null
});

global.createMockIO = () => ({
  to: jest.fn(() => ({ emit: jest.fn() })),
  emit: jest.fn()
});