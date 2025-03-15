import { param } from "express-validator";

export const getByIdValidation = [
  param("id")
    .notEmpty()
    .withMessage((_, { req }) =>
      req.i18n.t("incidentStatusHistoryValidationMessages.getIncidentStatusHistory.id.empty")
    )
    .isMongoId()
    .withMessage((_, { req }) =>
      req.i18n.t("incidentStatusHistoryValidationMessages.getIncidentStatusHistory.id.isMongoDbId")
    ),
];
