import { body, param } from "express-validator";

export const incidentHistoryValidation = [
  body("incident")
    .notEmpty()
    .withMessage((_,{req})=>req.i18n.t("incidentHistoryValidationMessages.incidentHistoryValidation.incident.empty"))
    .isMongoId()
    .withMessage((_,{req})=>req.i18n.t("incidentHistoryValidationMessages.incidentHistoryValidation.incident.isMongoDbId")),

  body("employee")
    .notEmpty()
    .withMessage((_,{req})=>req.i18n.t("incidentHistoryValidationMessages.incidentHistoryValidation.employee.empty"))
    .isMongoId()
    .withMessage((_,{req})=>req.i18n.t("incidentHistoryValidationMessages.incidentHistoryValidation.employee.isMongoDbId")),

  body("title")
  .notEmpty().withMessage((_,{req})=>req.i18n.t("incidentHistoryValidationMessages.incidentHistoryValidation.title.empty"))
  .isString().withMessage((_,{req})=>req.i18n.t("incidentHistoryValidationMessages.incidentHistoryValidation.title.string")),

//   body("role")
//     .notEmpty()
//     .withMessage("Role ID is required")
//     .custom((value) => mongoose.Types.ObjectId.isValid(value))
//     .withMessage("Invalid Role ID"),
];

export const getHistoryByIncidentId = [
  param("id")
  .notEmpty()
  .withMessage((_,{req})=>req.i18n.t("incidentHistoryValidationMessages.incidentHistoryValidation.incident.empty"))
  .isMongoId()
  .withMessage((_,{req})=>req.i18n.t("incidentHistoryValidationMessages.incidentHistoryValidation.incident.isMongoDbId")),
]
