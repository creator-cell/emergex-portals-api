"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables from .env file
dotenv_1.default.config();
// Export the configuration settings
exports.config = {
    port: parseInt(process.env.PORT || "8000", 10),
    dbConnectionString: process.env.MONGO_URI || "",
    jwtSecret: process.env.JWT_SECRET || "defaultSecret",
    apiVersion: process.env.API_VERSION || "v1",
    nodeEnv: process.env.NODE_ENV || "development",
    aws_access_key: process.env.AWS_ACCESS_KEY,
    aws_secret_key: process.env.AWS_SECRET_KEY,
    aws_region: process.env.AWS_REGION,
    aws_bucket_name: process.env.AWS_BUCKET_NAME,
    twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID || "",
        authToken: process.env.TWILIO_AUTH_TOKEN || "",
        apiKey: process.env.TWILIO_API_KEY || "",
        apiSecret: process.env.TWILIO_API_SECRET || "",
        serviceSid: process.env.TWILIO_SERVICE_SID || "",
    },
    google: {
        cloud_key_path: process.env.GOOGLE_APPLICATION_CREDENTIALS || "",
        cloud_project_id: process.env.GOOGLE_CLOUD_PROJECT_ID || "",
    },
    openai: {
        api_key: process.env.OPENAI_API_KEY,
    },
};
