"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeTeamMemberValidation = exports.addRemoveTeamMemberValidation = exports.teamUpdateByIdValidation = exports.teamGetByIdValidation = exports.teamValidationRules = void 0;
const express_validator_1 = require("express-validator");
const mongoose_1 = __importDefault(require("mongoose"));
exports.teamValidationRules = [
    (0, express_validator_1.body)("name")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("teamValidationMessages.name.empty"))
        .trim()
        .isLength({ min: 4 })
        .withMessage((_, { req }) => req.i18n.t("teamValidationMessages.name.length")),
];
exports.teamGetByIdValidation = [
    (0, express_validator_1.param)("id")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("teamValidationMessages.id.empty"))
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("teamValidationMessages.id.invalidMongooseFormat")),
];
exports.teamUpdateByIdValidation = [
    (0, express_validator_1.param)("id")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("teamValidationMessages.id.empty"))
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("teamValidationMessages.id.invalidMongooseFormat")),
    (0, express_validator_1.body)("name")
        .optional()
        .trim()
        .isString()
        .isLength({ min: 4 })
        .withMessage((_, { req }) => req.i18n.t("teamValidationMessages.name.length")),
];
exports.addRemoveTeamMemberValidation = [
    (0, express_validator_1.param)("id")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("teamValidationMessages.addRemoveTeamMemberValidation.id.empty"))
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("teamValidationMessages.addRemoveTeamMemberValidation.id.invalidMongooseFormat")),
    (0, express_validator_1.body)("employeeId")
        .isArray({ min: 1 })
        .withMessage((_, { req }) => req.i18n.t("teamValidationMessages.addRemoveTeamMemberValidation.employeeId.mustBeArray"))
        .custom((value, { req }) => {
        if (value.some((id) => !mongoose_1.default.Types.ObjectId.isValid(id))) {
            throw new Error(req.i18n.t("teamValidationMessages.addRemoveTeamMemberValidation.employeeId.invalidMongooseFormat"));
        }
        return true;
    })
        .withMessage((_, { req }) => req.i18n.t("teamValidationMessages.addRemoveTeamMemberValidation.employeeId.empty"))
];
exports.removeTeamMemberValidation = [
    (0, express_validator_1.param)("id")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("teamValidationMessages.addRemoveTeamMemberValidation.id.empty"))
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("teamValidationMessages.addRemoveTeamMemberValidation.id.invalidMongooseFormat")),
    (0, express_validator_1.body)("employeeId")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("employeeValidationMessages.id.empty"))
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("employeeValidationMessages.id.invalidMongooseFormat"))
];
