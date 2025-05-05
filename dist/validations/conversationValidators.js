"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversationIdValidation = exports.updateConversationValidation = exports.sendMessageValidation = exports.removeParticipantValidation = exports.addParticipantValidation = exports.getUserConversationsValidation = exports.createConversationValidation = exports.validate = void 0;
const express_validator_1 = require("express-validator");
const validate = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};
exports.validate = validate;
exports.createConversationValidation = [
    (0, express_validator_1.body)("participant")
        .notEmpty()
        .withMessage("Participant is required")
        .isMongoId()
        .withMessage("Participant must be a valid MongoDB ID"),
    exports.validate,
];
exports.getUserConversationsValidation = [
    (0, express_validator_1.body)("incidentId")
        .optional()
        .notEmpty()
        .withMessage("incidentId is required")
        .isMongoId()
        .withMessage("incidentId must be a valid MongoDB ID"),
    exports.validate,
];
exports.addParticipantValidation = [
    (0, express_validator_1.param)("id").isMongoId().withMessage("Invalid conversation ID"),
    (0, express_validator_1.body)("userId").isMongoId().withMessage("Invalid user ID"),
    (0, express_validator_1.body)("identity")
        .notEmpty()
        .withMessage("Identity is required")
        .isLength({ min: 3, max: 100 })
        .withMessage("Identity must be between 3 and 100 characters"),
    exports.validate,
];
exports.removeParticipantValidation = [
    (0, express_validator_1.param)("id").isMongoId().withMessage("Invalid conversation ID"),
    (0, express_validator_1.param)("participantId").isMongoId().withMessage("Invalid participant ID"),
    exports.validate,
];
exports.sendMessageValidation = [
    (0, express_validator_1.param)("id").isMongoId().withMessage("Invalid conversation ID"),
    (0, express_validator_1.body)("body")
        .optional()
        .isLength({ min: 1, max: 4096 })
        .withMessage("Message body must be between 1 and 4096 characters"),
    (0, express_validator_1.body)("media")
        .optional()
        .isArray()
        .withMessage("Media must be an array of URLs"),
    exports.validate,
];
exports.updateConversationValidation = [
    (0, express_validator_1.param)("id").isMongoId().withMessage("Invalid conversation ID"),
    (0, express_validator_1.body)("friendlyName")
        .optional()
        .isLength({ min: 3, max: 100 })
        .withMessage("Friendly name must be between 3 and 100 characters"),
    (0, express_validator_1.body)("attributes")
        .optional()
        .isObject()
        .withMessage("Attributes must be an object"),
    exports.validate,
];
exports.conversationIdValidation = [
    (0, express_validator_1.param)("id").isMongoId().withMessage("Invalid conversation ID"),
    exports.validate,
];
