import express from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/roleMiddleware';
import { GlobalAdminRoles } from '../config/global-enum';
import { getHistoryByIncidentId, incidentHistoryValidation } from '../validations/incidentHistoryValidators';
import { checkValidationResult } from '../middlewares/checkValidationsMiddleware';
import { addIncidentHistory, getIncidentHistoryByIncidentId } from '../controllers/IncidentHistoryControllers';
const router = express.Router();

router.route('/')
.post(authenticate,authorizeRoles(GlobalAdminRoles.SuperAdmin,GlobalAdminRoles.ClientAdmin),incidentHistoryValidation,checkValidationResult,addIncidentHistory);

router.get('/history-by-incident-id/:id',authenticate,authorizeRoles(GlobalAdminRoles.SuperAdmin,GlobalAdminRoles.ClientAdmin),getHistoryByIncidentId,checkValidationResult,getIncidentHistoryByIncidentId);

export default router;