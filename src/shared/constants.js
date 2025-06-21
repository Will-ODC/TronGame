/**
 * Shared constants between client and server
 */
const GAME_CONSTANTS = {
  // Game dimensions
  GAME_WIDTH: 800,
  GAME_HEIGHT: 800,
  LINE_WIDTH: 10,
  
  // Game settings
  DEFAULT_SPEED: 2,
  MIN_SPEED: 1,
  MAX_SPEED: 5,
  TICK_RATE: 1000 / 60,
  BROADCAST_RATE: 1000 / 30,
  COUNTDOWN_DURATION: 10,
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 4,
  
  // Performance
  // Trail limits removed to prevent trail reshaping
  // MAX_TRAIL_LENGTH: 2000,  // Deprecated
  // TRAIL_COMPRESSION_THRESHOLD: 100,  // Deprecated
  
  // Player colors
  PLAYER_COLORS: ['red', 'blue', 'green', 'purple'],
  
  // Starting positions
  START_POSITIONS: [
    { x: 150, y: 400, direction: 'RIGHT' },
    { x: 650, y: 400, direction: 'LEFT' },
    { x: 400, y: 150, direction: 'DOWN' },
    { x: 400, y: 650, direction: 'UP' }
  ],
  
  // Game states
  GAME_STATES: {
    LOBBY: 'lobby',
    COUNTDOWN: 'countdown',
    PLAYING: 'playing',
    GAME_OVER: 'gameOver'
  },
  
  // Socket events
  SOCKET_EVENTS: {
    // Client to server
    JOIN_GAME: 'joinGame',
    READY: 'ready',
    TURN: 'turn',
    RESTART: 'restart',
    SET_SPEED: 'setSpeed',
    
    // Server to client
    JOINED: 'joined',
    GAME_STATE: 'gameState',
    COUNTDOWN: 'countdown',
    GAME_OVER: 'gameOver',
    SPEED_CHANGED: 'speedChanged',
    ERROR: 'error'
  }
};

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GAME_CONSTANTS;
} else if (typeof window !== 'undefined') {
  window.GAME_CONSTANTS = GAME_CONSTANTS;
}