"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertToWav = convertToWav;
exports.transcribeAudio = transcribeAudio;
exports.extractIncidentInfo = extractIncidentInfo;
const fs_1 = __importDefault(require("fs"));
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const googleClient_1 = __importDefault(require("../config/googleClient"));
const openAiClient_1 = __importDefault(require("../config/openAiClient"));
// Convert audio to WAV
async function convertToWav(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        (0, fluent_ffmpeg_1.default)(inputPath)
            .output(outputPath)
            .audioCodec('pcm_s16le')
            .audioFilters('aformat=channel_layouts=mono')
            .on('end', () => resolve(outputPath))
            .on('error', (err) => reject(new Error(`Conversion error: ${err.message}`)))
            .run();
    });
}
// Transcribe audio using Google Speech-to-Text
async function transcribeAudio(audioFilePath) {
    const file = fs_1.default.readFileSync(audioFilePath);
    const audioBytes = file.toString('base64');
    const request = {
        audio: { content: audioBytes },
        config: { encoding: "LINEAR16", languageCode: 'en-US' },
    };
    const [response] = await googleClient_1.default.recognize(request);
    const transcription = response.results
        ?.map((result) => result.alternatives[0].transcript)
        .join('\n') || '';
    return transcription;
}
// Extract incident information using OpenAI
async function extractIncidentInfo(text) {
    const prompt = `
  First analyze the text then translate the text into English if it is not already in English.
Extract the following details from the text:
- Incident Type
- Location
- Time
- Number of Injured People
- Status
- Damage Assets
- Finance
and provide Damage Assets in an array of strings.

Text: """${text}"""

Return result as a JSON object.
`;
    const completion = await openAiClient_1.default.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
    });
    const result = JSON.parse(completion.choices[0].message.content?.trim() || '{}');
    return result;
}
