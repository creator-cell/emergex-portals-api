import { body, param } from 'express-validator';

export const createRoleValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage((_, { req }) => req.i18n.t("roleValidationMessages.name.empty"))
    .isLength({ min: 4 })
    .withMessage((_, { req }) => req.i18n.t("roleValidationMessages.name.length"))
];

export const roleByIdValidations = [
  param("id").notEmpty().withMessage((_, { req }) => req.i18n.t("roleValidationMessages.id.empty")).isMongoId().withMessage((_, { req }) => req.i18n.t("roleValidationMessages.id.invalidMongooseFormat")),
]

export const updateRoleValidation = [
  param('id').notEmpty().withMessage((_, { req }) => req.i18n.t("roleValidationMessages.id.empty")).isMongoId().withMessage((_, { req }) => req.i18n.t("roleValidationMessages.id.invalidMongooseFormat")),
  body('name')
    .trim()
    .optional()
    .isLength({ min: 4 })
    .withMessage((_, { req }) => req.i18n.t("roleValidationMessages.name.empty"))
];
