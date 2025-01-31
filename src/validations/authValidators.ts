import { body, checkExact } from "express-validator";
import { GlobalAdminRoles } from "../config/global-enum";

export const validateRegister = [
  body("username")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t("authValidationMessages.username.empty")
    )
    .trim()
    .isLength({ min: 4 })
    .withMessage((_, { req }) =>
      req.i18n.t("authValidationMessages.username.length")
    ),
  body("email")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t("authValidationMessages.email.empty")
    )
    .notEmpty()
    .isEmail()
    .withMessage((_, { req }) =>
      req.i18n.t("authValidationMessages.email.notEmail")
    )
    .normalizeEmail(),
  body("phoneNumber")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t("authValidationMessages.phoneNumber.empty")
    )
    .trim()
    .isLength({ min: 10, max: 10 })
    .withMessage((_, { req }) =>
      req.i18n.t("authValidationMessages.phoneNumber.length")
    )
    .matches(/^\d{10}$/)
    .withMessage((_, { req }) =>
      req.i18n.t("authValidationMessages.phoneNumber.containCharacters")
    ),
  body("password")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t("authValidationMessages.password.empty")
    )
    .isLength({ min: 6 })
    .withMessage((_, { req }) =>
      req.i18n.t("authValidationMessages.password.length")
    ),
  body("role")
    .optional()
    .isIn(Object.values(GlobalAdminRoles))
    .withMessage((_, { req }) =>
      req.i18n.t("authValidationMessages.role.notFromEnum")
    ),
  // checkExact([], { message: 'Only name, email, role and password are allowed' }),
];

export const validateLogin = [
  body("email")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t("authValidationMessages.email.empty")
    )
    .isEmail()
    .withMessage((_, { req }) =>
      req.i18n.t("authValidationMessages.email.notEmail")
    )
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t("authValidationMessages.password.empty")
    )
    .trim()
    .isLength({ min: 6 })
    .withMessage((_, { req }) =>
      req.i18n.t("authValidationMessages.password.length")
    ),
  // checkExact([], { message: 'Only email and password are allowed' }),
];
