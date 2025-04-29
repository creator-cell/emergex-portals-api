import express from "express";
import {
  accessChat,
  fetchChats,
  createSuperAdminChat,
  generateChatToken,
} from "../controllers/ChatControllers";
import { authenticate } from "../middlewares/authMiddleware";
import { authorizeRoles } from "../middlewares/roleMiddleware";
import { GlobalAdminRoles } from "../config/global-enum";

const router = express.Router();

router
  .route("/")
  .post(
    authenticate,
    authorizeRoles(GlobalAdminRoles.SuperAdmin, GlobalAdminRoles.ClientAdmin),
    accessChat
  )
  .get(
    authenticate,
    authorizeRoles(GlobalAdminRoles.SuperAdmin, GlobalAdminRoles.ClientAdmin),
    fetchChats
  );

  
router.post(
  "/group",
  authenticate,
  authorizeRoles(GlobalAdminRoles.SuperAdmin),
  createSuperAdminChat
);

router.get(
  "/token",
  authenticate,
  authorizeRoles(GlobalAdminRoles.SuperAdmin,GlobalAdminRoles.ClientAdmin),
  generateChatToken
);

export default router;
