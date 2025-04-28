"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRoleValidations = exports.roleByIdValidation = exports.createRoleValidations = void 0;
const express_validator_1 = require("express-validator");
exports.createRoleValidations = [
    (0, express_validator_1.body)("title")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("roleValidationMessages.title.empty"))
        .isString()
        .withMessage((_, { req }) => req.i18n.t("roleValidationMessages.title.string"))
        .isLength({ min: 2 })
        .withMessage((_, { req }) => req.i18n.t("roleValidationMessages.title.length")),
    (0, express_validator_1.body)("description")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("roleValidationMessages.description.empty"))
        .isString()
        .withMessage((_, { req }) => req.i18n.t("roleValidationMessages.description.string")),
];
exports.roleByIdValidation = [
    (0, express_validator_1.param)("id")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("roleValidationMessages.id.empty"))
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("roleValidationMessages.id.invalidId")),
];
exports.updateRoleValidations = [
    (0, express_validator_1.param)("id")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("roleValidationMessages.id.empty"))
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("roleValidationMessages.id.invalidId")),
    (0, express_validator_1.body)("title")
        .optional()
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("roleValidationMessages.title.empty"))
        .isString()
        .withMessage((_, { req }) => req.i18n.t("roleValidationMessages.title.string"))
        .isLength({ min: 2 })
        .withMessage((_, { req }) => req.i18n.t("roleValidationMessages.title.length")),
    (0, express_validator_1.body)("description")
        .optional()
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("roleValidationMessages.description.empty"))
        .isString()
        .withMessage((_, { req }) => req.i18n.t("roleValidationMessages.description.string")),
];
