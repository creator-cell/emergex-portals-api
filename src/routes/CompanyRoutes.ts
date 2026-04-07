import { Router } from "express";
import {
  getCompany,
  getCompanyById,
  updateCompany,
} from "../controllers/CompanyControllers";
import { authenticate } from "../middlewares/authMiddleware";
import { companyIdValidator, updateCompanyValidator } from "../validations/companyValidator";
import { checkValidationResult } from "../middlewares/checkValidationsMiddleware";

const router = Router();

router.get("/me", authenticate, getCompany);
router.get("/:id", authenticate, companyIdValidator, checkValidationResult, getCompanyById);
router.put(
  "/",
  authenticate,
  updateCompanyValidator,
  checkValidationResult,
  updateCompany
);

export default router;
