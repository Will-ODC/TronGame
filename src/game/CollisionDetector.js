/**
 * CollisionDetector handles all collision logic for the game
 */
class CollisionDetector {
  constructor(config) {
    this.config = config;
  }

  /**
   * Check if a player has collided with anything
   * @param {Player} player - Player to check
   * @param {Map} allPlayers - All players in game
   * @param {number} speed - Current game speed (optional)
   * @returns {boolean} - True if collision detected
   */
  checkCollision(player, allPlayers, speed = 2) {
    return this.checkWallCollision(player) || this.checkTrailCollision(player, allPlayers, speed);
  }

  /**
   * Check if player hit a wall
   * @param {Player} player - Player to check
   * @returns {boolean} - True if hit wall
   */
  checkWallCollision(player) {
    const halfWidth = this.config.LINE_WIDTH / 2;
    return (
      player.x < halfWidth || 
      player.x > this.config.GAME_WIDTH - halfWidth ||
      player.y < halfWidth || 
      player.y > this.config.GAME_HEIGHT - halfWidth
    );
  }

  /**
   * Check if player hit any trail (including their own)
   * @param {Player} player - Player to check
   * @param {Map} allPlayers - All players in game
   * @param {number} speed - Current game speed
   * @returns {boolean} - True if hit trail
   */
  checkTrailCollision(player, allPlayers, speed = 2) {
    for (const [id, otherPlayer] of allPlayers) {
      const trail = otherPlayer.trail;
      // Skip last few points of own trail to prevent self-collision on turns
      // Special handling for speed 1 - it needs a much larger buffer
      let buffer;
      if (speed === 1) {
        // At speed 1, we need a very large fixed buffer
        // This prevents instant death on turns while still allowing self-collision
        // for legitimate loops that take a long time to form
        buffer = 150;
      } else {
        // For other speeds, scale buffer appropriately
        const pixelBuffer = this.config.LINE_WIDTH * 3;
        const pointsNeeded = Math.ceil(pixelBuffer / speed);
        buffer = Math.max(pointsNeeded, Math.ceil(10 * (speed / 2)));
      }
      const checkLength = id === player.id ? Math.max(0, trail.length - buffer) : trail.length;
      
      for (let i = 0; i < checkLength; i++) {
        const point = trail[i];
        if (this.checkPointCollision(player.x, player.y, point.x, point.y)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Check if two points are colliding based on line width
   * @param {number} x1 - First point X
   * @param {number} y1 - First point Y
   * @param {number} x2 - Second point X
   * @param {number} y2 - Second point Y
   * @returns {boolean} - True if points collide
   */
  checkPointCollision(x1, y1, x2, y2) {
    const distance = Math.sqrt(
      Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2)
    );
    return distance < this.config.LINE_WIDTH;
  }
}

module.exports = CollisionDetector;