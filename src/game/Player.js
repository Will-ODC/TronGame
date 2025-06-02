/**
 * Player class representing a single player in the game
 */
class Player {
  constructor(id, name, color, position) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.x = position.x;
    this.y = position.y;
    this.direction = position.direction;
    this.trail = [];
    this.alive = true;
    this.ready = false;
  }

  /**
   * Move player in current direction
   * @param {number} speed - Movement speed
   */
  move(speed, directionVectors) {
    if (!this.alive) return;
    
    const dir = directionVectors[this.direction];
    this.x += dir.x * speed;
    this.y += dir.y * speed;
    
    // Add new position to trail
    this.trail.push({ x: this.x, y: this.y });
  }

  /**
   * Reset player for new game
   * @param {Object} position - Starting position
   */
  reset(position) {
    this.x = position.x;
    this.y = position.y;
    this.direction = position.direction;
    this.trail = [];
    this.alive = true;
    this.ready = false;
  }

  /**
   * Change direction based on turn input
   * @param {string} turn - 'left' or 'right'
   */
  turn(turn) {
    const directions = ['UP', 'RIGHT', 'DOWN', 'LEFT'];
    let currentIndex = directions.indexOf(this.direction);
    
    if (turn === 'left') {
      currentIndex = (currentIndex - 1 + 4) % 4;
    } else if (turn === 'right') {
      currentIndex = (currentIndex + 1) % 4;
    }
    
    this.direction = directions[currentIndex];
  }

  /**
   * Serialize player data for client
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      color: this.color,
      x: this.x,
      y: this.y,
      direction: this.direction,
      trail: this.trail,
      alive: this.alive,
      ready: this.ready
    };
  }
}

module.exports = Player;