"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateLogin = exports.validateRegister = void 0;
const express_validator_1 = require("express-validator");
const global_enum_1 = require("../config/global-enum");
exports.validateRegister = [
    (0, express_validator_1.body)("username")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("authValidationMessages.username.empty"))
        .trim()
        .isLength({ min: 4 })
        .withMessage((_, { req }) => req.i18n.t("authValidationMessages.username.length")),
    (0, express_validator_1.body)("email")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("authValidationMessages.email.empty"))
        .notEmpty()
        .isEmail()
        .withMessage((_, { req }) => req.i18n.t("authValidationMessages.email.notEmail"))
        .normalizeEmail(),
    (0, express_validator_1.body)("phoneNumber")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("authValidationMessages.phoneNumber.empty"))
        .trim()
        .isLength({ min: 10, max: 10 })
        .withMessage((_, { req }) => req.i18n.t("authValidationMessages.phoneNumber.length"))
        .matches(/^\d{10}$/)
        .withMessage((_, { req }) => req.i18n.t("authValidationMessages.phoneNumber.containCharacters")),
    (0, express_validator_1.body)("password")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("authValidationMessages.password.empty"))
        .isLength({ min: 6 })
        .withMessage((_, { req }) => req.i18n.t("authValidationMessages.password.length")),
    (0, express_validator_1.body)("role")
        .optional()
        .isIn(Object.values(global_enum_1.GlobalAdminRoles))
        .withMessage((_, { req }) => req.i18n.t("authValidationMessages.role.notFromEnum")),
    // checkExact([], { message: 'Only name, email, role and password are allowed' }),
];
exports.validateLogin = [
    (0, express_validator_1.body)("email")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("authValidationMessages.email.empty"))
        .isEmail()
        .withMessage((_, { req }) => req.i18n.t("authValidationMessages.email.notEmail"))
        .normalizeEmail(),
    (0, express_validator_1.body)("password")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("authValidationMessages.password.empty"))
        .trim()
        .isLength({ min: 6 })
        .withMessage((_, { req }) => req.i18n.t("authValidationMessages.password.length")),
    // checkExact([], { message: 'Only email and password are allowed' }),
];
