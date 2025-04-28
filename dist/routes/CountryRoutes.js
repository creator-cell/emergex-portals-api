"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const CountryControllers_1 = require("../controllers/CountryControllers");
const countryValidator_1 = require("../validations/countryValidator");
const checkValidationsMiddleware_1 = require("../middlewares/checkValidationsMiddleware");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const roleMiddleware_1 = require("../middlewares/roleMiddleware");
const global_enum_1 = require("../config/global-enum");
const router = express_1.default.Router();
router
    .route("/")
    .post(authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin), countryValidator_1.validateCountry, checkValidationsMiddleware_1.checkValidationResult, CountryControllers_1.addCountry)
    .get(authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin, global_enum_1.GlobalAdminRoles.ClientAdmin), CountryControllers_1.getAllCountries);
router
    .route("/country-by-id/:id")
    .get(authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin), countryValidator_1.CountryByIdValidation, checkValidationsMiddleware_1.checkValidationResult, CountryControllers_1.getCountryById)
    .put(authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin), countryValidator_1.updateCountryByIdValidation, checkValidationsMiddleware_1.checkValidationResult, CountryControllers_1.updateCountryById)
    .delete(authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin), countryValidator_1.CountryByIdValidation, checkValidationsMiddleware_1.checkValidationResult, CountryControllers_1.deleteCountryById);
router.get("/get-all-countries-workplaces", authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin), CountryControllers_1.getCountryRegionsWorksites);
exports.default = router;
