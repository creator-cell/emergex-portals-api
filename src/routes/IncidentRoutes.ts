import { Router } from "express";
import {
  approveIncidentById,
  createIncident,
  deleteIncidentById,
  generateIncidentReport,
  getIncidentById,
  getIncidentReportsGroupByProjects,
  getIncidentsByProject,
  getIncidentStatistics,
  markedAsNearMiss,
  stopIncidentTimer,
  updateIncidentById,
  updateIncidentStatus,
} from "../controllers/IncidentControllers";
import { checkValidationResult } from "../middlewares/checkValidationsMiddleware";
import {
  getIncidentsByProjectIdValidationRules,
  incidentsByIdValidationRules,
  incidentValidationRules,
  updateIncidentValidationRules,
  updateStatusValidation,
} from "../validations/incidentValidators";
import { authenticate } from "../middlewares/authMiddleware";
import { authorizeRoles } from "../middlewares/roleMiddleware";
import { GlobalAdminRoles } from "../config/global-enum";
import { normalizeImageData } from "../middlewares/imageNormalizer";
import { writeLimiter, heavyLimiter } from "../middlewares/rateLimiter.middleware";

const router = Router();

// All incident routes require authentication
router.use(authenticate);

// ─── Create incident ──────────────────────────────────────────────────────────
router.post(
  "/",
  authorizeRoles(GlobalAdminRoles.SuperAdmin, GlobalAdminRoles.ClientAdmin),
  writeLimiter,
  incidentValidationRules,   // re-enabled — was incorrectly commented out
  checkValidationResult,
  normalizeImageData,
  createIncident
);

// ─── Read ─────────────────────────────────────────────────────────────────────
router.get(
  "/incident-by-project/:id",
  authorizeRoles(GlobalAdminRoles.SuperAdmin, GlobalAdminRoles.ClientAdmin),
  getIncidentsByProjectIdValidationRules,
  checkValidationResult,
  getIncidentsByProject
);

router.get(
  "/incident-by-id/:id",
  authorizeRoles(GlobalAdminRoles.SuperAdmin, GlobalAdminRoles.ClientAdmin),
  incidentsByIdValidationRules,
  checkValidationResult,
  getIncidentById
);

router.get(
  "/statistics",
  authorizeRoles(GlobalAdminRoles.SuperAdmin, GlobalAdminRoles.ClientAdmin),
  getIncidentStatistics
);

router.get(
  "/reports/:projectId",
  authorizeRoles(GlobalAdminRoles.ClientAdmin, GlobalAdminRoles.SuperAdmin),
  getIncidentReportsGroupByProjects
);

// ─── Update ───────────────────────────────────────────────────────────────────
router.put(
  "/incident-by-id/:id",
  authorizeRoles(GlobalAdminRoles.SuperAdmin, GlobalAdminRoles.ClientAdmin),
  writeLimiter,
  updateIncidentValidationRules,
  checkValidationResult,
  normalizeImageData,
  updateIncidentById
);

router.put(
  "/update-status/:id",
  authorizeRoles(GlobalAdminRoles.SuperAdmin, GlobalAdminRoles.ClientAdmin),
  updateStatusValidation,
  checkValidationResult,
  updateIncidentStatus
);

router.put(
  "/stop-timer/:id",
  authorizeRoles(GlobalAdminRoles.SuperAdmin, GlobalAdminRoles.ClientAdmin),
  incidentsByIdValidationRules,
  checkValidationResult,
  stopIncidentTimer
);

// ─── Delete ───────────────────────────────────────────────────────────────────
router.delete(
  "/incident-by-id/:id",
  authorizeRoles(GlobalAdminRoles.SuperAdmin, GlobalAdminRoles.ClientAdmin),
  incidentsByIdValidationRules,
  checkValidationResult,
  deleteIncidentById
);

// ─── Patch actions ────────────────────────────────────────────────────────────
router.patch(
  "/approve/:id",
  authorizeRoles(GlobalAdminRoles.ClientAdmin, GlobalAdminRoles.SuperAdmin),
  approveIncidentById
);

router.patch(
  "/near-miss/:id",
  authorizeRoles(GlobalAdminRoles.ClientAdmin, GlobalAdminRoles.SuperAdmin),
  markedAsNearMiss
);

// ─── Reports ──────────────────────────────────────────────────────────────────
router.post(
  "/report/:id",
  authorizeRoles(GlobalAdminRoles.ClientAdmin, GlobalAdminRoles.SuperAdmin),
  heavyLimiter,
  generateIncidentReport
);

export default router;
