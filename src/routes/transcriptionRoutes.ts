import express from 'express';
const router = express.Router();

import { handleTranscription } from '../controllers/transcriptionController';

router.post('/', handleTranscription);

export default router;