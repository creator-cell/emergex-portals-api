import twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();

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

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID as string,
  process.env.TWILIO_AUTH_TOKEN as string
);

const conversationsClient = twilioClient.conversations.v1.services(
  process.env.TWILIO_SERVICE_SID as string
);

const generateAccessToken = (identity: string, room?: string) => {
  const { AccessToken } = require('twilio').jwt;
  const { ChatGrant, VoiceGrant, VideoGrant } = AccessToken;

  const token = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID as string,
    process.env.TWILIO_API_KEY as string,
    process.env.TWILIO_API_SECRET as string,
    { identity }
  );

  const chatGrant = new ChatGrant({
    serviceSid: process.env.TWILIO_SERVICE_SID as string,
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


export { twilioClient, conversationsClient, generateAccessToken };