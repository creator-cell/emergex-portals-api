"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTwilioConfig = exports.initializeTwilioConversations = exports.twilioClient = void 0;
const twilio_1 = __importDefault(require("twilio"));
const _1 = require(".");
exports.twilioClient = (0, twilio_1.default)(_1.config.twilio.accountSid, _1.config.twilio.authToken);
// Initialize Twilio client for Conversations API
const initializeTwilioConversations = () => {
    if (!_1.config.twilio.accountSid || !_1.config.twilio.authToken) {
        throw new Error('Twilio credentials not configured properly');
    }
    return exports.twilioClient;
};
exports.initializeTwilioConversations = initializeTwilioConversations;
// Validate Twilio configuration
const validateTwilioConfig = () => {
    return !!(_1.config.twilio.accountSid &&
        _1.config.twilio.authToken &&
        _1.config.twilio.apiKey &&
        _1.config.twilio.apiSecret &&
        _1.config.twilio.serviceSid);
};
exports.validateTwilioConfig = validateTwilioConfig;
