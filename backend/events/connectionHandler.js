import { joinSession } from '../controllers/sessionController.js';
import { startQuiz, submitAnswer } from '../controllers/quizController.js';
import { sessions } from '../controllers/sessionController.js';

export const handleConnection = (io, socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_session', (data) => {
    const result = joinSession(io, socket, data);
    if (!result) return;

    const { session, player } = result;

    socket.emit('joined_session', { 
      sessionId: session.id, 
      playerId: player.id, 
      name: player.name,
      isAdmin: player.isAdmin
    });

    // Notify others
    socket.to(session.id).emit('player_joined', {
      playerId: player.id,
      name: player.name,
      playersCount: session.players.size,
      isAdmin: player.isAdmin
    });

    // Update admin with player list
    if (!player.isAdmin) {
      const adminPlayer = session.getAllPlayers().find(p => p.isAdmin);
      if (adminPlayer) {
        io.to(adminPlayer.socketId).emit('players_update', {
          players: session.getAllPlayers().map(p => ({
            id: p.id,
            name: p.name,
            isAdmin: p.isAdmin
          }))
        });
      }
    }

    console.log(`Player ${player.name} joined session ${session.id}`);
  });

  socket.on('start_quiz', (data) => {
    try {
      startQuiz(data.sessionId, data.adminId);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('submit_answer', (data) => {
    try {
      submitAnswer(data.sessionId, data.playerId, data.answer);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove player from sessions
    for (let [sessionId, session] of sessions) {
      for (let [playerId, player] of session.players) {
        if (player.socketId === socket.id) {
          session.players.delete(playerId);
          console.log(`Player ${playerId} removed from session ${sessionId}`);
          break;
        }
      }
    }
  });
};