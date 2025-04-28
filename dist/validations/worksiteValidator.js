"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCountryRegionWorksites = exports.worksitesByIdValidation = exports.getWorksitesByRegionValidation = exports.updateWorksiteByIdValidation = exports.validateWorksite = void 0;
const express_validator_1 = require("express-validator");
exports.validateWorksite = [
    (0, express_validator_1.body)('name')
        .trim()
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("worksiteValidationMessages.validateWorksite.name.empty"))
        .isString()
        .withMessage((_, { req }) => req.i18n.t("worksiteValidationMessages.validateWorksite.name.string")),
    (0, express_validator_1.body)('regionId')
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("regionValidationMessages.validateRegion.id.empty"))
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("regionValidationMessages.validateRegion.id.invalidMongooseFormat")),
];
exports.updateWorksiteByIdValidation = [
    (0, express_validator_1.param)('id')
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("worksiteValidationMessages.validateWorksite.id.empty"))
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("worksiteValidationMessages.validateWorksite.id.invalidMongooseFormat")),
    (0, express_validator_1.body)('name')
        .optional()
        .trim()
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("worksiteValidationMessages.validateWorksite.name.empty"))
        .isString()
        .withMessage((_, { req }) => req.i18n.t("worksiteValidationMessages.validateWorksite.name.empty")),
    (0, express_validator_1.body)('regionId')
        .optional()
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("regionValidationMessages.validateRegion.id.empty"))
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("regionValidationMessages.validateRegion.id.invalidMongooseFormat")),
];
exports.getWorksitesByRegionValidation = [
    (0, express_validator_1.param)('id')
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("regionValidationMessages.validateRegion.id.empty"))
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("regionValidationMessages.validateRegion.id.invalidMongooseFormat")),
];
exports.worksitesByIdValidation = [
    (0, express_validator_1.param)('id')
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("worksiteValidationMessages.validateWorksite.id.empty"))
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("worksiteValidationMessages.validateWorksite.id.invalidMongooseFormat")),
];
exports.validateCountryRegionWorksites = [
    // Validate 'country'
    (0, express_validator_1.body)('country')
        .exists({ checkFalsy: true })
        .withMessage('Country is required.')
        .isString()
        .withMessage('Country must be a string.')
        .trim()
        .notEmpty()
        .withMessage('Country cannot be empty.'),
    // Validate 'region'
    (0, express_validator_1.body)('region')
        .exists({ checkFalsy: true })
        .withMessage('Region is required.')
        .isString()
        .withMessage('Region must be a string.')
        .trim()
        .notEmpty()
        .withMessage('Region cannot be empty.'),
    // Validate 'worksites'
    (0, express_validator_1.body)('worksites')
        .exists({ checkFalsy: true })
        .withMessage('Worksites are required.')
        .isArray({ min: 1 })
        .withMessage('Worksites must be a non-empty array.')
        .custom((worksites) => {
        if (worksites.some((site) => typeof site !== 'string' || !site.trim())) {
            throw new Error('Each worksite must be a non-empty string.');
        }
        return true;
    }),
];
