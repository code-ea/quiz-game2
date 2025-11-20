const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Enable CORS for all routes
app.use(cors());

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes for HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'admin.html'));
});

app.get('/player', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'player.html'));
});

// In-memory storage
const sessions = new Map();
const players = new Map();

// Quiz questions (sample data)
const questions = [
  {
    id: 1,
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correctAnswer: 2
  },
  {
    id: 2,
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctAnswer: 1
  },
  {
    id: 3,
    question: "What is 2 + 2?",
    options: ["3", "4", "5", "6"],
    correctAnswer: 1
  },
  {
    id: 4,
    question: "Which language runs in web browsers?",
    options: ["Java", "Python", "JavaScript", "C++"],
    correctAnswer: 2
  },
  {
    id: 5,
    question: "What does HTML stand for?",
    options: [
      "Hyper Text Markup Language",
      "High Tech Modern Language",
      "Hyper Transfer Markup Language",
      "Home Tool Markup Language"
    ],
    correctAnswer: 0
  }
];

class QuizSession {
  constructor(sessionId, adminSocketId) {
    this.sessionId = sessionId;
    this.adminSocketId = adminSocketId;
    this.players = new Map();
    this.currentQuestionIndex = -1;
    this.timer = null;
    this.isActive = false;
    this.questionStartTime = null;
  }

  addPlayer(playerId, playerName, socketId) {
    this.players.set(playerId, {
      id: playerId,
      name: playerName,
      socketId: socketId,
      score: 0,
      currentAnswer: null,
      hasAnswered: false
    });
  }

  startQuiz() {
    this.isActive = true;
    this.currentQuestionIndex = -1;
    this.nextQuestion();
  }

  nextQuestion() {
    this.currentQuestionIndex++;
    
    if (this.currentQuestionIndex >= questions.length) {
      this.endQuiz();
      return;
    }

    // Reset player answers for new question
    this.players.forEach(player => {
      player.currentAnswer = null;
      player.hasAnswered = false;
    });

    const currentQuestion = questions[this.currentQuestionIndex];
    this.questionStartTime = Date.now();
    
    // Broadcast question to all players
    io.to(this.sessionId).emit('newQuestion', {
      question: currentQuestion,
      questionNumber: this.currentQuestionIndex + 1,
      totalQuestions: questions.length
    });

    // Start 10-second timer
    this.timer = setTimeout(() => {
      this.evaluateAnswers();
    }, 10000);
  }

  submitAnswer(playerId, answerIndex) {
    const player = this.players.get(playerId);
    if (player && !player.hasAnswered) {
      player.currentAnswer = answerIndex;
      player.hasAnswered = true;

      // Check if all players have answered
      const allAnswered = Array.from(this.players.values()).every(p => p.hasAnswered);
      if (allAnswered) {
        clearTimeout(this.timer);
        this.evaluateAnswers();
      }
    }
  }

  evaluateAnswers() {
    const currentQuestion = questions[this.currentQuestionIndex];
    const results = [];
    let fastestPlayer = null;
    let fastestTime = Infinity;

    this.players.forEach(player => {
      const isCorrect = player.currentAnswer === currentQuestion.correctAnswer;
      const answerTime = Date.now() - this.questionStartTime;
      
      if (isCorrect) {
        player.score += 10;
        // Bonus for fastest correct answer
        if (answerTime < fastestTime) {
          fastestTime = answerTime;
          fastestPlayer = player.id;
        }
      }

      results.push({
        playerId: player.id,
        playerName: player.name,
        answer: player.currentAnswer,
        isCorrect: isCorrect,
        score: player.score
      });
    });

    // Add bonus to fastest correct answer
    if (fastestPlayer) {
      this.players.get(fastestPlayer).score += 5;
      const fastestPlayerResult = results.find(r => r.playerId === fastestPlayer);
      if (fastestPlayerResult) {
        fastestPlayerResult.score += 5;
        fastestPlayerResult.bonus = true;
      }
    }

    // Broadcast results
    io.to(this.sessionId).emit('questionResults', {
      results: results,
      correctAnswer: currentQuestion.correctAnswer,
      question: currentQuestion.question
    });

    // Wait 3 seconds before next question
    setTimeout(() => {
      this.nextQuestion();
    }, 3000);
  }

  endQuiz() {
    this.isActive = false;
    clearTimeout(this.timer);

    const finalScores = Array.from(this.players.values()).map(player => ({
      id: player.id,
      name: player.name,
      score: player.score
    }));

    // Sort by score descending
    finalScores.sort((a, b) => b.score - a.score);

    io.to(this.sessionId).emit('quizEnd', { finalScores });
  }

  getPlayerList() {
    return Array.from(this.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      score: p.score
    }));
  }
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Admin creates a session
  socket.on('createSession', (data) => {
    const sessionId = generateSessionId();
    const session = new QuizSession(sessionId, socket.id);
    
    sessions.set(sessionId, session);
    players.set(socket.id, { sessionId, isAdmin: true });

    socket.join(sessionId);
    socket.emit('sessionCreated', { sessionId });
    
    console.log(`Session created: ${sessionId}`);
  });

  // Player joins a session
  socket.on('joinSession', (data) => {
    const { sessionId, playerName } = data;
    const session = sessions.get(sessionId);

    if (!session) {
      socket.emit('error', { message: 'Session not found' });
      return;
    }

    if (session.isActive) {
      socket.emit('error', { message: 'Quiz already in progress' });
      return;
    }

    const playerId = generatePlayerId();
    session.addPlayer(playerId, playerName, socket.id);
    players.set(socket.id, { sessionId, playerId, isAdmin: false });

    socket.join(sessionId);
    socket.emit('joinedSession', { playerId, sessionId });

    // Notify admin and all players about new player
    io.to(session.adminSocketId).emit('playerJoined', session.getPlayerList());
    io.to(sessionId).emit('playerListUpdate', session.getPlayerList());
    
    console.log(`Player ${playerName} joined session ${sessionId}`);
  });

  // Admin starts the quiz
  socket.on('startQuiz', (data) => {
    const playerData = players.get(socket.id);
    if (!playerData || !playerData.isAdmin) return;

    const session = sessions.get(playerData.sessionId);
    if (session) {
      session.startQuiz();
      console.log(`Quiz started for session ${session.sessionId}`);
    }
  });

  // Player submits answer
  socket.on('submitAnswer', (data) => {
    const playerData = players.get(socket.id);
    if (!playerData || playerData.isAdmin) return;

    const session = sessions.get(playerData.sessionId);
    if (session && session.isActive) {
      session.submitAnswer(playerData.playerId, data.answerIndex);
      console.log(`Player ${playerData.playerId} submitted answer: ${data.answerIndex}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    const playerData = players.get(socket.id);
    if (playerData) {
      const session = sessions.get(playerData.sessionId);
      if (session) {
        if (playerData.isAdmin) {
          // Admin disconnected - end session
          sessions.delete(playerData.sessionId);
          io.to(playerData.sessionId).emit('sessionEnded', { message: 'Admin left the session' });
        } else {
          // Player disconnected - remove from session
          session.players.delete(playerData.playerId);
          io.to(playerData.sessionId).emit('playerListUpdate', session.getPlayerList());
        }
      }
      players.delete(socket.id);
    }
  });
});

function generateSessionId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generatePlayerId() {
  return Math.random().toString(36).substring(2, 10);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the application at:`);
  console.log(`- Main Page: http://localhost:${PORT}/`);
  console.log(`- Admin: http://localhost:${PORT}/admin`);
  console.log(`- Player: http://localhost:${PORT}/player`);
});