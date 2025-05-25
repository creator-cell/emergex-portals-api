"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectRolesByPriority = exports.validateRolePriority = exports.validateSpecificRole = exports.addRolesToProjectValidation = void 0;
const express_validator_1 = require("express-validator");
exports.addRolesToProjectValidation = [
    (0, express_validator_1.param)("id")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("projectValidationMessages.getProjectById.id.empty"))
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("projectValidationMessages.getProjectById.id.invalidId")),
    (0, express_validator_1.body)("roles")
        .isArray({ min: 1 })
        .withMessage((_, { req }) => req.i18n.t("projectRoleValidationMessages.addRolesToProject.roles.array"))
        .bail()
        .custom((roles) => roles.every((role) => typeof role.roleId === "string" &&
        typeof role.assignTo === "string" &&
        typeof role.roleDescription === "string"))
        .withMessage((_, { req }) => req.i18n.t("projectRoleValidationMessages.addRolesToProject.roles.custom")),
];
exports.validateSpecificRole = [
    (0, express_validator_1.param)("id")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("projectRoleValidationMessages.validateSpecificRole.id.empty"))
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("projectRoleValidationMessages.validateSpecificRole.id.invalidId")),
    (0, express_validator_1.body)("roleId")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("projectRoleValidationMessages.validateSpecificRole.roleId.empty"))
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("projectRoleValidationMessages.validateSpecificRole.roleId.invalidId")),
    (0, express_validator_1.body)("newRoleDetails.team")
        .optional()
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("projectRoleValidationMessages.validateSpecificRole.newRoleDetails.team.invalidId")),
    (0, express_validator_1.body)("newRoleDetails.assignTo")
        .optional()
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("projectRoleValidationMessages.validateSpecificRole.newRoleDetails.assignTo.invalidId")),
    (0, express_validator_1.body)("newRoleDetails.roleDescription")
        .optional()
        .isString()
        .withMessage((_, { req }) => req.i18n.t("projectRoleValidationMessages.validateSpecificRole.newRoleDetails.description.string"))
        .isLength({ min: 6 })
        .withMessage((_, { req }) => req.i18n.t("projectRoleValidationMessages.validateSpecificRole.newRoleDetails.description.length"))
        .trim()
        .escape(),
];
exports.validateRolePriority = [
    (0, express_validator_1.param)("id")
        .notEmpty()
        .withMessage("Employee Id is requried")
        .isMongoId()
        .withMessage("Invalid project ID"),
    (0, express_validator_1.body)("role").optional().isMongoId().withMessage("Invalid role ID"),
    (0, express_validator_1.body)("employee")
        .notEmpty()
        .withMessage("Employee Id is requried")
        .isMongoId()
        .withMessage("Employee ID is required"),
    (0, express_validator_1.body)("from").optional().isMongoId().withMessage("Invalid from employee ID"),
    (0, express_validator_1.body)("to").optional().isMongoId().withMessage("Invalid to employee ID"),
];
exports.getProjectRolesByPriority = [
    (0, express_validator_1.param)("id")
        .notEmpty()
        .withMessage("project Id is requried")
        .isMongoId()
        .withMessage("Invalid project ID"),
];
