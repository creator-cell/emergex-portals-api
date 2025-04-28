import { Request, Response } from 'express';
import { convertToWav, transcribeAudio, extractIncidentInfo } from '../services/transcriptionService';
import path from 'path';

export async function handleTranscription(req: Request, res: Response): Promise<Response> {
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
    const incidentInfo = await extractIncidentInfo(text);

    return res.status(200).json({ success:true,transcription: text, incidentInfo });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ success:false,error: error.message || 'Server Error' });
  }
}
