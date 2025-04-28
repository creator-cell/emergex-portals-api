import { SpeechClient } from '@google-cloud/speech';

const speechClient = new SpeechClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || "aalaahah",
});

export default speechClient;
