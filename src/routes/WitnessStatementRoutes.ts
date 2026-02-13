import { Router } from "express";
import {
  addWitnessStatement,
  getWitnessStatementsByInvestigation,
  getWitnessStatementById,
  updateWitnessStatement,
  deleteWitnessStatement,
  deleteWitnessStatementFile,
} from "../controllers/WitnessStatementControllers";
import { authenticate } from "../middlewares/authMiddleware";
import { authorizeRoles } from "../middlewares/roleMiddleware";
import { handleDocumentsUpload } from "../config/MulterConfig";

const router = Router();

router.post(
  "/",
  authenticate,
  authorizeRoles("super-admin", "client-admin", "viewer"),
  handleDocumentsUpload,
  addWitnessStatement
);

router.get(
  "/investigation/:investigationId",
  authenticate,
  authorizeRoles("super-admin", "client-admin", "viewer"),
  getWitnessStatementsByInvestigation
);

router.get(
  "/:id",
  authenticate,
  authorizeRoles("super-admin", "client-admin", "viewer"),
  getWitnessStatementById
);

router.put(
  "/:id",
  authenticate,
  authorizeRoles("super-admin", "client-admin", "viewer"),
  handleDocumentsUpload,
  updateWitnessStatement
);

router.delete(
  "/:id",
  authenticate,
  authorizeRoles("super-admin", "client-admin"),
  deleteWitnessStatement
);

router.delete(
  "/:id/files/:fileIndex",
  authenticate,
  authorizeRoles("super-admin", "client-admin", "viewer"),
  deleteWitnessStatementFile
);

export default router;
