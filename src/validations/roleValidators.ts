import { body, param } from "express-validator";

export const createRoleValidations = [
  body("title")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t("roleValidationMessages.title.empty")
    )
    .isString()
    .withMessage((_, { req }) =>
      req.i18n.t("roleValidationMessages.title.string")
    )
    .isLength({ min: 2 })
    .withMessage((_, { req }) =>
      req.i18n.t("roleValidationMessages.title.length")
    ),
  body("description")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t("roleValidationMessages.description.empty")
    )
    .isString()
    .withMessage((_, { req }) =>
      req.i18n.t("roleValidationMessages.description.string")
    ),
];

export const roleByIdValidation = [
  param("id")
    .notEmpty()
    .withMessage((_, { req }) => req.i18n.t("roleValidationMessages.id.empty"))
    .isMongoId()
    .withMessage((_, { req }) =>
      req.i18n.t("roleValidationMessages.id.invalidId")
    ),
];

export const updateRoleValidations = [
  param("id")
    .notEmpty()
    .withMessage((_, { req }) => req.i18n.t("roleValidationMessages.id.empty"))
    .isMongoId()
    .withMessage((_, { req }) =>
      req.i18n.t("roleValidationMessages.id.invalidId")
    ),
  body("title")
    .optional()
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t("roleValidationMessages.title.empty")
    )
    .isString()
    .withMessage((_, { req }) =>
      req.i18n.t("roleValidationMessages.title.string")
    )
    .isLength({ min: 2 })
    .withMessage((_, { req }) =>
      req.i18n.t("roleValidationMessages.title.length")
    ),
  body("description")
    .optional()
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t("roleValidationMessages.description.empty")
    )
    .isString()
    .withMessage((_, { req }) =>
      req.i18n.t("roleValidationMessages.description.string")
    ),
];
