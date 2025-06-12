import { google } from '@google-cloud/speech/build/protos/protos';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Export the configuration settings
export const config = {
  port: parseInt(process.env.PORT || '8000', 10),
  dbConnectionString: process.env.MONGO_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'defaultSecret',
  apiVersion: process.env.API_VERSION || 'v1',
  nodeEnv: process.env.NODE_ENV || 'development',
  aws_access_key: process.env.AWS_ACCESS_KEY,
  aws_secret_key: process.env.AWS_SECRET_KEY,
  aws_region: process.env.AWS_REGION,
  aws_bucket_name: process.env.AWS_BUCKET_NAME,
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    apiKey: process.env.TWILIO_API_KEY || '',
    apiSecret: process.env.TWILIO_API_SECRET || '',
    serviceSid: process.env.TWILIO_SERVICE_SID || ''
  },
  google:{
    cloud_key_path:process.env.GOOGLE_CLOUD_PROJECT_ID || '',
    cloud_project_id: process.env.GOOGLE_CLOUD_PROJECT_ID || '',
  },
  openai:{
api_key:process.env.OPENAI_API_KEY
  }
};
