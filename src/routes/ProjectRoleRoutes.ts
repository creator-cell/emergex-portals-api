import express from "express";
import { checkValidationResult } from "../middlewares/checkValidationsMiddleware";
import {addRolesToProjectValidation, validateRolePriority, validateSpecificRole
} from "../validations/projectRoleValidators";

import { authorizeRoles } from "../middlewares/roleMiddleware";
import { GlobalAdminRoles } from "../config/global-enum";
import { addRolesInProject, getProjectRolesByPriority, updateRolePriority, updateSpecificRole,getUserRoleDetails, getRolesByIncidentId, getUserRoleInIncident, getAvailableRolesInProject } from "../controllers/ProjectRoleControllers";
import { incidentsByIdValidationRules } from "../validations/incidentValidators";

const router = express.Router();

router.route('/project-roles/:id').put(addRolesToProjectValidation,checkValidationResult,addRolesInProject)

router.put('/update-project-role/:id',validateSpecificRole,checkValidationResult,updateSpecificRole);

router.get('/user-role-details/:id',incidentsByIdValidationRules,checkValidationResult,getUserRoleDetails);

router.route('/organization-chart/:id')
.put(validateRolePriority,checkValidationResult,updateRolePriority)
.get(getProjectRolesByPriority);

router.route('/incident-roles/:id').get(incidentsByIdValidationRules,checkValidationResult,getRolesByIncidentId);

router.route('/user-role-in-incident/:id').get(incidentsByIdValidationRules,checkValidationResult,getUserRoleInIncident);

router.route('/roles-in-project/:id').get(incidentsByIdValidationRules,checkValidationResult,getAvailableRolesInProject);

router.use(authorizeRoles(GlobalAdminRoles.SuperAdmin,GlobalAdminRoles.ClientAdmin));

export default router;
