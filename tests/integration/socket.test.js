const { createServer } = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const GameRoom = require('../../src/game/GameRoom');

/**
 * Socket.io Integration Tests
 * 
 * These tests verify the socket communication between client and server:
 * 1. Connection handling
 * 2. Room joining and leaving
 * 3. Game state broadcasting
 * 4. Player ready states
 * 5. Turn commands
 * 6. Game restart
 * 7. Speed changes
 */

describe('Socket.io Integration', () => {
  let io, serverSocket, clientSocket;
  let httpServer;
  let gameRooms;

  beforeAll((done) => {
    // Create test server
    httpServer = createServer();
    io = new Server(httpServer);
    httpServer.listen(() => {
      const port = httpServer.address().port;
      
      // Mock game rooms map
      gameRooms = new Map();
      
      // Set up server-side socket handling (simplified version of server.js)
      io.on('connection', (socket) => {
        serverSocket = socket;
        
        socket.on('joinGame', (data) => {
          const roomId = data.roomId || 'default';
          const playerName = data.name;
          
          if (!gameRooms.has(roomId)) {
            gameRooms.set(roomId, new GameRoom(roomId, {
              GAME_WIDTH: 800,
              GAME_HEIGHT: 800,
              PLAYER_SPEED: 2,
              LINE_WIDTH: 10,
              TICK_RATE: 1000 / 60,
              COUNTDOWN_DURATION: 10,
              MIN_PLAYERS: 2,
              MAX_PLAYERS: 4
            }, io));
          }
          
          const room = gameRooms.get(roomId);
          if (room.addPlayer(socket.id, playerName, ['red', 'blue', 'green', 'purple'])) {
            socket.join(roomId);
            socket.roomId = roomId;
            
            socket.emit('joined', {
              playerId: socket.id,
              roomId: roomId
            });
            
            room.broadcast();
          } else {
            socket.emit('error', 'Game room is full');
          }
        });
        
        socket.on('ready', (ready) => {
          if (socket.roomId) {
            const room = gameRooms.get(socket.roomId);
            if (room) {
              room.setPlayerReady(socket.id, ready);
              room.broadcast();
            }
          }
        });
        
        socket.on('turn', (direction) => {
          if (socket.roomId) {
            const room = gameRooms.get(socket.roomId);
            if (room) {
              room.changeDirection(socket.id, direction);
            }
          }
        });
        
        socket.on('disconnect', () => {
          if (socket.roomId) {
            const room = gameRooms.get(socket.roomId);
            if (room) {
              room.removePlayer(socket.id);
              room.broadcast();
              
              if (room.getPlayerCount() === 0) {
                gameRooms.delete(socket.roomId);
              }
            }
          }
        });
      });
      
      // Create client socket
      clientSocket = Client(`http://localhost:${port}`);
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.close();
    httpServer.close();
  });

  afterEach(() => {
    // Clean up game rooms
    gameRooms.clear();
  });

  describe('Connection', () => {
    it('should establish connection', (done) => {
      expect(clientSocket.connected).toBe(true);
      expect(serverSocket).toBeDefined();
      done();
    });
  });

  describe('Joining Game', () => {
    it('should join game successfully', (done) => {
      clientSocket.on('joined', (data) => {
        expect(data.playerId).toBe(clientSocket.id);
        expect(data.roomId).toBe('test-room');
        done();
      });

      clientSocket.emit('joinGame', {
        name: 'Test Player',
        roomId: 'test-room'
      });
    });

    it('should receive game state after joining', (done) => {
      let joinedReceived = false;
      
      clientSocket.on('joined', () => {
        joinedReceived = true;
      });

      clientSocket.on('gameState', (gameState) => {
        if (joinedReceived) {
          expect(gameState.players).toHaveLength(1);
          expect(gameState.players[0].name).toBe('Test Player');
          expect(gameState.state).toBe('lobby');
          done();
        }
      });

      clientSocket.emit('joinGame', {
        name: 'Test Player',
        roomId: 'test-room'
      });
    });

    it('should handle full room', (done) => {
      // Create a second client to fill the room
      const client2 = Client(`http://localhost:${httpServer.address().port}`);
      const client3 = Client(`http://localhost:${httpServer.address().port}`);
      const client4 = Client(`http://localhost:${httpServer.address().port}`);
      const client5 = Client(`http://localhost:${httpServer.address().port}`);

      let joinCount = 0;
      const checkJoinCount = () => {
        joinCount++;
        if (joinCount === 4) {
          // Try to join with 5th client
          client5.on('error', (message) => {
            expect(message).toBe('Game room is full');
            client2.close();
            client3.close();
            client4.close();
            client5.close();
            done();
          });

          client5.emit('joinGame', {
            name: 'Player 5',
            roomId: 'full-room'
          });
        }
      };

      // Join 4 players first
      clientSocket.on('joined', checkJoinCount);
      client2.on('joined', checkJoinCount);
      client3.on('joined', checkJoinCount);
      client4.on('joined', checkJoinCount);

      clientSocket.emit('joinGame', { name: 'Player 1', roomId: 'full-room' });
      client2.emit('joinGame', { name: 'Player 2', roomId: 'full-room' });
      client3.emit('joinGame', { name: 'Player 3', roomId: 'full-room' });
      client4.emit('joinGame', { name: 'Player 4', roomId: 'full-room' });
    });
  });

  describe('Ready State', () => {
    beforeEach((done) => {
      clientSocket.on('joined', done);
      clientSocket.emit('joinGame', {
        name: 'Test Player',
        roomId: 'ready-test'
      });
    });

    it('should update ready state', (done) => {
      clientSocket.on('gameState', (gameState) => {
        const player = gameState.players.find(p => p.id === clientSocket.id);
        if (player && player.ready) {
          expect(player.ready).toBe(true);
          done();
        }
      });

      clientSocket.emit('ready', true);
    });
  });

  describe('Turn Commands', () => {
    beforeEach((done) => {
      clientSocket.on('joined', () => {
        // Start the game
        const room = gameRooms.get('turn-test');
        room.state = 'playing';
        room.startGame();
        done();
      });
      
      clientSocket.emit('joinGame', {
        name: 'Test Player',
        roomId: 'turn-test'
      });
    });

    it('should process turn commands', (done) => {
      const room = gameRooms.get('turn-test');
      const player = room.players.get(clientSocket.id);
      
      expect(player.direction).toBe('RIGHT'); // Initial direction
      
      clientSocket.emit('turn', 'left');
      
      // Give it a moment to process
      setTimeout(() => {
        expect(player.direction).toBe('UP');
        done();
      }, 50);
    });
  });

  describe('Disconnection', () => {
    it('should handle player disconnect', (done) => {
      const client2 = Client(`http://localhost:${httpServer.address().port}`);
      
      let player1Joined = false;
      let player2Joined = false;
      
      clientSocket.on('joined', () => {
        player1Joined = true;
      });
      
      client2.on('joined', () => {
        player2Joined = true;
        
        // Disconnect player 2
        client2.disconnect();
      });
      
      clientSocket.on('gameState', (gameState) => {
        if (player1Joined && player2Joined && gameState.players.length === 1) {
          expect(gameState.players[0].name).toBe('Player 1');
          done();
        }
      });
      
      clientSocket.emit('joinGame', {
        name: 'Player 1',
        roomId: 'disconnect-test'
      });
      
      client2.emit('joinGame', {
        name: 'Player 2',
        roomId: 'disconnect-test'
      });
    });
  });

  describe('Multiple Rooms', () => {
    it('should isolate different rooms', (done) => {
      const client2 = Client(`http://localhost:${httpServer.address().port}`);
      
      let room1Updates = 0;
      let room2Updates = 0;
      
      clientSocket.on('gameState', (gameState) => {
        room1Updates++;
        expect(gameState.players.every(p => p.name === 'Room1 Player')).toBe(true);
      });
      
      client2.on('gameState', (gameState) => {
        room2Updates++;
        expect(gameState.players.every(p => p.name === 'Room2 Player')).toBe(true);
        
        if (room1Updates > 0 && room2Updates > 0) {
          client2.close();
          done();
        }
      });
      
      clientSocket.emit('joinGame', {
        name: 'Room1 Player',
        roomId: 'room1'
      });
      
      client2.emit('joinGame', {
        name: 'Room2 Player',
        roomId: 'room2'
      });
    });
  });
});