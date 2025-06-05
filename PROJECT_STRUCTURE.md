# Tron Game - Improved Project Structure

## Overview
The project has been refactored for better organization, performance, and maintainability.

## Directory Structure
```
TronGame/
├── server.js               # Original server (kept for compatibility)
├── server-new.js          # Refactored server using SocketHandler
├── index.html             # Game UI
├── main.js               # New client entry point with proper module loading
├── game.js               # Original client (kept for compatibility)
├── style.css             # Game styles
├── package.json          # Dependencies
│
├── src/
│   ├── shared/           # Code shared between client and server
│   │   └── constants.js  # Game constants and configuration
│   │
│   ├── server/           # Server-specific modules
│   │   └── SocketHandler.js  # Handles all socket.io events
│   │
│   ├── game/             # Game logic modules (used by server)
│   │   ├── GameRoom.js   # Game room management
│   │   ├── Player.js     # Player class
│   │   └── CollisionDetector.js  # Collision detection logic
│   │
│   └── client/           # Client-side modules
│       ├── GameClient.js # Main client coordinator
│       ├── GameRenderer.js   # Canvas rendering
│       ├── InputHandler.js   # Keyboard input handling
│       └── UIManager.js      # UI state management
│
└── tests/                # Test files
    ├── game/            # Server-side tests
    └── client/          # Client-side tests
```

## Key Improvements

### 1. Fixed Color Duplication
- Colors are now properly tracked and assigned
- Players keep their color throughout the session
- Colors are freed when players leave

### 2. Performance Optimizations
- **Trail Length Limiting**: Max 2000 points per trail
- **Reduced Network Traffic**: Broadcasting at 30fps instead of 60fps
- **Data Compression**: Only sending every nth trail point when trails are long
- **Smooth Rendering**: Using requestAnimationFrame for 60fps client rendering
- **Separated Concerns**: Game logic updates separate from rendering

### 3. Better Architecture
- **Shared Constants**: Single source of truth for configuration
- **Modular Server**: SocketHandler separates socket logic from server setup
- **Proper Module Loading**: Dynamic script loading instead of document.write
- **Clear Separation**: Client, server, and shared code clearly separated

## Migration Guide

To use the new structure:

1. **For Development**: Use `server-new.js` instead of `server.js`
   ```bash
   node server-new.js
   ```

2. **For Production**: Update your start script in package.json:
   ```json
   "scripts": {
     "start": "node server-new.js"
   }
   ```

3. The new structure is backward compatible - the original files still work.

## Benefits

1. **Maintainability**: Easier to find and modify code
2. **Performance**: Significant reduction in network traffic and smoother gameplay
3. **Scalability**: Better structure for adding new features
4. **Testability**: Cleaner separation makes testing easier
5. **Reusability**: Shared constants prevent duplication