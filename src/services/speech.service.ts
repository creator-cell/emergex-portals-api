import { SpeechClient } from "@google-cloud/speech";
import { UploadFileParams, UploadFileResponse } from "../helper/S3Bucket";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { config } from "../config/index";
import { S3 } from "../helper/S3Bucket";
import OpenAI from "openai";
import { Translate } from '@google-cloud/translate/build/src/v2';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

// Initialize Google Cloud Speech Client with better error handling
let speechClient: SpeechClient;
let openai: OpenAI;
let translateClient: Translate;

// console.log("data: ",{
//     keyFilename: config.google.cloud_key_path,
//     projectId: config.google.cloud_project_id,
// })

try {
  speechClient = new SpeechClient({
    keyFilename: config.google.cloud_key_path,
    projectId: config.google.cloud_project_id,
  });
  console.log('Google Speech Client initialized successfully');
} catch (error) {
  console.error('Failed to initialize Google Speech Client:', error);
}

try {
  openai = new OpenAI({
    apiKey: config.openai.api_key,
  });
  console.log('OpenAI Client initialized successfully');
} catch (error) {
  console.error('Failed to initialize OpenAI Client:', error);
}

try {
  translateClient = new Translate({
    keyFilename: config.google.cloud_key_path,
    projectId: config.google.cloud_project_id,
  });
  console.log('Google Translate Client initialized successfully');
} catch (error) {
  console.error('Failed to initialize Google Translate Client:', error);
}

// OPTIMIZED: Reduced language support to most common ones only
const PRIORITY_LANGUAGES = ['en-US', 'es-ES', 'hi-IN', 'fr-FR'];

// Enhanced logging for debugging
const logDebug = (message: string, data?: any) => {
  console.log(`[SpeechService] ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

const logError = (message: string, error: any) => {
  console.error(`[SpeechService ERROR] ${message}`, error);
};

// FIXED: Proper audio metadata detection using buffer analysis
const detectAudioProperties = (buffer: Buffer, mimetype: string): { sampleRate: number; channels: number } => {
  let sampleRate = 16000; // Default fallback
  let channels = 1;

  try {
    if (mimetype === 'audio/webm' || mimetype === 'audio/ogg') {
      // WEBM OPUS files typically use 48kHz
      // Check for OPUS header signature
      const headerStr = buffer.slice(0, 100).toString('hex');
      if (headerStr.includes('4f707573486561644f') || headerStr.includes('4f70757348656164')) {
        sampleRate = 48000; // OPUS default
      }
    } else if (mimetype === 'audio/wav') {
      // WAV header analysis (bytes 24-27 for sample rate)
      if (buffer.length >= 28) {
        sampleRate = buffer.readUInt32LE(24);
        channels = buffer.readUInt16LE(22);
      }
    }
    // For other formats, keep defaults or add more detection logic

    logDebug('Audio properties detected', { mimetype, sampleRate, channels });
  } catch (error) {
    logError('Failed to detect audio properties, using defaults', error);
  }

  return { sampleRate, channels };
};

// FIXED: Updated recognition with proper sample rate handling
const recognizeSpeechFast = async (
  audioBuffer: Buffer, 
  mimetype: string,
  languageCode: string = 'en-US'
): Promise<{
  transcription: string;
  confidence: number;
  detectedLanguage: string;
}> => {
  try {
    logDebug('Starting Google Speech recognition', {
      bufferSize: audioBuffer.length,
      mimetype,
      languageCode
    });

    // Check if speechClient is initialized
    if (!speechClient) {
      throw new Error('Google Speech Client not initialized');
    }

    const audioEncoding = getAudioEncoding(mimetype);
    const { sampleRate } = detectAudioProperties(audioBuffer, mimetype);
    
    logDebug('Audio encoding and sample rate determined', { audioEncoding, sampleRate });

    const request: any = {
      audio: {
        content: audioBuffer.toString('base64'),
      },
      config: {
        encoding: audioEncoding as any,
        languageCode: languageCode,
        enableAutomaticPunctuation: true,
        model: 'command_and_search',
        maxAlternatives: 1,
        audioChannelCount: 1,
        enableSeparateRecognitionPerChannel: false,
      },
    };

    // FIXED: Only set sample rate for formats that require it
    if (audioEncoding !== 'WEBM_OPUS' && audioEncoding !== 'OGG_OPUS') {
      request.config.sampleRateHertz = sampleRate;
    }
    // For WEBM_OPUS and OGG_OPUS, let Google detect from header

    logDebug('Sending request to Google Speech API', {
      encoding: audioEncoding,
      sampleRateHertz: request.config.sampleRateHertz || 'auto-detect'
    });
    
    const [response] = await speechClient.recognize(request);
    logDebug('Google Speech API response received', {
      resultCount: response.results?.length || 0
    });

    if (response.results && response.results.length > 0) {
      const transcription = response.results
        .map(result => result.alternatives?.[0]?.transcript || '')
        .join(' ');

      const confidence = response.results[0]?.alternatives?.[0]?.confidence || 0;

      logDebug('Transcription successful', {
        transcription: transcription.substring(0, 100) + '...',
        confidence
      });

      return {
        transcription,
        confidence,
        detectedLanguage: languageCode
      };
    }

    logDebug('No results from Google Speech API');
    return { transcription: '', confidence: 0, detectedLanguage: languageCode };
  } catch (error: any) {
    logError('Google Speech recognition failed', {
      error: error.message,
      code: error.code,
      details: error.details
    });
    throw new Error(`Speech recognition failed: ${error.message || error}`);
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

    logDebug('Translating text', { sourceLanguage, baseLang });

    if (!translateClient) {
      logError('Google Translate Client not initialized', null);
      return text;
    }

    // Only translate other languages to English
    const [translation] = await translateClient.translate(text, {
      from: baseLang,
      to: 'en'
    });

    const result = Array.isArray(translation) ? translation[0] : translation;
    logDebug('Translation successful');
    return result;
  } catch (error) {
    logError('Translation failed', error);
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

// OPTIMIZED: Improved validation
const validateAudioBuffer = (buffer: Buffer): boolean => {
  const isValid = buffer && buffer.length > 1024;
  logDebug('Audio buffer validation', { 
    size: buffer?.length, 
    isValid,
    firstBytes: buffer?.slice(0, 10).toString('hex')
  });
  return isValid;
};

// OPTIMIZED: Simplified adequacy check
const isTranscriptionAdequate = (transcription: string): boolean => {
  const isAdequate = !!transcription && transcription.trim().length >= 3;
  logDebug('Transcription adequacy check', { 
    transcription: transcription?.substring(0, 50) + '...',
    length: transcription?.length,
    isAdequate 
  });
  return isAdequate;
};

// FIXED: Whisper with proper file handling for Node.js environment
const fallbackTranscriptionWithAI = async (audioBuffer: Buffer, languageHint: string): Promise<string> => {
  let tempFilePath: string | null = null;
  
  try {
    logDebug('Starting Whisper transcription', {
      bufferSize: audioBuffer.length,
      languageHint
    });

    // Check if OpenAI client is initialized
    if (!openai) {
      throw new Error('OpenAI Client not initialized');
    }

    // FIXED: Create temporary file for Whisper API (Node.js environment)
    const tempDir = '/tmp'; // Use /tmp in production environment
    const tempFileName = `audio_${Date.now()}_${Math.random().toString(36).substring(7)}.wav`;
    tempFilePath = path.join(tempDir, tempFileName);

    // Write buffer to temporary file
    await promisify(fs.writeFile)(tempFilePath, new Uint8Array(audioBuffer));

    logDebug('Temporary audio file created', { tempFilePath });

    // Create file stream for Whisper
    const audioFile = fs.createReadStream(tempFilePath);

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

    logDebug('Sending request to Whisper API', { 
      model: whisperRequest.model,
      language: whisperRequest.language 
    });

    const transcription = await openai.audio.transcriptions.create(whisperRequest);
    
    logDebug('Whisper transcription successful', {
      text: transcription.text.substring(0, 100) + '...'
    });

    return transcription.text;
  } catch (error: any) {
    logError('Whisper transcription failed', {
      error: error.message,
      code: error.code,
      type: error.type
    });
    throw new Error(`Whisper transcription failed: ${error.message || error}`);
  } finally {
    // Clean up temporary file
    if (tempFilePath) {
      try {
        await promisify(fs.unlink)(tempFilePath);
        logDebug('Temporary file cleaned up', { tempFilePath });
      } catch (cleanupError) {
        logError('Failed to cleanup temporary file', cleanupError);
      }
    }
  }
};

// Speech Service Class
export class SpeechService {

  // FIXED: Updated speech-to-text with proper audio handling
  static async convertSpeechToText(
    audioBuffer: Buffer, 
    mimetype: string, 
    languageHint: string = 'en-US'
  ): Promise<{
    transcription: string;
    confidence: 'high' | 'medium' | 'low';
    method: 'google' | 'whisper';
    detectedLanguage?: string;
  }> {
    try {
      logDebug('Starting speech-to-text conversion', {
        bufferSize: audioBuffer.length,
        mimetype,
        languageHint
      });

      if (!validateAudioBuffer(audioBuffer)) {
        throw new Error('Invalid audio buffer');
      }

      let transcription = '';
      let method: 'google' | 'whisper' = 'google';
      let confidence: 'high' | 'medium' | 'low' = 'low';
      let detectedLanguage: string | undefined;
      let googleError: any = null;
      let whisperError: any = null;

      // Try Google Speech-to-Text first
      try {
        logDebug('Attempting Google Speech-to-Text');
        const result = await recognizeSpeechFast(audioBuffer, mimetype, languageHint);
        
        if (isTranscriptionAdequate(result.transcription)) {
          transcription = result.transcription;
          detectedLanguage = result.detectedLanguage;
          
          // Set confidence based on recognition confidence
          if (result.confidence > 0.8) confidence = 'high';
          else if (result.confidence > 0.5) confidence = 'medium';
          else confidence = 'low';

          logDebug('Google Speech-to-Text successful', { confidence });

          // Only translate non-Hindi, non-English languages
          if (!languageHint.startsWith('en-') && !languageHint.startsWith('hi-') && confidence !== 'low') {
            transcription = await translateIfNeeded(transcription, languageHint);
          }
        }
      } catch (error) {
        googleError = error;
        logError('Google Speech-to-Text failed', error);
        
        // Try English fallback if original wasn't English
        if (!languageHint.startsWith('en-')) {
          try {
            logDebug('Trying Google Speech-to-Text with English fallback');
            const englishResult = await recognizeSpeechFast(audioBuffer, mimetype, 'en-US');
            if (isTranscriptionAdequate(englishResult.transcription)) {
              transcription = englishResult.transcription;
              detectedLanguage = 'en-US';
              confidence = englishResult.confidence > 0.5 ? 'medium' : 'low';
              logDebug('English fallback successful');
            }
          } catch (englishError) {
            logError('English fallback also failed', englishError);
          }
        }
      }

      // Use Whisper only if Google completely failed
      if (!isTranscriptionAdequate(transcription)) {
        try {
          logDebug('Attempting Whisper transcription as fallback');
          transcription = await fallbackTranscriptionWithAI(audioBuffer, languageHint);
          method = 'whisper';
          confidence = 'medium';
          logDebug('Whisper transcription successful');
        } catch (error) {
          whisperError = error;
          logError('Whisper transcription failed', error);
        }
      }

      if (!transcription.trim()) {
        // Provide detailed error information
        const errorDetails = {
          googleError: googleError?.message,
          whisperError: whisperError?.message,
          audioInfo: {
            size: audioBuffer.length,
            mimetype,
            languageHint
          }
        };
        
        logError('All transcription methods failed', errorDetails);
        throw new Error(`All transcription methods failed. Google: ${googleError?.message || 'Unknown'}, Whisper: ${whisperError?.message || 'Unknown'}`);
      }
      
      logDebug('Speech-to-text conversion completed successfully', {
        method,
        confidence,
        transcriptionLength: transcription.length
      });

      return {
        transcription: transcription.trim(),
        confidence,
        method,
        detectedLanguage
      };

    } catch (error) {
      logError('Speech-to-text conversion failed', error);
      
      if (error instanceof Error) {
        if (error.message.includes('INVALID_ARGUMENT')) {
          throw new Error('Invalid audio format');
        } else if (error.message.includes('QUOTA_EXCEEDED')) {
          throw new Error('API quota exceeded');
        } else if (error.message.includes('PERMISSION_DENIED')) {
          throw new Error('API permission denied');
        } else if (error.message.includes('not initialized')) {
          throw new Error('API clients not properly initialized - check credentials and config');
        }
      }
      
      throw new Error(`Speech recognition failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // OPTIMIZED: Simplified audio file processing
  static async processAudioFile(
    file: Express.Multer.File, 
    languageHint: string = 'en-US'
  ): Promise<{
    transcription: string;
    confidence: 'high' | 'medium' | 'low';
    method: 'google' | 'whisper';
    detectedLanguage?: string;
  }> {
    try {
      logDebug('Processing audio file', {
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        languageHint
      });

      if (!file.buffer || file.buffer.length === 0) {
        throw new Error('Empty audio file');
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Audio file too large (max 10MB)');
      }

      // Direct transcription
      const result = await this.convertSpeechToText(
        file.buffer, 
        file.mimetype, 
        languageHint
      );

      logDebug('Audio file processing completed successfully');

      return {
        transcription: result.transcription,
        confidence: result.confidence,
        method: result.method,
        detectedLanguage: result.detectedLanguage
      };
    } catch (error) {
      logError('Audio file processing failed', error);
      throw error;
    }
  }

  // Add a method to check service health
  static async checkServiceHealth(): Promise<{
    googleSpeech: boolean;
    openai: boolean;
    googleTranslate: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    let googleSpeechHealthy = false;
    let openaiHealthy = false;
    let googleTranslateHealthy = false;

    // Check Google Speech
    try {
      if (speechClient) {
        googleSpeechHealthy = true;
      } else {
        errors.push('Google Speech Client not initialized');
      }
    } catch (error) {
      errors.push(`Google Speech health check failed: ${error}`);
    }

    // Check OpenAI
    try {
      if (openai) {
        openaiHealthy = true;
      } else {
        errors.push('OpenAI Client not initialized');
      }
    } catch (error) {
      errors.push(`OpenAI health check failed: ${error}`);
    }

    // Check Google Translate
    try {
      if (translateClient) {
        googleTranslateHealthy = true;
      } else {
        errors.push('Google Translate Client not initialized');
      }
    } catch (error) {
      errors.push(`Google Translate health check failed: ${error}`);
    }

    return {
      googleSpeech: googleSpeechHealthy,
      openai: openaiHealthy,
      googleTranslate: googleTranslateHealthy,
      errors
    };
  }
}