import { body, param } from 'express-validator';

export const validateRegion = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage((_,{req})=>req.i18n.t("regionValidationMessages.validateRegion.name.empty"))
    .isString()
    .withMessage((_,{req})=>req.i18n.t("regionValidationMessages.validateRegion.name.string")),
  body('countryId')
    .notEmpty()
    .withMessage((_,{req})=>req.i18n.t("CountryValidationMessages.validateCountry.id.empty"))
    .isMongoId()
    .withMessage((_,{req})=>req.i18n.t("CountryValidationMessages.validateCountry.id.invalidMongooseFormat")),
];

export const regionByIdValidation = [
  param('id')
    .notEmpty()
    .withMessage((_,{req})=>req.i18n.t("regionValidationMessages.validateRegion.id.empty"))
    .isMongoId()
    .withMessage((_,{req})=>req.i18n.t("regionValidationMessages.validateRegion.id.invalidMongooseFormat")),
];

export const updateRegionByIdValidation = [
  param('id')
  .notEmpty()
  .withMessage((_,{req})=>req.i18n.t("regionValidationMessages.validateRegion.id.empty"))
  .isMongoId()
  .withMessage((_,{req})=>req.i18n.t("regionValidationMessages.validateRegion.id.invalidMongooseFormat")),
  body('name')
  .optional()
    .trim()
    .notEmpty()
    .withMessage((_,{req})=>req.i18n.t("regionValidationMessages.validateRegion.name.empty"))
    .isString()
    .withMessage((_,{req})=>req.i18n.t("regionValidationMessages.validateRegion.name.string")),
  body('countryId')
  .optional()
  .notEmpty()
  .withMessage((_,{req})=>req.i18n.t("CountryValidationMessages.validateCountry.id.empty"))
  .isMongoId()
  .withMessage((_,{req})=>req.i18n.t("CountryValidationMessages.validateCountry.id.invalidMongooseFormat")),
];
