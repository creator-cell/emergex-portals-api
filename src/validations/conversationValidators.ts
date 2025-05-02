import { Request, Response, NextFunction } from "express";
import { body, param, validationResult } from "express-validator";

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const createConversationValidation = [
  body("participant")
    .notEmpty()
    .withMessage("Participant is required")
    .isMongoId()
    .withMessage("Participant must be a valid MongoDB ID"),
  validate,
];

export const getUserConversationsValidation = [
  body("incidentId")
    .optional()
    .notEmpty()
    .withMessage("incidentId is required")
    .isMongoId()
    .withMessage("incidentId must be a valid MongoDB ID"),
  validate,
];

export const addParticipantValidation = [
  param("id").isMongoId().withMessage("Invalid conversation ID"),
  body("userId").isMongoId().withMessage("Invalid user ID"),
  body("identity")
    .notEmpty()
    .withMessage("Identity is required")
    .isLength({ min: 3, max: 100 })
    .withMessage("Identity must be between 3 and 100 characters"),
  validate,
];

export const removeParticipantValidation = [
  param("id").isMongoId().withMessage("Invalid conversation ID"),
  param("participantId").isMongoId().withMessage("Invalid participant ID"),
  validate,
];

export const sendMessageValidation = [
  param("id").isMongoId().withMessage("Invalid conversation ID"),
  body("body")
    .optional()
    .isLength({ min: 1, max: 4096 })
    .withMessage("Message body must be between 1 and 4096 characters"),
  body("media")
    .optional()
    .isArray()
    .withMessage("Media must be an array of URLs"),
  validate,
];

export const updateConversationValidation = [
  param("id").isMongoId().withMessage("Invalid conversation ID"),
  body("friendlyName")
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage("Friendly name must be between 3 and 100 characters"),
  body("attributes")
    .optional()
    .isObject()
    .withMessage("Attributes must be an object"),
  validate,
];

export const conversationIdValidation = [
  param("id").isMongoId().withMessage("Invalid conversation ID"),
  validate,
];
