"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/roleRoutes.ts
const express_1 = __importDefault(require("express"));
const RoleControllers_1 = require("../controllers/RoleControllers");
const roleMiddleware_1 = require("../middlewares/roleMiddleware");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const global_enum_1 = require("../config/global-enum");
const ProjectRoleRoutes_1 = __importDefault(require("./ProjectRoleRoutes"));
const roleValidators_1 = require("../validations/roleValidators");
const checkValidationsMiddleware_1 = require("../middlewares/checkValidationsMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.authenticate);
// Create a new role
router.post("/", (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin), roleValidators_1.createRoleValidations, checkValidationsMiddleware_1.checkValidationResult, RoleControllers_1.createRole);
// Get all roles
router.get("/", (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin, global_enum_1.GlobalAdminRoles.ClientAdmin), RoleControllers_1.getAllRoles);
// Get a single role by ID
router.get("/:id", (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin, global_enum_1.GlobalAdminRoles.ClientAdmin), roleValidators_1.roleByIdValidation, checkValidationsMiddleware_1.checkValidationResult, RoleControllers_1.getRoleById);
// Update a role by ID
router.put("/:id", (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin, global_enum_1.GlobalAdminRoles.ClientAdmin), roleValidators_1.updateRoleValidations, checkValidationsMiddleware_1.checkValidationResult, RoleControllers_1.updateRole);
// Delete a role by ID
router.delete("/:id", (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin), roleValidators_1.roleByIdValidation, checkValidationsMiddleware_1.checkValidationResult, RoleControllers_1.deleteRole);
router.use("/", ProjectRoleRoutes_1.default);
exports.default = router;
