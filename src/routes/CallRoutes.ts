import express from "express";
import {
  initiateVideoCall,
  acceptIncomingCall,
  handleEndCall,
  fetchCallByConversation,
} from "../controllers/CallControllers";
import { authenticate } from "../middlewares/authMiddleware";
import { authorizeRoles } from "../middlewares/roleMiddleware";
import { GlobalAdminRoles } from "../config/global-enum";
import {
  fetchCallByConversationValidator,
  initiateVideoCallValidator,
} from "../validations/callValidators";
import { checkValidationResult } from "../middlewares/checkValidationsMiddleware";

const router = express.Router();

// Public routes for Twilio webhooks (no auth)
// router.post("/voice/webhook", handleVoiceWebhook);
// router.post("/voice/connect/:toIdentity", connectVoiceCall);

// Protected routes
router.use(
  authenticate,
  authorizeRoles(GlobalAdminRoles.SuperAdmin, GlobalAdminRoles.ClientAdmin)
);

// Token generation
// router.get("/token", generateCallToken);
// router.get("/generate-token", generateCallToken);

// Video calls
router.get(
  "/initiate",
  initiateVideoCallValidator,
  checkValidationResult,
  initiateVideoCall
);

router.get(
  "/accept-incoming-call",
  // acceptIncomingCallValidation,
  // checkValidationResult,
  acceptIncomingCall
);

router.patch(
  "/end-call/:roomName",
  // handleCallEndValidation,
  // checkValidationResult,
  handleEndCall
);

router.get(
  "/call-by-conversation/:id",
  fetchCallByConversationValidator,
  checkValidationResult,
  fetchCallByConversation
);

export default router;
