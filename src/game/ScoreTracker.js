/**
 * ScoreTracker manages player scores and statistics for a game room
 */
class ScoreTracker {
  constructor() {
    // Track scores by player name (not socket ID, so scores persist across reconnects)
    this.playerScores = new Map(); // Map<playerName, scoreData>
    this.totalGamesPlayed = 0;
  }

  /**
   * Register a player in the score system
   * @param {string} playerName - Player's display name
   */
  registerPlayer(playerName) {
    if (!this.playerScores.has(playerName)) {
      this.playerScores.set(playerName, {
        wins: 0,
        gamesPlayed: 0,
        currentStreak: 0,
        bestStreak: 0,
        joinTime: Date.now(),
        lastSeen: Date.now()
      });
    } else {
      // Update last seen time
      const scoreData = this.playerScores.get(playerName);
      scoreData.lastSeen = Date.now();
    }
  }

  /**
   * Record a game result
   * @param {string} winnerName - Name of the winning player (null if no winner)
   * @param {Array<string>} participants - Names of all players who participated
   */
  recordGame(winnerName, participants) {
    this.totalGamesPlayed++;
    
    // Update games played for all participants
    participants.forEach(playerName => {
      if (this.playerScores.has(playerName)) {
        const scoreData = this.playerScores.get(playerName);
        scoreData.gamesPlayed++;
        scoreData.lastSeen = Date.now();
        
        // Update win stats if this player won
        if (playerName === winnerName) {
          scoreData.wins++;
          scoreData.currentStreak++;
          scoreData.bestStreak = Math.max(scoreData.bestStreak, scoreData.currentStreak);
        } else {
          scoreData.currentStreak = 0;
        }
      }
    });
  }

  /**
   * Get leaderboard data
   * @returns {Array} - Sorted array of player scores
   */
  getLeaderboard() {
    const leaderboard = [];
    
    this.playerScores.forEach((scoreData, playerName) => {
      leaderboard.push({
        name: playerName,
        wins: scoreData.wins,
        gamesPlayed: scoreData.gamesPlayed,
        winRate: scoreData.gamesPlayed > 0 
          ? Math.round((scoreData.wins / scoreData.gamesPlayed) * 100) 
          : 0,
        currentStreak: scoreData.currentStreak,
        bestStreak: scoreData.bestStreak
      });
    });
    
    // Sort by wins (descending), then by win rate
    leaderboard.sort((a, b) => {
      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }
      return b.winRate - a.winRate;
    });
    
    return leaderboard;
  }

  /**
   * Get score data for a specific player
   * @param {string} playerName - Player's name
   * @returns {Object|null} - Player's score data or null
   */
  getPlayerScore(playerName) {
    const scoreData = this.playerScores.get(playerName);
    if (!scoreData) return null;
    
    return {
      name: playerName,
      wins: scoreData.wins,
      gamesPlayed: scoreData.gamesPlayed,
      winRate: scoreData.gamesPlayed > 0 
        ? Math.round((scoreData.wins / scoreData.gamesPlayed) * 100) 
        : 0,
      currentStreak: scoreData.currentStreak,
      bestStreak: scoreData.bestStreak
    };
  }

  /**
   * Get room statistics
   * @returns {Object} - Room statistics
   */
  getRoomStats() {
    let totalWins = 0;
    let totalPlayers = this.playerScores.size;
    let activePlayers = 0;
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    this.playerScores.forEach(scoreData => {
      totalWins += scoreData.wins;
      if (scoreData.lastSeen > oneHourAgo) {
        activePlayers++;
      }
    });
    
    return {
      totalGamesPlayed: this.totalGamesPlayed,
      totalPlayers: totalPlayers,
      activePlayers: activePlayers,
      averageGamesPerPlayer: totalPlayers > 0 
        ? Math.round(this.totalGamesPlayed / totalPlayers) 
        : 0
    };
  }

  /**
   * Export scores for persistence (future feature)
   * @returns {Object} - Serialized score data
   */
  exportScores() {
    return {
      playerScores: Array.from(this.playerScores.entries()),
      totalGamesPlayed: this.totalGamesPlayed,
      exportTime: Date.now()
    };
  }

  /**
   * Import scores from saved data (future feature)
   * @param {Object} data - Serialized score data
   */
  importScores(data) {
    if (data.playerScores) {
      this.playerScores = new Map(data.playerScores);
    }
    if (data.totalGamesPlayed) {
      this.totalGamesPlayed = data.totalGamesPlayed;
    }
  }
}

module.exports = ScoreTracker;