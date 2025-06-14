import { Request, Response } from 'express';
import { SpeechService } from '../services/speech.service';
import { SpeechToTextResponse } from '../types/speech.types';

export const convertSpeechToText = async (req: Request, res: Response): Promise<void> => {
    try {
      // Check if file was uploaded
      if (!req.file) {
        const response: SpeechToTextResponse = {
          success: false,
          error: 'No audio file provided'
        };
        res.status(400).json(response);
        return;
      }

      // Validate file size
      if (req.file.size === 0) {
        const response: SpeechToTextResponse = {
          success: false,
          error: 'Audio file is empty'
        };
        res.status(400).json(response);
        return;
      }

      console.log('Processing audio file:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });

      // Process the audio file
      const result = await SpeechService.processAudioFile(req.file);

      const response: SpeechToTextResponse = {
        success: true,
        transcription: result.transcription
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Speech to text conversion error:', error);
      
      const response: SpeechToTextResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      };

      res.status(500).json(response);
    }
  }