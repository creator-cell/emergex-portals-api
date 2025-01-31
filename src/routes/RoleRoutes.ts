import express from "express";
import { checkValidationResult } from "../middlewares/checkValidationsMiddleware";
import {
  createRoleValidation,
  roleByIdValidations,
  updateRoleValidation,
} from "../validations/roleValidators";
import {
  createRole,
  getRoles,
  getRoleById,
  updateRole,
  deleteRole,
} from "../controllers/RoleControllers";
import { authorizeRoles } from "../middlewares/roleMiddleware";
import { GlobalAdminRoles } from "../config/global-enum";
import { authenticate } from "../middlewares/authMiddleware";

const router = express.Router();

router
  .route("/")
  .post(authenticate,authorizeRoles(GlobalAdminRoles.SuperAdmin,GlobalAdminRoles.ClientAdmin),createRoleValidation, checkValidationResult, createRole)
  .get(authenticate,authorizeRoles(GlobalAdminRoles.SuperAdmin,GlobalAdminRoles.ClientAdmin),getRoles);

router.route("/role-by-id/:id")
.get(authenticate,authorizeRoles(GlobalAdminRoles.SuperAdmin),roleByIdValidations,checkValidationResult, getRoleById)
.put(authenticate,authorizeRoles(GlobalAdminRoles.SuperAdmin),authenticate,authorizeRoles(GlobalAdminRoles.SuperAdmin),updateRoleValidation, checkValidationResult, updateRole)
.delete(authenticate,authorizeRoles(GlobalAdminRoles.SuperAdmin),roleByIdValidations,checkValidationResult,deleteRole);

export default router;
