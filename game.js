// Load client modules
document.write('<script src="src/client/GameRenderer.js"></script>');
document.write('<script src="src/client/InputHandler.js"></script>');
document.write('<script src="src/client/UIManager.js"></script>');

/**
 * Main game client class
 */
class TronGame {
  constructor() {
    this.socket = null;
    this.playerId = null;
    this.roomId = null;
    this.gameState = null;
    this.config = null;
    
    // Wait for modules to load
    window.addEventListener('load', () => {
      this.init();
    });
  }

  /**
   * Initialize game components
   */
  init() {
    // Initialize components
    this.ui = new UIManager();
    this.renderer = new GameRenderer(this.ui.getCanvas());
    this.input = new InputHandler();
    
    // Set up UI callbacks
    this.setupUICallbacks();
    
    // Set up input callbacks
    this.input.onTurn((direction) => {
      if (this.socket && this.gameState && this.gameState.state === 'playing') {
        this.socket.emit('turn', direction);
      }
    });
    
    // Connect to server
    this.connect();
  }

  /**
   * Set up UI event callbacks
   */
  setupUICallbacks() {
    this.ui.on('onJoinGame', (data) => {
      if (this.socket) {
        this.socket.emit('joinGame', data);
      }
    });
    
    this.ui.on('onReady', (ready) => {
      if (this.socket) {
        this.socket.emit('ready', ready);
      }
    });
    
    this.ui.on('onSpeedChange', (speed) => {
      if (this.socket) {
        this.socket.emit('setSpeed', speed);
      }
    });
    
    this.ui.on('onContinue', () => {
      if (this.socket) {
        this.socket.emit('restart');
        this.ui.showScreen('lobby');
        // Reset ready button state
        this.ui.elements.readyButton.classList.remove('ready');
        this.ui.elements.readyButton.textContent = 'Ready';
      }
    });
    
    this.ui.on('onQuit', () => {
      location.reload();
    });
  }

  /**
   * Connect to game server
   */
  connect() {
    this.socket = io();
    
    // Handle successful join
    this.socket.on('joined', (data) => {
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
    this.socket.on('gameState', (gameState) => {
      this.gameState = gameState;
      this.handleGameStateUpdate();
    });
    
    // Handle countdown updates
    this.socket.on('countdown', (countdown) => {
      if (this.gameState) {
        this.gameState.countdown = countdown;
        this.ui.updateLobby(this.gameState, this.playerId);
      }
    });
    
    // Handle game over
    this.socket.on('gameOver', (data) => {
      this.input.setEnabled(false);
      this.ui.showGameOver(data.winner, data.winnerColor);
    });
    
    // Handle speed changes
    this.socket.on('speedChanged', (speed) => {
      console.log('Game speed changed to:', speed);
      // Update the UI slider to reflect the new speed
      this.ui.elements.speedSlider.value = speed;
      this.ui.elements.speedValue.textContent = speed;
    });
    
    // Handle errors
    this.socket.on('error', (message) => {
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
      case 'lobby':
      case 'countdown':
        this.ui.showScreen('lobby');
        this.ui.updateLobby(this.gameState, this.playerId);
        this.input.setEnabled(false);
        break;
        
      case 'playing':
        this.ui.showScreen('game');
        this.input.setEnabled(true);
        this.renderer.render(this.gameState);
        break;
        
      case 'gameOver':
        this.input.setEnabled(false);
        break;
    }
  }
}

// Start the game
const game = new TronGame();