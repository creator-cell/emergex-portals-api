import { body, param } from "express-validator";

export const createProjectByNameValidation = [
  body("name")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "projectValidationMessages.createProjectByNameValidation.name.empty"
      )
    )
    .isLength({ min: 4 })
    .withMessage((_, { req }) =>
      req.i18n.t(
        "projectValidationMessages.createProjectByNameValidation.name.length"
      )
    ),
  body("description")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "projectValidationMessages.createProjectByNameValidation.description.empty"
      )
    )
    .isLength({ min: 4 })
    .withMessage((_, { req }) =>
      req.i18n.t(
        "projectValidationMessages.createProjectByNameValidation.description.length"
      )
    ),
];

export const createProjectValidation = [
  body("name")
  .optional()
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t("projectValidationMessages.createProjectValidation.name.empty")
    ),
  body("description")
  .optional()
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "projectValidationMessages.createProjectValidation.description.empty"
      )
    )
    .isLength({ min: 25 })
    .withMessage((_, { req }) =>
      req.i18n.t(
        "projectValidationMessages.createProjectValidation.description.length"
      )
    ),
  body("parentProjectId")
    .optional()
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "projectValidationMessages.createProjectValidation.parentProjectId.empty"
      )
    )
    .isMongoId()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "projectValidationMessages.createProjectValidation.parentProjectId.invalidId"
      )
    ),
  body("country")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "projectValidationMessages.createProjectValidation.country.empty"
      )
    )
    .isMongoId()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "projectValidationMessages.createProjectValidation.country.invalidId"
      )
    ),
  body("region")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "projectValidationMessages.createProjectValidation.region.empty"
      )
    )
    .isMongoId()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "projectValidationMessages.createProjectValidation.region.invalidId"
      )
    ),
  body("worksite")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "projectValidationMessages.createProjectValidation.worksite.empty"
      )
    )
    .isMongoId()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "projectValidationMessages.createProjectValidation.worksite.invalidId"
      )
    ),
];

export const updateProjectValidation = [
  param("id")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t("projectValidationMessages.updateProjectValidation.id.empty")
    )
    .isMongoId()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "projectValidationMessages.updateProjectValidation.id.invalidId"
      )
    ),
  body("parentProjectId")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "projectValidationMessages.createProjectValidation.parentProjectId.empty"
      )
    )
    .isMongoId()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "projectValidationMessages.createProjectValidation.parentProjectId.invalidId"
      )
    ),
  body("country")
    .optional()
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "projectValidationMessages.updateProjectValidation.country.empty"
      )
    ),
  body("region")
    .optional()
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "projectValidationMessages.updateProjectValidation.region.empty"
      )
    ),
  body("worksite")
    .optional()
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "projectValidationMessages.updateProjectValidation.worksite.empty"
      )
    ),
  body("name")
    .optional()
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t("projectValidationMessages.updateProjectValidation.name.empty")
    )
    .isLength({ min: 4 })
    .withMessage((_, { req }) =>
      req.i18n.t(
        "projectValidationMessages.updateProjectValidation.name.length"
      )
    ),
  body("description")
    .optional()
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "projectValidationMessages.updateProjectValidation.description.empty"
      )
    )
    .isLength({ min: 25 })
    .withMessage((_, { req }) =>
      req.i18n.t(
        "projectValidationMessages.updateProjectValidation.description.length"
      )
    ),
];

export const getProjectByIdValidation = [
  param("id")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t("projectValidationMessages.getProjectById.id.empty")
    )
    .isMongoId()
    .withMessage((_, { req }) =>
      req.i18n.t("projectValidationMessages.getProjectById.id.invalidId")
    ),
];

export const validateSpecificRole = [
  param("id")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t("projectValidationMessages.validateSpecificRole.id.empty")
    )
    .isMongoId()
    .withMessage((_, { req }) =>
      req.i18n.t("projectValidationMessages.validateSpecificRole.id.invalidId")
    ),
  body("roleId")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t("projectValidationMessages.validateSpecificRole.roleId.empty")
    )
    .isMongoId()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "projectValidationMessages.validateSpecificRole.roleId.invalidId"
      )
    ),
  body("newRoleDetails.team")
    .optional()
    .isMongoId()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "projectValidationMessages.validateSpecificRole.newRoleDetails.team.invalidId"
      )
    ),
  body("newRoleDetails.assignTo")
    .optional()
    .isMongoId()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "projectValidationMessages.validateSpecificRole.newRoleDetails.assignTo.invalidId"
      )
    ),
  body("newRoleDetails.roleDescription")
    .optional()
    .isString()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "projectValidationMessages.validateSpecificRole.newRoleDetails.description.string"
      )
    )
    .isLength({ min: 25 })
    .withMessage((_, { req }) =>
      req.i18n.t(
        "projectValidationMessages.validateSpecificRole.newRoleDetails.description.length"
      )
    )
    .trim()
    .escape(),
];

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
      req.i18n.t(
        "projectValidationMessages.addRolesToProject.roles.array"
      )
    )
    .bail()
    .custom((roles) =>
      roles.every(
        (role: any) =>
          typeof role.team === "string" &&
          typeof role.assignTo === "string" &&
          typeof role.roleDescription === "string"
      )
    )
    .withMessage((_, { req }) =>
      req.i18n.t(
        "projectValidationMessages.addRolesToProject.roles.custom"
      )
    ),
];

export const projectByLocationValidation = [
  body("country")
  .notEmpty()
  .withMessage("countryValidationMessages.validateCountry.id.empty")
  .isMongoId()
  .withMessage("countryValidationMessages.validateCountry.id.invalidMongooseFormat"),
  body("region")
  .notEmpty()
  .withMessage("regionValidationMessages.validateRegion.id.empty")
  .isMongoId()
  .withMessage("regionValidationMessages.validateRegion.id.invalidMongooseFormat"),
  body("worksite")
  .notEmpty()
  .withMessage("worksiteValidationMessages.validateWorksite.id.empty")
  .isMongoId()
  .withMessage("worksiteValidationMessages.validateWorksite.id.invalidMongooseFormat")
]
