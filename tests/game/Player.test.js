const Player = require('../../src/game/Player');

/**
 * Player Class Unit Tests
 * 
 * These tests verify that the Player class correctly:
 * 1. Initializes with proper default values
 * 2. Handles movement in all directions
 * 3. Manages trail creation
 * 4. Handles turning logic
 * 5. Resets properly for new games
 * 6. Serializes data correctly for network transmission
 */

describe('Player Class', () => {
  let player;
  const mockPosition = {
    x: 100,
    y: 200,
    direction: 'RIGHT'
  };

  beforeEach(() => {
    // Create a fresh player instance before each test
    player = new Player('player-1', 'TestPlayer', 'red', mockPosition);
  });

  describe('Constructor', () => {
    it('should initialize player with correct properties', () => {
      expect(player.id).toBe('player-1');
      expect(player.name).toBe('TestPlayer');
      expect(player.color).toBe('red');
      expect(player.x).toBe(100);
      expect(player.y).toBe(200);
      expect(player.direction).toBe('RIGHT');
      expect(player.trail).toEqual([]);
      expect(player.alive).toBe(true);
      expect(player.ready).toBe(false);
    });
  });

  describe('Movement', () => {
    const directionVectors = {
      UP: { x: 0, y: -1 },
      DOWN: { x: 0, y: 1 },
      LEFT: { x: -1, y: 0 },
      RIGHT: { x: 1, y: 0 }
    };

    it('should move right correctly', () => {
      player.move(5, directionVectors);
      expect(player.x).toBe(105); // 100 + (1 * 5)
      expect(player.y).toBe(200);
      expect(player.trail).toHaveLength(1);
      expect(player.trail[0]).toEqual({ x: 105, y: 200 });
    });

    it('should move up correctly', () => {
      player.direction = 'UP';
      player.move(3, directionVectors);
      expect(player.x).toBe(100);
      expect(player.y).toBe(197); // 200 + (-1 * 3)
    });

    it('should move down correctly', () => {
      player.direction = 'DOWN';
      player.move(4, directionVectors);
      expect(player.x).toBe(100);
      expect(player.y).toBe(204); // 200 + (1 * 4)
    });

    it('should move left correctly', () => {
      player.direction = 'LEFT';
      player.move(2, directionVectors);
      expect(player.x).toBe(98); // 100 + (-1 * 2)
      expect(player.y).toBe(200);
    });

    it('should not move when dead', () => {
      player.alive = false;
      player.move(5, directionVectors);
      expect(player.x).toBe(100); // No change
      expect(player.y).toBe(200); // No change
      expect(player.trail).toHaveLength(0); // No trail added
    });

    it('should build trail over multiple moves', () => {
      // Move right 3 times
      player.move(1, directionVectors);
      player.move(1, directionVectors);
      player.move(1, directionVectors);
      
      expect(player.trail).toHaveLength(3);
      expect(player.trail[0]).toEqual({ x: 101, y: 200 });
      expect(player.trail[1]).toEqual({ x: 102, y: 200 });
      expect(player.trail[2]).toEqual({ x: 103, y: 200 });
    });
  });

  describe('Turning', () => {
    it('should turn left correctly from each direction', () => {
      // From RIGHT to UP
      player.direction = 'RIGHT';
      player.turn('left');
      expect(player.direction).toBe('UP');

      // From UP to LEFT
      player.turn('left');
      expect(player.direction).toBe('LEFT');

      // From LEFT to DOWN
      player.turn('left');
      expect(player.direction).toBe('DOWN');

      // From DOWN to RIGHT
      player.turn('left');
      expect(player.direction).toBe('RIGHT');
    });

    it('should turn right correctly from each direction', () => {
      // From RIGHT to DOWN
      player.direction = 'RIGHT';
      player.turn('right');
      expect(player.direction).toBe('DOWN');

      // From DOWN to LEFT
      player.turn('right');
      expect(player.direction).toBe('LEFT');

      // From LEFT to UP
      player.turn('right');
      expect(player.direction).toBe('UP');

      // From UP to RIGHT
      player.turn('right');
      expect(player.direction).toBe('RIGHT');
    });

    it('should handle invalid turn inputs', () => {
      player.direction = 'RIGHT';
      player.turn('invalid');
      expect(player.direction).toBe('RIGHT'); // No change
    });
  });

  describe('Reset', () => {
    it('should reset player to new position and clear trail', () => {
      // First, modify the player state
      player.trail = [{ x: 100, y: 200 }, { x: 105, y: 200 }];
      player.alive = false;
      player.ready = true;

      // Reset with new position
      const newPosition = { x: 300, y: 400, direction: 'LEFT' };
      player.reset(newPosition);

      // Verify reset
      expect(player.x).toBe(300);
      expect(player.y).toBe(400);
      expect(player.direction).toBe('LEFT');
      expect(player.trail).toEqual([]);
      expect(player.alive).toBe(true);
      expect(player.ready).toBe(false);
    });
  });

  describe('Serialization', () => {
    it('should serialize player data correctly', () => {
      player.trail = [{ x: 100, y: 200 }];
      player.ready = true;

      const json = player.toJSON();

      expect(json).toEqual({
        id: 'player-1',
        name: 'TestPlayer',
        color: 'red',
        x: 100,
        y: 200,
        direction: 'RIGHT',
        trail: [{ x: 100, y: 200 }],
        alive: true,
        ready: true
      });
    });

    it('should create a new object (not reference)', () => {
      const json = player.toJSON();
      json.x = 500; // Modify the JSON
      expect(player.x).toBe(100); // Original should be unchanged
    });
  });
});