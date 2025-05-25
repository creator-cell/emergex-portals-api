import express from "express";
import { authenticate } from "../middlewares/authMiddleware";
import { authorizeRoles } from "../middlewares/roleMiddleware";
import { GlobalAdminRoles } from "../config/global-enum";
import {
  getCurrentIncidentStatusHistoryByRole,
  getIncidentStatusHistory,
  getIncidentUpdateHistory,
  updateIncidentStatusHistoryByRole,
} from "../controllers/IncidentStatusHistoryControllers";
import {
  incidentsByIdValidationRules,
  updateStatusValidation,
} from "../validations/incidentValidators";
const router = express.Router();

router
  .route("/status/:id")
  .get(
    authenticate,
    authorizeRoles(GlobalAdminRoles.ClientAdmin, GlobalAdminRoles.SuperAdmin),
    incidentsByIdValidationRules,
    getIncidentStatusHistory
  )
  .post(
    authenticate,
    authorizeRoles(GlobalAdminRoles.ClientAdmin, GlobalAdminRoles.SuperAdmin),
    updateStatusValidation,
    updateIncidentStatusHistoryByRole
  );

router
  .route("/status/current-status/:id")
  .get(
    authenticate,
    authorizeRoles(GlobalAdminRoles.ClientAdmin, GlobalAdminRoles.SuperAdmin),
    incidentsByIdValidationRules,
    getCurrentIncidentStatusHistoryByRole
  );

router.get(
  "/update/:id",
  authenticate,
  incidentsByIdValidationRules,
  getIncidentUpdateHistory
);

export default router;
