import { getIO } from '../config/socket.js';
import { sessions } from './sessionController.js';
import { questions } from '../utils/questions.js';
import { calculatePlayerStats } from '../utils/helpers.js';

export const startQuiz = (sessionId, adminId) => {
  const session = sessions.get(sessionId);
  
  if (!session || session.adminId !== adminId) {
    throw new Error('Unauthorized');
  }

  session.isActive = true;
  session.questionIndex = 0;
  session.quizResults = [];
  session.answers.clear();
  
  const io = getIO();
  io.to(sessionId).emit('quiz_starting');
  
  console.log(`Quiz starting for session ${sessionId}`);
  
  setTimeout(() => {
    startQuestion(sessionId);
  }, 2000);
};

export const submitAnswer = (sessionId, playerId, answer) => {
  const session = sessions.get(sessionId);
  
  if (!session || !session.isActive || !session.currentQuestion) {
    throw new Error('No active question');
  }

  session.recordAnswer(session.questionIndex, playerId, answer);
  console.log(`Player ${playerId} answered: ${answer} for question ${session.questionIndex + 1}`);
  
  // Notify admin
  const adminPlayer = session.getAllPlayers().find(p => p.isAdmin);
  if (adminPlayer) {
    const questionAnswers = session.answers.get(session.questionIndex) || new Map();
    const io = getIO();
    
    io.to(adminPlayer.socketId).emit('answer_submitted', {
      playerId,
      answersCount: questionAnswers.size,
      totalPlayers: session.getNonAdminPlayers().length,
      questionNumber: session.questionIndex + 1
    });
  }

  // Check if all players have answered
  const questionAnswers = session.answers.get(session.questionIndex) || new Map();
  const nonAdminPlayers = session.getNonAdminPlayers();
  const allPlayersAnswered = nonAdminPlayers.length > 0 && 
    nonAdminPlayers.every(player => questionAnswers.has(player.id));

  if (allPlayersAnswered) {
    console.log('All players answered, ending question early');
    endQuestion(sessionId);
  }
};

export const startQuestion = (sessionId) => {
  const session = sessions.get(sessionId);
  if (!session) return;

  const question = questions[session.questionIndex];
  if (!question) {
    endQuiz(sessionId);
    return;
  }

  session.currentQuestion = question;
  const io = getIO();
  
  // Send question to players
  session.getAllPlayers().forEach(player => {
    if (!player.isAdmin) {
      io.to(player.socketId).emit('question', {
        question: question.question,
        options: question.options,
        questionNumber: session.questionIndex + 1,
        totalQuestions: questions.length
      });
    }
  });

  // Send admin info
  const adminPlayer = session.getAllPlayers().find(p => p.isAdmin);
  if (adminPlayer) {
    io.to(adminPlayer.socketId).emit('question_admin', {
      questionNumber: session.questionIndex + 1,
      totalQuestions: questions.length,
      currentAnswers: 0,
      totalPlayers: session.getNonAdminPlayers().length
    });
  }

  console.log(`Question ${session.questionIndex + 1} started for session ${sessionId}`);

  // Start timer
  session.timer = setTimeout(() => {
    endQuestion(sessionId);
  }, 10000);
};

export const endQuestion = (sessionId) => {
  const session = sessions.get(sessionId);
  if (!session || !session.currentQuestion) return;

  session.clearTimer();

  const question = session.currentQuestion;
  const questionAnswers = session.answers.get(session.questionIndex) || new Map();
  
  const answersObject = {};
  questionAnswers.forEach((answer, playerId) => {
    answersObject[playerId] = answer;
  });

  const questionResult = {
    question: question.question,
    options: question.options,
    correctAnswer: question.correctAnswer,
    answers: answersObject,
    questionNumber: session.questionIndex + 1
  };

  session.quizResults.push(questionResult);
  console.log(`Question ${session.questionIndex + 1} completed for session ${sessionId}`);

  const io = getIO();
  io.to(sessionId).emit('quiz_result', questionResult);

  setTimeout(() => {
    session.questionIndex++;
    if (session.questionIndex < questions.length) {
      startQuestion(sessionId);
    } else {
      endQuiz(sessionId);
    }
  }, 5000);
};

export const endQuiz = (sessionId) => {
  const session = sessions.get(sessionId);
  if (!session) return;

  session.isActive = false;

  const finalResults = {
    sessionId: sessionId,
    totalQuestions: questions.length,
    totalPlayers: session.getNonAdminPlayers().length,
    questions: session.quizResults,
    playerStats: calculatePlayerStats(session)
  };

  const io = getIO();
  io.to(sessionId).emit('quiz_complete', finalResults);
  
  console.log(`Quiz completed for session ${sessionId}`);
  
  setTimeout(() => {
    sessions.delete(sessionId);
    console.log(`Session ${sessionId} cleaned up`);
  }, 30000);
};