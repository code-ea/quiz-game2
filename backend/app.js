import express from 'express';
import cors from 'cors';
import sessionRoutes from './routes/sessionRoutes.js';
import { initializeSocket } from './config/socket.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', sessionRoutes);

export default app;