"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractIncidentInfo = extractIncidentInfo;
// import speechClient from '../config/googleClient';
const openAiClient_1 = __importDefault(require("../config/openAiClient"));
// Convert audio to WAV
// export async function convertToWav(inputPath: string, outputPath: string): Promise<string> {
//   return new Promise((resolve, reject) => {
//     ffmpeg(inputPath)
//       .output(outputPath)
//       .audioCodec('pcm_s16le')
//       .audioFilters('aformat=channel_layouts=mono')
//       .on('end', () => resolve(outputPath))
//       .on('error', (err: Error) => reject(new Error(`Conversion error: ${err.message}`)))
//       .run();
//   });
// }
// // Transcribe audio using Google Speech-to-Text
// export async function transcribeAudio(audioFilePath: string): Promise<string> {
//   const file = fs.readFileSync(audioFilePath);
//   const audioBytes = file.toString('base64');
//   const request = {
//     audio: { content: audioBytes },
//     config: { encoding: "LINEAR16" as const, languageCode: 'en-US' },
//   };
//   const [response] = await speechClient.recognize(request);
//   const transcription = response.results
//     ?.map((result: any) => result.alternatives[0].transcript)
//     .join('\n') || '';
//   return transcription;
// }
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
