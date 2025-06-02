const GameRoom = require('../../src/game/GameRoom');

/**
 * GameRoom Class Unit Tests
 * 
 * These tests verify the core game logic:
 * 1. Player management (add, remove, ready states)
 * 2. Game state transitions (lobby → countdown → playing → gameOver)
 * 3. Countdown timer functionality
 * 4. Game loop and player updates
 * 5. Win condition detection
 * 6. Broadcasting game state
 * 7. Speed configuration
 */

describe('GameRoom Class', () => {
  let gameRoom;
  let mockIO;
  let config;

  beforeEach(() => {
    // Mock Socket.io instance
    mockIO = {
      to: jest.fn(() => ({ emit: jest.fn() }))
    };

    // Game configuration
    config = {
      GAME_WIDTH: 800,
      GAME_HEIGHT: 800,
      PLAYER_SPEED: 2,
      LINE_WIDTH: 10,
      TICK_RATE: 1000 / 60,
      COUNTDOWN_DURATION: 10,
      MIN_PLAYERS: 2,
      MAX_PLAYERS: 4
    };

    gameRoom = new GameRoom('room-1', config, mockIO);
  });

  afterEach(() => {
    // Clean up any running intervals
    if (gameRoom.countdownInterval) {
      clearInterval(gameRoom.countdownInterval);
    }
    if (gameRoom.gameLoop) {
      clearInterval(gameRoom.gameLoop);
    }
  });

  describe('Player Management', () => {
    it('should add players successfully', () => {
      const colors = ['red', 'blue', 'green', 'purple'];
      
      expect(gameRoom.addPlayer('p1', 'Player 1', colors)).toBe(true);
      expect(gameRoom.players.size).toBe(1);
      
      expect(gameRoom.addPlayer('p2', 'Player 2', colors)).toBe(true);
      expect(gameRoom.players.size).toBe(2);
    });

    it('should assign correct colors to players', () => {
      const colors = ['red', 'blue', 'green', 'purple'];
      
      gameRoom.addPlayer('p1', 'Player 1', colors);
      gameRoom.addPlayer('p2', 'Player 2', colors);
      
      const p1 = gameRoom.players.get('p1');
      const p2 = gameRoom.players.get('p2');
      
      expect(p1.color).toBe('red');
      expect(p2.color).toBe('blue');
    });

    it('should not add more than MAX_PLAYERS', () => {
      const colors = ['red', 'blue', 'green', 'purple'];
      
      // Add maximum players
      for (let i = 0; i < config.MAX_PLAYERS; i++) {
        expect(gameRoom.addPlayer(`p${i}`, `Player ${i}`, colors)).toBe(true);
      }
      
      // Try to add one more
      expect(gameRoom.addPlayer('p5', 'Player 5', colors)).toBe(false);
      expect(gameRoom.players.size).toBe(config.MAX_PLAYERS);
    });

    it('should remove players correctly', () => {
      const colors = ['red', 'blue'];
      gameRoom.addPlayer('p1', 'Player 1', colors);
      gameRoom.addPlayer('p2', 'Player 2', colors);
      
      gameRoom.removePlayer('p1');
      expect(gameRoom.players.size).toBe(1);
      expect(gameRoom.players.has('p1')).toBe(false);
    });

    it('should set player ready status', () => {
      const colors = ['red'];
      gameRoom.addPlayer('p1', 'Player 1', colors);
      
      gameRoom.setPlayerReady('p1', true);
      expect(gameRoom.players.get('p1').ready).toBe(true);
      
      gameRoom.setPlayerReady('p1', false);
      expect(gameRoom.players.get('p1').ready).toBe(false);
    });
  });

  describe('Game State Transitions', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      const colors = ['red', 'blue'];
      gameRoom.addPlayer('p1', 'Player 1', colors);
      gameRoom.addPlayer('p2', 'Player 2', colors);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should start countdown when MIN_PLAYERS are ready', () => {
      expect(gameRoom.state).toBe('lobby');
      
      gameRoom.setPlayerReady('p1', true);
      expect(gameRoom.state).toBe('lobby'); // Still lobby
      
      gameRoom.setPlayerReady('p2', true);
      expect(gameRoom.state).toBe('countdown'); // Should start countdown
    });

    it('should not start countdown with insufficient players', () => {
      gameRoom.removePlayer('p2'); // Only 1 player left
      gameRoom.setPlayerReady('p1', true);
      expect(gameRoom.state).toBe('lobby');
    });

    it('should stop countdown if player leaves during countdown', () => {
      gameRoom.setPlayerReady('p1', true);
      gameRoom.setPlayerReady('p2', true);
      expect(gameRoom.state).toBe('countdown');
      
      gameRoom.removePlayer('p2');
      expect(gameRoom.state).toBe('lobby');
      expect(gameRoom.countdown).toBe(config.COUNTDOWN_DURATION);
    });

    it('should complete countdown and start game', () => {
      gameRoom.setPlayerReady('p1', true);
      gameRoom.setPlayerReady('p2', true);
      
      // Fast-forward through countdown
      for (let i = 0; i < config.COUNTDOWN_DURATION; i++) {
        jest.advanceTimersByTime(1000);
      }
      
      expect(gameRoom.state).toBe('playing');
    });

    it('should emit countdown updates', () => {
      const emitSpy = jest.fn();
      mockIO.to = jest.fn(() => ({ emit: emitSpy }));
      
      gameRoom.setPlayerReady('p1', true);
      gameRoom.setPlayerReady('p2', true);
      
      jest.advanceTimersByTime(3000); // 3 seconds
      
      expect(emitSpy).toHaveBeenCalledWith('countdown', 7);
    });
  });

  describe('Game Loop', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      const colors = ['red', 'blue'];
      gameRoom.addPlayer('p1', 'Player 1', colors);
      gameRoom.addPlayer('p2', 'Player 2', colors);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should update player positions during game', () => {
      // Start the game directly
      gameRoom.state = 'playing';
      gameRoom.startGame();
      
      const p1 = gameRoom.players.get('p1');
      const initialX = p1.x;
      
      // Advance one tick
      jest.advanceTimersByTime(config.TICK_RATE);
      
      // Player should have moved
      expect(p1.x).not.toBe(initialX);
    });

    it('should detect collisions and kill players', () => {
      gameRoom.state = 'playing';
      gameRoom.startGame();
      
      const p1 = gameRoom.players.get('p1');
      
      // Force player into wall
      p1.x = 1; // Will collide with wall
      
      jest.advanceTimersByTime(config.TICK_RATE);
      
      expect(p1.alive).toBe(false);
    });

    it('should end game when only one player remains', () => {
      const emitSpy = jest.fn();
      mockIO.to = jest.fn(() => ({ emit: emitSpy }));
      
      gameRoom.state = 'playing';
      gameRoom.startGame();
      
      // Kill player 1
      const p1 = gameRoom.players.get('p1');
      p1.alive = false;
      
      jest.advanceTimersByTime(config.TICK_RATE);
      
      expect(gameRoom.state).toBe('gameOver');
      expect(emitSpy).toHaveBeenCalledWith('gameOver', expect.objectContaining({
        winner: 'Player 2'
      }));
    });

    it('should handle no winner scenario', () => {
      const emitSpy = jest.fn();
      mockIO.to = jest.fn(() => ({ emit: emitSpy }));
      
      gameRoom.state = 'playing';
      gameRoom.startGame();
      
      // Kill both players
      gameRoom.players.forEach(player => {
        player.alive = false;
      });
      
      jest.advanceTimersByTime(config.TICK_RATE);
      
      expect(emitSpy).toHaveBeenCalledWith('gameOver', expect.objectContaining({
        winner: 'No one'
      }));
    });
  });

  describe('Direction Changes', () => {
    it('should change player direction during game', () => {
      const colors = ['red'];
      gameRoom.addPlayer('p1', 'Player 1', colors);
      gameRoom.state = 'playing';
      
      const p1 = gameRoom.players.get('p1');
      p1.direction = 'RIGHT';
      
      gameRoom.changeDirection('p1', 'left');
      expect(p1.direction).toBe('UP');
      
      gameRoom.changeDirection('p1', 'right');
      expect(p1.direction).toBe('RIGHT');
    });

    it('should not change direction when player is dead', () => {
      const colors = ['red'];
      gameRoom.addPlayer('p1', 'Player 1', colors);
      gameRoom.state = 'playing';
      
      const p1 = gameRoom.players.get('p1');
      p1.alive = false;
      p1.direction = 'RIGHT';
      
      gameRoom.changeDirection('p1', 'left');
      expect(p1.direction).toBe('RIGHT'); // No change
    });

    it('should not change direction when game is not playing', () => {
      const colors = ['red'];
      gameRoom.addPlayer('p1', 'Player 1', colors);
      gameRoom.state = 'lobby';
      
      const p1 = gameRoom.players.get('p1');
      const originalDir = p1.direction;
      
      gameRoom.changeDirection('p1', 'left');
      expect(p1.direction).toBe(originalDir); // No change
    });
  });

  describe('Game Restart', () => {
    it('should reset game state properly', () => {
      const colors = ['red', 'blue'];
      gameRoom.addPlayer('p1', 'Player 1', colors);
      gameRoom.addPlayer('p2', 'Player 2', colors);
      
      // Simulate game played
      gameRoom.state = 'gameOver';
      gameRoom.countdown = 3;
      gameRoom.players.forEach(player => {
        player.ready = true;
        player.alive = false;
        player.trail = [{ x: 100, y: 100 }];
      });
      
      gameRoom.restart();
      
      expect(gameRoom.state).toBe('lobby');
      expect(gameRoom.countdown).toBe(config.COUNTDOWN_DURATION);
      
      gameRoom.players.forEach(player => {
        expect(player.ready).toBe(false);
        expect(player.alive).toBe(true);
        expect(player.trail).toEqual([]);
      });
    });
  });

  describe('Broadcasting', () => {
    it('should broadcast correct game state', () => {
      const emitSpy = jest.fn();
      mockIO.to = jest.fn(() => ({ emit: emitSpy }));
      
      const colors = ['red'];
      gameRoom.addPlayer('p1', 'Player 1', colors);
      
      gameRoom.broadcast();
      
      expect(mockIO.to).toHaveBeenCalledWith('room-1');
      expect(emitSpy).toHaveBeenCalledWith('gameState', expect.objectContaining({
        players: expect.any(Array),
        state: 'lobby',
        countdown: 10,
        config: expect.objectContaining({
          gameWidth: 800,
          gameHeight: 800,
          lineWidth: 10,
          speed: 2
        })
      }));
    });
  });

  describe('Speed Configuration', () => {
    it('should update game speed', () => {
      gameRoom.setSpeed(5);
      expect(gameRoom.speed).toBe(5);
    });

    it('should use updated speed in game', () => {
      jest.useFakeTimers();
      const colors = ['red'];
      gameRoom.addPlayer('p1', 'Player 1', colors);
      
      gameRoom.setSpeed(10); // Fast speed
      gameRoom.state = 'playing';
      gameRoom.startGame();
      
      const p1 = gameRoom.players.get('p1');
      const initialX = p1.x;
      
      jest.advanceTimersByTime(config.TICK_RATE);
      
      // Should move by speed amount
      expect(Math.abs(p1.x - initialX)).toBe(10);
      
      jest.useRealTimers();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty room correctly', () => {
      expect(gameRoom.getPlayerCount()).toBe(0);
      gameRoom.broadcast(); // Should not crash
    });

    it('should handle invalid player IDs', () => {
      gameRoom.setPlayerReady('invalid-id', true); // Should not crash
      gameRoom.changeDirection('invalid-id', 'left'); // Should not crash
    });
  });
});