"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getByIdValidation = void 0;
const express_validator_1 = require("express-validator");
exports.getByIdValidation = [
    (0, express_validator_1.param)("id")
        .notEmpty()
        .withMessage((_, { req }) => req.i18n.t("incidentStatusHistoryValidationMessages.getIncidentStatusHistory.id.empty"))
        .isMongoId()
        .withMessage((_, { req }) => req.i18n.t("incidentStatusHistoryValidationMessages.getIncidentStatusHistory.id.isMongoDbId")),
];
