"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAccessToken = exports.conversationsClient = exports.twilioClient = void 0;
const twilio_1 = __importDefault(require("twilio"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const requiredEnvVars = [
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_SERVICE_SID',
    'TWILIO_API_KEY',
    'TWILIO_API_SECRET',
    'TWILIO_TWIML_APP_SID'
];
requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
        throw new Error(`Missing environment variable: ${varName}`);
    }
});
const twilioClient = (0, twilio_1.default)(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
exports.twilioClient = twilioClient;
const conversationsClient = twilioClient.conversations.v1.services(process.env.TWILIO_SERVICE_SID);
exports.conversationsClient = conversationsClient;
const generateAccessToken = (identity, room) => {
    const { AccessToken } = require('twilio').jwt;
    const { ChatGrant, VoiceGrant, VideoGrant } = AccessToken;
    const token = new AccessToken(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_API_KEY, process.env.TWILIO_API_SECRET, { identity });
    const chatGrant = new ChatGrant({
        serviceSid: process.env.TWILIO_SERVICE_SID,
    });
    token.addGrant(chatGrant);
    const voiceGrant = new VoiceGrant({
        outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID,
        incomingAllow: true,
    });
    token.addGrant(voiceGrant);
    if (room) {
        const videoGrant = new VideoGrant({ room });
        token.addGrant(videoGrant);
    }
    return token.toJwt();
};
exports.generateAccessToken = generateAccessToken;
