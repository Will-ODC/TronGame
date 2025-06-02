const CollisionDetector = require('../../src/game/CollisionDetector');
const Player = require('../../src/game/Player');

/**
 * CollisionDetector Class Unit Tests
 * 
 * These tests verify collision detection logic:
 * 1. Wall collisions at game boundaries
 * 2. Trail collisions with other players
 * 3. Self-trail collisions (with safety buffer)
 * 4. Point-to-point collision calculations
 * 5. Edge cases and boundary conditions
 */

describe('CollisionDetector Class', () => {
  let detector;
  let config;
  let player1, player2;

  beforeEach(() => {
    // Game configuration
    config = {
      GAME_WIDTH: 800,
      GAME_HEIGHT: 800,
      LINE_WIDTH: 10
    };

    detector = new CollisionDetector(config);

    // Create test players
    player1 = new Player('p1', 'Player 1', 'red', { x: 400, y: 400, direction: 'RIGHT' });
    player2 = new Player('p2', 'Player 2', 'blue', { x: 200, y: 200, direction: 'DOWN' });
  });

  describe('Wall Collisions', () => {
    it('should detect collision with left wall', () => {
      player1.x = 4; // Less than LINE_WIDTH/2 (5)
      expect(detector.checkWallCollision(player1)).toBe(true);
    });

    it('should detect collision with right wall', () => {
      player1.x = 796; // Greater than GAME_WIDTH - LINE_WIDTH/2 (795)
      expect(detector.checkWallCollision(player1)).toBe(true);
    });

    it('should detect collision with top wall', () => {
      player1.y = 3; // Less than LINE_WIDTH/2 (5)
      expect(detector.checkWallCollision(player1)).toBe(true);
    });

    it('should detect collision with bottom wall', () => {
      player1.y = 797; // Greater than GAME_HEIGHT - LINE_WIDTH/2 (795)
      expect(detector.checkWallCollision(player1)).toBe(true);
    });

    it('should not detect collision when player is safely inside boundaries', () => {
      player1.x = 400;
      player1.y = 400;
      expect(detector.checkWallCollision(player1)).toBe(false);
    });

    it('should handle exact boundary cases', () => {
      // Exactly at the safe boundary
      player1.x = 5; // LINE_WIDTH/2
      player1.y = 5;
      expect(detector.checkWallCollision(player1)).toBe(false);

      // Just inside the collision zone
      player1.x = 4.9;
      expect(detector.checkWallCollision(player1)).toBe(true);
    });
  });

  describe('Trail Collisions', () => {
    it('should detect collision with another player trail', () => {
      // Create a trail for player2
      player2.trail = [
        { x: 200, y: 200 },
        { x: 200, y: 210 },
        { x: 200, y: 220 }
      ];

      const players = new Map([
        ['p1', player1],
        ['p2', player2]
      ]);

      // Move player1 to collide with player2's trail
      player1.x = 200;
      player1.y = 210;

      expect(detector.checkTrailCollision(player1, players)).toBe(true);
    });

    it('should not detect collision when trails dont intersect', () => {
      player1.trail = [{ x: 400, y: 400 }];
      player2.trail = [{ x: 200, y: 200 }];

      const players = new Map([
        ['p1', player1],
        ['p2', player2]
      ]);

      expect(detector.checkTrailCollision(player1, players)).toBe(false);
    });

    it('should skip recent self-trail points to prevent turn collisions', () => {
      // Create a trail that just turned
      player1.trail = [
        { x: 390, y: 400 },
        { x: 391, y: 400 },
        { x: 392, y: 400 },
        { x: 393, y: 400 },
        { x: 394, y: 400 },
        { x: 395, y: 400 },
        { x: 396, y: 400 },
        { x: 397, y: 400 },
        { x: 398, y: 400 },
        { x: 399, y: 400 },
        { x: 400, y: 400 } // Current position
      ];

      const players = new Map([['p1', player1]]);

      // Player shouldn't collide with last 10 points of own trail (at default speed 2)
      expect(detector.checkTrailCollision(player1, players, 2)).toBe(false);
    });

    it('should detect self-collision with older trail points', () => {
      // Create a longer trail (need more than buffer size)
      player1.trail = [];
      for (let i = 0; i < 20; i++) {
        player1.trail.push({ x: 400 + i, y: 400 });
      }

      // Move player back to an old position
      // At default speed 2, buffer is 15, so trail[1] is outside buffer
      player1.x = 401; // This is trail[1], which is > 15 points ago
      player1.y = 400;

      const players = new Map([['p1', player1]]);

      expect(detector.checkTrailCollision(player1, players, 2)).toBe(true);
    });

    it('should handle empty trails', () => {
      const players = new Map([
        ['p1', player1],
        ['p2', player2]
      ]);

      expect(detector.checkTrailCollision(player1, players)).toBe(false);
    });

    it('should scale self-collision buffer with speed', () => {
      // Create a trail with points spaced far enough apart to avoid collision overlap
      // Each point is 15 pixels apart to ensure clean testing
      player1.trail = [];
      for (let i = 0; i < 70; i++) {
        player1.trail.push({ x: 400 + (i * 15), y: 400 });
      }

      const players = new Map([['p1', player1]]);

      // At speed 1, buffer is 150 (special case for very slow speed)
      // Since we only have 70 trail points and buffer is 150, effectively no collision
      // This is expected behavior for speed 1 to prevent instant death
      player1.x = 475; // trail[5], but with buffer 150 > 70, no collision expected  
      expect(detector.checkTrailCollision(player1, players, 1)).toBe(false);

      // At speed 2 (default), buffer is 15
      // trail[60] is at x = 400 + (60 * 15) = 1300, within last 15 points
      player1.x = 1300; // trail[60], within buffer, should NOT collide
      expect(detector.checkTrailCollision(player1, players, 2)).toBe(false);
      
      // trail[40] is at x = 400 + (40 * 15) = 1000, outside buffer
      player1.x = 1000; // trail[40], outside buffer, should collide
      expect(detector.checkTrailCollision(player1, players, 2)).toBe(true);

      // At speed 5, buffer is 25
      // trail[50] is at x = 400 + (50 * 15) = 1150, within last 25 points
      player1.x = 1150; // trail[50], within buffer, should NOT collide
      expect(detector.checkTrailCollision(player1, players, 5)).toBe(false);

      // But very old trail points should still collide (for speeds other than 1)
      // trail[2] is at x = 400 + (2 * 15) = 430
      player1.x = 430; // trail[2], should collide at speed 5 (buffer 25 < 70)
      expect(detector.checkTrailCollision(player1, players, 5)).toBe(true);
      // Note: Speed 1 has buffer 150, so trail[2] is excluded and won't collide
    });
  });

  describe('Point Collision', () => {
    it('should detect collision between close points', () => {
      // Points within LINE_WIDTH distance
      const result = detector.checkPointCollision(100, 100, 105, 100);
      expect(result).toBe(true); // Distance = 5, LINE_WIDTH = 10
    });

    it('should not detect collision between distant points', () => {
      // Points far apart
      const result = detector.checkPointCollision(100, 100, 200, 200);
      expect(result).toBe(false);
    });

    it('should handle exact threshold distance', () => {
      // Distance exactly equals LINE_WIDTH
      const result = detector.checkPointCollision(100, 100, 110, 100);
      expect(result).toBe(false); // Should be < not <=
    });

    it('should handle diagonal distances correctly', () => {
      // Pythagorean theorem: sqrt(6^2 + 8^2) = 10
      const result = detector.checkPointCollision(0, 0, 6, 8);
      expect(result).toBe(false); // Distance = 10, threshold < 10

      // Slightly closer
      const result2 = detector.checkPointCollision(0, 0, 5.9, 8);
      expect(result2).toBe(true); // Distance < 10
    });
  });

  describe('Combined Collision Detection', () => {
    it('should check both wall and trail collisions', () => {
      const players = new Map([['p1', player1]]);

      // No collision
      expect(detector.checkCollision(player1, players)).toBe(false);

      // Wall collision
      player1.x = 2;
      expect(detector.checkCollision(player1, players)).toBe(true);

      // Reset and test trail collision
      player1.x = 400;
      player2.trail = [{ x: 400, y: 400 }];
      players.set('p2', player2);
      expect(detector.checkCollision(player1, players)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle players at exact same position', () => {
      player2.trail = [{ x: 400, y: 400 }];
      player1.x = 400;
      player1.y = 400;

      const players = new Map([
        ['p1', player1],
        ['p2', player2]
      ]);

      expect(detector.checkTrailCollision(player1, players)).toBe(true);
    });

    it('should handle very large trails efficiently', () => {
      // Create a large trail
      player2.trail = [];
      for (let i = 0; i < 1000; i++) {
        player2.trail.push({ x: i, y: 100 });
      }

      const players = new Map([
        ['p1', player1],
        ['p2', player2]
      ]);

      // Should complete quickly even with large trail
      const start = Date.now();
      detector.checkTrailCollision(player1, players);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(10); // Should be very fast
    });
  });
});