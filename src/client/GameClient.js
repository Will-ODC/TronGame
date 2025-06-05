/**
 * Main game client class - handles game logic and coordination
 */
class GameClient {
  constructor() {
    this.socket = null;
    this.playerId = null;
    this.roomId = null;
    this.gameState = null;
    this.config = null;
    this.animationId = null;
    this.isRendering = false;
    
    // Initialize components
    this.ui = new UIManager();
    this.renderer = new GameRenderer(this.ui.getCanvas());
    this.input = new InputHandler();
    
    this.setupEventHandlers();
  }

  /**
   * Set up event handlers
   */
  setupEventHandlers() {
    // UI event callbacks
    this.ui.on('onJoinGame', (data) => {
      if (this.socket) {
        this.socket.emit(GAME_CONSTANTS.SOCKET_EVENTS.JOIN_GAME, data);
      }
    });
    
    this.ui.on('onReady', (ready) => {
      if (this.socket) {
        this.socket.emit(GAME_CONSTANTS.SOCKET_EVENTS.READY, ready);
      }
    });
    
    this.ui.on('onSpeedChange', (speed) => {
      if (this.socket) {
        this.socket.emit(GAME_CONSTANTS.SOCKET_EVENTS.SET_SPEED, speed);
      }
    });
    
    this.ui.on('onContinue', () => {
      if (this.socket) {
        this.socket.emit(GAME_CONSTANTS.SOCKET_EVENTS.RESTART);
        this.ui.showScreen('lobby');
        // Reset ready button state
        this.ui.elements.readyButton.classList.remove('ready');
        this.ui.elements.readyButton.textContent = 'Ready';
      }
    });
    
    this.ui.on('onQuit', () => {
      location.reload();
    });
    
    // Input handler callbacks
    this.input.onTurn((direction) => {
      if (this.socket && this.gameState && this.gameState.state === GAME_CONSTANTS.GAME_STATES.PLAYING) {
        this.socket.emit(GAME_CONSTANTS.SOCKET_EVENTS.TURN, direction);
      }
    });
  }

  /**
   * Connect to game server
   */
  connect() {
    this.socket = io();
    
    // Handle successful join
    this.socket.on(GAME_CONSTANTS.SOCKET_EVENTS.JOINED, (data) => {
      this.playerId = data.playerId;
      this.roomId = data.roomId;
      this.config = data.config;
      
      // Initialize renderer with config
      if (this.config) {
        this.renderer.init({
          gameWidth: this.config.GAME_WIDTH,
          gameHeight: this.config.GAME_HEIGHT,
          lineWidth: this.config.LINE_WIDTH
        });
      }
      
      this.ui.showRoomInfo(this.roomId);
    });
    
    // Handle game state updates
    this.socket.on(GAME_CONSTANTS.SOCKET_EVENTS.GAME_STATE, (gameState) => {
      this.gameState = gameState;
      this.handleGameStateUpdate();
    });
    
    // Handle countdown updates
    this.socket.on(GAME_CONSTANTS.SOCKET_EVENTS.COUNTDOWN, (countdown) => {
      if (this.gameState) {
        this.gameState.countdown = countdown;
        this.ui.updateLobby(this.gameState, this.playerId);
      }
    });
    
    // Handle game over
    this.socket.on(GAME_CONSTANTS.SOCKET_EVENTS.GAME_OVER, (data) => {
      this.input.setEnabled(false);
      this.ui.showGameOver(data.winner, data.winnerColor, data.leaderboard, data.roomStats);
    });
    
    // Handle speed changes
    this.socket.on(GAME_CONSTANTS.SOCKET_EVENTS.SPEED_CHANGED, (speed) => {
      console.log('Game speed changed to:', speed);
      // Update the UI slider to reflect the new speed
      this.ui.elements.speedSlider.value = speed;
      this.ui.elements.speedValue.textContent = speed;
    });
    
    // Handle errors
    this.socket.on(GAME_CONSTANTS.SOCKET_EVENTS.ERROR, (message) => {
      alert('Error: ' + message);
    });
    
    // Handle disconnection
    this.socket.on('disconnect', () => {
      alert('Disconnected from server');
      location.reload();
    });
  }

  /**
   * Handle game state updates
   */
  handleGameStateUpdate() {
    if (!this.gameState) return;
    
    switch (this.gameState.state) {
      case GAME_CONSTANTS.GAME_STATES.LOBBY:
      case GAME_CONSTANTS.GAME_STATES.COUNTDOWN:
        this.ui.showScreen('lobby');
        this.ui.updateLobby(this.gameState, this.playerId);
        this.input.setEnabled(false);
        break;
        
      case GAME_CONSTANTS.GAME_STATES.PLAYING:
        this.ui.showScreen('game');
        this.input.setEnabled(true);
        if (!this.isRendering) {
          this.startRenderLoop();
        }
        break;
        
      case GAME_CONSTANTS.GAME_STATES.GAME_OVER:
        this.input.setEnabled(false);
        this.stopRenderLoop();
        break;
    }
  }

  /**
   * Start continuous rendering for smooth gameplay
   */
  startRenderLoop() {
    this.isRendering = true;
    
    const render = () => {
      if (this.gameState && this.gameState.state === GAME_CONSTANTS.GAME_STATES.PLAYING) {
        this.renderer.render(this.gameState);
        this.animationId = requestAnimationFrame(render);
      } else {
        this.stopRenderLoop();
      }
    };
    
    render();
  }

  /**
   * Stop the render loop
   */
  stopRenderLoop() {
    this.isRendering = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}