"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateProjectOrganizationChart = void 0;
const express_validator_1 = require("express-validator");
const mongoose_1 = __importDefault(require("mongoose"));
exports.validateProjectOrganizationChart = [
    (0, express_validator_1.body)("project")
        .notEmpty()
        .withMessage("Project ID is required.")
        .custom((value) => mongoose_1.default.Types.ObjectId.isValid(value))
        .withMessage("Invalid Project ID."),
    (0, express_validator_1.body)("from")
        .optional()
        .custom((value) => mongoose_1.default.Types.ObjectId.isValid(value))
        .withMessage("Invalid Employee ID for 'from' field."),
    (0, express_validator_1.body)("to")
        .optional()
        .custom((value) => mongoose_1.default.Types.ObjectId.isValid(value))
        .withMessage("Invalid Employee ID for 'to' field."),
    (0, express_validator_1.body)("team")
        .notEmpty()
        .withMessage("Team ID is required.")
        .custom((value) => mongoose_1.default.Types.ObjectId.isValid(value))
        .withMessage("Invalid Team ID."),
    (0, express_validator_1.body)("employee")
        .notEmpty()
        .withMessage("Employee ID is required.")
        .custom((value) => mongoose_1.default.Types.ObjectId.isValid(value))
        .withMessage("Invalid Employee ID."),
];
