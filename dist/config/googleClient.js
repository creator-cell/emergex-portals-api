"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const speech_1 = require("@google-cloud/speech");
const speechClient = new speech_1.SpeechClient({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || "aalaahah",
});
exports.default = speechClient;
