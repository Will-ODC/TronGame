# Tron Game Test Suite Guide

## Overview
This test suite provides comprehensive coverage for the Tron multiplayer game, including unit tests for individual components and integration tests for socket communication.

## Test Structure

### Server-Side Unit Tests
Located in `tests/game/`:

1. **Player.test.js** - Tests the Player class
   - Player initialization with correct properties
   - Movement mechanics in all directions
   - Trail building and management
   - Turn logic (90-degree turns)
   - Player reset functionality
   - Data serialization for network transmission

2. **CollisionDetector.test.js** - Tests collision detection logic
   - Wall boundary collisions
   - Player trail collisions
   - Self-collision prevention (5-point buffer)
   - Point-to-point distance calculations
   - Performance with large trails

3. **GameRoom.test.js** - Tests core game logic
   - Player management (add/remove/ready states)
   - Game state transitions (lobby → countdown → playing → game over)
   - Countdown timer functionality
   - Game loop and position updates
   - Win condition detection
   - Speed configuration

### Client-Side Unit Tests
Located in `tests/client/`:

1. **GameRenderer.test.js** - Tests canvas rendering
   - Canvas initialization
   - Grid and boundary drawing
   - Player and trail rendering
   - Dead player transparency
   - Countdown overlay
   - Complete frame rendering

2. **InputHandler.test.js** - Tests keyboard input
   - Event listener setup
   - Arrow key handling (left/right)
   - WASD key support
   - Input enable/disable states
   - Event prevention

3. **UIManager.test.js** - Tests UI management
   - Screen transitions
   - Event callback registration
   - Lobby player list updates
   - Ready state toggling
   - Speed slider functionality
   - Game over display
   - UI reset

### Integration Tests
Located in `tests/integration/`:

1. **socket.test.js** - Tests client-server communication
   - Socket connection establishment
   - Room joining and leaving
   - Player ready state synchronization
   - Turn command transmission
   - Game state broadcasting
   - Multi-room isolation

## Running Tests

```bash
# Run all tests
npm test

# Run only server-side tests
npm run test:server

# Run only client-side tests  
npm run test:client

# Run only integration tests
npm run test:integration

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run all test suites separately
npm run test:all
```

## Test Coverage Goals

The test suite aims for:
- 70%+ branch coverage
- 70%+ function coverage
- 70%+ line coverage
- 70%+ statement coverage

## Key Testing Patterns

### Mocking
- Canvas API mocked for client-side tests
- Socket.io mocked for unit tests
- Timers mocked for game loop testing

### Setup/Teardown
- `beforeEach`: Fresh instances for each test
- `afterEach`: Cleanup intervals and connections
- `beforeAll/afterAll`: Server setup for integration tests

### Edge Cases Tested
- Empty player lists
- Full game rooms
- Simultaneous collisions
- Rapid direction changes
- Network disconnections
- Invalid inputs

## Debugging Failed Tests

1. **Check console output** - Tests include descriptive failure messages
2. **Run single test file** - `jest tests/game/Player.test.js`
3. **Use --verbose flag** - `npm test -- --verbose`
4. **Check mock calls** - Many tests verify mock function calls

## Adding New Tests

When adding features:
1. Write tests first (TDD approach)
2. Test both success and failure cases
3. Test edge cases
4. Ensure tests are isolated (no dependencies between tests)
5. Use descriptive test names

## Common Issues

1. **Canvas not defined** - Ensure client tests use jsdom environment
2. **Timers not advancing** - Use `jest.useFakeTimers()` and `jest.advanceTimersByTime()`
3. **Socket events not firing** - Check event names match between client and server
4. **Tests hanging** - Ensure all intervals/timeouts are cleared