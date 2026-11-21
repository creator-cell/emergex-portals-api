import express from "express";
import { register, login, changePassword } from "../controllers/AuthContollers";
import {
  validateLogin,
  validateRegister,
  validateChangePassword,
} from "../validations/authValidators";
import { authenticate } from "../middlewares/authMiddleware";
import { authorizeRoles } from "../middlewares/roleMiddleware";
import { GlobalAdminRoles } from "../config/global-enum";
import { checkValidationResult } from "../middlewares/checkValidationsMiddleware";
import { authLimiter } from "../middlewares/rateLimiter.middleware";

const router = express.Router();

// Login is the most sensitive endpoint — strict rate limit
router.post("/login", authLimiter, validateLogin, checkValidationResult, login);

// Register is super-admin only — still rate-limited
router.post(
  "/register",
  authLimiter,
  authenticate,
  authorizeRoles(GlobalAdminRoles.SuperAdmin),
  validateRegister,
  checkValidationResult,
  register
);

router.put(
  "/change-password",
  authenticate,
  authorizeRoles(GlobalAdminRoles.SuperAdmin, GlobalAdminRoles.ClientAdmin),
  validateChangePassword,
  checkValidationResult,
  changePassword
);

export default router;
