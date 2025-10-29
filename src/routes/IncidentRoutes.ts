import { Router } from "express";
import { approveIncidentById, createIncident, deleteIncidentById, generateIncidentReport, getIncidentById, getIncidentReportsGroupByProjects, getIncidentsByProject, getIncidentStatistics, markedAsNearMiss, stopIncidentTimer, updateIncidentById, updateIncidentStatus } from "../controllers/IncidentControllers";
import { checkValidationResult } from "../middlewares/checkValidationsMiddleware";
import { getIncidentsByProjectIdValidationRules, incidentsByIdValidationRules, incidentValidationRules, updateIncidentValidationRules, updateStatusValidation } from "../validations/incidentValidators";
import { authenticate } from "../middlewares/authMiddleware";
import { authorizeRoles } from "../middlewares/roleMiddleware";
import { GlobalAdminRoles } from "../config/global-enum";
import { normalizeImageData } from "../middlewares/imageNormalizer";

const router = Router();

router
  .route("/")
  .post(
    authenticate,
    authorizeRoles(GlobalAdminRoles.SuperAdmin, GlobalAdminRoles.ClientAdmin),
    // incidentValidationRules,
    // checkValidationResult,
    normalizeImageData,
    createIncident
  );


router.get("/incident-by-project/:id", authenticate, authorizeRoles(GlobalAdminRoles.SuperAdmin, GlobalAdminRoles.ClientAdmin), getIncidentsByProjectIdValidationRules, checkValidationResult, getIncidentsByProject)

router.route("/incident-by-id/:id")
  .get(authenticate, authorizeRoles(GlobalAdminRoles.SuperAdmin, GlobalAdminRoles.ClientAdmin), incidentsByIdValidationRules, checkValidationResult, getIncidentById)
  .put(authenticate, authorizeRoles(GlobalAdminRoles.SuperAdmin, GlobalAdminRoles.ClientAdmin), normalizeImageData, updateIncidentById)
  .delete(authenticate, authorizeRoles(GlobalAdminRoles.SuperAdmin, GlobalAdminRoles.ClientAdmin), incidentsByIdValidationRules, checkValidationResult, deleteIncidentById);

router.put("/update-status/:id", authenticate, authorizeRoles(GlobalAdminRoles.SuperAdmin, GlobalAdminRoles.ClientAdmin), updateStatusValidation, checkValidationResult, updateIncidentStatus);

router.put("/stop-timer/:id", authenticate, authorizeRoles(GlobalAdminRoles.SuperAdmin, GlobalAdminRoles.ClientAdmin), incidentsByIdValidationRules, checkValidationResult, stopIncidentTimer)

router.get("/statistics", authenticate, authorizeRoles(GlobalAdminRoles.SuperAdmin, GlobalAdminRoles.ClientAdmin), getIncidentStatistics);

router.patch('/approve/:id', authenticate, authorizeRoles(GlobalAdminRoles.ClientAdmin, GlobalAdminRoles.SuperAdmin), approveIncidentById);

router.patch('/near-miss/:id', authenticate, authorizeRoles(GlobalAdminRoles.ClientAdmin, GlobalAdminRoles.SuperAdmin), markedAsNearMiss);

router.post('/report/:id', authenticate, authorizeRoles(GlobalAdminRoles.ClientAdmin, GlobalAdminRoles.SuperAdmin), generateIncidentReport);

router.get('/reports/:projectId', authenticate, authorizeRoles(GlobalAdminRoles.ClientAdmin, GlobalAdminRoles.SuperAdmin), getIncidentReportsGroupByProjects);

export default router;
