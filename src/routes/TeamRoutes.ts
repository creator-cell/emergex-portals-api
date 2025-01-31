import express from 'express';
import { addNewMemberToTeam, createTeam, getAllTeams, getTeamDetails, removeMemberFromTeam, updateTeamDetail } from '../controllers/TeamControllers';
import { addRemoveTeamMemberValidation, teamGetByIdValidation, teamValidationRules,teamUpdateByIdValidation } from '../validations/teamValidators';
import { authenticate } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/roleMiddleware';
import { GlobalAdminRoles } from '../config/global-enum';
import { checkValidationResult } from '../middlewares/checkValidationsMiddleware';
const router = express.Router();

router.route('/')
.post(authenticate, authorizeRoles(GlobalAdminRoles.SuperAdmin),teamValidationRules,checkValidationResult,createTeam)
.get(authenticate, authorizeRoles(GlobalAdminRoles.SuperAdmin),getAllTeams)

router.put('/add-member/:id',authenticate, authorizeRoles(GlobalAdminRoles.SuperAdmin),addRemoveTeamMemberValidation,checkValidationResult,addNewMemberToTeam)

router.put('/remove-member/:id',authenticate, authorizeRoles(GlobalAdminRoles.SuperAdmin),addRemoveTeamMemberValidation,checkValidationResult,removeMemberFromTeam)

router.route("/team-by-id/:id").get(authenticate, authorizeRoles(GlobalAdminRoles.SuperAdmin),teamGetByIdValidation,checkValidationResult,getTeamDetails).put(authenticate, authorizeRoles(GlobalAdminRoles.SuperAdmin),teamUpdateByIdValidation,checkValidationResult,updateTeamDetail)

export default router;