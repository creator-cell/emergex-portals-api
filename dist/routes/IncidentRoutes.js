"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const IncidentControllers_1 = require("../controllers/IncidentControllers");
const checkValidationsMiddleware_1 = require("../middlewares/checkValidationsMiddleware");
const incidentValidators_1 = require("../validations/incidentValidators");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const roleMiddleware_1 = require("../middlewares/roleMiddleware");
const global_enum_1 = require("../config/global-enum");
const router = (0, express_1.Router)();
router
    .route("/")
    .post(authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin, global_enum_1.GlobalAdminRoles.ClientAdmin), incidentValidators_1.incidentValidationRules, checkValidationsMiddleware_1.checkValidationResult, IncidentControllers_1.createIncident);
router.get("/incident-by-project/:id", authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin, global_enum_1.GlobalAdminRoles.ClientAdmin), incidentValidators_1.getIncidentsByProjectIdValidationRules, checkValidationsMiddleware_1.checkValidationResult, IncidentControllers_1.getIncidentsByProject);
router.route("/incident-by-id/:id")
    .get(authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin, global_enum_1.GlobalAdminRoles.ClientAdmin), incidentValidators_1.incidentsByIdValidationRules, checkValidationsMiddleware_1.checkValidationResult, IncidentControllers_1.getIncidentById)
    .put(authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin, global_enum_1.GlobalAdminRoles.ClientAdmin), [...incidentValidators_1.incidentsByIdValidationRules, ...incidentValidators_1.updateIncidentValidationRules], checkValidationsMiddleware_1.checkValidationResult, IncidentControllers_1.updateIncidentById)
    .delete(authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin, global_enum_1.GlobalAdminRoles.ClientAdmin), incidentValidators_1.incidentsByIdValidationRules, checkValidationsMiddleware_1.checkValidationResult, IncidentControllers_1.deleteIncidentById);
// router.get("/incident-by-id/:id", authenticate,authorizeRoles(GlobalAdminRoles.SuperAdmin, GlobalAdminRoles.ClientAdmin),incidentsByIdValidationRules,checkValidationResult,getIncidentsByProject);
router.put("/update-status/:id", authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin, global_enum_1.GlobalAdminRoles.ClientAdmin), incidentValidators_1.updateStatusValidation, checkValidationsMiddleware_1.checkValidationResult, IncidentControllers_1.updateIncidentStatus);
router.put("/stop-timer/:id", authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin, global_enum_1.GlobalAdminRoles.ClientAdmin), incidentValidators_1.incidentsByIdValidationRules, checkValidationsMiddleware_1.checkValidationResult, IncidentControllers_1.stopIncidentTimer);
router.get("/statistics", authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin, global_enum_1.GlobalAdminRoles.ClientAdmin), IncidentControllers_1.getIncidentStatistics);
// router.use(handleErrors);
exports.default = router;
