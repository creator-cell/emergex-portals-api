import { body } from "express-validator";
import mongoose from "mongoose";

export const validateProjectOrganizationChart = [
  body("project")
    .notEmpty()
    .withMessage("Project ID is required.")
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Invalid Project ID."),

  body("from")
    .optional()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Invalid Employee ID for 'from' field."),

  body("to")
    .optional()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Invalid Employee ID for 'to' field."),

  body("team")
    .notEmpty()
    .withMessage("Team ID is required.")
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Invalid Team ID."),

  body("employee")
    .notEmpty()
    .withMessage("Employee ID is required.")
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Invalid Employee ID."),
];
