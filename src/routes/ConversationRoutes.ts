import express from 'express';
import {
  createConversation,
  getUserConversations,
  getConversation,
  getConversationMessages,
  addParticipant,
  removeParticipant,
  sendMessage,
  updateConversation,
  deleteConversation,
  generateToken
} from '../controllers/ConversationControllers';
import {
  createConversationValidation,
  addParticipantValidation,
  removeParticipantValidation,
  sendMessageValidation,
  updateConversationValidation,
  conversationIdValidation
} from '../validations/conversationValidators';
import { authenticate } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/roleMiddleware';
import { GlobalAdminRoles } from '../config/global-enum';

const router = express.Router();
router.use(authenticate,authorizeRoles(GlobalAdminRoles.SuperAdmin,GlobalAdminRoles.ClientAdmin));

// Conversation routes
router.post('/', createConversationValidation, createConversation);
router.get('/', getUserConversations);
router.get('/:id', conversationIdValidation, getConversation);
router.get('/:id/messages', conversationIdValidation, getConversationMessages);
router.post('/:id/participants', addParticipantValidation, addParticipant);
router.delete('/:id/participants/:participantId', removeParticipantValidation, removeParticipant);
router.post('/:id/messages', sendMessageValidation, sendMessage);
router.put('/:id', updateConversationValidation, updateConversation);
router.delete('/:id', conversationIdValidation, deleteConversation);
router.get('/token/generate', generateToken);

export default router;