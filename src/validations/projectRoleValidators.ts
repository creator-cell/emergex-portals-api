import { body, param } from "express-validator";

export const addRolesToProjectValidation = [
  param("id")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t("projectValidationMessages.getProjectById.id.empty")
    )
    .isMongoId()
    .withMessage((_, { req }) =>
      req.i18n.t("projectValidationMessages.getProjectById.id.invalidId")
    ),
  body("roles")
    .isArray({ min: 1 })
    .withMessage((_, { req }) =>
      req.i18n.t("projectRoleValidationMessages.addRolesToProject.roles.array")
    )
    .bail()
    .custom((roles) =>
      roles.every(
        (role: any) =>
          typeof role.roleId === "string" &&
          typeof role.assignTo === "string" &&
          typeof role.roleDescription === "string"
      )
    )
    .withMessage((_, { req }) =>
      req.i18n.t("projectRoleValidationMessages.addRolesToProject.roles.custom")
    ),
];

export const validateSpecificRole = [
  param("id")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t("projectRoleValidationMessages.validateSpecificRole.id.empty")
    )
    .isMongoId()
    .withMessage((_, { req }) =>
      req.i18n.t("projectRoleValidationMessages.validateSpecificRole.id.invalidId")
    ),
  body("roleId")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t("projectRoleValidationMessages.validateSpecificRole.roleId.empty")
    )
    .isMongoId()
    .withMessage((_, { req }) =>
      req.i18n.t("projectRoleValidationMessages.validateSpecificRole.roleId.invalidId")
    ),
  body("newRoleDetails.team")
    .optional()
    .isMongoId()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "projectRoleValidationMessages.validateSpecificRole.newRoleDetails.team.invalidId"
      )
    ),
  body("newRoleDetails.assignTo")
    .optional()
    .isMongoId()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "projectRoleValidationMessages.validateSpecificRole.newRoleDetails.assignTo.invalidId"
      )
    ),
  body("newRoleDetails.roleDescription")
    .optional()
    .isString()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "projectRoleValidationMessages.validateSpecificRole.newRoleDetails.description.string"
      )
    )
    .isLength({ min: 6 })
    .withMessage((_, { req }) =>
      req.i18n.t(
        "projectRoleValidationMessages.validateSpecificRole.newRoleDetails.description.length"
      )
    )
    .trim()
    .escape(),
];

export const validateRolePriority = [
  param("id")
    .notEmpty()
    .withMessage("Employee Id is requried")
    .isMongoId()
    .withMessage("Invalid project ID"),
  body("role").optional().isMongoId().withMessage("Invalid role ID"),
  body("employee")
    .notEmpty()
    .withMessage("Employee Id is requried")
    .isMongoId()
    .withMessage("Employee ID is required"),
  body("from").optional().isMongoId().withMessage("Invalid from employee ID"),
  body("to").optional().isMongoId().withMessage("Invalid to employee ID"),
];

export const getProjectRolesByPriority = [
  param("id")
    .notEmpty()
    .withMessage("project Id is requried")
    .isMongoId()
    .withMessage("Invalid project ID"),
];
