"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ProjectControllers_1 = require("../controllers/ProjectControllers");
const projectValidators_1 = require("../validations/projectValidators");
const checkValidationsMiddleware_1 = require("../middlewares/checkValidationsMiddleware");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const roleMiddleware_1 = require("../middlewares/roleMiddleware");
const global_enum_1 = require("../config/global-enum");
const router = express_1.default.Router();
router.post("/create-project", authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin, global_enum_1.GlobalAdminRoles.ClientAdmin), projectValidators_1.createProjectByNameValidation, checkValidationsMiddleware_1.checkValidationResult, ProjectControllers_1.createProjectByName);
router
    .route("/")
    .post(authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin, global_enum_1.GlobalAdminRoles.ClientAdmin), projectValidators_1.createProjectValidation, checkValidationsMiddleware_1.checkValidationResult, ProjectControllers_1.createProject)
    .get(authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin, global_enum_1.GlobalAdminRoles.ClientAdmin), ProjectControllers_1.getAllProjects);
router.get("/get/all", authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin, global_enum_1.GlobalAdminRoles.ClientAdmin), ProjectControllers_1.getAllProjectsForUser);
router
    .route("/project-by-id/:id")
    .get(authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin, global_enum_1.GlobalAdminRoles.ClientAdmin), projectValidators_1.getProjectByIdValidation, checkValidationsMiddleware_1.checkValidationResult, ProjectControllers_1.getProjectById)
    .put(authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin), projectValidators_1.updateProjectValidation, checkValidationsMiddleware_1.checkValidationResult, ProjectControllers_1.updateProject)
    .delete(authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin), projectValidators_1.getProjectByIdValidation, checkValidationsMiddleware_1.checkValidationResult, ProjectControllers_1.deleteProject);
router.get("/project-by-location", authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin, global_enum_1.GlobalAdminRoles.ClientAdmin), projectValidators_1.projectByLocationValidation, checkValidationsMiddleware_1.checkValidationResult, ProjectControllers_1.getProjectsByLocation);
router.get("/employees-in-project-organization/:id", authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin, global_enum_1.GlobalAdminRoles.ClientAdmin), projectValidators_1.getProjectByIdValidation, checkValidationsMiddleware_1.checkValidationResult, ProjectControllers_1.getAllEmployeesInProjectOrganization);
exports.default = router;
