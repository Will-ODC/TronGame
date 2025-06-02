const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const GameRoom = require('./src/game/GameRoom');

// Server setup
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Serve static files
app.use(express.static(__dirname));

// Game configuration
const CONFIG = {
  GAME_WIDTH: 800,
  GAME_HEIGHT: 800,
  PLAYER_SPEED: 2,
  LINE_WIDTH: 10,
  TICK_RATE: 1000 / 60,
  COUNTDOWN_DURATION: 10,
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 4
};

// Player colors for up to 4 players
const PLAYER_COLORS = ['red', 'blue', 'green', 'purple'];

// Store all active game rooms
const gameRooms = new Map();

/**
 * Get or create a game room
 * @param {string} roomId - Room identifier
 * @returns {GameRoom} - Game room instance
 */
function getOrCreateRoom(roomId) {
  if (!gameRooms.has(roomId)) {
    gameRooms.set(roomId, new GameRoom(roomId, CONFIG, io));
  }
  return gameRooms.get(roomId);
}

/**
 * Clean up empty game rooms
 * @param {string} roomId - Room to check
 */
function cleanupRoom(roomId) {
  const room = gameRooms.get(roomId);
  if (room && room.getPlayerCount() === 0) {
    gameRooms.delete(roomId);
  }
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New player connected:', socket.id);
  
  /**
   * Handle player joining a game room
   */
  socket.on('joinGame', (data) => {
    const roomId = data.roomId || 'default';
    const playerName = data.name;
    
    const room = getOrCreateRoom(roomId);
    
    if (room.addPlayer(socket.id, playerName, PLAYER_COLORS)) {
      socket.join(roomId);
      socket.roomId = roomId;
      
      socket.emit('joined', {
        playerId: socket.id,
        roomId: roomId,
        config: CONFIG
      });
      
      room.broadcast();
    } else {
      socket.emit('error', 'Game room is full');
    }
  });
  
  /**
   * Handle player ready state
   */
  socket.on('ready', (ready) => {
    if (socket.roomId) {
      const room = gameRooms.get(socket.roomId);
      if (room) {
        room.setPlayerReady(socket.id, ready);
        room.broadcast();
      }
    }
  });
  
  /**
   * Handle player turn input
   */
  socket.on('turn', (direction) => {
    if (socket.roomId) {
      const room = gameRooms.get(socket.roomId);
      if (room) {
        room.changeDirection(socket.id, direction);
      }
    }
  });
  
  /**
   * Handle game restart request
   */
  socket.on('restart', () => {
    if (socket.roomId) {
      const room = gameRooms.get(socket.roomId);
      if (room && room.state === 'gameOver') {
        room.restart();
        room.broadcast();
      }
    }
  });
  
  /**
   * Handle speed change request
   */
  socket.on('setSpeed', (speed) => {
    if (socket.roomId) {
      const room = gameRooms.get(socket.roomId);
      if (room && room.state === 'lobby') {
        room.setSpeed(speed);
        io.to(socket.roomId).emit('speedChanged', speed);
      }
    }
  });
  
  /**
   * Handle player disconnect
   */
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    if (socket.roomId) {
      const room = gameRooms.get(socket.roomId);
      if (room) {
        room.removePlayer(socket.id);
        room.broadcast();
        cleanupRoom(socket.roomId);
      }
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Tron Game Server running on port ${PORT}`);
  console.log(`Local access: http://localhost:${PORT}`);
  console.log(`Network access: http://[YOUR-WINDOWS-IP]:${PORT}`);
});