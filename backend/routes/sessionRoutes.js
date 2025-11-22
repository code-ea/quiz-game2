import express from 'express';
import { createSession } from '../controllers/sessionController.js';

const router = express.Router();

router.post('/session/create', createSession);

export default router;