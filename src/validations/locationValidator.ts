import { body, param } from 'express-validator';

export const validateCreateLocation = [
  body('country')
    .notEmpty()
    .withMessage((_,{req})=>req.t('locationValidationMessages.validateCreateLocation.country.empty'))
    .isString()
    .withMessage((_,{req})=>req.t('locationValidationMessages.validateCreateLocation.country.string')),
  body('region')
    .notEmpty()
    .withMessage((_,{req})=>req.t('locationValidationMessages.validateCreateLocation.region.empty'))
    .isString()
    .withMessage((_,{req})=>req.t('locationValidationMessages.validateCreateLocation.region.string')),
  body('worksite')
    .notEmpty()
    .withMessage((_,{req})=>req.t('locationValidationMessages.validateCreateLocation.worksite.empty'))
    .isString()
    .withMessage((_,{req})=>req.t('locationValidationMessages.validateCreateLocation.worksite.string')),
];

export const validateUpdateLocation = [
  param('id')
    .notEmpty()
    .withMessage((_,{req})=>req.t('locationValidationMessages.validateUpdateLocation.id.empty'))
    .isMongoId()
    .withMessage((_,{req})=>req.t('locationValidationMessages.validateUpdateLocation.id.invalidId')),
    body('country')
    .notEmpty()
    .withMessage((_,{req})=>req.t('locationValidationMessages.validateUpdateLocation.country.empty'))
    .isString()
    .withMessage((_,{req})=>req.t('locationValidationMessages.validateUpdateLocation.country.string')),
  body('region')
    .notEmpty()
    .withMessage((_,{req})=>req.t('locationValidationMessages.validateUpdateLocation.region.empty'))
    .isString()
    .withMessage((_,{req})=>req.t('locationValidationMessages.validateUpdateLocation.region.string')),
  body('worksite')
    .notEmpty()
    .withMessage((_,{req})=>req.t('locationValidationMessages.validateUpdateLocation.worksite.empty'))
    .isString()
    .withMessage((_,{req})=>req.t('locationValidationMessages.validateUpdateLocation.worksite.string')),
];

export const validateLocationId = [
  param('id')
    .notEmpty()
    .withMessage((_,{req})=>req.t('locationValidationMessages.validateLocationId.id.empty'))
    .isMongoId()
    .withMessage((_,{req})=>req.t('locationValidationMessages.validateLocationId.id.invalidId')),
];




