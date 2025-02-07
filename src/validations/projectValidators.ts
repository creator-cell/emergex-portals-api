import { body, param, query } from "express-validator";

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

export const projectByLocationValidation = [
  query("country")
  .notEmpty()
  .withMessage((_, { req }) =>
    req.i18n.t("countryValidationMessages.validateCountry.id.empty")
  )
  .isMongoId()
  .withMessage((_, { req }) =>
    req.i18n.t(
      "countryValidationMessages.validateCountry.id.invalidMongooseFormat"
    )
  ),
  query("region")
  .notEmpty()
    .withMessage((_,{req})=>req.i18n.t("regionValidationMessages.validateRegion.id.empty"))
    .isMongoId()
    .withMessage((_,{req})=>req.i18n.t("regionValidationMessages.validateRegion.id.invalidMongooseFormat")),
  query("worksite")
  .notEmpty()
  .withMessage((_,{req})=>req.i18n.t("worksiteValidationMessages.validateWorksite.id.empty"))
  .isMongoId()
  .withMessage((_,{req})=>req.i18n.t("worksiteValidationMessages.validateWorksite.id.invalidMongooseFormat")),
]
