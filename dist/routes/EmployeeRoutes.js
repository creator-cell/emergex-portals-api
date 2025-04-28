"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const EmployeeControllers_1 = require("../controllers/EmployeeControllers");
const employeeValidators_1 = require("../validations/employeeValidators");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const roleMiddleware_1 = require("../middlewares/roleMiddleware");
const global_enum_1 = require("../config/global-enum");
const checkValidationsMiddleware_1 = require("../middlewares/checkValidationsMiddleware");
const router = express_1.default.Router();
router.post("/", authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin), employeeValidators_1.validateCreateEmployee, checkValidationsMiddleware_1.checkValidationResult, EmployeeControllers_1.createEmployee);
router.get("/", authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin, global_enum_1.GlobalAdminRoles.ClientAdmin), EmployeeControllers_1.getEmployees);
router.route("/employee-by-id/:id").get(authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin), employeeValidators_1.validateEmployeeId, checkValidationsMiddleware_1.checkValidationResult, EmployeeControllers_1.getEmployeeById).put(authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin), employeeValidators_1.validateUpdateEmployee, checkValidationsMiddleware_1.checkValidationResult, EmployeeControllers_1.updateEmployee).delete(authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin), employeeValidators_1.validateEmployeeId, checkValidationsMiddleware_1.checkValidationResult, EmployeeControllers_1.deleteEmployee);
exports.default = router;
