export class Session {
  constructor(sessionId, adminId) {
    this.id = sessionId;
    this.adminId = adminId;
    this.players = new Map();
    this.currentQuestion = null;
    this.answers = new Map();
    this.questionIndex = 0;
    this.isActive = false;
    this.timer = null;
    this.quizResults = [];
  }

  addPlayer(player) {
    this.players.set(player.id, player);
  }

  removePlayer(playerId) {
    this.players.delete(playerId);
  }

  recordAnswer(questionIndex, playerId, answer) {
    if (!this.answers.has(questionIndex)) {
      this.answers.set(questionIndex, new Map());
    }
    this.answers.get(questionIndex).set(playerId, answer);
  }

  getAllPlayers() {
    return Array.from(this.players.values());
  }

  getNonAdminPlayers() {
    return this.getAllPlayers().filter(player => !player.isAdmin);
  }

  clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}