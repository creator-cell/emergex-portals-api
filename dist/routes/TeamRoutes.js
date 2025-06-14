"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const TeamControllers_1 = require("../controllers/TeamControllers");
const teamValidators_1 = require("../validations/teamValidators");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const roleMiddleware_1 = require("../middlewares/roleMiddleware");
const global_enum_1 = require("../config/global-enum");
const checkValidationsMiddleware_1 = require("../middlewares/checkValidationsMiddleware");
const router = express_1.default.Router();
router.route('/')
    .post(authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin, global_enum_1.GlobalAdminRoles.ClientAdmin), teamValidators_1.teamValidationRules, checkValidationsMiddleware_1.checkValidationResult, TeamControllers_1.createTeam)
    .get(authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin, global_enum_1.GlobalAdminRoles.ClientAdmin), TeamControllers_1.getAllTeams);
router.put('/add-member/:id', authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin), teamValidators_1.addRemoveTeamMemberValidation, checkValidationsMiddleware_1.checkValidationResult, TeamControllers_1.addNewMemberToTeam);
router.put('/remove-member/:id', authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin), teamValidators_1.removeTeamMemberValidation, checkValidationsMiddleware_1.checkValidationResult, TeamControllers_1.removeMemberFromTeam);
router.route("/team-by-id/:id").get(authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin, global_enum_1.GlobalAdminRoles.ClientAdmin), teamValidators_1.teamGetByIdValidation, checkValidationsMiddleware_1.checkValidationResult, TeamControllers_1.getTeamDetails).put(authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin, global_enum_1.GlobalAdminRoles.ClientAdmin), teamValidators_1.teamUpdateByIdValidation, checkValidationsMiddleware_1.checkValidationResult, TeamControllers_1.updateTeamDetail);
router.get("/team-names", authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin, global_enum_1.GlobalAdminRoles.ClientAdmin), TeamControllers_1.getTeamNames);
router.get("/employees-of-team/:id", authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin, global_enum_1.GlobalAdminRoles.ClientAdmin), teamValidators_1.teamGetByIdValidation, checkValidationsMiddleware_1.checkValidationResult, TeamControllers_1.getTeamEmployees);
exports.default = router;
