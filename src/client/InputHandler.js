/**
 * InputHandler manages keyboard input for the game
 */
class InputHandler {
  constructor() {
    this.callbacks = {
      onTurn: null
    };
    this.enabled = false;
    this.setupEventListeners();
  }

  /**
   * Set callback for turn events
   * @param {Function} callback - Function to call on turn
   */
  onTurn(callback) {
    this.callbacks.onTurn = callback;
  }

  /**
   * Enable or disable input handling
   * @param {boolean} enabled - Enable state
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Set up keyboard event listeners
   */
  setupEventListeners() {
    document.addEventListener('keydown', (e) => {
      if (!this.enabled || !this.callbacks.onTurn) return;
      
      switch(e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          this.callbacks.onTurn('left');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          this.callbacks.onTurn('right');
          break;
      }
    });
  }
}