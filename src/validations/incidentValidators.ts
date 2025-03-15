import { body, param } from "express-validator";

const base64Regex = /^data:image\/(png|jpeg|jpg|gif|webp);base64,[A-Za-z0-9+/=]+$/;

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
    .isArray()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentValidationRules.damageAssets.array"
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
    body("images")
      .notEmpty()
      .withMessage((_, { req }) =>
        req.i18n.t(
          "incidentValidationMessages.incidentValidationRules.signature.empty"
        )
      )
      .isArray()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentValidationRules.images.array"
      )
    )
    .custom((images) => {
      if (!Array.isArray(images)) return false;
      return images.every((img) => base64Regex.test(img));
    })
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentValidationRules.images.base64"
      )
    ),
  body("signature")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentValidationRules.signature.empty"
      )
    )
    .matches(base64Regex)
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentValidationRules.signature.base64"
      )
    ),
];

export const updateIncidentValidationRules = [
  body("level")
    .optional()
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
  body("type").optional(),
  body("description").optional(),
  body("status")
    .optional()
    .isIn(["Assigned", "Delayed", "In Progress", "Completed", "Cancelled"])
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentValidationRules.status.enum"
      )
    ),
  body("projectId")
    .optional()
    .isMongoId()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentValidationRules.projectId.isMongoDbId"
      )
    ),
  body("assignedTo")
    .optional()
    .isMongoId()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentValidationRules.assignedTo.isMongoDbId"
      )
    ),
  body("countOfInjuredPeople")
    .optional()
    .isInt({ min: 0 })
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentValidationRules.countOfInjuredPeople.int"
      )
    ),
  body("countOfTotalPeople")
    .optional()
    .isInt({ min: 0 })
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentValidationRules.countOfTotalPeople.int"
      )
    ),
  body("location")
    .optional()
    .isString()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentValidationRules.location.string"
      )
    ),
  body("damageAssets")
    .optional()
    .isArray()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentValidationRules.damageAssets.array"
      )
    ),
  body("finance")
    .optional()
    .isFloat({ min: 0 })
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentValidationRules.finance.int"
      )
    ),
  body("utilityAffected")
    .optional()
    .isArray()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentValidationRules.utilityAffected.array"
      )
    ),
  body("informToTeam")
    .optional()
    .isBoolean()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentValidationRules.informToTeam.boolean"
      )
    ),
  body("termsAndConditions")
    .optional()
    .isBoolean()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentValidationRules.termsAndConditions.boolean"
      )
    ),
  body("images")
    .optional()
    .isArray()
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentValidationRules.images.array"
      )
    ),
  body("signature")
    .optional()
    .matches(base64Regex)
    .withMessage((_, { req }) =>
      req.i18n.t(
        "incidentValidationMessages.incidentValidationRules.signature.base64"
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
