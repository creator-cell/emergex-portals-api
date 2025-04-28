"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRegionByIdValidation = exports.regionByIdValidation = exports.validateRegion = void 0;
const express_validator_1 = require("express-validator");
exports.validateRegion = [
    (0, express_validator_1.body)('name')
        .trim()
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("regionValidationMessages.validateRegion.name.empty"))
        .isString()
        .withMessage((_, { req }) => req.i18n.t("regionValidationMessages.validateRegion.name.string")),
    (0, express_validator_1.body)('countryId')
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("CountryValidationMessages.validateCountry.id.empty"))
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("CountryValidationMessages.validateCountry.id.invalidMongooseFormat")),
];
exports.regionByIdValidation = [
    (0, express_validator_1.param)('id')
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("regionValidationMessages.validateRegion.id.empty"))
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("regionValidationMessages.validateRegion.id.invalidMongooseFormat")),
];
exports.updateRegionByIdValidation = [
    (0, express_validator_1.param)('id')
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("regionValidationMessages.validateRegion.id.empty"))
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("regionValidationMessages.validateRegion.id.invalidMongooseFormat")),
    (0, express_validator_1.body)('name')
        .optional()
        .trim()
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("regionValidationMessages.validateRegion.name.empty"))
        .isString()
        .withMessage((_, { req }) => req.i18n.t("regionValidationMessages.validateRegion.name.string")),
    (0, express_validator_1.body)('countryId')
        .optional()
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("CountryValidationMessages.validateCountry.id.empty"))
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("CountryValidationMessages.validateCountry.id.invalidMongooseFormat")),
];
