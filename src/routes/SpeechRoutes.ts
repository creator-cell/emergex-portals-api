import { Router } from 'express';
import {convertSpeechToText} from '../controllers/SpeechController';
import { handleAudioUpload } from '../config/MulterConfig';

const router = Router();

// Convert speech to text route
router.post('/convert', handleAudioUpload, convertSpeechToText);

export default router;