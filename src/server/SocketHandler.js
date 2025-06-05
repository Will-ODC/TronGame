const GameRoom = require('../game/GameRoom');
const GAME_CONSTANTS = require('../shared/constants');

/**
 * Handles all socket.io connections and events
 */
class SocketHandler {
  constructor(io) {
    this.io = io;
    this.gameRooms = new Map();
    this.setupSocketEvents();
  }

  /**
   * Get or create a game room
   * @param {string} roomId - Room identifier
   * @returns {GameRoom} - Game room instance
   */
  getOrCreateRoom(roomId) {
    if (!this.gameRooms.has(roomId)) {
      this.gameRooms.set(roomId, new GameRoom(roomId, GAME_CONSTANTS, this.io));
    }
    return this.gameRooms.get(roomId);
  }

  /**
   * Clean up empty game rooms
   * @param {string} roomId - Room to check
   */
  cleanupRoom(roomId) {
    const room = this.gameRooms.get(roomId);
    if (room && room.getPlayerCount() === 0) {
      this.gameRooms.delete(roomId);
    }
  }

  /**
   * Set up socket event handlers
   */
  setupSocketEvents() {
    this.io.on('connection', (socket) => {
      console.log('New player connected:', socket.id);
      
      // Handle player joining a game room
      socket.on(GAME_CONSTANTS.SOCKET_EVENTS.JOIN_GAME, (data) => {
        this.handleJoinGame(socket, data);
      });
      
      // Handle player ready state
      socket.on(GAME_CONSTANTS.SOCKET_EVENTS.READY, (ready) => {
        this.handleReady(socket, ready);
      });
      
      // Handle player turn input
      socket.on(GAME_CONSTANTS.SOCKET_EVENTS.TURN, (direction) => {
        this.handleTurn(socket, direction);
      });
      
      // Handle game restart request
      socket.on(GAME_CONSTANTS.SOCKET_EVENTS.RESTART, () => {
        this.handleRestart(socket);
      });
      
      // Handle speed change request
      socket.on(GAME_CONSTANTS.SOCKET_EVENTS.SET_SPEED, (speed) => {
        this.handleSetSpeed(socket, speed);
      });
      
      // Handle player disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  /**
   * Handle player joining a game
   */
  handleJoinGame(socket, data) {
    const roomId = data.roomId || 'default';
    const playerName = data.name;
    
    const room = this.getOrCreateRoom(roomId);
    
    if (room.addPlayer(socket.id, playerName, GAME_CONSTANTS.PLAYER_COLORS)) {
      socket.join(roomId);
      socket.roomId = roomId;
      
      socket.emit(GAME_CONSTANTS.SOCKET_EVENTS.JOINED, {
        playerId: socket.id,
        roomId: roomId,
        config: GAME_CONSTANTS
      });
      
      room.broadcast();
    } else {
      socket.emit(GAME_CONSTANTS.SOCKET_EVENTS.ERROR, 'Game room is full');
    }
  }

  /**
   * Handle player ready state change
   */
  handleReady(socket, ready) {
    if (socket.roomId) {
      const room = this.gameRooms.get(socket.roomId);
      if (room) {
        room.setPlayerReady(socket.id, ready);
        room.broadcast();
      }
    }
  }

  /**
   * Handle player turn
   */
  handleTurn(socket, direction) {
    if (socket.roomId) {
      const room = this.gameRooms.get(socket.roomId);
      if (room) {
        room.changeDirection(socket.id, direction);
      }
    }
  }

  /**
   * Handle game restart
   */
  handleRestart(socket) {
    if (socket.roomId) {
      const room = this.gameRooms.get(socket.roomId);
      if (room && room.state === GAME_CONSTANTS.GAME_STATES.GAME_OVER) {
        room.restart();
        room.broadcast();
      }
    }
  }

  /**
   * Handle speed change
   */
  handleSetSpeed(socket, speed) {
    if (socket.roomId) {
      const room = this.gameRooms.get(socket.roomId);
      if (room && room.state === GAME_CONSTANTS.GAME_STATES.LOBBY) {
        room.setSpeed(speed);
        this.io.to(socket.roomId).emit(GAME_CONSTANTS.SOCKET_EVENTS.SPEED_CHANGED, speed);
      }
    }
  }

  /**
   * Handle player disconnect
   */
  handleDisconnect(socket) {
    console.log('Player disconnected:', socket.id);
    if (socket.roomId) {
      const room = this.gameRooms.get(socket.roomId);
      if (room) {
        room.removePlayer(socket.id);
        room.broadcast();
        this.cleanupRoom(socket.roomId);
      }
    }
  }
}

module.exports = SocketHandler;