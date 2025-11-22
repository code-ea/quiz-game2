import { createServer } from 'http';
import app from './app.js';
import { initializeSocket } from './config/socket.js';

const PORT = process.env.PORT || 3000;
const server = createServer(app);

// Initialize Socket.io
initializeSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});