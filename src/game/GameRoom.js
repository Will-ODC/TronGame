const Player = require('./Player');
const CollisionDetector = require('./CollisionDetector');

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
    
    const playerNumber = this.players.size;
    const player = new Player(
      socketId,
      name || `Player ${playerNumber + 1}`,
      playerColors[playerNumber],
      this.startPositions[playerNumber]
    );
    
    this.players.set(socketId, player);
    return true;
  }

  /**
   * Remove a player from the game
   * @param {string} socketId - Socket ID of the player to remove
   */
  removePlayer(socketId) {
    this.players.delete(socketId);
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
    
    // Initialize player trails
    this.players.forEach(player => {
      player.trail = [{ x: player.x, y: player.y }];
      player.alive = true;
    });
    
    // Start game update loop
    this.gameLoop = setInterval(() => {
      this.update();
      this.broadcast();
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
    
    // Reset ready states when game ends
    this.players.forEach(player => {
      player.ready = false;
    });
    
    this.io.to(this.roomId).emit('gameOver', {
      winner: winner ? winner.name : 'No one',
      winnerColor: winner ? winner.color : null
    });
  }

  /**
   * Reset game to lobby state
   */
  restart() {
    this.state = 'lobby';
    this.countdown = this.config.COUNTDOWN_DURATION;
    
    // Reset all players
    let playerIndex = 0;
    this.players.forEach(player => {
      player.reset(this.startPositions[playerIndex]);
      playerIndex++;
    });
  }

  /**
   * Broadcast current game state to all players in room
   */
  broadcast() {
    const gameState = {
      players: Array.from(this.players.values()).map(p => p.toJSON()),
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