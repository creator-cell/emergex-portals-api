import { Router } from "express";
import { authenticate } from "../middlewares/authMiddleware";
import { authorizeRoles } from "../middlewares/roleMiddleware";
import {
  analyzeIncident,
  getRcaReport,
  listRcaReports,
  refineRca,
  approveRca,
  rejectRca,
  generateRcaPdf,
  getRcaPdfDownloadUrl,
} from "../controllers/RcaControllers";

const router = Router();

// All RCA routes require authentication
router.use(authenticate);

// Any authenticated user can trigger analysis or view reports
router.post(
  "/analyze",
  authorizeRoles("super-admin", "client-admin", "investigator", "viewer"),
  analyzeIncident,
);

router.get(
  "/",
  authorizeRoles("super-admin", "client-admin", "investigator", "viewer"),
  listRcaReports,
);

router.get(
  "/:incidentId",
  authorizeRoles("super-admin", "client-admin", "investigator", "viewer"),
  getRcaReport,
);

// Refine, approve, reject — investigators and admins only
router.post(
  "/refine",
  authorizeRoles("super-admin", "client-admin", "investigator"),
  refineRca,
);

router.post(
  "/approve",
  authorizeRoles("super-admin", "client-admin", "investigator"),
  approveRca,
);

router.post(
  "/reject",
  authorizeRoles("super-admin", "client-admin", "investigator"),
  rejectRca,
);

// PDF generation — investigators and admins
router.post(
  "/:reportId/generate-pdf",
  authorizeRoles("super-admin", "client-admin", "investigator"),
  generateRcaPdf,
);

// Download URL — any authenticated user
router.get(
  "/:reportId/download",
  authorizeRoles("super-admin", "client-admin", "investigator", "viewer"),
  getRcaPdfDownloadUrl,
);

export default router;
