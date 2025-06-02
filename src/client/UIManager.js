/**
 * UIManager handles all UI state and interactions
 */
class UIManager {
  constructor() {
    this.screens = {
      lobby: document.getElementById('lobby'),
      game: document.getElementById('game'),
      gameOver: document.getElementById('gameOver')
    };
    
    this.elements = {
      // Lobby elements
      playerName: document.getElementById('playerName'),
      roomId: document.getElementById('roomId'),
      joinButton: document.getElementById('joinButton'),
      lobbyInfo: document.getElementById('lobbyInfo'),
      currentRoom: document.getElementById('currentRoom'),
      playersList: document.getElementById('playersList'),
      speedSlider: document.getElementById('speedSlider'),
      speedValue: document.getElementById('speedValue'),
      readyButton: document.getElementById('readyButton'),
      countdownDisplay: document.getElementById('countdownDisplay'),
      
      // Game elements
      gameCanvas: document.getElementById('gameCanvas'),
      gameInfo: document.getElementById('gameInfo'),
      
      // Game over elements
      winnerText: document.getElementById('winnerText'),
      continueButton: document.getElementById('continueButton'),
      quitButton: document.getElementById('quitButton')
    };
    
    this.callbacks = {};
    this.setupEventListeners();
  }

  /**
   * Set up UI event listeners
   */
  setupEventListeners() {
    // Join game
    this.elements.joinButton.addEventListener('click', () => {
      const name = this.elements.playerName.value.trim() || 'Anonymous';
      const roomId = this.elements.roomId.value.trim() || 'default';
      if (this.callbacks.onJoinGame) {
        this.callbacks.onJoinGame({ name, roomId });
      }
    });
    
    // Enter key to join
    [this.elements.playerName, this.elements.roomId].forEach(input => {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.elements.joinButton.click();
        }
      });
    });
    
    // Ready button
    this.elements.readyButton.addEventListener('click', () => {
      const isReady = this.elements.readyButton.classList.toggle('ready');
      this.elements.readyButton.textContent = isReady ? 'Not Ready' : 'Ready';
      if (this.callbacks.onReady) {
        this.callbacks.onReady(isReady);
      }
    });
    
    // Speed slider
    this.elements.speedSlider.addEventListener('input', (e) => {
      const speed = parseInt(e.target.value);
      this.elements.speedValue.textContent = speed;
      if (this.callbacks.onSpeedChange) {
        this.callbacks.onSpeedChange(speed);
      }
    });
    
    // Game over buttons
    this.elements.continueButton.addEventListener('click', () => {
      if (this.callbacks.onContinue) {
        this.callbacks.onContinue();
      }
    });
    
    this.elements.quitButton.addEventListener('click', () => {
      if (this.callbacks.onQuit) {
        this.callbacks.onQuit();
      }
    });
  }

  /**
   * Register callback functions
   */
  on(event, callback) {
    this.callbacks[event] = callback;
  }

  /**
   * Show a specific screen
   * @param {string} screenName - Name of screen to show
   */
  showScreen(screenName) {
    Object.values(this.screens).forEach(screen => {
      screen.classList.remove('active');
    });
    
    if (this.screens[screenName]) {
      this.screens[screenName].classList.add('active');
    }
  }

  /**
   * Update lobby display
   * @param {Object} gameState - Current game state
   * @param {string} currentPlayerId - Current player's ID
   */
  updateLobby(gameState, currentPlayerId) {
    // Show lobby info after joining
    this.elements.lobbyInfo.classList.remove('hidden');
    
    // Update speed slider if speed is provided
    if (gameState.speed !== undefined) {
      this.elements.speedSlider.value = gameState.speed;
      this.elements.speedValue.textContent = gameState.speed;
    }
    
    // Find current player
    const currentPlayer = gameState.players.find(p => p.id === currentPlayerId);
    
    // Update ready button state based on current player's ready status
    if (currentPlayer) {
      if (currentPlayer.ready) {
        this.elements.readyButton.classList.add('ready');
        this.elements.readyButton.textContent = 'Not Ready';
      } else {
        this.elements.readyButton.classList.remove('ready');
        this.elements.readyButton.textContent = 'Ready';
      }
    }
    
    // Update players list
    this.elements.playersList.innerHTML = gameState.players
      .map(player => {
        const isMe = player.id === currentPlayerId;
        const readyStatus = player.ready ? '✓' : '○';
        return `
          <li class="player-item" style="color: ${player.color}">
            ${readyStatus} ${player.name} ${isMe ? '(You)' : ''}
          </li>
        `;
      })
      .join('');
    
    // Update countdown if active
    if (gameState.state === 'countdown') {
      this.elements.countdownDisplay.classList.remove('hidden');
      this.elements.countdownDisplay.textContent = `Game starts in: ${gameState.countdown}`;
      this.elements.readyButton.disabled = true;
    } else {
      this.elements.countdownDisplay.classList.add('hidden');
      this.elements.readyButton.disabled = false;
    }
  }

  /**
   * Show room info
   * @param {string} roomId - Room ID
   */
  showRoomInfo(roomId) {
    this.elements.currentRoom.textContent = roomId;
    this.elements.joinButton.disabled = true;
    this.elements.playerName.disabled = true;
    this.elements.roomId.disabled = true;
  }

  /**
   * Show game over screen
   * @param {string} winner - Winner name
   * @param {string} winnerColor - Winner color
   */
  showGameOver(winner, winnerColor) {
    this.showScreen('gameOver');
    this.elements.winnerText.innerHTML = `
      <span style="color: ${winnerColor || '#fff'}">${winner}</span> wins!
    `;
  }

  /**
   * Reset to initial state
   */
  reset() {
    this.showScreen('lobby');
    this.elements.joinButton.disabled = false;
    this.elements.playerName.disabled = false;
    this.elements.roomId.disabled = false;
    this.elements.lobbyInfo.classList.add('hidden');
    this.elements.readyButton.classList.remove('ready');
    this.elements.readyButton.textContent = 'Ready';
    this.elements.playersList.innerHTML = '';
  }

  /**
   * Get canvas element
   * @returns {HTMLCanvasElement} - Game canvas
   */
  getCanvas() {
    return this.elements.gameCanvas;
  }
}