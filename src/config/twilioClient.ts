import twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();

const requiredEnvVars = [
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_SERVICE_SID'
];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Missing environment variable: ${varName}`);
  }
});

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID as string,
  process.env.TWILIO_AUTH_TOKEN as string
);

const conversationsClient = twilioClient.conversations.v1.services(
  process.env.TWILIO_SERVICE_SID as string
);

export { twilioClient, conversationsClient };