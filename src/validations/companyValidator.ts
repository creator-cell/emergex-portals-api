import { body, param } from "express-validator";

export const createCompanyValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Company name is required"),
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
];

export const updateCompanyValidator = [
  param("id").isMongoId().withMessage("Invalid company ID"),
  body("name").optional().trim(),
  body("logo").optional(),
  body("location").optional(),
  body("businessType").optional(),
  body("emergencyContactNumber").optional(),
  body("email").optional().isEmail().withMessage("Invalid email"),
  body("contactNumber").optional(),
  body("isActive").optional().isBoolean(),
];

export const companyIdValidator = [
  param("id").isMongoId().withMessage("Invalid company ID"),
];
