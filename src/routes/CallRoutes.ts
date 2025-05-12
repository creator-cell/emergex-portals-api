import express from "express";
import {
  generateCallToken,
  initiateVoiceCall,
  handleVoiceWebhook,
  connectVoiceCall,
  initiateVideoCall,
  joinVideoCall,
  endCall,
  getCallHistory,
  generateVideoCallToken,
  createRoom,
  acceptIncomingCall,
  handleEndCall,
  fetchCallByConversation,
} from "../controllers/CallControllers";
import { authenticate } from "../middlewares/authMiddleware";
import { authorizeRoles } from "../middlewares/roleMiddleware";
import { GlobalAdminRoles } from "../config/global-enum";
import {
  acceptIncomingCallValidation,
  fetchCallByConversationValidator,
  handleCallEndValidation,
  initiateVideoCallValidator,
} from "../validations/callValidators";
import { checkValidationResult } from "../middlewares/checkValidationsMiddleware";

const router = express.Router();

// Public routes for Twilio webhooks (no auth)
router.post("/voice/webhook", handleVoiceWebhook);
router.post("/voice/connect/:toIdentity", connectVoiceCall);

// Protected routes
router.use(
  authenticate,
  authorizeRoles(GlobalAdminRoles.SuperAdmin, GlobalAdminRoles.ClientAdmin)
);

// Token generation
router.get("/token", generateCallToken);
router.get("/generate-token/video", generateVideoCallToken);

// Voice calls
router.post("/voice/initiate", initiateVoiceCall);

// Video calls
router.get(
  "/video/initiate",
  initiateVideoCallValidator,
  checkValidationResult,
  initiateVideoCall
);
router.get("/video/join/:roomName", joinVideoCall);
router.get(
  "/accept-incoming-call",
  // acceptIncomingCallValidation,
  // checkValidationResult,
  acceptIncomingCall
);

router.post("/video/create-room", createRoom);
router.patch(
  "/end-call/:roomName",
  handleCallEndValidation,
  checkValidationResult,
  handleEndCall
);

// Common call operations
router.post("/:callId/end", endCall);
router.get("/history", getCallHistory);

router.get(
  "/call-by-conversation/:id",
  fetchCallByConversationValidator,
  checkValidationResult,
  fetchCallByConversation
);

export default router;
