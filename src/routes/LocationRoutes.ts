import express from 'express';
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

const router = express.Router();

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

export default router;
