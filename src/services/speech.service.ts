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
  apiKey: config.openai.api_key, // Add this to your config
});

const translateClient = new Translate({
  keyFilename: config.google.cloud_key_path,
  projectId: config.google.cloud_project_id,
});

const SUPPORTED_LANGUAGES = {
  'en': 'en-US',     // English
  'es': 'es-ES',     // Spanish
  'hi': 'hi-IN',     // Hindi
  'fr': 'fr-FR',     // French
  'de': 'de-DE',     // German
  'it': 'it-IT',     // Italian
  'pt': 'pt-BR',     // Portuguese
  'ru': 'ru-RU',     // Russian
  'ja': 'ja-JP',     // Japanese
  'ko': 'ko-KR',     // Korean
  'zh': 'zh-CN',     // Chinese (Simplified)
  'ar': 'ar-SA',     // Arabic
  'tr': 'tr-TR',     // Turkish
  'nl': 'nl-NL',     // Dutch
  'sv': 'sv-SE',     // Swedish
  'da': 'da-DK',     // Danish
  'no': 'nb-NO',     // Norwegian
  'fi': 'fi-FI',     // Finnish
  'pl': 'pl-PL',     // Polish
  'cs': 'cs-CZ',     // Czech
  'hu': 'hu-HU',     // Hungarian
  'ro': 'ro-RO',     // Romanian
  'sk': 'sk-SK',     // Slovak
  'bg': 'bg-BG',     // Bulgarian
  'hr': 'hr-HR',     // Croatian
  'sr': 'sr-RS',     // Serbian
  'sl': 'sl-SI',     // Slovenian
  'et': 'et-EE',     // Estonian
  'lv': 'lv-LV',     // Latvian
  'lt': 'lt-LT',     // Lithuanian
  'uk': 'uk-UA',     // Ukrainian
  'he': 'he-IL',     // Hebrew
  'th': 'th-TH',     // Thai
  'vi': 'vi-VN',     // Vietnamese
  'id': 'id-ID',     // Indonesian
  'ms': 'ms-MY',     // Malaysian
  'tl': 'tl-PH',     // Filipino/Tagalog
  'bn': 'bn-IN',     // Bengali
  'ta': 'ta-IN',     // Tamil
  'te': 'te-IN',     // Telugu
  'mr': 'mr-IN',     // Marathi
  'gu': 'gu-IN',     // Gujarati
  'kn': 'kn-IN',     // Kannada
  'ml': 'ml-IN',     // Malayalam
  'pa': 'pa-IN',     // Punjabi
  'or': 'or-IN',     // Odia
  'as': 'as-IN',     // Assamese
};

const recognizeSpeechMultiLanguage = async (
  audioBuffer: Buffer, 
  mimetype: string, 
  sampleRate: number,
  targetLanguages: string[] = ['en-US', 'es-ES', 'hi-IN', 'fr-FR', 'de-DE']
): Promise<{
  transcription: string;
  detectedLanguage: string;
  confidence: number;
  alternatives?: Array<{ text: string; language: string; confidence: number }>;
}> => {
  let bestResult = { transcription: '', detectedLanguage: 'en-US', confidence: 0 };
  const alternatives: Array<{ text: string; language: string; confidence: number }> = [];

  // Try recognition with multiple languages
  for (const languageCode of targetLanguages) {
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
          model: 'latest_long',
          enableWordConfidence: true,
          maxAlternatives: 1,
          profanityFilter: false,
          audioChannelCount: 1,
          enableSeparateRecognitionPerChannel: false,
          useEnhanced: true,
          // **ADDED: Alternative language codes for better recognition**
          alternativeLanguageCodes: targetLanguages.filter(lang => lang !== languageCode).slice(0, 3),
        },
      };

      const [response] = await speechClient.recognize(request);

      if (response.results && response.results.length > 0) {
        const transcription = response.results
          .map(result => result.alternatives?.[0]?.transcript || '')
          .join(' ');

        const avgConfidence = response.results.reduce((acc, result) => {
          const conf = result.alternatives?.[0]?.confidence || 0;
          return acc + conf;
        }, 0) / response.results.length;

        alternatives.push({
          text: transcription,
          language: languageCode,
          confidence: avgConfidence
        });

        // Keep track of the best result
        if (avgConfidence > bestResult.confidence && transcription.trim().length > 0) {
          bestResult = {
            transcription,
            detectedLanguage: languageCode,
            confidence: avgConfidence
          };
        }

        console.log(`Recognition result for ${languageCode}: confidence ${avgConfidence}, text: "${transcription.substring(0, 50)}..."`);
      }
    } catch (error) {
      console.log(`Recognition failed for language ${languageCode}:`, error);
      continue;
    }
  }

  return {
    ...bestResult,
    alternatives: alternatives.sort((a, b) => b.confidence - a.confidence)
  };
};

const translateToEnglish = async (text: string, sourceLanguage: string): Promise<{
  translatedText: string;
  originalLanguage: string;
  confidence: number;
}> => {
  try {
    if (sourceLanguage === 'en') {
      return {
        translatedText: text,
        originalLanguage: 'en',
        confidence: 1.0
      };
    }

    const [translation] = await translateClient.translate(text, {
      from: sourceLanguage,
      to: 'en'
    });

    return {
      translatedText: Array.isArray(translation) ? translation[0] : translation,
      originalLanguage: sourceLanguage,
      confidence: 0.9 // Assume high confidence for Google Translate
    };
  } catch (error) {
    console.error('Translation failed:', error);
    return {
      translatedText: text,
      originalLanguage: sourceLanguage,
      confidence: 0
    };
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
    console.log(Err);
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
  // console.log("encoding: ",encodingMap[mimetype])
  return encodingMap[mimetype] || "LINEAR16";
};

const validateAudioBuffer = (buffer: Buffer): boolean => {
  // Check if buffer is not empty and has minimum size
  if (!buffer || buffer.length === 0) {
    // console.log("Audio buffer is empty");
    return false;
  }

  // Check minimum file size (should be at least 1KB for meaningful audio)
  if (buffer.length < 1024) {
    // console.log("Audio buffer too small:", buffer.length, "bytes");
    return false;
  }

  // console.log("Audio buffer size:", buffer.length, "bytes");
  return true;
};

const detectSampleRate = (buffer: Buffer, mimetype: string): number => {
  // Default sample rates based on format
  const defaultRates: { [key: string]: number } = {
    "audio/wav": 44100,
    "audio/webm": 48000,
    "audio/ogg": 48000,
    "audio/mpeg": 44100,
    "audio/mp4": 44100,
    "audio/flac": 44100,
  };

  // For WAV files, try to extract sample rate from header
  if (mimetype === "audio/wav" && buffer.length > 44) {
    try {
      // WAV header sample rate is at bytes 24-27 (little endian)
      const sampleRate = buffer.readUInt32LE(24);
      if (sampleRate >= 8000 && sampleRate <= 48000) {
        // console.log("Detected sample rate:", sampleRate);
        return sampleRate;
      }
    } catch (error) {
      console.log(
        "Could not extract sample rate from WAV header, using default"
      );
    }
  }

  const defaultRate = defaultRates[mimetype] || 16000;
  // console.log("Using default sample rate:", defaultRate);
  return defaultRate;
};

const isTranscriptionAdequate = (transcription: string): boolean => {
  if (!transcription || transcription.trim().length === 0) {
    return false;
  }
  
  // Check for minimum length (at least 5 characters for meaningful content)
  if (transcription.trim().length < 5) {
    return false;
  }
  
  // Check for gibberish patterns
  const gibberishPatterns = [
    /^[^a-zA-Z0-9\s]*$/, // Only special characters
    /(.)\1{4,}/, // Repeated characters (aaaaa, bbbbb)
    /^[a-z]{1,2}(\s[a-z]{1,2}){3,}$/, // Too many single/double letter words
  ];
  
  for (const pattern of gibberishPatterns) {
    if (pattern.test(transcription.trim().toLowerCase())) {
      return false;
    }
  }
  
  return true;
};

const enhanceTranscriptionWithAI = async (rawTranscription: string, context?: string): Promise<string> => {
  try {
    const prompt = `
You are helping to improve a speech-to-text transcription that may contain errors, unclear words, or missing context.

Original transcription: "${rawTranscription}"
${context ? `Context: This appears to be related to ${context}` : ''}

Please:
1. Fix any obvious speech-to-text errors
2. Correct grammar and punctuation
3. Fill in likely missing words based on context
4. Ensure the text makes logical sense
5. If the transcription seems to be about an incident/emergency, structure it clearly

Return only the improved transcription, nothing else.
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 500
    });

    const enhancedText = completion.choices[0].message.content?.trim() || rawTranscription;
    console.log("AI Enhanced transcription:", enhancedText);
    return enhancedText;
  } catch (error) {
    console.error('AI enhancement failed:', error);
    return rawTranscription; // Return original if AI fails
  }
};

const fallbackTranscriptionWithAI = async (audioBuffer: Buffer, detectedLanguage?: string): Promise<{
  transcription: string;
  originalLanguage: string;
  translatedText?: string;
}> => {
  try {
    console.log("Attempting AI fallback transcription...");
    
    // Use OpenAI's Whisper API for transcription
    const audioFile = new File([new Uint8Array(audioBuffer)], "audio.wav", { type: "audio/wav" });
    
    // **MODIFIED: Enhanced Whisper request with language detection**
    const whisperRequest: any = {
      file: audioFile,
      model: "whisper-1",
      response_format: "verbose_json", // Get language detection info
      prompt: "This is likely an incident report, emergency communication, or general conversation.", // Context hint
    };

    // Add language hint if detected
    if (detectedLanguage) {
      const languageCode = detectedLanguage.split('-')[0]; // Extract base language code
      whisperRequest.language = languageCode;
      console.log(`Using language hint for Whisper: ${languageCode}`);
    }

    const transcription = await openai.audio.transcriptions.create(whisperRequest);

    let result = {
      transcription: transcription.text,
      originalLanguage: (transcription as any).language || detectedLanguage || 'unknown',
      translatedText: undefined as string | undefined
    };

    // **ADDED: Translate to English if not already in English**
    if (result.originalLanguage && result.originalLanguage !== 'en' && result.originalLanguage !== 'english') {
      console.log(`Translating from ${result.originalLanguage} to English...`);
      const translation = await translateToEnglish(result.transcription, result.originalLanguage);
      result.translatedText = translation.translatedText;
      console.log(`Translation result: "${translation.translatedText.substring(0, 100)}..."`);
    }

    console.log("Whisper transcription result:", {
      originalLanguage: result.originalLanguage,
      originalText: result.transcription.substring(0, 100) + "...",
      hasTranslation: !!result.translatedText
    });

    return result;
  } catch (error) {
    console.error('Whisper fallback failed:', error);
    throw new Error('Both Google Speech-to-Text and OpenAI Whisper failed to transcribe the audio');
  }
};

// Speech Service Class
export class SpeechService {

  static async convertSpeechToText(
    audioBuffer: Buffer, 
    mimetype: string, 
    context?: string,
    // **ADDED: New parameters for multi-language support**
    targetLanguages?: string[],
    forceLanguage?: string
  ): Promise<{
    transcription: string;
    confidence: 'high' | 'medium' | 'low';
    method: 'google' | 'google_enhanced' | 'whisper' | 'whisper_enhanced';
    originalTranscription?: string;
    // **ADDED: Language detection results**
    detectedLanguage?: string;
    originalLanguage?: string;
    translatedText?: string;
    languageConfidence?: number;
    alternatives?: Array<{ text: string; language: string; confidence: number }>;
  }> {
    try {
      if (!validateAudioBuffer(audioBuffer)) {
        throw new Error('Invalid or empty audio buffer');
      }

      const sampleRate = detectSampleRate(audioBuffer, mimetype);
      let transcription = '';
      let originalTranscription = '';
      let method: 'google' | 'google_enhanced' | 'whisper' | 'whisper_enhanced' = 'google';
      let confidence: 'high' | 'medium' | 'low' = 'low';
      
      // **ADDED: Multi-language support variables**
      let detectedLanguage: string | undefined;
      let originalLanguage: string | undefined;
      let translatedText: string | undefined;
      let languageConfidence: number | undefined;
      let alternatives: Array<{ text: string; language: string; confidence: number }> | undefined;

      // **ADDED: Determine target languages for recognition**
      const languagesToTry = forceLanguage 
        ? [forceLanguage]
        : targetLanguages || ['en-US', 'es-ES', 'hi-IN', 'fr-FR', 'de-DE', 'pt-BR', 'ru-RU', 'ar-SA'];

      console.log(`Attempting speech recognition with languages: ${languagesToTry.join(', ')}`);

      // Step 1: Try Google Speech-to-Text with multiple languages
      try {
        const multiLangResult = await recognizeSpeechMultiLanguage(
          audioBuffer, 
          mimetype, 
          sampleRate, 
          languagesToTry
        );

        if (multiLangResult.transcription && multiLangResult.transcription.trim().length > 0) {
          transcription = multiLangResult.transcription;
          originalTranscription = transcription;
          detectedLanguage = multiLangResult.detectedLanguage;
          languageConfidence = multiLangResult.confidence;
          alternatives = multiLangResult.alternatives;

          // Set confidence based on recognition confidence
          if (multiLangResult.confidence > 0.8) confidence = 'high';
          else if (multiLangResult.confidence > 0.5) confidence = 'medium';
          else confidence = 'low';

          console.log(`Google multi-language recognition successful: ${detectedLanguage} with confidence ${multiLangResult.confidence}`);

          // **ADDED: Translate to English if not already in English**
          if (detectedLanguage && !detectedLanguage.startsWith('en-') && transcription.trim()) {
            console.log(`Translating from ${detectedLanguage} to English...`);
            const baseLanguage = detectedLanguage.split('-')[0];
            const translation = await translateToEnglish(transcription, baseLanguage);
            
            if (translation.translatedText && translation.translatedText !== transcription) {
              translatedText = translation.translatedText;
              originalLanguage = baseLanguage;
              console.log(`Translation completed: "${translatedText.substring(0, 100)}..."`);
            }
          }
        }
      } catch (googleError) {
        console.log('Google multi-language Speech-to-Text failed:', googleError);
      }

      // Step 2: Check if Google transcription is adequate
      if (!isTranscriptionAdequate(transcription)) {
        console.log('Google transcription inadequate, trying Whisper fallback...');
        
        try {
          const whisperResult = await fallbackTranscriptionWithAI(audioBuffer, detectedLanguage);
          transcription = whisperResult.translatedText || whisperResult.transcription;
          method = 'whisper';
          confidence = 'medium'; // Whisper generally has good accuracy
          
          // **ADDED: Set language information from Whisper**
          originalLanguage = whisperResult.originalLanguage;
          if (whisperResult.translatedText) {
            originalTranscription = whisperResult.transcription;
            translatedText = whisperResult.translatedText;
          } else if (!originalTranscription) {
            originalTranscription = transcription;
          }
          
          console.log(`Whisper fallback successful. Original language: ${originalLanguage}`);
        } catch (whisperError) {
          console.log('Whisper fallback also failed:', whisperError);
          
          if (!transcription.trim()) {
            throw new Error('All transcription methods failed');
          }
        }
      }

      // Step 3: Enhance with AI if confidence is low or transcription seems poor
      if (confidence === 'low' || !isTranscriptionAdequate(transcription)) {
        console.log('Enhancing transcription with AI...');
        
        try {
          // Use the final transcription (translated if available) for enhancement
          const textToEnhance = translatedText || transcription;
          const enhancedTranscription = await enhanceTranscriptionWithAI(textToEnhance, context);
          
          if (enhancedTranscription && enhancedTranscription !== textToEnhance) {
            transcription = enhancedTranscription;
            method = method === 'google' ? 'google_enhanced' : 'whisper_enhanced';
            
            // Upgrade confidence if AI enhancement was applied
            if (confidence === 'low') confidence = 'medium';
            
            console.log(`AI enhancement applied: "${transcription.substring(0, 100)}..."`);
          }
        } catch (aiError) {
          console.log('AI enhancement failed:', aiError);
        }
      }

      if (!transcription.trim()) {
        throw new Error('Could not transcribe the audio - no speech detected');
      }

      // **ADDED: Log final result with language information**
      console.log(`Final transcription result:`, {
        method,
        confidence,
        detectedLanguage,
        originalLanguage,
        hasTranslation: !!translatedText,
        textPreview: transcription.substring(0, 100) + "..."
      });
      
      return {
        transcription: transcription.trim(),
        confidence,
        method,
        originalTranscription: originalTranscription !== transcription ? originalTranscription : undefined,
        // **ADDED: Return language information**
        detectedLanguage,
        originalLanguage,
        translatedText,
        languageConfidence,
        alternatives
      };

    } catch (error) {
      console.error('Speech recognition error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('INVALID_ARGUMENT')) {
          throw new Error('Invalid audio format or configuration. Please check the audio file.');
        } else if (error.message.includes('QUOTA_EXCEEDED')) {
          throw new Error('Speech API quota exceeded. Please try again later.');
        } else if (error.message.includes('PERMISSION_DENIED')) {
          throw new Error('Speech API permission denied. Please check your credentials.');
        }
      }
      
      throw new Error(`Speech recognition failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Upload audio to S3 and convert to text
  static async processAudioFile(
    file: Express.Multer.File, 
    context?: string,
    // **ADDED: New parameters for multi-language support**
    targetLanguages?: string[],
    forceLanguage?: string
  ): Promise<{
    transcription: string;
    audioUrl: string;
    confidence: 'high' | 'medium' | 'low';
    method: 'google' | 'google_enhanced' | 'whisper' | 'whisper_enhanced';
    originalTranscription?: string;
    // **ADDED: Language detection results**
    detectedLanguage?: string;
    originalLanguage?: string;
    translatedText?: string;
    languageConfidence?: number;
    alternatives?: Array<{ text: string; language: string; confidence: number }>;
  }> {
    try {
      if (!file.buffer || file.buffer.length === 0) {
        throw new Error('Empty audio file received');
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Audio file too large. Maximum size is 10MB.');
      }

      const timestamp = Date.now();
      const fileName = `audio/${timestamp}_${file.originalname}`;

      // **MODIFIED: Convert speech to text with multi-language support**
      const result = await this.convertSpeechToText(
        file.buffer, 
        file.mimetype, 
        context, 
        targetLanguages, 
        forceLanguage
      );

      return {
        transcription: result.transcription,
        audioUrl: "", // Add S3 upload back if needed
        confidence: result.confidence,
        method: result.method,
        originalTranscription: result.originalTranscription,
        // **ADDED: Return language information**
        detectedLanguage: result.detectedLanguage,
        originalLanguage: result.originalLanguage,
        translatedText: result.translatedText,
        languageConfidence: result.languageConfidence,
        alternatives: result.alternatives
      };
    } catch (error) {
      console.error('Process audio file error:', error);
      throw error;
    }
  }
}
