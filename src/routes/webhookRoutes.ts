import express from 'express';
import { handleWebhook } from '../controllers/webHookControllers';

const router = express.Router();

// Webhook route for Twilio Conversations events
router.post('/', handleWebhook);

export default router;