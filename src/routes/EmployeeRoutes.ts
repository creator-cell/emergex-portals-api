import express from "express";
import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getUnassignedEmployees,
  getEmployeesNotInProject,
} from "../controllers/EmployeeControllers";
import {
  validateCreateEmployee,
  validateEmployeeId,
  validateUpdateEmployee,
} from "../validations/employeeValidators";
import { authenticate } from "../middlewares/authMiddleware";
import { authorizeRoles } from "../middlewares/roleMiddleware";
import { GlobalAdminRoles } from "../config/global-enum";
import { checkValidationResult } from "../middlewares/checkValidationsMiddleware";

const router = express.Router();

router.post(
  "/",
  authenticate,
  authorizeRoles(GlobalAdminRoles.SuperAdmin),
  validateCreateEmployee,
  checkValidationResult,
  createEmployee
);
router.get(
  "/",
  authenticate,
  authorizeRoles(GlobalAdminRoles.SuperAdmin, GlobalAdminRoles.ClientAdmin),
  getEmployees
);

router
  .route("/employee-by-id/:id")
  .get(
    authenticate,
    authorizeRoles(GlobalAdminRoles.SuperAdmin),
    validateEmployeeId,
    checkValidationResult,
    getEmployeeById
  )
  .put(
    authenticate,
    authorizeRoles(GlobalAdminRoles.SuperAdmin),
    validateUpdateEmployee,
    checkValidationResult,
    updateEmployee
  )
  .delete(
    authenticate,
    authorizeRoles(GlobalAdminRoles.SuperAdmin),
    validateEmployeeId,
    checkValidationResult,
    deleteEmployee
  );

router.get(
  "/not-in-team",
  authenticate,
  authorizeRoles(GlobalAdminRoles.SuperAdmin),
  // validateCreateEmployee,
  getUnassignedEmployees
);

router
  .route("/not-in-project/:id")
  .get(
    authenticate,
    authorizeRoles(GlobalAdminRoles.SuperAdmin, GlobalAdminRoles.ClientAdmin),
    getEmployeesNotInProject
  );

export default router;
