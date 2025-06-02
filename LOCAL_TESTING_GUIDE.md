# Local Testing Guide for Tron Game

## Prerequisites
- Node.js installed (version 14 or higher)
- A modern web browser (Chrome, Firefox, Edge)
- Multiple browser windows/tabs for multiplayer testing

## Setup Instructions

### 1. Install Dependencies
```bash
cd TronGame
npm install
```

### 2. Start the Server
```bash
npm start
# Or for development with auto-restart:
npm run dev
```

You should see:
```
Tron Game Server running on port 3000
```

### 3. Access the Game
Open your web browser and navigate to:
```
http://localhost:3000
```

## Testing Single Player Setup

1. **Open one browser tab** at `http://localhost:3000`
2. Enter your name (or leave blank for "Anonymous")
3. Leave Room ID blank (uses "default" room)
4. Click "Join Game"
5. You'll see yourself in the lobby, but need another player to start

## Testing Multiplayer Locally

### Method 1: Multiple Browser Tabs
1. **Open 2-4 browser tabs** all pointing to `http://localhost:3000`
2. In each tab:
   - Enter a different player name (Player 1, Player 2, etc.)
   - Use the same Room ID (or leave all blank)
   - Click "Join Game"
3. Each player clicks "Ready" button
4. Game starts after 10-second countdown when 2+ players are ready

### Method 2: Different Browsers
1. Open the game in Chrome: `http://localhost:3000`
2. Open the game in Firefox: `http://localhost:3000`
3. Join the same room from both browsers
4. This simulates two different players better

### Method 3: Incognito/Private Windows
1. Open normal browser window with the game
2. Open incognito/private window with the game
3. Join as different players

## Testing Different Rooms

1. **Player 1 & 2**: Join with Room ID "room1"
2. **Player 3 & 4**: Join with Room ID "room2"
3. These games will be completely separate

## Testing Game Features

### 1. Controls
- **Arrow Keys**: Left/Right to turn
- **A/D Keys**: Alternative controls
- Test that both work during gameplay

### 2. Speed Settings
- In lobby, adjust the speed slider (1-5)
- Only works before game starts
- Test different speeds to see gameplay differences

### 3. Collision Testing
- **Wall collision**: Drive into boundaries
- **Trail collision**: Cross another player's trail
- **Self collision**: Try to cross your own trail
- Verify players die appropriately

### 4. Game Flow
1. **Lobby Phase**: Players join and ready up
2. **Countdown**: 10-second countdown (shows at 3-2-1-GO!)
3. **Playing**: Players control their light cycles
4. **Game Over**: Winner announced
5. **Continue/Quit**: Test both options

## Debugging Tips

### 1. Console Monitoring
Open browser Developer Tools (F12) and check:
- **Console tab**: For any errors
- **Network tab**: To see Socket.io messages

### 2. Server Logs
Watch the terminal where you ran `npm start`:
```
New player connected: socketId123
Player disconnected: socketId123
```

### 3. Common Issues & Solutions

**Issue**: "Cannot connect to server"
- Make sure server is running (`npm start`)
- Check if port 3000 is available
- Try `http://127.0.0.1:3000` instead

**Issue**: Game doesn't start
- Need at least 2 players marked as "Ready"
- Check all players are in the same room

**Issue**: Controls not working
- Click on the game canvas to ensure it has focus
- Check if the game state is "playing"
- Ensure your player is still alive

## Performance Testing

### 1. Stress Test with 4 Players
- Open 4 browser tabs
- Join all as different players
- Play until trails fill significant screen space
- Monitor for lag or performance issues

### 2. Long Game Sessions
- Play multiple rounds using "Continue"
- Check for memory leaks or degraded performance

### 3. Rapid Inputs
- Quickly alternate left/right turns
- Verify all inputs are registered correctly

## Network Simulation

### Testing Latency (Advanced)
1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Click throttling dropdown
4. Select "Slow 3G" or custom latency
5. Test how game handles delayed inputs

## Quick Test Checklist

- [ ] Server starts without errors
- [ ] Can join game from single browser
- [ ] Can join from multiple browsers
- [ ] Players see each other in lobby
- [ ] Ready button works
- [ ] Countdown displays properly
- [ ] Game starts after countdown
- [ ] Arrow keys control player
- [ ] A/D keys also work
- [ ] Collisions kill players
- [ ] Winner is announced
- [ ] Can restart game
- [ ] Can quit to lobby
- [ ] Different rooms stay separate
- [ ] Speed slider changes game speed

## Automated Testing
For automated tests, run:
```bash
# Run all unit tests
npm test

# Run with coverage report
npm run test:coverage
```

## Mobile Testing (Limited)
While the game is designed for keyboard input, you can test responsive design:
1. Open Chrome DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test lobby UI on different screen sizes
4. Note: Game controls won't work without keyboard

## Port Configuration
If port 3000 is in use, you can change it:
```bash
# Windows
set PORT=8080 && npm start

# Mac/Linux
PORT=8080 npm start
```
Then access at `http://localhost:8080`