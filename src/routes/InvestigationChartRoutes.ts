import express from "express";
import { checkValidationResult } from "../middlewares/checkValidationsMiddleware";
import { body, param } from "express-validator";
import { authorizeRoles } from "../middlewares/roleMiddleware";
import { authenticate } from "../middlewares/authMiddleware";
import { GlobalAdminRoles } from "../config/global-enum";
import { addInvestigationChart, getInvestigationChartByPriority, getInvestigationEmployeesByProject } from "../controllers/InvestigationChartControllers";

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles(GlobalAdminRoles.SuperAdmin, GlobalAdminRoles.ClientAdmin));

const validateInvestigationChart = [
  param("id")
    .notEmpty()
    .withMessage("Project Id is required")
    .isMongoId()
    .withMessage("Invalid project ID"),
  body("role").optional().isMongoId().withMessage("Invalid role ID"),
  body("employee")
    .notEmpty()
    .withMessage("Employee Id is required")
    .isMongoId()
    .withMessage("Invalid employee ID"),
  body("from").optional().isMongoId().withMessage("Invalid from employee ID"),
  body("to").optional().isMongoId().withMessage("Invalid to employee ID"),
];

router.route('/:id')
  .put(validateInvestigationChart, checkValidationResult, addInvestigationChart)
  .get(getInvestigationChartByPriority);

router.route('/employees/:projectId')
  .get(getInvestigationEmployeesByProject);

export default router;
