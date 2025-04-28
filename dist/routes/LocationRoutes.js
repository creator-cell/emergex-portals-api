"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
// import {
//   createLocation,
//   getLocations,
//   getLocationById,
//   updateLocation,
//   deleteLocation,
//   hardDeleteLocation,
//   getDistinctCountries,
//   getWorksitesByRegionAndCountry,
//   getRegionsByCountry,
// } from '../controllers/LocationControllers';
// import { validateCreateLocation, validateUpdateLocation, validateLocationId } from '../validations/locationValidator';
// import { checkValidationResult } from '../middlewares/checkValidationsMiddleware';
// import { authenticate } from '../middlewares/authMiddleware';
// import { authorizeRoles } from '../middlewares/roleMiddleware';
// import { GlobalAdminRoles } from '../config/global-enum';
const router = express_1.default.Router();
// router.route('/')
// .post(authenticate,authorizeRoles(GlobalAdminRoles.SuperAdmin),validateCreateLocation, checkValidationResult, createLocation)
// .get(authenticate,authorizeRoles(GlobalAdminRoles.SuperAdmin),getLocations);
// router.route('/location-by-id/:id')
// .get(authenticate,authorizeRoles(GlobalAdminRoles.SuperAdmin),validateLocationId, checkValidationResult, getLocationById)
// .put(authenticate,authorizeRoles(GlobalAdminRoles.SuperAdmin),validateUpdateLocation, checkValidationResult, updateLocation)
// .delete(authenticate,authorizeRoles(GlobalAdminRoles.SuperAdmin),validateLocationId, checkValidationResult, deleteLocation);
// router.delete('/hard-delete/:id',authenticate,authorizeRoles(GlobalAdminRoles.SuperAdmin),validateLocationId, checkValidationResult, hardDeleteLocation);
// router.get('/distinct-countries',getDistinctCountries);
// router.get('/distinct-regions',getRegionsByCountry);
// router.get('/distinct-worksite',getWorksitesByRegionAndCountry);
exports.default = router;
