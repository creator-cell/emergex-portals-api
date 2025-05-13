import express from "express";
import { authenticate } from "../middlewares/authMiddleware";
import { authorizeRoles } from "../middlewares/roleMiddleware";
import { GlobalAdminRoles } from "../config/global-enum";
import {
  getUserById,
  updateUserById,
  verifyToken,
} from "../controllers/UserControllers";
import {
  updateUserValidation,
  userIdValidation,
} from "../validations/userValidators";
import { checkValidationResult } from "../middlewares/checkValidationsMiddleware";

const router = express.Router();
router.get(
  "/super-admin",
  authenticate,
  authorizeRoles(GlobalAdminRoles.SuperAdmin),
  (req, res) => {
    res.status(200).json({ message: "Welcome, Super Admin!" });
  }
);

router.get(
  "/client-admin",
  authenticate,
  authorizeRoles("client-admin", "super-admin"),
  (req, res) => {
    res.status(200).json({ message: "Welcome, Client Admin!" });
  }
);

router.get("/viewer", authenticate, (req, res) => {
  res.status(200).json({ message: "Welcome, Viewer!" });
});

router.route("/verify-token").get(authenticate, verifyToken);

router
  .route("/:id")
  .get(
    authenticate,
    authorizeRoles(GlobalAdminRoles.SuperAdmin,GlobalAdminRoles.ClientAdmin),
    userIdValidation,
    checkValidationResult,
    getUserById
  )
  .patch(
    authenticate,
    authorizeRoles(GlobalAdminRoles.SuperAdmin,GlobalAdminRoles.ClientAdmin),
    updateUserValidation,
    checkValidationResult,
    updateUserById
  );

export default router;
