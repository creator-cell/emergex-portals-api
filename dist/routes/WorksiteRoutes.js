"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const WorksiteControllers_1 = require("../controllers/WorksiteControllers");
const worksiteValidator_1 = require("../validations/worksiteValidator");
const checkValidationsMiddleware_1 = require("../middlewares/checkValidationsMiddleware");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const roleMiddleware_1 = require("../middlewares/roleMiddleware");
const global_enum_1 = require("../config/global-enum");
const router = (0, express_1.Router)();
router.route('/')
    .post(authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin), worksiteValidator_1.validateWorksite, checkValidationsMiddleware_1.checkValidationResult, WorksiteControllers_1.addWorksite)
    .get(authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin, global_enum_1.GlobalAdminRoles.ClientAdmin), WorksiteControllers_1.getAllWorksites);
router.get('/worksite-by-region-id/:id', authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin, global_enum_1.GlobalAdminRoles.ClientAdmin), worksiteValidator_1.getWorksitesByRegionValidation, checkValidationsMiddleware_1.checkValidationResult, WorksiteControllers_1.getWorksitesByRegion);
router.route('/worksite-by-id/:id')
    .get(authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin), worksiteValidator_1.worksitesByIdValidation, checkValidationsMiddleware_1.checkValidationResult, WorksiteControllers_1.getWorksiteById)
    .put(authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin), worksiteValidator_1.updateWorksiteByIdValidation, checkValidationsMiddleware_1.checkValidationResult, WorksiteControllers_1.updateWorksiteById)
    .delete(authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin), worksiteValidator_1.worksitesByIdValidation, checkValidationsMiddleware_1.checkValidationResult, WorksiteControllers_1.deleteWorksiteById);
router.post("/add-workplaces", authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin), worksiteValidator_1.validateCountryRegionWorksites, checkValidationsMiddleware_1.checkValidationResult, WorksiteControllers_1.addCountryRegionWorksites);
exports.default = router;
