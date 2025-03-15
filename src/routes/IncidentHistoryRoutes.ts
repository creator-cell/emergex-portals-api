import express from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/roleMiddleware';
import { GlobalAdminRoles } from '../config/global-enum';
import { getIncidentStatusHistory, getIncidentUpdateHistory } from '../controllers/IncidentStatusHistoryControllers';
import { incidentsByIdValidationRules } from '../validations/incidentValidators';
const router = express.Router();

router.get('/status/:id',authenticate,incidentsByIdValidationRules,getIncidentStatusHistory)
router.get('/update/:id',authenticate,incidentsByIdValidationRules,getIncidentUpdateHistory)

export default router;