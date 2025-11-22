import { v4 as uuidv4 } from 'uuid';
import { Session } from '../models/Session.js';
import { Player } from '../models/Player.js';

// In-memory storage
export const sessions = new Map();
export const players = new Map();

export const createSession = (req, res) => {
  const sessionId = uuidv4().substring(0, 8);
  const adminId = uuidv4();
  const session = new Session(sessionId, adminId);
  
  sessions.set(sessionId, session);
  console.log(`Session created: ${sessionId} by admin ${adminId}`);
  
  res.json({ sessionId, adminId });
};

export const joinSession = (io, socket, data) => {
  const { sessionId, playerId, name } = data;
  const session = sessions.get(sessionId);
  
  if (!session) {
    socket.emit('error', { message: 'Session not found' });
    return null;
  }

  if (session.isActive && session.questionIndex > 0) {
    socket.emit('error', { message: 'Quiz already in progress' });
    return null;
  }

  // Join socket room
  socket.join(sessionId);
  
  // Create and store player
  const isAdmin = playerId === session.adminId;
  const player = new Player(playerId, name, socket.id, isAdmin);
  
  players.set(playerId, player);
  session.addPlayer(player);

  return { session, player };
};