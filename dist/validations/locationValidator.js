"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateLocationId = exports.validateUpdateLocation = exports.validateCreateLocation = void 0;
const express_validator_1 = require("express-validator");
exports.validateCreateLocation = [
    (0, express_validator_1.body)('country')
        .notEmpty()
        .withMessage((_, { req }) => req.t('locationValidationMessages.validateCreateLocation.country.empty'))
        .isString()
        .withMessage((_, { req }) => req.t('locationValidationMessages.validateCreateLocation.country.string')),
    (0, express_validator_1.body)('region')
        .notEmpty()
        .withMessage((_, { req }) => req.t('locationValidationMessages.validateCreateLocation.region.empty'))
        .isString()
        .withMessage((_, { req }) => req.t('locationValidationMessages.validateCreateLocation.region.string')),
    (0, express_validator_1.body)('worksite')
        .notEmpty()
        .withMessage((_, { req }) => req.t('locationValidationMessages.validateCreateLocation.worksite.empty'))
        .isString()
        .withMessage((_, { req }) => req.t('locationValidationMessages.validateCreateLocation.worksite.string')),
];
exports.validateUpdateLocation = [
    (0, express_validator_1.param)('id')
        .notEmpty()
        .withMessage((_, { req }) => req.t('locationValidationMessages.validateUpdateLocation.id.empty'))
        .isMongoId()
        .withMessage((_, { req }) => req.t('locationValidationMessages.validateUpdateLocation.id.invalidId')),
    (0, express_validator_1.body)('country')
        .notEmpty()
        .withMessage((_, { req }) => req.t('locationValidationMessages.validateUpdateLocation.country.empty'))
        .isString()
        .withMessage((_, { req }) => req.t('locationValidationMessages.validateUpdateLocation.country.string')),
    (0, express_validator_1.body)('region')
        .notEmpty()
        .withMessage((_, { req }) => req.t('locationValidationMessages.validateUpdateLocation.region.empty'))
        .isString()
        .withMessage((_, { req }) => req.t('locationValidationMessages.validateUpdateLocation.region.string')),
    (0, express_validator_1.body)('worksite')
        .notEmpty()
        .withMessage((_, { req }) => req.t('locationValidationMessages.validateUpdateLocation.worksite.empty'))
        .isString()
        .withMessage((_, { req }) => req.t('locationValidationMessages.validateUpdateLocation.worksite.string')),
];
exports.validateLocationId = [
    (0, express_validator_1.param)('id')
        .notEmpty()
        .withMessage((_, { req }) => req.t('locationValidationMessages.validateLocationId.id.empty'))
        .isMongoId()
        .withMessage((_, { req }) => req.t('locationValidationMessages.validateLocationId.id.invalidId')),
];
