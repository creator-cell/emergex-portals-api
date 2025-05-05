"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleTranscription = handleTranscription;
const transcriptionService_1 = require("../services/transcriptionService");
async function handleTranscription(req, res) {
    try {
        const { text } = req.body;
        // if (!audioFilePath) {
        //   return res.status(400).json({ error: 'Audio file path is required.' });
        // }
        if (!text) {
            return res.status(400).json({ error: 'Text is required.' });
        }
        // const wavFilePath = path.join(process.cwd(), 'uploads', 'converted_audio.wav');
        // await convertToWav(audioFilePath, wavFilePath);
        // const text = await transcribeAudio(wavFilePath);
        const incidentInfo = await (0, transcriptionService_1.extractIncidentInfo)(text);
        return res.status(200).json({ success: true, transcription: text, incidentInfo });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, error: error.message || 'Server Error' });
    }
}
