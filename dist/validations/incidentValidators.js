"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStatusValidation = exports.getIncidentsByProjectIdValidationRules = exports.incidentsByIdValidationRules = exports.updateIncidentValidationRules = exports.incidentValidationRules = void 0;
const express_validator_1 = require("express-validator");
const base64Regex = /^data:image\/(png|jpeg|jpg|gif|webp);base64,[A-Za-z0-9+/=]+$/;
exports.incidentValidationRules = [
    (0, express_validator_1.body)("level")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentValidationRules.level.empty"))
        .isString()
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentValidationRules.level.string"))
        .isIn(["Level 1", "Level 2", "Level 3", "Level 4"])
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentValidationRules.level.enum")),
    (0, express_validator_1.body)("type")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentValidationRules.type.empty")),
    (0, express_validator_1.body)("description")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentValidationRules.description.empty")),
    (0, express_validator_1.body)("status")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentValidationRules.status.empty"))
        .isIn(["Assigned", "Delayed", "In Progress", "Completed", "Cancelled"])
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentValidationRules.status.enum")),
    (0, express_validator_1.body)("projectId")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentValidationRules.projectId.empty"))
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentValidationRules.projectId.isMongoDbId")),
    // body("assignedTo")
    //   .notEmpty()
    //   .withMessage((_, { req }) =>
    //     req.i18n.t(
    //       "incidentValidationMessages.incidentValidationRules.assignedTo.empty"
    //     )
    //   )
    //   .isMongoId()
    //   .withMessage((_, { req }) =>
    //     req.i18n.t(
    //       "incidentValidationMessages.incidentValidationRules.assignedTo.isMongoDbId"
    //     )
    //   ),
    (0, express_validator_1.body)("countOfInjuredPeople")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentValidationRules.countOfInjuredPeople.empty"))
        .isInt({ min: 0 })
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentValidationRules.countOfInjuredPeople.int")),
    (0, express_validator_1.body)("countOfTotalPeople")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentValidationRules.countOfTotalPeople.empty"))
        .isInt({ min: 0 })
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentValidationRules.countOfTotalPeople.int")),
    (0, express_validator_1.body)("location")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentValidationRules.location.empty"))
        .isString()
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentValidationRules.location.string")),
    (0, express_validator_1.body)("damageAssets")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentValidationRules.damageAssets.empty"))
        .isArray()
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentValidationRules.damageAssets.array")),
    (0, express_validator_1.body)("finance")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentValidationRules.finance.empty"))
        .isFloat({ min: 0 })
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentValidationRules.finance.int")),
    (0, express_validator_1.body)("utilityAffected")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentValidationRules.utilityAffected.empty"))
        .isArray()
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentValidationRules.utilityAffected.array")),
    (0, express_validator_1.body)("informToTeam")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentValidationRules.informToTeam.empty"))
        .isBoolean()
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentValidationRules.informToTeam.boolean")),
    (0, express_validator_1.body)("termsAndConditions")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentValidationRules.termsAndConditions.empty"))
        .isBoolean()
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentValidationRules.termsAndConditions.boolean")),
    (0, express_validator_1.body)("images")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentValidationRules.signature.empty"))
        .isArray()
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentValidationRules.images.array"))
        .custom((images) => {
        if (!Array.isArray(images))
            return false;
        return images.every((img) => base64Regex.test(img));
    })
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentValidationRules.images.base64")),
    (0, express_validator_1.body)("signature")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentValidationRules.signature.empty"))
        .matches(base64Regex)
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentValidationRules.signature.base64")),
];
exports.updateIncidentValidationRules = [
    (0, express_validator_1.body)("level")
        .optional()
        .isString()
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentValidationRules.level.string"))
        .isIn(["Level 1", "Level 2", "Level 3", "Level 4"])
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentValidationRules.level.enum")),
    (0, express_validator_1.body)("type").optional(),
    (0, express_validator_1.body)("description").optional(),
    (0, express_validator_1.body)("status")
        .optional()
        .isIn(["Assigned", "Delayed", "In Progress", "Completed", "Cancelled"])
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentValidationRules.status.enum")),
    (0, express_validator_1.body)("projectId")
        .optional()
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentValidationRules.projectId.isMongoDbId")),
    // body("assignedTo")
    //   .optional()
    //   .isMongoId()
    //   .withMessage((_, { req }) =>
    //     req.i18n.t(
    //       "incidentValidationMessages.incidentValidationRules.assignedTo.isMongoDbId"
    //     )
    //   ),
    (0, express_validator_1.body)("countOfInjuredPeople")
        .optional()
        .isInt({ min: 0 })
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentValidationRules.countOfInjuredPeople.int")),
    (0, express_validator_1.body)("countOfTotalPeople")
        .optional()
        .isInt({ min: 0 })
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentValidationRules.countOfTotalPeople.int")),
    (0, express_validator_1.body)("location")
        .optional()
        .isString()
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentValidationRules.location.string")),
    (0, express_validator_1.body)("damageAssets")
        .optional()
        .isArray()
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentValidationRules.damageAssets.array")),
    (0, express_validator_1.body)("finance")
        .optional()
        .isFloat({ min: 0 })
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentValidationRules.finance.int")),
    (0, express_validator_1.body)("utilityAffected")
        .optional()
        .isArray()
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentValidationRules.utilityAffected.array")),
    (0, express_validator_1.body)("informToTeam")
        .optional()
        .isBoolean()
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentValidationRules.informToTeam.boolean")),
    (0, express_validator_1.body)("termsAndConditions")
        .optional()
        .isBoolean()
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentValidationRules.termsAndConditions.boolean")),
    (0, express_validator_1.body)("images")
        .optional()
        .isArray()
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentValidationRules.images.array")),
    (0, express_validator_1.body)("signature")
        .optional()
        .custom((signature) => {
        return base64Regex.test(signature) || /^https?:\/\/.+/.test(signature);
    })
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentValidationRules.signature.base64")),
];
exports.incidentsByIdValidationRules = [
    (0, express_validator_1.param)("id")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentsByIdValidationRules.id.empty"))
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentsByIdValidationRules.id.isMongoDbId")),
];
exports.getIncidentsByProjectIdValidationRules = [
    (0, express_validator_1.param)("id")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("projectValidationMessages.getProjectById.id.empty"))
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("projectValidationMessages.getProjectById.id.invalidId")),
];
exports.updateStatusValidation = [
    (0, express_validator_1.param)("id")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentsByIdValidationRules.id.empty"))
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentsByIdValidationRules.id.isMongoDbId")),
    (0, express_validator_1.body)("status")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentValidationRules.status.empty"))
        .isIn(["Assigned", "Delayed", "In Progress", "Completed", "Cancelled"])
        .withMessage((_, { req }) => req.i18n.t("incidentValidationMessages.incidentValidationRules.status.enum")),
];
