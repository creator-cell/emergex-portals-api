"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCountryByIdValidation = exports.CountryByIdValidation = exports.validateCountry = void 0;
const express_validator_1 = require("express-validator");
exports.validateCountry = [
    (0, express_validator_1.body)("name")
        .trim()
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("countryValidationMessages.validateCountry.name.empty"))
        .isString()
        .withMessage((_, { req }) => req.i18n.t("countryValidationMessages.validateCountry.name.string")),
];
exports.CountryByIdValidation = [
    (0, express_validator_1.param)("id")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("countryValidationMessages.validateCountry.id.empty"))
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("countryValidationMessages.validateCountry.id.invalidMongooseFormat")),
];
exports.updateCountryByIdValidation = [
    (0, express_validator_1.param)("id")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("countryValidationMessages.validateCountry.id.empty"))
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("countryValidationMessages.validateCountry.id.invalidMongooseFormat")),
    (0, express_validator_1.body)("name")
        .optional()
        .trim()
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("countryValidationMessages.validateCountry.name.empty"))
        .isString()
        .withMessage((_, { req }) => req.i18n.t("countryValidationMessages.validateCountry.name.string")),
];
