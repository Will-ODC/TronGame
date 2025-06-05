/**
 * Main entry point for the Tron game client
 * Loads all required modules and initializes the game
 */

// Load modules in correct order
const scripts = [
  'src/shared/constants.js',
  'src/client/GameRenderer.js',
  'src/client/InputHandler.js',
  'src/client/UIManager.js',
  'src/client/GameClient.js'
];

let loadedCount = 0;

/**
 * Load a script dynamically
 */
function loadScript(src, callback) {
  const script = document.createElement('script');
  script.src = src;
  script.onload = callback;
  script.onerror = () => {
    console.error(`Failed to load script: ${src}`);
  };
  document.head.appendChild(script);
}

/**
 * Load all scripts in sequence
 */
function loadAllScripts() {
  function loadNext() {
    if (loadedCount < scripts.length) {
      loadScript(scripts[loadedCount], () => {
        loadedCount++;
        loadNext();
      });
    } else {
      // All scripts loaded, initialize the game
      initializeGame();
    }
  }
  
  loadNext();
}

/**
 * Initialize the game after all modules are loaded
 */
function initializeGame() {
  console.log('All modules loaded, initializing game...');
  
  // Create and start the game client
  const gameClient = new GameClient();
  gameClient.connect();
  
  // Make it globally accessible for debugging
  window.gameClient = gameClient;
}

// Start loading when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadAllScripts);
} else {
  loadAllScripts();
}