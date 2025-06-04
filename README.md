# Tron Multiplayer Game

A real-time multiplayer Tron light cycle game built with Node.js, Socket.io, and HTML5 Canvas.

## Features
- Support for up to 4 players
- Real-time multiplayer gameplay
- Simple lobby system with ready status
- Configurable game speed
- Instant 90-degree turns
- Collision detection with walls and player trails
- Distinct player colors (red, blue, green, purple)

## How to Deploy on Replit

1. Create a new Repl and select "Import from GitHub" or upload these files
2. Select "Node.js" as the template
3. Click "Run" to start the server
4. The game will be available at your Repl's URL

## How to Play

### Controls
- **Left Arrow** or **A**: Turn left
- **Right Arrow** or **D**: Turn right

### Game Rules
1. Each player controls a light cycle that leaves a trail
2. Players can only turn left or right (90-degree turns)
3. Avoid hitting walls, other players' trails, or your own trail
4. Last player surviving wins
5. Game requires at least 2 players to start

### Joining a Game
1. Enter your name (optional)
2. Enter a room ID to create/join a specific room (optional)
3. Click "Join Game"
4. Click "Ready" when you're ready to play
5. Game starts automatically after 10-second countdown when 2+ players are ready

## Local Development

```bash
# Install dependencies
npm install

# Run the server
npm start

# Or use nodemon for development
npm run dev
```

Visit `http://localhost:3000` to play locally.

## Project Structure

```
.
├── server.js           # Main server file
├── index.html          # Game UI
├── game.js            # Client-side game logic
├── style.css          # Styling
├── package.json       # Dependencies
└── src/
    ├── game/          # Server-side game modules
    │   ├── GameRoom.js
    │   ├── Player.js
    │   └── CollisionDetector.js
    └── client/        # Client-side modules
        ├── GameRenderer.js
        ├── InputHandler.js
        └── UIManager.js
```