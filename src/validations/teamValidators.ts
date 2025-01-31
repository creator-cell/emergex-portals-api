import { body, param } from "express-validator";
import mongoose from "mongoose";

export const teamValidationRules = [
  body("name")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t("teamValidationMessages.name.empty")
    )
    .trim()
    .isLength({ min: 4 })
    .withMessage((_, { req }) =>
      req.i18n.t("teamValidationMessages.name.length")
    ),
];

export const teamGetByIdValidation = [
  param("id")
    .notEmpty()
    .withMessage((_, { req }) => req.i18n.t("teamValidationMessages.id.empty"))
    .isMongoId()
    .withMessage((_, { req }) =>
      req.i18n.t("teamValidationMessages.id.invalidMongooseFormat")
    ),
];

export const teamUpdateByIdValidation = [
  param("id")
    .notEmpty()
    .withMessage((_, { req }) => req.i18n.t("teamValidationMessages.id.empty"))
    .isMongoId()
    .withMessage((_, { req }) =>
      req.i18n.t("teamValidationMessages.id.invalidMongooseFormat")
    ),
  body("name")
    .optional()
    .trim()
    .isString()
    .isLength({ min: 4 })
    .withMessage((_, { req }) =>
      req.i18n.t("teamValidationMessages.name.length")
    ),
];

export const addRemoveTeamMemberValidation = [
  param("id")
    .notEmpty()
    .withMessage((_, { req }) => req.i18n.t("teamValidationMessages.addRemoveTeamMemberValidation.id.empty"))
    .isMongoId()
    .withMessage((_, { req }) =>
      req.i18n.t("teamValidationMessages.addRemoveTeamMemberValidation.id.invalidMongooseFormat")
    ),
    body("employeeId")
    .isArray({ min: 1 })
    .withMessage((_, { req }) =>
      req.i18n.t("teamValidationMessages.addRemoveTeamMemberValidation.employeeId.mustBeArray")
    )
    .custom((value, { req }) => {
      if (value.some((id:mongoose.Types.ObjectId) => !mongoose.Types.ObjectId.isValid(id))) {
        throw new Error(req.i18n.t("teamValidationMessages.addRemoveTeamMemberValidation.employeeId.invalidMongooseFormat"));
      }
      return true;
    })
    .withMessage((_, { req }) =>
      req.i18n.t("teamValidationMessages.addRemoveTeamMemberValidation.employeeId.empty")
    )
  
];
