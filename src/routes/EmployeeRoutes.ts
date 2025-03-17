import express from "express";
import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} from "../controllers/EmployeeControllers";
import { validateCreateEmployee, validateEmployeeId, validateUpdateEmployee } from "../validations/employeeValidators";
import { authenticate } from "../middlewares/authMiddleware";
import { authorizeRoles } from "../middlewares/roleMiddleware";
import { GlobalAdminRoles } from "../config/global-enum";
import { checkValidationResult } from "../middlewares/checkValidationsMiddleware";

const router = express.Router();

router.post("/:id",authenticate, authorizeRoles(GlobalAdminRoles.SuperAdmin) ,validateCreateEmployee,checkValidationResult,createEmployee)
router.get("/",authenticate, authorizeRoles(GlobalAdminRoles.SuperAdmin,GlobalAdminRoles.ClientAdmin),getEmployees);     

router.route("/employee-by-id/:id").get(authenticate, authorizeRoles(GlobalAdminRoles.SuperAdmin),validateEmployeeId,checkValidationResult,getEmployeeById).put(authenticate, authorizeRoles(GlobalAdminRoles.SuperAdmin),validateUpdateEmployee,checkValidationResult,updateEmployee).delete(authenticate, authorizeRoles(GlobalAdminRoles.SuperAdmin),validateEmployeeId,checkValidationResult,deleteEmployee);     

export default router;
