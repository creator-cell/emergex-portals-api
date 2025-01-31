import { body, param } from "express-validator";

export const incidentValidationRules = [
  body("level")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentValidationRules.level.empty"
      )
    )
    .isString()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentValidationRules.level.string"
      )
    )
    .isIn(["Level 1", "Level 2", "Level 3", "Level 4"])
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentValidationRules.level.enum"
      )
    ),
  body("type")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentValidationRules.type.empty"
      )
    ),
  body("description")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentValidationRules.description.empty"
      )
    ),
  body("status")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentValidationRules.status.empty"
      )
    )
    .isIn(["Assigned", "Delayed", "In Progress", "Completed", "Cancelled"])
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentValidationRules.status.enum"
      )
    ),
  body("projectId")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentValidationRules.projectId.empty"
      )
    )
    .isMongoId()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentValidationRules.projectId.isMongoDbId"
      )
    ),
  body("assignedTo")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentValidationRules.assignedTo.empty"
      )
    )
    .isMongoId()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentValidationRules.assignedTo.isMongoDbId"
      )
    ),
  body("countOfInjuredPeople")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentValidationRules.countOfInjuredPeople.empty"
      )
    )
    .isInt({ min: 0 })
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentValidationRules.countOfInjuredPeople.int"
      )
    ),
  body("countOfTotalPeople")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentValidationRules.countOfTotalPeople.empty"
      )
    )
    .isInt({ min: 0 })
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentValidationRules.countOfTotalPeople.int"
      )
    ),
  body("location")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentValidationRules.location.empty"
      )
    )
    .isString()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentValidationRules.location.string"
      )
    ),
  body("damageAssets")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentValidationRules.damageAssets.empty"
      )
    )
    .isString()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentValidationRules.damageAssets.string"
      )
    ),
  body("finance")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentValidationRules.finance.empty"
      )
    )
    .isFloat({ min: 0 })
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentValidationRules.finance.int"
      )
    ),
  body("utilityAffected")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentValidationRules.utilityAffected.empty"
      )
    )
    .isArray()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentValidationRules.utilityAffected.array"
      )
    ),
  body("informToTeam")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentValidationRules.informToTeam.empty"
      )
    )
    .isBoolean()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentValidationRules.informToTeam.boolean"
      )
    ),
  body("termsAndConditions")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentValidationRules.termsAndConditions.empty"
      )
    )
    .isBoolean()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentValidationRules.termsAndConditions.boolean"
      )
    ),
];

export const incidentsByIdValidationRules = [
  param("id")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentsByIdValidationRules.id.empty"
      )
    )
    .isMongoId()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentsByIdValidationRules.id.isMongoDbId"
      )
    ),
];

export const getIncidentsByProjectIdValidationRules = [
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

export const updateStatusValidation = [
  param("id")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentsByIdValidationRules.id.empty"
      )
    )
    .isMongoId()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentsByIdValidationRules.id.isMongoDbId"
      )
    ),
  body("status")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentValidationRules.status.empty"
      )
    )
    .isIn(["Assigned", "Delayed", "In Progress", "Completed", "Cancelled"])
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentValidationRules.status.enum"
      )
    ),
];
