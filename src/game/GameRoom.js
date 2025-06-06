const Player = require('./Player');
const CollisionDetector = require('./CollisionDetector');
const ScoreTracker = require('./ScoreTracker');

/**
 * GameRoom manages a single game instance with multiple players
 */
class GameRoom {
  constructor(roomId, config, io) {
    this.roomId = roomId;
    this.config = config;
    this.io = io;
    this.players = new Map();
    this.state = 'lobby'; // lobby | countdown | playing | gameOver
    this.countdown = config.COUNTDOWN_DURATION;
    this.countdownInterval = null;
    this.gameLoop = null;
    this.speed = config.PLAYER_SPEED;
    this.collisionDetector = new CollisionDetector(config);
    
    // Track available colors and positions
    this.availableColors = ['red', 'blue', 'green', 'purple'];
    this.colorAssignments = new Map(); // Track which socket has which color
    
    // Performance optimizations
    this.maxTrailLength = 2000; // Limit trail length to prevent infinite growth
    this.broadcastRate = 1000 / 30; // Reduce broadcast rate to 30fps instead of 60fps
    this.lastBroadcast = 0;
    
    // Score tracking
    try {
      this.scoreTracker = new ScoreTracker();
      console.log('ScoreTracker initialized successfully for room:', roomId);
    } catch (error) {
      console.error('Failed to initialize ScoreTracker:', error);
      // Create a mock score tracker to prevent crashes
      this.scoreTracker = {
        registerPlayer: () => {},
        recordGame: () => {},
        getLeaderboard: () => [],
        getRoomStats: () => ({})
      };
    }
    
    // Player starting positions (with more buffer from walls)
    this.startPositions = [
      { x: 150, y: config.GAME_HEIGHT / 2, direction: 'RIGHT' },
      { x: config.GAME_WIDTH - 150, y: config.GAME_HEIGHT / 2, direction: 'LEFT' },
      { x: config.GAME_WIDTH / 2, y: 150, direction: 'DOWN' },
      { x: config.GAME_WIDTH / 2, y: config.GAME_HEIGHT - 150, direction: 'UP' }
    ];
  }

  /**
   * Add a new player to the game
   * @param {string} socketId - Socket ID of the player
   * @param {string} name - Player's display name
   * @param {string[]} playerColors - Available colors
   * @returns {boolean} - Success status
   */
  addPlayer(socketId, name, playerColors) {
    if (this.players.size >= this.config.MAX_PLAYERS) return false;
    
    // Find first available color
    let assignedColor = null;
    let positionIndex = null;
    
    for (let i = 0; i < this.availableColors.length; i++) {
      const color = this.availableColors[i];
      if (![...this.colorAssignments.values()].includes(color)) {
        assignedColor = color;
        positionIndex = i;
        break;
      }
    }
    
    if (!assignedColor) return false; // No colors available
    
    // Assign color to this socket
    this.colorAssignments.set(socketId, assignedColor);
    
    const playerName = name || `Player ${this.players.size + 1}`;
    const player = new Player(
      socketId,
      playerName,
      assignedColor,
      this.startPositions[positionIndex]
    );
    
    // Register player in score tracking system
    this.scoreTracker.registerPlayer(playerName);
    
    this.players.set(socketId, player);
    return true;
  }

  /**
   * Remove a player from the game
   * @param {string} socketId - Socket ID of the player to remove
   */
  removePlayer(socketId) {
    this.players.delete(socketId);
    // Free up the color
    this.colorAssignments.delete(socketId);
    
    // Stop countdown if not enough players
    if (this.players.size < this.config.MIN_PLAYERS && this.state === 'countdown') {
      this.stopCountdown();
    }
  }

  /**
   * Set a player's ready status
   * @param {string} socketId - Socket ID of the player
   * @param {boolean} ready - Ready status
   */
  setPlayerReady(socketId, ready) {
    const player = this.players.get(socketId);
    if (player) {
      player.ready = ready;
      this.checkStartConditions();
    }
  }

  /**
   * Check if game can start (enough ready players)
   */
  checkStartConditions() {
    const readyPlayers = Array.from(this.players.values()).filter(p => p.ready);
    if (readyPlayers.length >= this.config.MIN_PLAYERS && this.state === 'lobby') {
      this.startCountdown();
    }
  }

  /**
   * Start the pre-game countdown
   */
  startCountdown() {
    this.state = 'countdown';
    this.countdown = this.config.COUNTDOWN_DURATION;
    
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      this.io.to(this.roomId).emit('countdown', this.countdown);
      
      if (this.countdown <= 0) {
        this.stopCountdown();
        this.startGame();
      }
    }, 1000);
  }

  /**
   * Stop the countdown and return to lobby
   */
  stopCountdown() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
    this.state = 'lobby';
    this.countdown = this.config.COUNTDOWN_DURATION;
  }

  /**
   * Start the game loop
   */
  startGame() {
    this.state = 'playing';
    this.lastBroadcast = Date.now();
    
    // Initialize player trails
    this.players.forEach(player => {
      player.trail = [{ x: player.x, y: player.y }];
      player.alive = true;
    });
    
    // Start game update loop
    this.gameLoop = setInterval(() => {
      this.update();
      
      // Broadcast at reduced rate
      const now = Date.now();
      if (now - this.lastBroadcast >= this.broadcastRate) {
        this.broadcast();
        this.lastBroadcast = now;
      }
    }, this.config.TICK_RATE);
  }

  /**
   * Update game state for one tick
   */
  update() {
    const directionVectors = {
      UP: { x: 0, y: -1 },
      DOWN: { x: 0, y: 1 },
      LEFT: { x: -1, y: 0 },
      RIGHT: { x: 1, y: 0 }
    };

    // Move all alive players
    this.players.forEach(player => {
      if (!player.alive) return;
      
      player.move(this.speed, directionVectors);
      
      // Limit trail length for performance
      if (player.trail.length > this.maxTrailLength) {
        player.trail.shift(); // Remove oldest point
      }
      
      // Check for collisions (pass current speed for proper buffer calculation)
      if (this.collisionDetector.checkCollision(player, this.players, this.speed)) {
        player.alive = false;
      }
    });
    
    // Check win condition
    const alivePlayers = Array.from(this.players.values()).filter(p => p.alive);
    if (alivePlayers.length <= 1) {
      this.endGame(alivePlayers[0]);
    }
  }

  /**
   * Change a player's direction based on turn input
   * @param {string} socketId - Socket ID of the player
   * @param {string} turn - 'left' or 'right'
   */
  changeDirection(socketId, turn) {
    const player = this.players.get(socketId);
    if (!player || !player.alive || this.state !== 'playing') return;
    
    player.turn(turn);
  }

  /**
   * End the game and announce winner
   * @param {Player} winner - Winning player object
   */
  endGame(winner) {
    clearInterval(this.gameLoop);
    this.state = 'gameOver';
    
    // Record game result in score tracker
    const participants = Array.from(this.players.values()).map(p => p.name);
    const winnerName = winner ? winner.name : null;
    this.scoreTracker.recordGame(winnerName, participants);
    
    // Reset ready states when game ends
    this.players.forEach(player => {
      player.ready = false;
    });
    
    // Get updated leaderboard
    const leaderboard = this.scoreTracker.getLeaderboard();
    const roomStats = this.scoreTracker.getRoomStats();
    
    console.log('Game Over - Sending data:', {
      winner: winner ? winner.name : 'No one',
      leaderboardLength: leaderboard.length,
      roomStats: roomStats
    });
    
    this.io.to(this.roomId).emit('gameOver', {
      winner: winner ? winner.name : 'No one',
      winnerColor: winner ? winner.color : null,
      leaderboard: leaderboard,
      roomStats: roomStats
    });
  }

  /**
   * Reset game to lobby state
   */
  restart() {
    this.state = 'lobby';
    this.countdown = this.config.COUNTDOWN_DURATION;
    
    // Reset all players to their correct positions based on color
    this.players.forEach(player => {
      const colorIndex = this.availableColors.indexOf(player.color);
      if (colorIndex !== -1) {
        player.reset(this.startPositions[colorIndex]);
      }
    });
  }

  /**
   * Broadcast current game state to all players in room
   */
  broadcast() {
    // Optimize data sent - compress trail data
    const optimizedPlayers = Array.from(this.players.values()).map(p => {
      const playerData = p.toJSON();
      
      // Compress trail data for better performance
      if (playerData.trail.length > this.config.TRAIL_COMPRESSION_THRESHOLD) {
        const compressed = [];
        const step = Math.max(1, Math.floor(playerData.trail.length / this.config.TRAIL_COMPRESSION_THRESHOLD));
        
        // Always include first point
        if (playerData.trail.length > 0) {
          compressed.push(playerData.trail[0]);
        }
        
        // Sample trail points
        for (let i = step; i < playerData.trail.length - 1; i += step) {
          compressed.push(playerData.trail[i]);
        }
        
        // Always include last point for smooth head rendering
        if (playerData.trail.length > 1) {
          compressed.push(playerData.trail[playerData.trail.length - 1]);
        }
        
        playerData.trail = compressed;
      }
      
      return playerData;
    });
    
    const gameState = {
      players: optimizedPlayers,
      state: this.state,
      countdown: this.countdown,
      speed: this.speed,
      config: {
        gameWidth: this.config.GAME_WIDTH,
        gameHeight: this.config.GAME_HEIGHT,
        lineWidth: this.config.LINE_WIDTH,
        speed: this.speed
      }
    };
    this.io.to(this.roomId).emit('gameState', gameState);
  }

  /**
   * Set game speed
   * @param {number} newSpeed - New speed value
   */
  setSpeed(newSpeed) {
    this.speed = newSpeed;
  }

  /**
   * Get number of players in room
   * @returns {number} - Player count
   */
  getPlayerCount() {
    return this.players.size;
  }
}

module.exports = GameRoom;