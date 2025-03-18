// routes/roleRoutes.ts
import express from "express";
import {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
} from "../controllers/RoleControllers";
import { authorizeRoles } from "../middlewares/roleMiddleware";
import { authenticate } from "../middlewares/authMiddleware";
import { GlobalAdminRoles } from "../config/global-enum";
import projectRoleRoutes from "./ProjectRoleRoutes";
import {
  createRoleValidations,
  roleByIdValidation,
  updateRoleValidations,
} from "../validations/roleValidators";
import { checkValidationResult } from "../middlewares/checkValidationsMiddleware";

const router = express.Router();
router.use(authenticate);

// Create a new role
router.post(
  "/",
  authorizeRoles(GlobalAdminRoles.SuperAdmin),
  createRoleValidations,
  checkValidationResult,
  createRole
);

// Get all roles
router.get(
  "/",
  authorizeRoles(GlobalAdminRoles.SuperAdmin, GlobalAdminRoles.ClientAdmin),
  getAllRoles
);

// Get a single role by ID
router.get(
  "/:id",
  authorizeRoles(GlobalAdminRoles.SuperAdmin, GlobalAdminRoles.ClientAdmin),
  roleByIdValidation,
  checkValidationResult,
  getRoleById
);

// Update a role by ID
router.put(
  "/:id",
  authorizeRoles(GlobalAdminRoles.SuperAdmin, GlobalAdminRoles.ClientAdmin),
  updateRoleValidations,
  checkValidationResult,
  updateRole
);

// Delete a role by ID
router.delete(
  "/:id",
  authorizeRoles(GlobalAdminRoles.SuperAdmin),
  roleByIdValidation,
  checkValidationResult,
  deleteRole
);

router.use("/", projectRoleRoutes);

export default router;
