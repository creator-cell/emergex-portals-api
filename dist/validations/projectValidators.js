"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectByLocationValidation = exports.getProjectByIdValidation = exports.updateProjectValidation = exports.createProjectValidation = exports.createProjectByNameValidation = void 0;
const express_validator_1 = require("express-validator");
exports.createProjectByNameValidation = [
    (0, express_validator_1.body)("name")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("projectValidationMessages.createProjectByNameValidation.name.empty"))
        .isLength({ min: 4 })
        .withMessage((_, { req }) => req.i18n.t("projectValidationMessages.createProjectByNameValidation.name.length")),
    (0, express_validator_1.body)("description")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("projectValidationMessages.createProjectByNameValidation.description.empty"))
        .isLength({ min: 4 })
        .withMessage((_, { req }) => req.i18n.t("projectValidationMessages.createProjectByNameValidation.description.length")),
];
exports.createProjectValidation = [
    (0, express_validator_1.body)("name")
        .optional()
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("projectValidationMessages.createProjectValidation.name.empty")),
    (0, express_validator_1.body)("description")
        .optional()
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("projectValidationMessages.createProjectValidation.description.empty"))
        .isLength({ min: 25 })
        .withMessage((_, { req }) => req.i18n.t("projectValidationMessages.createProjectValidation.description.length")),
    (0, express_validator_1.body)("parentProjectId")
        .optional()
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("projectValidationMessages.createProjectValidation.parentProjectId.empty"))
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("projectValidationMessages.createProjectValidation.parentProjectId.invalidId")),
    (0, express_validator_1.body)("country")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("projectValidationMessages.createProjectValidation.country.empty"))
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("projectValidationMessages.createProjectValidation.country.invalidId")),
    (0, express_validator_1.body)("region")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("projectValidationMessages.createProjectValidation.region.empty"))
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("projectValidationMessages.createProjectValidation.region.invalidId")),
    (0, express_validator_1.body)("worksite")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("projectValidationMessages.createProjectValidation.worksite.empty"))
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("projectValidationMessages.createProjectValidation.worksite.invalidId")),
];
exports.updateProjectValidation = [
    (0, express_validator_1.param)("id")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("projectValidationMessages.updateProjectValidation.id.empty"))
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("projectValidationMessages.updateProjectValidation.id.invalidId")),
    (0, express_validator_1.body)("parentProjectId")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("projectValidationMessages.createProjectValidation.parentProjectId.empty"))
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("projectValidationMessages.createProjectValidation.parentProjectId.invalidId")),
    (0, express_validator_1.body)("country")
        .optional()
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("projectValidationMessages.updateProjectValidation.country.empty")),
    (0, express_validator_1.body)("region")
        .optional()
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("projectValidationMessages.updateProjectValidation.region.empty")),
    (0, express_validator_1.body)("worksite")
        .optional()
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("projectValidationMessages.updateProjectValidation.worksite.empty")),
    (0, express_validator_1.body)("name")
        .optional()
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("projectValidationMessages.updateProjectValidation.name.empty"))
        .isLength({ min: 4 })
        .withMessage((_, { req }) => req.i18n.t("projectValidationMessages.updateProjectValidation.name.length")),
    (0, express_validator_1.body)("description")
        .optional()
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("projectValidationMessages.updateProjectValidation.description.empty"))
        .isLength({ min: 25 })
        .withMessage((_, { req }) => req.i18n.t("projectValidationMessages.updateProjectValidation.description.length")),
];
exports.getProjectByIdValidation = [
    (0, express_validator_1.param)("id")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("projectValidationMessages.getProjectById.id.empty"))
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("projectValidationMessages.getProjectById.id.invalidId")),
];
exports.projectByLocationValidation = [
    (0, express_validator_1.query)("country")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("countryValidationMessages.validateCountry.id.empty"))
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("countryValidationMessages.validateCountry.id.invalidMongooseFormat")),
    (0, express_validator_1.query)("region")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("regionValidationMessages.validateRegion.id.empty"))
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("regionValidationMessages.validateRegion.id.invalidMongooseFormat")),
    (0, express_validator_1.query)("worksite")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("worksiteValidationMessages.validateWorksite.id.empty"))
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("worksiteValidationMessages.validateWorksite.id.invalidMongooseFormat")),
];
