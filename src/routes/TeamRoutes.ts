import express from 'express';
import { addNewMemberToTeam, createTeam, getAllTeams, getTeamDetails, getTeamEmployees, getTeamNames, removeMemberFromTeam, updateTeamDetail } from '../controllers/TeamControllers';
import { addRemoveTeamMemberValidation, teamGetByIdValidation, teamValidationRules,teamUpdateByIdValidation } from '../validations/teamValidators';
import { authenticate } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/roleMiddleware';
import { GlobalAdminRoles } from '../config/global-enum';
import { checkValidationResult } from '../middlewares/checkValidationsMiddleware';
const router = express.Router();

router.route('/')
.post(authenticate, authorizeRoles(GlobalAdminRoles.SuperAdmin,GlobalAdminRoles.ClientAdmin),teamValidationRules,checkValidationResult,createTeam)
.get(authenticate, authorizeRoles(GlobalAdminRoles.SuperAdmin,GlobalAdminRoles.ClientAdmin),getAllTeams)

router.put('/add-member/:id',authenticate, authorizeRoles(GlobalAdminRoles.SuperAdmin,GlobalAdminRoles.ClientAdmin),addRemoveTeamMemberValidation,checkValidationResult,addNewMemberToTeam)

router.put('/remove-member/:id',authenticate, authorizeRoles(GlobalAdminRoles.SuperAdmin,GlobalAdminRoles.ClientAdmin),addRemoveTeamMemberValidation,checkValidationResult,removeMemberFromTeam)

router.route("/team-by-id/:id").get(authenticate, authorizeRoles(GlobalAdminRoles.SuperAdmin,GlobalAdminRoles.ClientAdmin),teamGetByIdValidation,checkValidationResult,getTeamDetails).put(authenticate, authorizeRoles(GlobalAdminRoles.SuperAdmin,GlobalAdminRoles.ClientAdmin),teamUpdateByIdValidation,checkValidationResult,updateTeamDetail)

router.get("/team-names",authenticate, authorizeRoles(GlobalAdminRoles.SuperAdmin,GlobalAdminRoles.ClientAdmin),getTeamNames);
router.get("/employees-of-team/:id",authenticate, authorizeRoles(GlobalAdminRoles.SuperAdmin,GlobalAdminRoles.ClientAdmin),teamGetByIdValidation,checkValidationResult,getTeamEmployees)

export default router;