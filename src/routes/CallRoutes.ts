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
  notifyUserToJoinRoom,
  acceptIncomingCall,
  handleCallResponse
} from "../controllers/CallControllers";
import { authenticate } from "../middlewares/authMiddleware";
import { authorizeRoles } from "../middlewares/roleMiddleware";
import { GlobalAdminRoles } from "../config/global-enum";

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
router.get("/video/initiate", initiateVideoCall);
router.get("/video/join/:roomName", joinVideoCall);
router.get("accept-incoming-call", acceptIncomingCall);

router.post("/video/create-room", createRoom);

// Common call operations
router.post("/:callId/end", endCall);
router.get("/history", getCallHistory);
router.post("/video/notify-join-room", notifyUserToJoinRoom);
router.post("/video/handle-call-response", handleCallResponse);


export default router;