"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnnouncementByIdValidation = exports.updateAnnouncementByIdValidation = exports.validateAnnouncement = void 0;
const express_validator_1 = require("express-validator");
exports.validateAnnouncement = [
    (0, express_validator_1.body)("title")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("announcementValidationMessages.validateAnnouncement.title.empty"))
        .isString()
        .withMessage((_, { req }) => req.i18n.t("announcementValidationMessages.validateAnnouncement.title.string")),
    (0, express_validator_1.body)("description")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("announcementValidationMessages.validateAnnouncement.description.empty"))
        .isString(),
    (0, express_validator_1.body)("team")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("announcementValidationMessages.validateAnnouncement.team.empty"))
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("announcementValidationMessages.validateAnnouncement.team.invalidId")),
    (0, express_validator_1.body)("country")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("announcementValidationMessages.validateAnnouncement.country.empty"))
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("announcementValidationMessages.validateAnnouncement.country.invalidId")),
    (0, express_validator_1.body)("region")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("announcementValidationMessages.validateAnnouncement.region.empty"))
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("announcementValidationMessages.validateAnnouncement.region.invalidId")),
    (0, express_validator_1.body)("worksite")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("announcementValidationMessages.validateAnnouncement.worksite.empty"))
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("announcementValidationMessages.validateAnnouncement.worksite.invalidId")),
];
exports.updateAnnouncementByIdValidation = [
    (0, express_validator_1.param)("id")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("announcementValidationMessages.updateAnnouncementByIdValidation.id.empty"))
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("announcementValidationMessages.updateAnnouncementByIdValidation.id.invalidId")),
    (0, express_validator_1.body)("title")
        .optional()
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("announcementValidationMessages.updateAnnouncementByIdValidation.title.empty"))
        .isString()
        .withMessage((_, { req }) => req.i18n.t("announcementValidationMessages.updateAnnouncementByIdValidation.title.string")),
    (0, express_validator_1.body)("description")
        .optional()
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("announcementValidationMessages.updateAnnouncementByIdValidation.description.empty"))
        .isString(),
    (0, express_validator_1.body)("location")
        .optional()
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("announcementValidationMessages.updateAnnouncementByIdValidation.location.empty"))
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("announcementValidationMessages.updateAnnouncementByIdValidation.location.invalidId")),
    (0, express_validator_1.body)("team")
        .optional()
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("announcementValidationMessages.updateAnnouncementByIdValidation.team.empty"))
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("announcementValidationMessages.updateAnnouncementByIdValidation.team.invalidId")),
];
exports.getAnnouncementByIdValidation = [
    (0, express_validator_1.param)("id")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("announcementValidationMessages.getAnnouncementByIdValidation.id.empty"))
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("announcementValidationMessages.getAnnouncementByIdValidation.id.invalidId")),
];
