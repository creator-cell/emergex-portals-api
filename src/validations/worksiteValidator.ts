import { body, param } from 'express-validator';

export const validateWorksite = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage((_,{req})=>req.i18n.t("worksiteValidationMessages.validateWorksite.name.empty"))
    .isString()
    .withMessage((_,{req})=>req.i18n.t("worksiteValidationMessages.validateWorksite.name.string")),
  body('regionId')
    .notEmpty()
    .withMessage((_,{req})=>req.i18n.t("regionValidationMessages.validateRegion.id.empty"))
    .isMongoId()
    .withMessage((_,{req})=>req.i18n.t("regionValidationMessages.validateRegion.id.invalidMongooseFormat")),
];

export const updateWorksiteByIdValidation = [
  param('id')
    .notEmpty()
    .withMessage((_,{req})=>req.i18n.t("worksiteValidationMessages.validateWorksite.id.empty"))
    .isMongoId()
    .withMessage((_,{req})=>req.i18n.t("worksiteValidationMessages.validateWorksite.id.invalidMongooseFormat")),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage((_,{req})=>req.i18n.t("worksiteValidationMessages.validateWorksite.name.empty"))
    .isString()
    .withMessage((_,{req})=>req.i18n.t("worksiteValidationMessages.validateWorksite.name.empty")),
  body('regionId')
    .optional()
    .notEmpty()
    .withMessage((_,{req})=>req.i18n.t("regionValidationMessages.validateRegion.id.empty"))
    .isMongoId()
    .withMessage((_,{req})=>req.i18n.t("regionValidationMessages.validateRegion.id.invalidMongooseFormat")),
];

export const getWorksitesByRegionValidation = [
  param('id')
  .notEmpty()
  .withMessage((_,{req})=>req.i18n.t("regionValidationMessages.validateRegion.id.empty"))
  .isMongoId()
  .withMessage((_,{req})=>req.i18n.t("regionValidationMessages.validateRegion.id.invalidMongooseFormat")),
];

export const worksitesByIdValidation = [
  param('id')
  .notEmpty()
  .withMessage((_,{req})=>req.i18n.t("worksiteValidationMessages.validateWorksite.id.empty"))
  .isMongoId()
  .withMessage((_,{req})=>req.i18n.t("worksiteValidationMessages.validateWorksite.id.invalidMongooseFormat")),
];

export const validateCountryRegionWorksites = [
  // Validate 'country'
  body('country')
    .exists({ checkFalsy: true })
    .withMessage('Country is required.')
    .isString()
    .withMessage('Country must be a string.')
    .trim()
    .notEmpty()
    .withMessage('Country cannot be empty.'),

  // Validate 'region'
  body('region')
    .exists({ checkFalsy: true })
    .withMessage('Region is required.')
    .isString()
    .withMessage('Region must be a string.')
    .trim()
    .notEmpty()
    .withMessage('Region cannot be empty.'),

  // Validate 'worksites'
  body('worksites')
    .exists({ checkFalsy: true })
    .withMessage('Worksites are required.')
    .isArray({ min: 1 })
    .withMessage('Worksites must be a non-empty array.')
    .custom((worksites: unknown[]) => {
      if (worksites.some((site) => typeof site !== 'string' || !site.trim())) {
        throw new Error('Each worksite must be a non-empty string.');
      }
      return true;
    }),
];
