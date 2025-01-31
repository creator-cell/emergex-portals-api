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
};
