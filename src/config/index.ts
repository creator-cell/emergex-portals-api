import dotenv from "dotenv";

dotenv.config();

/**
 * Central config object.
 * All process.env access happens here — nowhere else in the codebase.
 *
 * Critical secrets have NO fallback so the app fails fast at startup
 * rather than silently running with an insecure default.
 * Call validateEnv() in index.ts before this is first used.
 */
export const config = {
  port: parseInt(process.env.PORT || "8000", 10),
  dbConnectionString: process.env.MONGO_URI || "",
  jwtSecret: process.env.JWT_SECRET || "",   // validated by validateEnv() at startup
  apiVersion: process.env.API_VERSION || "v1",
  nodeEnv: process.env.NODE_ENV || "development",

  aws: {
    accessKey: process.env.AWS_ACCESS_KEY || "",
    secretKey: process.env.AWS_SECRET_KEY || "",
    region: process.env.AWS_REGION || "us-east-1",
    bucketName: process.env.AWS_BUCKET_NAME || "",
    arnKey: process.env.AWS_ARN || "",
  },

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || "",
    authToken: process.env.TWILIO_AUTH_TOKEN || "",
    apiKey: process.env.TWILIO_API_KEY || "",
    apiSecret: process.env.TWILIO_API_SECRET || "",
    serviceSid: process.env.TWILIO_SERVICE_SID || "",
    twimlAppSid: process.env.TWILIO_TWIML_APP_SID || "",
  },

  google: {
    cloudKeyPath: process.env.GOOGLE_APPLICATION_CREDENTIALS || "",
    cloudProjectId: process.env.GOOGLE_CLOUD_PROJECT_ID || "",
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY || "",
  },

  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || "",
    emailFrom: process.env.EMAIL_FROM || "",
  },

  cors: {
    prodDomain: process.env.PROD_AUTHORIZED_DOMAIN || "",
    devDomain: process.env.DEV_AUTHORIZED_DOMAIN || "http://localhost:3000",
  },

  rca: {
    engineUrl: process.env.RCA_ENGINE_URL || "http://localhost:8001",
    internalApiKey: process.env.RCA_INTERNAL_API_KEY || "",
  },
};
