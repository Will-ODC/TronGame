const UIManager = require('../../src/client/UIManager');

/**
 * UIManager Class Unit Tests
 * 
 * These tests verify UI management functionality:
 * 1. DOM element references
 * 2. Screen switching
 * 3. Event listener setup
 * 4. Lobby updates
 * 5. Game over display
 * 6. UI state reset
 */

describe('UIManager Class', () => {
  let uiManager;
  let mockElements;

  beforeEach(() => {
    // Create mock DOM structure
    document.body.innerHTML = `
      <div id="lobby" class="screen active"></div>
      <div id="game" class="screen"></div>
      <div id="gameOver" class="screen"></div>
      
      <input id="playerName" />
      <input id="roomId" />
      <button id="joinButton">Join</button>
      <div id="lobbyInfo" class="hidden"></div>
      <span id="currentRoom"></span>
      <ul id="playersList"></ul>
      <input id="speedSlider" type="range" min="1" max="5" value="2" />
      <span id="speedValue">2</span>
      <button id="readyButton">Ready</button>
      <div id="countdownDisplay" class="hidden"></div>
      
      <canvas id="gameCanvas"></canvas>
      <div id="gameInfo"></div>
      
      <h2 id="winnerText"></h2>
      <button id="continueButton">Continue</button>
      <button id="quitButton">Quit</button>
    `;

    uiManager = new UIManager();
  });

  describe('Initialization', () => {
    it('should initialize with correct screen references', () => {
      expect(uiManager.screens.lobby).toBeTruthy();
      expect(uiManager.screens.game).toBeTruthy();
      expect(uiManager.screens.gameOver).toBeTruthy();
    });

    it('should initialize with correct element references', () => {
      expect(uiManager.elements.playerName).toBeTruthy();
      expect(uiManager.elements.roomId).toBeTruthy();
      expect(uiManager.elements.joinButton).toBeTruthy();
      expect(uiManager.elements.gameCanvas).toBeTruthy();
    });
  });

  describe('Screen Management', () => {
    it('should show lobby screen', () => {
      uiManager.showScreen('lobby');
      
      expect(uiManager.screens.lobby.classList.contains('active')).toBe(true);
      expect(uiManager.screens.game.classList.contains('active')).toBe(false);
      expect(uiManager.screens.gameOver.classList.contains('active')).toBe(false);
    });

    it('should show game screen', () => {
      uiManager.showScreen('game');
      
      expect(uiManager.screens.lobby.classList.contains('active')).toBe(false);
      expect(uiManager.screens.game.classList.contains('active')).toBe(true);
      expect(uiManager.screens.gameOver.classList.contains('active')).toBe(false);
    });

    it('should handle invalid screen names', () => {
      uiManager.showScreen('invalidScreen');
      
      // Should remove active from all screens
      expect(uiManager.screens.lobby.classList.contains('active')).toBe(false);
      expect(uiManager.screens.game.classList.contains('active')).toBe(false);
      expect(uiManager.screens.gameOver.classList.contains('active')).toBe(false);
    });
  });

  describe('Event Callbacks', () => {
    it('should register callbacks', () => {
      const mockCallback = jest.fn();
      uiManager.on('onJoinGame', mockCallback);
      
      expect(uiManager.callbacks.onJoinGame).toBe(mockCallback);
    });

    it('should trigger join game callback on button click', () => {
      const mockCallback = jest.fn();
      uiManager.on('onJoinGame', mockCallback);
      
      uiManager.elements.playerName.value = 'TestPlayer';
      uiManager.elements.roomId.value = 'room123';
      
      uiManager.elements.joinButton.click();
      
      expect(mockCallback).toHaveBeenCalledWith({
        name: 'TestPlayer',
        roomId: 'room123'
      });
    });

    it('should use default values for empty inputs', () => {
      const mockCallback = jest.fn();
      uiManager.on('onJoinGame', mockCallback);
      
      uiManager.elements.playerName.value = '';
      uiManager.elements.roomId.value = '';
      
      uiManager.elements.joinButton.click();
      
      expect(mockCallback).toHaveBeenCalledWith({
        name: 'Anonymous',
        roomId: 'default'
      });
    });

    it('should trigger join on Enter key', () => {
      const mockCallback = jest.fn();
      uiManager.on('onJoinGame', mockCallback);
      
      const enterEvent = new KeyboardEvent('keypress', { key: 'Enter' });
      uiManager.elements.playerName.dispatchEvent(enterEvent);
      
      expect(mockCallback).toHaveBeenCalled();
    });

    it('should toggle ready state', () => {
      const mockCallback = jest.fn();
      uiManager.on('onReady', mockCallback);
      
      // First click - become ready
      uiManager.elements.readyButton.click();
      expect(mockCallback).toHaveBeenCalledWith(true);
      expect(uiManager.elements.readyButton.textContent).toBe('Not Ready');
      expect(uiManager.elements.readyButton.classList.contains('ready')).toBe(true);
      
      // Second click - not ready
      uiManager.elements.readyButton.click();
      expect(mockCallback).toHaveBeenCalledWith(false);
      expect(uiManager.elements.readyButton.textContent).toBe('Ready');
      expect(uiManager.elements.readyButton.classList.contains('ready')).toBe(false);
    });

    it('should handle speed slider changes', () => {
      const mockCallback = jest.fn();
      uiManager.on('onSpeedChange', mockCallback);
      
      uiManager.elements.speedSlider.value = '3.5';
      const event = new Event('input');
      uiManager.elements.speedSlider.dispatchEvent(event);
      
      expect(mockCallback).toHaveBeenCalledWith(3.5);
      expect(uiManager.elements.speedValue.textContent).toBe('3.5');
    });

    it('should handle continue button', () => {
      const mockCallback = jest.fn();
      uiManager.on('onContinue', mockCallback);
      
      uiManager.elements.continueButton.click();
      expect(mockCallback).toHaveBeenCalled();
    });

    it('should handle quit button', () => {
      const mockCallback = jest.fn();
      uiManager.on('onQuit', mockCallback);
      
      uiManager.elements.quitButton.click();
      expect(mockCallback).toHaveBeenCalled();
    });
  });

  describe('Lobby Updates', () => {
    const mockGameState = {
      players: [
        { id: 'p1', name: 'Player 1', color: 'red', ready: true },
        { id: 'p2', name: 'Player 2', color: 'blue', ready: false }
      ],
      state: 'lobby',
      countdown: 10
    };

    it('should update players list', () => {
      uiManager.updateLobby(mockGameState, 'p1');
      
      const playersList = uiManager.elements.playersList.innerHTML;
      expect(playersList).toContain('Player 1');
      expect(playersList).toContain('Player 2');
      expect(playersList).toContain('(You)');
      expect(playersList).toContain('color: red');
      expect(playersList).toContain('color: blue');
      expect(playersList).toContain('✓'); // Ready marker
      expect(playersList).toContain('○'); // Not ready marker
    });

    it('should show lobby info', () => {
      uiManager.updateLobby(mockGameState, 'p1');
      
      expect(uiManager.elements.lobbyInfo.classList.contains('hidden')).toBe(false);
    });

    it('should show countdown when active', () => {
      const countdownState = { ...mockGameState, state: 'countdown', countdown: 5 };
      uiManager.updateLobby(countdownState, 'p1');
      
      expect(uiManager.elements.countdownDisplay.classList.contains('hidden')).toBe(false);
      expect(uiManager.elements.countdownDisplay.textContent).toBe('Game starts in: 5');
      expect(uiManager.elements.readyButton.disabled).toBe(true);
    });

    it('should hide countdown when not active', () => {
      uiManager.updateLobby(mockGameState, 'p1');
      
      expect(uiManager.elements.countdownDisplay.classList.contains('hidden')).toBe(true);
      expect(uiManager.elements.readyButton.disabled).toBe(false);
    });
  });

  describe('Room Info', () => {
    it('should display room info and disable inputs', () => {
      uiManager.showRoomInfo('room123');
      
      expect(uiManager.elements.currentRoom.textContent).toBe('room123');
      expect(uiManager.elements.joinButton.disabled).toBe(true);
      expect(uiManager.elements.playerName.disabled).toBe(true);
      expect(uiManager.elements.roomId.disabled).toBe(true);
    });
  });

  describe('Game Over', () => {
    it('should show game over screen with winner', () => {
      uiManager.showGameOver('Player 1', 'red');
      
      expect(uiManager.screens.gameOver.classList.contains('active')).toBe(true);
      expect(uiManager.elements.winnerText.innerHTML).toContain('Player 1');
      expect(uiManager.elements.winnerText.innerHTML).toContain('color: red');
      expect(uiManager.elements.winnerText.innerHTML).toContain('wins!');
    });

    it('should handle no winner color', () => {
      uiManager.showGameOver('No one', null);
      
      expect(uiManager.elements.winnerText.innerHTML).toContain('No one');
      expect(uiManager.elements.winnerText.innerHTML).toContain('color: #fff');
    });
  });

  describe('Reset', () => {
    it('should reset UI to initial state', () => {
      // First, modify the UI state
      uiManager.showScreen('game');
      uiManager.elements.joinButton.disabled = true;
      uiManager.elements.playerName.disabled = true;
      uiManager.elements.roomId.disabled = true;
      uiManager.elements.lobbyInfo.classList.remove('hidden');
      uiManager.elements.readyButton.classList.add('ready');
      uiManager.elements.readyButton.textContent = 'Not Ready';
      uiManager.elements.playersList.innerHTML = '<li>Test</li>';
      
      // Reset
      uiManager.reset();
      
      // Verify reset
      expect(uiManager.screens.lobby.classList.contains('active')).toBe(true);
      expect(uiManager.elements.joinButton.disabled).toBe(false);
      expect(uiManager.elements.playerName.disabled).toBe(false);
      expect(uiManager.elements.roomId.disabled).toBe(false);
      expect(uiManager.elements.lobbyInfo.classList.contains('hidden')).toBe(true);
      expect(uiManager.elements.readyButton.classList.contains('ready')).toBe(false);
      expect(uiManager.elements.readyButton.textContent).toBe('Ready');
      expect(uiManager.elements.playersList.innerHTML).toBe('');
    });
  });

  describe('Canvas Access', () => {
    it('should return canvas element', () => {
      const canvas = uiManager.getCanvas();
      expect(canvas).toBe(uiManager.elements.gameCanvas);
      expect(canvas.id).toBe('gameCanvas');
    });
  });
});