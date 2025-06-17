import { Router } from "express";
import { createIncident, deleteIncidentById, getIncidentById, getIncidentsByProject, getIncidentStatistics, stopIncidentTimer, updateIncidentById, updateIncidentStatus } from "../controllers/IncidentControllers";
import { uploadFiles } from "../middlewares/uploadMiddleware";
import { handleErrors } from "../middlewares/multerErrorMiddleware";
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
    incidentValidationRules,
    checkValidationResult,
    normalizeImageData,
    createIncident
  );


router.get("/incident-by-project/:id", authenticate,authorizeRoles(GlobalAdminRoles.SuperAdmin, GlobalAdminRoles.ClientAdmin),getIncidentsByProjectIdValidationRules,checkValidationResult,getIncidentsByProject)

router.route("/incident-by-id/:id")
.get(authenticate,authorizeRoles(GlobalAdminRoles.SuperAdmin, GlobalAdminRoles.ClientAdmin),incidentsByIdValidationRules,checkValidationResult,getIncidentById)
.put(authenticate,authorizeRoles(GlobalAdminRoles.SuperAdmin, GlobalAdminRoles.ClientAdmin),[...incidentsByIdValidationRules,...updateIncidentValidationRules],checkValidationResult,normalizeImageData,updateIncidentById)
.delete(authenticate,authorizeRoles(GlobalAdminRoles.SuperAdmin, GlobalAdminRoles.ClientAdmin),incidentsByIdValidationRules,checkValidationResult,deleteIncidentById);

// router.get("/incident-by-id/:id", authenticate,authorizeRoles(GlobalAdminRoles.SuperAdmin, GlobalAdminRoles.ClientAdmin),incidentsByIdValidationRules,checkValidationResult,getIncidentsByProject);

router.put("/update-status/:id",authenticate,authorizeRoles(GlobalAdminRoles.SuperAdmin, GlobalAdminRoles.ClientAdmin),updateStatusValidation,checkValidationResult,updateIncidentStatus);

router.put("/stop-timer/:id",authenticate,authorizeRoles(GlobalAdminRoles.SuperAdmin, GlobalAdminRoles.ClientAdmin),incidentsByIdValidationRules,checkValidationResult,stopIncidentTimer)

router.get("/statistics", authenticate,authorizeRoles(GlobalAdminRoles.SuperAdmin, GlobalAdminRoles.ClientAdmin),getIncidentStatistics);

// router.use(handleErrors);

export default router;
