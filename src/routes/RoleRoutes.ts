import express from "express";
import { checkValidationResult } from "../middlewares/checkValidationsMiddleware";
import {addRolesToProjectValidation, validateRolePriority, validateSpecificRole
} from "../validations/roleValidators";

import { authorizeRoles } from "../middlewares/roleMiddleware";
import { GlobalAdminRoles } from "../config/global-enum";
import { authenticate } from "../middlewares/authMiddleware";
import { addRolesInProject, getProjectRolesByPriority, updateRolePriority, updateSpecificRole } from "../controllers/RoleControllers";

const router = express.Router();

router.route('/project-roles/:id').put(addRolesToProjectValidation,checkValidationResult,addRolesInProject);

router.put('/update-project-role/:id',validateSpecificRole,checkValidationResult,updateSpecificRole);

router.route('/organization-chart/:id')
.put(validateRolePriority,checkValidationResult,updateRolePriority)
.get(getProjectRolesByPriority);

router.use(authenticate,authorizeRoles(GlobalAdminRoles.SuperAdmin,GlobalAdminRoles.ClientAdmin));

export default router;
