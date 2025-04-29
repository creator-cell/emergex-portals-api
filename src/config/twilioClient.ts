import twilio from 'twilio';

const accountSid = 'YOUR_TWILIO_ACCOUNT_SID';
const authToken = 'YOUR_TWILIO_AUTH_TOKEN';

const twilioClient = twilio(accountSid, authToken);
export default twilioClient;
