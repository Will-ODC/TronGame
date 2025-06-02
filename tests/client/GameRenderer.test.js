// Mock the GameRenderer module since it's loaded differently
const GameRenderer = require('../../src/client/GameRenderer');

/**
 * GameRenderer Class Unit Tests
 * 
 * These tests verify the canvas rendering functionality:
 * 1. Canvas initialization and configuration
 * 2. Grid rendering
 * 3. Boundary rendering
 * 4. Player and trail rendering
 * 5. Countdown overlay
 * 6. Complete game state rendering
 */

describe('GameRenderer Class', () => {
  let renderer;
  let mockCanvas;
  let mockCtx;

  beforeEach(() => {
    // Create mock canvas and context
    mockCanvas = createMockCanvas();
    mockCtx = mockCanvas.getContext('2d');
    
    // Create renderer instance
    renderer = new GameRenderer(mockCanvas);
    renderer.ctx = mockCtx; // Ensure we use the mocked context
  });

  describe('Initialization', () => {
    it('should initialize with canvas and context', () => {
      expect(renderer.canvas).toBe(mockCanvas);
      expect(renderer.ctx).toBeDefined();
      expect(renderer.config).toBeNull();
    });

    it('should configure canvas dimensions on init', () => {
      const config = {
        gameWidth: 1000,
        gameHeight: 600,
        lineWidth: 10
      };

      renderer.init(config);

      expect(renderer.config).toEqual(config);
      expect(mockCanvas.width).toBe(1000);
      expect(mockCanvas.height).toBe(600);
      expect(mockCtx.fillRect).toHaveBeenCalled(); // Clear was called
    });
  });

  describe('Clear Function', () => {
    it('should clear canvas with black background', () => {
      renderer.init({ gameWidth: 800, gameHeight: 800, lineWidth: 10 });
      
      mockCtx.fillRect.mockClear();
      renderer.clear();

      expect(mockCtx.fillStyle).toBe('#000');
      expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 800, 800);
    });
  });

  describe('Grid Rendering', () => {
    beforeEach(() => {
      renderer.init({ gameWidth: 800, gameHeight: 800, lineWidth: 10 });
    });

    it('should draw grid lines', () => {
      renderer.drawGrid();

      expect(mockCtx.strokeStyle).toBe('#111');
      expect(mockCtx.lineWidth).toBe(1);
      expect(mockCtx.beginPath).toHaveBeenCalled();
      expect(mockCtx.moveTo).toHaveBeenCalled();
      expect(mockCtx.lineTo).toHaveBeenCalled();
      expect(mockCtx.stroke).toHaveBeenCalled();
    });

    it('should draw correct number of grid lines', () => {
      mockCtx.beginPath.mockClear();
      renderer.drawGrid();

      // Should draw lines every 40 pixels
      const expectedLines = Math.floor(800 / 40) + 1;
      // Each line needs beginPath, moveTo, lineTo, stroke (4 calls)
      // Times 2 for both vertical and horizontal
      const expectedCalls = expectedLines * 2;
      
      expect(mockCtx.beginPath.mock.calls.length).toBe(expectedCalls);
    });
  });

  describe('Boundary Rendering', () => {
    it('should draw white boundaries', () => {
      renderer.init({ gameWidth: 800, gameHeight: 800, lineWidth: 10 });
      renderer.drawBoundaries();

      expect(mockCtx.strokeStyle).toBe('#fff');
      expect(mockCtx.lineWidth).toBe(4);
      expect(mockCtx.strokeRect).toHaveBeenCalledWith(2, 2, 796, 796);
    });
  });

  describe('Player Rendering', () => {
    const mockPlayer = {
      name: 'Test Player',
      color: 'red',
      x: 400,
      y: 300,
      alive: true,
      trail: [
        { x: 380, y: 300 },
        { x: 390, y: 300 },
        { x: 400, y: 300 }
      ]
    };

    beforeEach(() => {
      renderer.init({ gameWidth: 800, gameHeight: 800, lineWidth: 10 });
    });

    it('should draw player trail', () => {
      renderer.drawPlayer(mockPlayer);

      expect(mockCtx.strokeStyle).toBe('red');
      expect(mockCtx.lineWidth).toBe(10);
      expect(mockCtx.lineCap).toBe('round');
      expect(mockCtx.lineJoin).toBe('round');
      expect(mockCtx.beginPath).toHaveBeenCalled();
      expect(mockCtx.moveTo).toHaveBeenCalledWith(380, 300);
      expect(mockCtx.lineTo).toHaveBeenCalledWith(390, 300);
      expect(mockCtx.lineTo).toHaveBeenCalledWith(400, 300);
      expect(mockCtx.stroke).toHaveBeenCalled();
    });

    it('should draw player head', () => {
      renderer.drawPlayer(mockPlayer);

      expect(mockCtx.fillStyle).toBe('red');
      expect(mockCtx.beginPath).toHaveBeenCalled();
      expect(mockCtx.arc).toHaveBeenCalledWith(400, 300, 7, 0, Math.PI * 2);
      expect(mockCtx.fill).toHaveBeenCalled();
    });

    it('should draw player name when alive', () => {
      renderer.drawPlayer(mockPlayer);

      expect(mockCtx.fillStyle).toBe('#fff');
      expect(mockCtx.font).toBe('14px Arial');
      expect(mockCtx.textAlign).toBe('center');
      expect(mockCtx.fillText).toHaveBeenCalledWith('Test Player', 400, 285);
    });

    it('should draw dead players with transparency', () => {
      const deadPlayer = { ...mockPlayer, alive: false };
      renderer.drawPlayer(deadPlayer);

      expect(mockCtx.globalAlpha).toBe(0.3);
      // After drawing, should reset alpha
      expect(mockCtx.globalAlpha).toBe(1);
    });

    it('should handle single-point trails', () => {
      const newPlayer = { ...mockPlayer, trail: [{ x: 100, y: 100 }] };
      
      // Should not crash
      expect(() => renderer.drawPlayer(newPlayer)).not.toThrow();
    });

    it('should handle empty trails', () => {
      const noTrailPlayer = { ...mockPlayer, trail: [] };
      
      // Should not crash
      expect(() => renderer.drawPlayer(noTrailPlayer)).not.toThrow();
    });
  });

  describe('Multiple Players', () => {
    it('should draw all players', () => {
      renderer.init({ gameWidth: 800, gameHeight: 800, lineWidth: 10 });
      
      const players = [
        {
          name: 'Player 1',
          color: 'red',
          x: 100,
          y: 100,
          alive: true,
          trail: [{ x: 100, y: 100 }]
        },
        {
          name: 'Player 2',
          color: 'blue',
          x: 200,
          y: 200,
          alive: true,
          trail: [{ x: 200, y: 200 }]
        }
      ];

      // Clear previous calls
      mockCtx.arc.mockClear();
      
      renderer.drawPlayers(players);
      
      // Should draw 2 player heads
      expect(mockCtx.arc).toHaveBeenCalledTimes(2);
    });
  });

  describe('Countdown Rendering', () => {
    beforeEach(() => {
      renderer.init({ gameWidth: 800, gameHeight: 800, lineWidth: 10 });
    });

    it('should draw countdown overlay with number', () => {
      renderer.drawCountdown(3);

      // Dark overlay
      expect(mockCtx.fillStyle).toBe('rgba(0, 0, 0, 0.7)');
      expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 800, 800);

      // Countdown text
      expect(mockCtx.fillStyle).toBe('#fff');
      expect(mockCtx.font).toBe('bold 72px Arial');
      expect(mockCtx.textAlign).toBe('center');
      expect(mockCtx.textBaseline).toBe('middle');
      expect(mockCtx.fillText).toHaveBeenCalledWith(3, 400, 400);
    });

    it('should draw GO! when countdown is 0', () => {
      renderer.drawCountdown(0);
      
      expect(mockCtx.fillText).toHaveBeenCalledWith('GO!', 400, 400);
    });
  });

  describe('Complete Render', () => {
    it('should render complete game state', () => {
      renderer.init({ gameWidth: 800, gameHeight: 800, lineWidth: 10 });
      
      const gameState = {
        players: [{
          name: 'Player 1',
          color: 'red',
          x: 100,
          y: 100,
          alive: true,
          trail: [{ x: 100, y: 100 }]
        }],
        state: 'playing',
        countdown: 10
      };

      // Track method calls
      const clearSpy = jest.spyOn(renderer, 'clear');
      const gridSpy = jest.spyOn(renderer, 'drawGrid');
      const boundariesSpy = jest.spyOn(renderer, 'drawBoundaries');
      const playersSpy = jest.spyOn(renderer, 'drawPlayers');
      const countdownSpy = jest.spyOn(renderer, 'drawCountdown');

      renderer.render(gameState);

      expect(clearSpy).toHaveBeenCalled();
      expect(gridSpy).toHaveBeenCalled();
      expect(boundariesSpy).toHaveBeenCalled();
      expect(playersSpy).toHaveBeenCalledWith(gameState.players);
      expect(countdownSpy).not.toHaveBeenCalled(); // countdown > 3
    });

    it('should render countdown overlay when countdown <= 3', () => {
      renderer.init({ gameWidth: 800, gameHeight: 800, lineWidth: 10 });
      
      const gameState = {
        players: [],
        state: 'countdown',
        countdown: 2
      };

      const countdownSpy = jest.spyOn(renderer, 'drawCountdown');
      
      renderer.render(gameState);
      
      expect(countdownSpy).toHaveBeenCalledWith(2);
    });

    it('should handle missing players array', () => {
      renderer.init({ gameWidth: 800, gameHeight: 800, lineWidth: 10 });
      
      const gameState = {
        state: 'playing',
        countdown: 10
        // No players array
      };

      // Should not crash
      expect(() => renderer.render(gameState)).not.toThrow();
    });
  });
});