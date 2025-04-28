"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTemplateEmail = exports.initSendGrid = void 0;
const mail_1 = __importDefault(require("@sendgrid/mail"));
const initSendGrid = () => {
    if (!process.env.SENDGRID_API_KEY) {
        throw new Error('SENDGRID_API_KEY is missing in environment variables');
    }
    mail_1.default.setApiKey(process.env.SENDGRID_API_KEY);
    return mail_1.default;
};
exports.initSendGrid = initSendGrid;
const sendTemplateEmail = async (params) => {
    const { to, templateId, dynamicTemplateData, from = process.env.DEFAULT_FROM_EMAIL, subject } = params;
    const msg = {
        to,
        from: from || 'no-reply@example.com',
        templateId,
        dynamicTemplateData,
        ...(subject && { subject }),
    };
    try {
        await mail_1.default.send(msg);
        return { success: true };
    }
    catch (error) {
        console.error('SendGrid error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to send email'
        };
    }
};
exports.sendTemplateEmail = sendTemplateEmail;
