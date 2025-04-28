"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const countryValidator_1 = require("../validations/countryValidator");
const checkValidationsMiddleware_1 = require("../middlewares/checkValidationsMiddleware");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const roleMiddleware_1 = require("../middlewares/roleMiddleware");
const global_enum_1 = require("../config/global-enum");
const regionValidator_1 = require("../validations/regionValidator");
const RegionControllers_1 = require("../controllers/RegionControllers");
const router = express_1.default.Router();
router
    .route("/")
    .post(authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin), regionValidator_1.validateRegion, checkValidationsMiddleware_1.checkValidationResult, RegionControllers_1.addRegion)
    .get(authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin, global_enum_1.GlobalAdminRoles.ClientAdmin), RegionControllers_1.getAllRegions);
router
    .route("/region-by-id/:id")
    .get(authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin), regionValidator_1.regionByIdValidation, checkValidationsMiddleware_1.checkValidationResult, RegionControllers_1.getRegionById)
    .put(authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin), regionValidator_1.updateRegionByIdValidation, checkValidationsMiddleware_1.checkValidationResult, RegionControllers_1.updateRegionById)
    .delete(authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin), regionValidator_1.regionByIdValidation, checkValidationsMiddleware_1.checkValidationResult, RegionControllers_1.deleteRegionById);
router.get("/region-by-country-id/:id", authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin, global_enum_1.GlobalAdminRoles.ClientAdmin), countryValidator_1.CountryByIdValidation, checkValidationsMiddleware_1.checkValidationResult, RegionControllers_1.getRegionsByCountry);
exports.default = router;
