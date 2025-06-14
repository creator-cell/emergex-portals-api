import { SpeechClient } from "@google-cloud/speech";
import { UploadFileParams, UploadFileResponse } from "../helper/S3Bucket";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { config } from "../config/index";
import { S3 } from "../helper/S3Bucket";
import OpenAI from "openai";
import { Translate } from '@google-cloud/translate/build/src/v2';

// Initialize Google Cloud Speech Client
const speechClient = new SpeechClient({
  keyFilename: config.google.cloud_key_path,
  projectId: config.google.cloud_project_id,
});

const openai = new OpenAI({
  apiKey: config.openai.api_key,
});

const translateClient = new Translate({
  keyFilename: config.google.cloud_key_path,
  projectId: config.google.cloud_project_id,
});

// OPTIMIZED: Reduced language support to most common ones only
const PRIORITY_LANGUAGES = ['en-US', 'es-ES', 'hi-IN', 'fr-FR'];

// OPTIMIZED: Fast single-language recognition (no multi-language loop)
const recognizeSpeechFast = async (
  audioBuffer: Buffer, 
  mimetype: string, 
  sampleRate: number,
  languageCode: string = 'en-US'
): Promise<{
  transcription: string;
  confidence: number;
  detectedLanguage: string;
}> => {
  try {
    const request = {
      audio: {
        content: audioBuffer.toString('base64'),
      },
      config: {
        encoding: getAudioEncoding(mimetype) as any,
        sampleRateHertz: sampleRate,
        languageCode: languageCode,
        enableAutomaticPunctuation: true,
        model: 'command_and_search', // OPTIMIZED: Faster model for quick results
        maxAlternatives: 1,
        audioChannelCount: 1,
        enableSeparateRecognitionPerChannel: false,
      },
    };

    const [response] = await speechClient.recognize(request);

    if (response.results && response.results.length > 0) {
      const transcription = response.results
        .map(result => result.alternatives?.[0]?.transcript || '')
        .join(' ');

      const confidence = response.results[0]?.alternatives?.[0]?.confidence || 0;

      return {
        transcription,
        confidence,
        detectedLanguage: languageCode
      };
    }

    return { transcription: '', confidence: 0, detectedLanguage: languageCode };
  } catch (error) {
    throw new Error(`Speech recognition failed: ${error}`);
  }
};

// MODIFIED: Keep Hindi text as-is, only translate other languages to English
const translateIfNeeded = async (text: string, sourceLanguage: string): Promise<string> => {
  try {
    const baseLang = sourceLanguage.split('-')[0];
    
    // ADDED: Don't translate Hindi or English - keep original
    if (baseLang === 'en' || baseLang === 'hi') {
      return text;
    }

    // Only translate other languages to English
    const [translation] = await translateClient.translate(text, {
      from: baseLang,
      to: 'en'
    });

    return Array.isArray(translation) ? translation[0] : translation;
  } catch (error) {
    return text; // Return original if translation fails
  }
};

// Helper function to get content type from filename
const getContentTypeFromFileName = (fileName: string): string => {
  const extension = fileName.split(".").pop()?.toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    mp3: "audio/mpeg",
    wav: "audio/wav",
    webm: "audio/webm",
    ogg: "audio/ogg",
    m4a: "audio/mp4",
    flac: "audio/flac",
  };
  return mimeTypes[extension || ""] || "audio/mpeg";
};

// Upload file to S3
const UploadFile = async ({
  file,
  fileName,
  contentType,
}: UploadFileParams): Promise<UploadFileResponse> => {
  try {
    if (!file || !fileName) {
      return { Error: "file and fileName are required", Success: false };
    }

    const Params = {
      Bucket: config.aws_bucket_name as string,
      Key: `/audio/${fileName}`,
      Body: file,
      ContentType: contentType || getContentTypeFromFileName(fileName),
    };

    const Command = new PutObjectCommand(Params);
    const Response = await S3.send(Command);

    if (Response.$metadata.httpStatusCode !== 200) {
      return { Error: Response.$metadata, Success: false };
    }

    const ImageURl = `https://${config.aws_bucket_name}.s3.${config.aws_region}.amazonaws.com/${Params.Key}`;
    return { Success: true, ImageURl: ImageURl };
  } catch (Err) {
    return { Error: Err, Success: false };
  }
};

// Convert audio encoding to Google Cloud Speech API format
const getAudioEncoding = (mimetype: string) => {
  const encodingMap: { [key: string]: string } = {
    "audio/wav": "LINEAR16",
    "audio/flac": "FLAC",
    "audio/webm": "WEBM_OPUS",
    "audio/ogg": "OGG_OPUS",
    "audio/mpeg": "MP3",
    "audio/mp4": "MP3",
  };
  return encodingMap[mimetype] || "LINEAR16";
};

// OPTIMIZED: Simplified validation
const validateAudioBuffer = (buffer: Buffer): boolean => {
  return buffer && buffer.length > 1024; // Simple size check
};

// OPTIMIZED: Simplified sample rate detection
const detectSampleRate = (buffer: Buffer, mimetype: string): number => {
  const defaultRates: { [key: string]: number } = {
    "audio/wav": 16000, // OPTIMIZED: Use 16kHz for faster processing
    "audio/webm": 16000,
    "audio/ogg": 16000,
    "audio/mpeg": 16000,
    "audio/mp4": 16000,
    "audio/flac": 16000,
  };

  return defaultRates[mimetype] || 16000;
};

// OPTIMIZED: Simplified adequacy check
const isTranscriptionAdequate = (transcription: string): boolean => {
  return !!transcription && transcription.trim().length >= 3;
};

// MODIFIED: Whisper with language preservation
const fallbackTranscriptionWithAI = async (audioBuffer: Buffer, languageHint: string): Promise<string> => {
  try {
    const audioFile = new File([new Uint8Array(audioBuffer)], "audio.wav", { type: "audio/wav" });
    
    const whisperRequest: any = {
      file: audioFile,
      model: "whisper-1",
    };

    // ADDED: Set language for Whisper to preserve original language
    if (languageHint.startsWith('hi-')) {
      whisperRequest.language = "hi"; // Keep Hindi
    } else if (languageHint.startsWith('en-')) {
      whisperRequest.language = "en"; // Keep English
    } else {
      whisperRequest.language = "en"; // Default to English for other languages
    }

    const transcription = await openai.audio.transcriptions.create(whisperRequest);
    return transcription.text;
  } catch (error) {
    throw new Error('Whisper transcription failed');
  }
};

// Speech Service Class
export class SpeechService {

  // OPTIMIZED: Streamlined speech-to-text with minimal overhead
  static async convertSpeechToText(
    audioBuffer: Buffer, 
    mimetype: string, 
    languageHint: string = 'en-US' // OPTIMIZED: Single language hint instead of array
  ): Promise<{
    transcription: string;
    confidence: 'high' | 'medium' | 'low';
    method: 'google' | 'whisper';
    detectedLanguage?: string;
  }> {
    try {
      if (!validateAudioBuffer(audioBuffer)) {
        throw new Error('Invalid audio buffer');
      }

      const sampleRate = detectSampleRate(audioBuffer, mimetype);
      let transcription = '';
      let method: 'google' | 'whisper' = 'google';
      let confidence: 'high' | 'medium' | 'low' = 'low';
      let detectedLanguage: string | undefined;

      // OPTIMIZED: Try Google Speech-to-Text with single language first
      try {
        const result = await recognizeSpeechFast(audioBuffer, mimetype, sampleRate, languageHint);
        
        if (isTranscriptionAdequate(result.transcription)) {
          transcription = result.transcription;
          detectedLanguage = result.detectedLanguage;
          
          // Set confidence based on recognition confidence
          if (result.confidence > 0.8) confidence = 'high';
          else if (result.confidence > 0.5) confidence = 'medium';
          else confidence = 'low';

          // MODIFIED: Only translate non-Hindi, non-English languages
          if (!languageHint.startsWith('en-') && !languageHint.startsWith('hi-') && confidence !== 'low') {
            transcription = await translateIfNeeded(transcription, languageHint);
          }
        }
      } catch (googleError) {
        // Google failed, try one fallback language if hint wasn't English
        if (!languageHint.startsWith('en-')) {
          try {
            const englishResult = await recognizeSpeechFast(audioBuffer, mimetype, sampleRate, 'en-US');
            if (isTranscriptionAdequate(englishResult.transcription)) {
              transcription = englishResult.transcription;
              detectedLanguage = 'en-US';
              confidence = englishResult.confidence > 0.5 ? 'medium' : 'low';
            }
          } catch (englishError) {
            // Both attempts failed, continue to Whisper
          }
        }
      }

      // OPTIMIZED: Only use Whisper if Google completely failed
      if (!isTranscriptionAdequate(transcription)) {
        try {
          transcription = await fallbackTranscriptionWithAI(audioBuffer, languageHint);
          method = 'whisper';
          confidence = 'medium';
        } catch (whisperError) {
          throw new Error('All transcription methods failed');
        }
      }

      if (!transcription.trim()) {
        throw new Error('No speech detected in audio');
      }
      
      return {
        transcription: transcription.trim(),
        confidence,
        method,
        detectedLanguage
      };

    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('INVALID_ARGUMENT')) {
          throw new Error('Invalid audio format');
        } else if (error.message.includes('QUOTA_EXCEEDED')) {
          throw new Error('API quota exceeded');
        } else if (error.message.includes('PERMISSION_DENIED')) {
          throw new Error('API permission denied');
        }
      }
      
      throw new Error(`Speech recognition failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // OPTIMIZED: Simplified audio file processing
  static async processAudioFile(
    file: Express.Multer.File, 
    languageHint: string = 'en-US' // OPTIMIZED: Single language parameter
  ): Promise<{
    transcription: string;
    confidence: 'high' | 'medium' | 'low';
    method: 'google' | 'whisper';
    detectedLanguage?: string;
  }> {
    try {
      if (!file.buffer || file.buffer.length === 0) {
        throw new Error('Empty audio file');
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Audio file too large (max 10MB)');
      }

      // OPTIMIZED: Direct transcription without extra processing
      const result = await this.convertSpeechToText(
        file.buffer, 
        file.mimetype, 
        languageHint
      );

      return {
        transcription: result.transcription,
        confidence: result.confidence,
        method: result.method,
        detectedLanguage: result.detectedLanguage
      };
    } catch (error) {
      throw error;
    }
  }
}