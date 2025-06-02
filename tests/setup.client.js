// Client-side test setup

// Mock Canvas API
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  strokeRect: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  fill: jest.fn(),
  arc: jest.fn(),
  fillText: jest.fn(),
  measureText: jest.fn(() => ({ width: 100 })),
  setTransform: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  lineCap: 'butt',
  lineJoin: 'miter',
  font: '10px sans-serif',
  textAlign: 'left',
  textBaseline: 'alphabetic',
  globalAlpha: 1
}));

// Mock document.write for module loading
document.write = jest.fn();

// Global test utilities for client tests
global.createMockCanvas = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 800;
  return canvas;
};

global.createMockEvent = (key) => {
  return new KeyboardEvent('keydown', { key });
};