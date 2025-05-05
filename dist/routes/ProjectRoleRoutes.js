"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const checkValidationsMiddleware_1 = require("../middlewares/checkValidationsMiddleware");
const projectRoleValidators_1 = require("../validations/projectRoleValidators");
const roleMiddleware_1 = require("../middlewares/roleMiddleware");
const global_enum_1 = require("../config/global-enum");
const ProjectRoleControllers_1 = require("../controllers/ProjectRoleControllers");
const incidentValidators_1 = require("../validations/incidentValidators");
const router = express_1.default.Router();
router.route('/project-roles/:id').put(projectRoleValidators_1.addRolesToProjectValidation, checkValidationsMiddleware_1.checkValidationResult, ProjectRoleControllers_1.addRolesInProject);
router.put('/update-project-role/:id', projectRoleValidators_1.validateSpecificRole, checkValidationsMiddleware_1.checkValidationResult, ProjectRoleControllers_1.updateSpecificRole);
router.get('/user-role-details/:id', incidentValidators_1.incidentsByIdValidationRules, checkValidationsMiddleware_1.checkValidationResult, ProjectRoleControllers_1.getUserRoleDetails);
router.route('/organization-chart/:id')
    .put(projectRoleValidators_1.validateRolePriority, checkValidationsMiddleware_1.checkValidationResult, ProjectRoleControllers_1.updateRolePriority)
    .get(ProjectRoleControllers_1.getProjectRolesByPriority);
router.route('/incident-roles/:id').get(incidentValidators_1.incidentsByIdValidationRules, checkValidationsMiddleware_1.checkValidationResult, ProjectRoleControllers_1.getRolesByIncidentId);
router.route('/user-role-in-incident/:id').get(incidentValidators_1.incidentsByIdValidationRules, checkValidationsMiddleware_1.checkValidationResult, ProjectRoleControllers_1.getUserRoleInIncident);
router.use((0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin, global_enum_1.GlobalAdminRoles.ClientAdmin));
exports.default = router;
