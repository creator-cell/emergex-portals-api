"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTwilioWebhook = void 0;
const twilio_1 = __importDefault(require("twilio"));
/**
 * Validate that the webhook request is coming from Twilio
 *
 * There are two methods to validate:
 * 1. Using Twilio's validateRequest function (more secure)
 * 2. Using a webhook secret (simpler but less secure)
 *
 * This middleware implements both methods and you can choose based on your security needs
 */
const validateTwilioWebhook = (req, res, next) => {
    // Method 1: Using Twilio's validateRequest function
    if (process.env.VALIDATE_TWILIO_SIGNATURE === 'true') {
        const twilioSignature = req.headers['x-twilio-signature'];
        const url = process.env.WEBHOOK_URL; // Full URL to your webhook endpoint
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        // If any required values are missing
        if (!twilioSignature || !url || !authToken) {
            console.error('Missing required values for Twilio signature validation');
            return res.status(403).send('Forbidden: Invalid webhook signature');
        }
        // Validate the request
        const isValid = twilio_1.default.validateRequest(authToken, twilioSignature, url, req.body);
        if (!isValid) {
            console.error('Invalid Twilio signature');
            return res.status(403).send('Forbidden: Invalid webhook signature');
        }
    }
    // Method 2: Using a simple webhook secret (less secure)
    else if (process.env.WEBHOOK_SECRET) {
        const providedSecret = req.headers['x-webhook-secret'];
        if (providedSecret !== process.env.WEBHOOK_SECRET) {
            console.error('Invalid webhook secret');
            return res.status(403).send('Forbidden: Invalid webhook secret');
        }
    }
    // No validation enabled - not recommended for production
    else {
        console.warn('WARNING: No webhook authentication method enabled');
    }
    // If we get here, the webhook is authenticated
    next();
};
exports.validateTwilioWebhook = validateTwilioWebhook;
