import express from "express";
import {
  addCountry,
  deleteCountryById,
  getAllCountries,
  getCountryById,
  updateCountryById,
} from "../controllers/CountryControllers";
import {
  validateCountry,
  CountryByIdValidation,
  updateCountryByIdValidation,
} from "../validations/countryValidator";
import { checkValidationResult } from "../middlewares/checkValidationsMiddleware";
import { authenticate } from "../middlewares/authMiddleware";
import { authorizeRoles } from "../middlewares/roleMiddleware";
import { GlobalAdminRoles } from "../config/global-enum";
import {
  regionByIdValidation,
  updateRegionByIdValidation,
  validateRegion,
} from "../validations/regionValidator";
import {
  addRegion,
  deleteRegionById,
  getAllRegions,
  getRegionById,
  getRegionsByCountry,
  updateRegionById,
} from "../controllers/RegionControllers";

const router = express.Router();

router
  .route("/")
  .post(
    authenticate,
    authorizeRoles(GlobalAdminRoles.SuperAdmin),
    validateRegion,
    checkValidationResult,
    addRegion
  )
  .get(
    authenticate,
    authorizeRoles(GlobalAdminRoles.SuperAdmin,GlobalAdminRoles.ClientAdmin),
    getAllRegions
  );

router
  .route("/region-by-id/:id")
  .get(
    authenticate,
    authorizeRoles(GlobalAdminRoles.SuperAdmin),
    regionByIdValidation,
    checkValidationResult,
    getRegionById
  )
  .put(
    authenticate,
    authorizeRoles(GlobalAdminRoles.SuperAdmin),
    updateRegionByIdValidation,
    checkValidationResult,
    updateRegionById
  )
  .delete(
    authenticate,
    authorizeRoles(GlobalAdminRoles.SuperAdmin),
    regionByIdValidation,
    checkValidationResult,
    deleteRegionById
  );

router.get(
  "/region-by-country-id/:id",
  authenticate,
  authorizeRoles(GlobalAdminRoles.SuperAdmin,GlobalAdminRoles.ClientAdmin),
  CountryByIdValidation,
  checkValidationResult,
  getRegionsByCountry
);

export default router;
