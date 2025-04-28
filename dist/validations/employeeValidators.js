"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUpdateEmployee = exports.validateEmployeeId = exports.validateCreateEmployee = void 0;
const express_validator_1 = require("express-validator");
exports.validateCreateEmployee = [
    (0, express_validator_1.body)("name")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("employeeValidationMessages.name.empty"))
        .trim()
        .isLength({ min: 4 })
        .withMessage((_, { req }) => req.i18n.t("employeeValidationMessages.name.length")),
    (0, express_validator_1.body)("email")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("employeeValidationMessages.email.empty"))
        .isEmail()
        .withMessage((_, { req }) => req.i18n.t("employeeValidationMessages.email.notEmail")),
    (0, express_validator_1.body)("contactNo")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("employeeValidationMessages.contactNo.empty"))
        .isLength({ min: 10, max: 10 })
        .withMessage((_, { req }) => req.i18n.t("employeeValidationMessages.contactNo.length"))
        .matches(/^\d{10}$/)
        .withMessage((_, { req }) => req.i18n.t("employeeValidationMessages.contactNo.containCharacters")),
];
exports.validateEmployeeId = [
    (0, express_validator_1.param)("id")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("employeeValidationMessages.id.empty"))
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("employeeValidationMessages.id.invalidMongooseFormat")),
];
exports.validateUpdateEmployee = [
    (0, express_validator_1.param)("id")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("employeeValidationMessages.id.empty"))
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("employeeValidationMessages.id.invalidMongooseFormat")),
    (0, express_validator_1.body)("name")
        .optional()
        .isString()
        .trim()
        .isLength({ min: 2 })
        .withMessage((_, { req }) => req.i18n.t("employeeValidationMessages.name.length")),
    (0, express_validator_1.body)("contactNo")
        .optional()
        .isString()
        .matches(/^\d{10}$/)
        .withMessage((_, { req }) => req.i18n.t("employeeValidationMessages.contactNo.containCharacters"))
        .isLength({ min: 10, max: 10 })
        .withMessage((_, { req }) => req.i18n.t("employeeValidationMessages.contactNo.length")),
    (0, express_validator_1.body)("designation")
        .optional()
        .isString()
        .trim()
        .isLength({ min: 2 })
        .withMessage((_, { req }) => req.i18n.t("employeeValidationMessages.designation.length")),
    (0, express_validator_1.body)("email")
        .optional()
        .isEmail()
        .withMessage((_, { req }) => req.i18n.t("employeeValidationMessages.email.notEmail")),
];
