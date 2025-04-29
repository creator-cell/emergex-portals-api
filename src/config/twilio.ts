import twilio from 'twilio';
import { config as env } from '.';

export const twilioClient = twilio(env.twilio.accountSid, env.twilio.authToken);

// Initialize Twilio client for Conversations API
export const initializeTwilioConversations = () => {
  if (!env.twilio.accountSid || !env.twilio.authToken) {
    throw new Error('Twilio credentials not configured properly');
  }
  
  return twilioClient;
};

// Validate Twilio configuration
export const validateTwilioConfig = (): boolean => {
  return !!(
    env.twilio.accountSid &&
    env.twilio.authToken &&
    env.twilio.apiKey &&
    env.twilio.apiSecret &&
    env.twilio.serviceSid
  );
};