"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const roleMiddleware_1 = require("../middlewares/roleMiddleware");
const global_enum_1 = require("../config/global-enum");
const IncidentStatusHistoryControllers_1 = require("../controllers/IncidentStatusHistoryControllers");
const incidentValidators_1 = require("../validations/incidentValidators");
const router = express_1.default.Router();
router
    .route("/status/:id")
    .get(authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.ClientAdmin, global_enum_1.GlobalAdminRoles.SuperAdmin), incidentValidators_1.incidentsByIdValidationRules, IncidentStatusHistoryControllers_1.getIncidentStatusHistory)
    .post(authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.ClientAdmin, global_enum_1.GlobalAdminRoles.SuperAdmin), incidentValidators_1.updateStatusValidation, IncidentStatusHistoryControllers_1.updateIncidentStatusHistoryByRole);
router
    .route("/status/current-status/:id")
    .get(authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.ClientAdmin, global_enum_1.GlobalAdminRoles.SuperAdmin), incidentValidators_1.incidentsByIdValidationRules, IncidentStatusHistoryControllers_1.getCurrentIncidentStatusHistoryByRole);
router.get("/update/:id", authMiddleware_1.authenticate, incidentValidators_1.incidentsByIdValidationRules, IncidentStatusHistoryControllers_1.getIncidentUpdateHistory);
exports.default = router;
