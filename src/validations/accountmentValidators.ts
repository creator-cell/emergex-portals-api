import { body, param } from "express-validator";

export const validateAnnouncement = [
  body("title")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "announcementValidationMessages.validateAnnouncement.title.empty"
      )
    )
    .isString()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "announcementValidationMessages.validateAnnouncement.title.string"
      )
    ),
  body("description")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "announcementValidationMessages.validateAnnouncement.description.empty"
      )
    )
    .isString(),
  body("team")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "announcementValidationMessages.validateAnnouncement.team.empty"
      )
    )
    .isMongoId()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "announcementValidationMessages.validateAnnouncement.team.invalidId"
      )
    ),
  body("country")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "announcementValidationMessages.validateAnnouncement.country.empty"
      )
    )
    .isMongoId()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "announcementValidationMessages.validateAnnouncement.country.invalidId"
      )
    ),
  body("region")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "announcementValidationMessages.validateAnnouncement.region.empty"
      )
    )
    .isMongoId()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "announcementValidationMessages.validateAnnouncement.region.invalidId"
      )
    ),
  body("worksite")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "announcementValidationMessages.validateAnnouncement.worksite.empty"
      )
    )
    .isMongoId()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "announcementValidationMessages.validateAnnouncement.worksite.invalidId"
      )
    ),
];

export const updateAnnouncementByIdValidation = [
  param("id")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "announcementValidationMessages.updateAnnouncementByIdValidation.id.empty"
      )
    )
    .isMongoId()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "announcementValidationMessages.updateAnnouncementByIdValidation.id.invalidId"
      )
    ),
  body("title")
    .optional()
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "announcementValidationMessages.updateAnnouncementByIdValidation.title.empty"
      )
    )
    .isString()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "announcementValidationMessages.updateAnnouncementByIdValidation.title.string"
      )
    ),
  body("description")
    .optional()
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "announcementValidationMessages.updateAnnouncementByIdValidation.description.empty"
      )
    )
    .isString(),

  body("location")
    .optional()
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "announcementValidationMessages.updateAnnouncementByIdValidation.location.empty"
      )
    )
    .isMongoId()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "announcementValidationMessages.updateAnnouncementByIdValidation.location.invalidId"
      )
    ),
  body("team")
    .optional()
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "announcementValidationMessages.updateAnnouncementByIdValidation.team.empty"
      )
    )
    .isMongoId()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "announcementValidationMessages.updateAnnouncementByIdValidation.team.invalidId"
      )
    ),
];

export const getAnnouncementByIdValidation = [
  param("id")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "announcementValidationMessages.getAnnouncementByIdValidation.id.empty"
      )
    )
    .isMongoId()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "announcementValidationMessages.getAnnouncementByIdValidation.id.invalidId"
      )
    ),
];
