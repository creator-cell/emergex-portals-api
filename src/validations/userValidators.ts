import { body, param } from "express-validator";

export const userIdValidation = [
  param("id")
    .notEmpty()
    .withMessage((_, { req }) => req.i18n.t("userValidationMessages.id.empty"))
    .isMongoId()
    .withMessage((_, { req }) =>
      req.i18n.t("userValidationMessages.id.isMongoDbId")
    ),
];

export const updateUserValidation = [
  ...userIdValidation,
  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage((_, { req }) =>
      req.i18n.t("userValidationMessages.firstName.length")
    )
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage((_, { req }) =>
      req.i18n.t("userValidationMessages.firstName.matches")
    ),

  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage((_, { req }) =>
      req.i18n.t("userValidationMessages.lastName.length")
    )
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage((_, { req }) =>
      req.i18n.t("userValidationMessages.lastName.matches")
    ),

  body("phoneNumber")
    .optional()
    .trim()
    .matches(/^\d{10}$/)
    .withMessage((_, { req }) =>
      req.i18n.t("userValidationMessages.phoneNumber.length")
    ),
];
