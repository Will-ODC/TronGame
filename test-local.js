/**
 * Local testing helper script
 * This script helps launch multiple browser windows for testing multiplayer
 */

const { exec } = require('child_process');
const os = require('os');

const PORT = process.env.PORT || 3000;
const URL = `http://localhost:${PORT}`;

// Detect platform
const platform = os.platform();

// Browser commands by platform
const browserCommands = {
  win32: {
    chrome: `start chrome "${URL}"`,
    firefox: `start firefox "${URL}"`,
    edge: `start msedge "${URL}"`
  },
  darwin: {
    chrome: `open -a "Google Chrome" "${URL}"`,
    firefox: `open -a "Firefox" "${URL}"`,
    safari: `open -a "Safari" "${URL}"`
  },
  linux: {
    chrome: `google-chrome "${URL}"`,
    firefox: `firefox "${URL}"`,
    chromium: `chromium-browser "${URL}"`
  }
};

// Function to open browser
function openBrowser(browser = 'chrome', count = 1) {
  const commands = browserCommands[platform];
  if (!commands) {
    console.error('Unsupported platform:', platform);
    return;
  }

  const command = commands[browser];
  if (!command) {
    console.error(`Browser '${browser}' not configured for platform '${platform}'`);
    console.log('Available browsers:', Object.keys(commands).join(', '));
    return;
  }

  console.log(`Opening ${count} ${browser} window(s) at ${URL}`);
  
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      exec(command, (error) => {
        if (error) {
          console.error(`Failed to open ${browser}:`, error.message);
        }
      });
    }, i * 500); // Stagger window openings
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const browser = args[0] || 'chrome';
const count = parseInt(args[1]) || 2;

// Instructions
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Tron Game Local Testing Helper

Usage: node test-local.js [browser] [count]

Arguments:
  browser  - Browser to open (default: chrome)
           Options: chrome, firefox, edge (Windows)
                   chrome, firefox, safari (macOS)
                   chrome, firefox, chromium (Linux)
  count    - Number of windows to open (default: 2)

Examples:
  node test-local.js                    # Opens 2 Chrome windows
  node test-local.js firefox 4          # Opens 4 Firefox windows
  node test-local.js edge 3             # Opens 3 Edge windows

Make sure the game server is running first:
  npm start
`);
  process.exit(0);
}

// Check if server is likely running
const http = require('http');
http.get(URL, (res) => {
  console.log(`Server is running at ${URL}`);
  openBrowser(browser, count);
}).on('error', (err) => {
  console.error(`
ERROR: Server not responding at ${URL}

Please make sure the game server is running:
  npm start

Then try again.
`);
  process.exit(1);
});