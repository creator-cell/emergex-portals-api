import express from "express";
import {
  addCountry,
  deleteCountryById,
  getAllCountries,
  getCountryById,
  getCountryRegionsWorksites,
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

const router = express.Router();

router
  .route("/")
  .post(
    authenticate,
    authorizeRoles(GlobalAdminRoles.SuperAdmin),
    validateCountry,
    checkValidationResult,
    addCountry
  )
  .get(
    authenticate,
    authorizeRoles(GlobalAdminRoles.SuperAdmin,GlobalAdminRoles.ClientAdmin),
    getAllCountries
  );

router
  .route("/country-by-id/:id")
    .get(
        authenticate,
        authorizeRoles(GlobalAdminRoles.SuperAdmin),
        CountryByIdValidation,
        checkValidationResult,
        getCountryById
    )
  .put(
    authenticate,
    authorizeRoles(GlobalAdminRoles.SuperAdmin),
    updateCountryByIdValidation,
    checkValidationResult,
    updateCountryById
  )
  .delete(
    authenticate,
    authorizeRoles(GlobalAdminRoles.SuperAdmin),
    CountryByIdValidation,
    checkValidationResult,
    deleteCountryById
  );

router.get("/get-all-countries-workplaces",authenticate,authorizeRoles(GlobalAdminRoles.SuperAdmin) ,getCountryRegionsWorksites)

export default router;
