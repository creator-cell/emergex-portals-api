import { Router } from "express";
import {
  getInvestigations,
  getInvestigationById,
  startInvestigationTimer,
  stopInvestigationTimer,
  updateInvestigationStatus,
  getInvestigationHistory,
} from "../controllers/InvestigationControllers";
import { authenticate } from "../middlewares/authMiddleware";
import { authorizeRoles } from "../middlewares/roleMiddleware";

const router = Router();

router.get(
  "/",
  authenticate,
  authorizeRoles("super-admin", "client-admin", "viewer"),
  getInvestigations
);

router.get(
  "/:id",
  authenticate,
  authorizeRoles("super-admin", "client-admin", "viewer"),
  getInvestigationById
);

router.put(
  "/:id/start-timer",
  authenticate,
  authorizeRoles("super-admin", "client-admin"),
  startInvestigationTimer
);

router.put(
  "/:id/stop-timer",
  authenticate,
  authorizeRoles("super-admin", "client-admin"),
  stopInvestigationTimer
);

router.put(
  "/status/:id",
  authenticate,
  authorizeRoles("super-admin", "client-admin", "viewer"),
  updateInvestigationStatus
);

router.get(
  "/history/:id",
  authenticate,
  authorizeRoles("super-admin", "client-admin", "viewer"),
  getInvestigationHistory
);

export default router;
