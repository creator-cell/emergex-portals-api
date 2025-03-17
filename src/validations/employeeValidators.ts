import { body, checkExact, param } from "express-validator";
import { employeeValidationMessages } from "../config/globalValidationsMessages";

export const validateCreateEmployee = [
  body("name")
    .notEmpty()
    .withMessage((_, { req }) => req.i18n.t("employeeValidationMessages.name.empty"))
    .trim()
    .isLength({ min: 4 })
    .withMessage((_, { req }) => req.i18n.t("employeeValidationMessages.name.length")),
  body("email")
    .notEmpty()
    .withMessage((_, { req }) => req.i18n.t("employeeValidationMessages.email.empty"))
    .isEmail()
    .withMessage((_, { req }) => req.i18n.t("employeeValidationMessages.email.notEmail")),
  body("contactNo")
    .notEmpty()
    .withMessage((_, { req }) => req.i18n.t("employeeValidationMessages.contactNo.empty"))
    .isLength({ min: 10, max: 10 })
    .withMessage((_, { req }) => req.i18n.t("employeeValidationMessages.contactNo.length"))
    .matches(/^\d{10}$/)
    .withMessage((_, { req }) => req.i18n.t("employeeValidationMessages.contactNo.containCharacters")),
    param("id")
    .notEmpty()
    .withMessage((_,{req})=>req.i18n.t("employeeValidationMessages.userId.empty"))
    .isMongoId()
    .withMessage((_,{req})=>req.i18n.t("employeeValidationMessages.userId.invalidMongooseFormat")),
];


export const validateEmployeeId = [
  param("id")
    .notEmpty()
    .withMessage((_,{req})=>req.i18n.t("employeeValidationMessages.id.empty"))
    .isMongoId()
    .withMessage((_,{req})=>req.i18n.t("employeeValidationMessages.id.invalidMongooseFormat")),
];

export const validateUpdateEmployee = [
  param("id")
    .notEmpty()
    .withMessage((_,{req})=>req.i18n.t("employeeValidationMessages.id.empty"))
    .isMongoId()
    .withMessage((_,{req})=>req.i18n.t("employeeValidationMessages.id.invalidMongooseFormat")),
  body("name")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2 })
    .withMessage((_,{req})=>req.i18n.t("employeeValidationMessages.name.length")),
  body("contactNo")
    .optional()
    .isString()
    .matches(/^\d{10}$/)
    .withMessage((_,{req})=>req.i18n.t("employeeValidationMessages.contactNo.containCharacters"))
    .isLength({ min: 10, max: 10 })
    .withMessage((_,{req})=>req.i18n.t("employeeValidationMessages.contactNo.length")),
  body("designation")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2 })
    .withMessage((_,{req})=>req.i18n.t("employeeValidationMessages.designation.length")),
  body("email")
    .optional()
    .isEmail()
    .withMessage((_,{req})=>req.i18n.t("employeeValidationMessages.email.notEmail")),
];
