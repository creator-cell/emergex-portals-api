import express from "express";
import { checkValidationResult } from "../middlewares/checkValidationsMiddleware";
import { body, param } from "express-validator";
import { authorizeRoles } from "../middlewares/roleMiddleware";
import { GlobalAdminRoles } from "../config/global-enum";
import { addEmergexChart, getEmergexChartByPriority, getEmergexEmployeesByProject } from "../controllers/EmergexChartControllers";

const router = express.Router();

const validateEmergexChart = [
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
.put(validateEmergexChart, checkValidationResult, addEmergexChart)
.get(getEmergexChartByPriority);

router.route('/employees/:projectId')
.get(getEmergexEmployeesByProject);

// Apply authorization middleware if needed
router.use(authorizeRoles(GlobalAdminRoles.SuperAdmin, GlobalAdminRoles.ClientAdmin));

export default router;
