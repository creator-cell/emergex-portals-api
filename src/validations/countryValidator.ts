import { body, param } from "express-validator";

export const validateCountry = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t("countryValidationMessages.validateCountry.name.empty")
    )
    .isString()
    .withMessage((_, { req }) =>
      req.i18n.t("countryValidationMessages.validateCountry.name.string")
    ),
];

export const CountryByIdValidation = [
  param("id")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t("countryValidationMessages.validateCountry.id.empty")
    )
    .isMongoId()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "countryValidationMessages.validateCountry.id.invalidMongooseFormat"
      )
    ),
];

export const updateCountryByIdValidation = [
  param("id")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t("countryValidationMessages.validateCountry.id.empty")
    )
    .isMongoId()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "countryValidationMessages.validateCountry.id.invalidMongooseFormat"
      )
    ),
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t("countryValidationMessages.validateCountry.name.empty")
    )
    .isString()
    .withMessage((_, { req }) =>
      req.i18n.t("countryValidationMessages.validateCountry.name.string")
    ),
];
