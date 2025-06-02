/**
 * GameRenderer handles all canvas drawing operations
 */
class GameRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.config = null;
  }

  /**
   * Initialize renderer with game configuration
   * @param {Object} config - Game configuration
   */
  init(config) {
    this.config = config;
    this.canvas.width = config.gameWidth;
    this.canvas.height = config.gameHeight;
    this.clear();
  }

  /**
   * Clear the entire canvas
   */
  clear() {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Draw the game grid
   */
  drawGrid() {
    this.ctx.strokeStyle = '#111';
    this.ctx.lineWidth = 1;
    
    // Draw vertical lines
    for (let x = 0; x <= this.canvas.width; x += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = 0; y <= this.canvas.height; y += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
  }

  /**
   * Draw game boundaries
   */
  drawBoundaries() {
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 4;
    this.ctx.strokeRect(2, 2, this.canvas.width - 4, this.canvas.height - 4);
  }

  /**
   * Draw a player and their trail
   * @param {Object} player - Player data
   */
  drawPlayer(player) {
    if (!player.alive) {
      this.ctx.globalAlpha = 0.3;
    }
    
    // Draw trail
    this.ctx.strokeStyle = player.color;
    this.ctx.lineWidth = this.config.lineWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    if (player.trail.length > 1) {
      this.ctx.beginPath();
      this.ctx.moveTo(player.trail[0].x, player.trail[0].y);
      
      for (let i = 1; i < player.trail.length; i++) {
        this.ctx.lineTo(player.trail[i].x, player.trail[i].y);
      }
      
      this.ctx.stroke();
    }
    
    // Draw player head (current position)
    this.ctx.fillStyle = player.color;
    this.ctx.beginPath();
    this.ctx.arc(player.x, player.y, this.config.lineWidth / 2 + 2, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Draw player name
    if (player.alive) {
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '14px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(player.name, player.x, player.y - 15);
    }
    
    this.ctx.globalAlpha = 1;
  }

  /**
   * Draw all players
   * @param {Array} players - Array of player objects
   */
  drawPlayers(players) {
    players.forEach(player => {
      this.drawPlayer(player);
    });
  }

  /**
   * Draw countdown overlay
   * @param {number} countdown - Countdown value
   */
  drawCountdown(countdown) {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 72px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    if (countdown > 0) {
      this.ctx.fillText(countdown, this.canvas.width / 2, this.canvas.height / 2);
    } else {
      this.ctx.fillText('GO!', this.canvas.width / 2, this.canvas.height / 2);
    }
  }

  /**
   * Render the complete game state
   * @param {Object} gameState - Current game state
   */
  render(gameState) {
    this.clear();
    this.drawGrid();
    this.drawBoundaries();
    
    if (gameState.players) {
      this.drawPlayers(gameState.players);
    }
    
    if (gameState.state === 'countdown' && gameState.countdown <= 3) {
      this.drawCountdown(gameState.countdown);
    }
  }
}