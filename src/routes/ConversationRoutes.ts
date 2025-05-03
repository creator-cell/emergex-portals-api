import express from "express";
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
  generateToken,
  getTeamsWithMembersAndConversations,
  getAvailableConversations,
  getCurrentConversationDetails,
} from "../controllers/ConversationControllers";
import {
  createConversationValidation,
  addParticipantValidation,
  removeParticipantValidation,
  sendMessageValidation,
  updateConversationValidation,
  conversationIdValidation,
  getUserConversationsValidation,
} from "../validations/conversationValidators";
import { authenticate } from "../middlewares/authMiddleware";
import { authorizeRoles } from "../middlewares/roleMiddleware";
import { GlobalAdminRoles } from "../config/global-enum";

const router = express.Router();
router.use(
  authenticate,
  authorizeRoles(GlobalAdminRoles.SuperAdmin, GlobalAdminRoles.ClientAdmin)
);

// Conversation routes
router.post("/", createConversationValidation, createConversation);
router.get("/", getUserConversationsValidation, getUserConversations);
router.get("/:id", conversationIdValidation, getConversation);
router.get("/:id/messages", conversationIdValidation, getConversationMessages);
router.post("/:id/  ", addParticipantValidation, addParticipant);
router.delete(
  "/:id/participants/:participantId",
  removeParticipantValidation,
  removeParticipant
);
router.post("/:id/messages", sendMessageValidation, sendMessage);
router.put("/:id", updateConversationValidation, updateConversation);
router.delete("/:id", conversationIdValidation, deleteConversation);
router.get("/token/generate", generateToken);

router.get('/team-and-members/get-list', getTeamsWithMembersAndConversations);
router.get('/available-chats/get-list', getAvailableConversations);
router.get('/current-conversation/details', getCurrentConversationDetails);

export default router;
