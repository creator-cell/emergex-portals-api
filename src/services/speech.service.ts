import { SpeechClient } from "@google-cloud/speech";
import { UploadFileParams, UploadFileResponse } from "../helper/S3Bucket";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import {config} from "../config/index"; 
import { S3 } from "../helper/S3Bucket";

// Initialize Google Cloud Speech Client
const speechClient = new SpeechClient({
  keyFilename: config.google.cloud_key_path,
  projectId: config.google.cloud_project_id,
});

// Helper function to get content type from filename
const getContentTypeFromFileName = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'webm': 'audio/webm',
    'ogg': 'audio/ogg',
    'm4a': 'audio/mp4',
    'flac': 'audio/flac'
  };
  return mimeTypes[extension || ''] || 'audio/mpeg';
};

// Upload file to S3
const UploadFile = async ({ file, fileName, contentType }: UploadFileParams): Promise<UploadFileResponse> => {
  try {
    if (!file || !fileName) {
      return { Error: "file and fileName are required", Success: false };
    }

    const Params = {
      Bucket: config.aws_bucket_name as string,
      Key: `/audio/${fileName}`,
      Body: file,
      ContentType: contentType || getContentTypeFromFileName(fileName)
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
    'audio/wav': 'LINEAR16',
    'audio/flac': 'FLAC',
    'audio/webm': 'WEBM_OPUS',
    'audio/ogg': 'OGG_OPUS',
    'audio/mpeg': 'MP3',
    'audio/mp4': 'MP3'
  };
  // console.log("encoding: ",encodingMap[mimetype])
  return encodingMap[mimetype] || 'LINEAR16';
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
    'audio/wav': 44100,
    'audio/webm': 48000,
    'audio/ogg': 48000,
    'audio/mpeg': 44100,
    'audio/mp4': 44100,
    'audio/flac': 44100
  };
  
  // For WAV files, try to extract sample rate from header
  if (mimetype === 'audio/wav' && buffer.length > 44) {
    try {
      // WAV header sample rate is at bytes 24-27 (little endian)
      const sampleRate = buffer.readUInt32LE(24);
      if (sampleRate >= 8000 && sampleRate <= 48000) {
        // console.log("Detected sample rate:", sampleRate);
        return sampleRate;
      }
    } catch (error) {
      console.log("Could not extract sample rate from WAV header, using default");
    }
  }
  
  const defaultRate = defaultRates[mimetype] || 16000;
  // console.log("Using default sample rate:", defaultRate);
  return defaultRate;
};

// Speech Service Class
export class SpeechService {
  static async convertSpeechToText(audioBuffer: Buffer, mimetype: string): Promise<string> {
    try {

       if (!validateAudioBuffer(audioBuffer)) {
        throw new Error('Invalid or empty audio buffer');
      }

      // **ADDED: Detect sample rate**
      const sampleRate = detectSampleRate(audioBuffer, mimetype);

    const request = {
        audio: {
          content: audioBuffer.toString('base64'),
        },
        config: {
          encoding: getAudioEncoding(mimetype) as any,
          sampleRateHertz: sampleRate, // **ADDED: Dynamic sample rate**
          languageCode: 'en-US',
          enableAutomaticPunctuation: true,
          model: 'latest_long',
          // **ADDED: Enhanced recognition settings**
          enableWordTimeOffsets: false,
          enableWordConfidence: false,
          maxAlternatives: 1,
          profanityFilter: false,
          // **ADDED: Audio channel configuration**
          audioChannelCount: 1, // Assume mono audio from browser recording
          enableSeparateRecognitionPerChannel: false,
          // **ADDED: Speech adaptation settings**
          useEnhanced: true, // Use enhanced model if available
        },
      };

      //       console.log("Sending request to Google Speech API with config:", {
      //   encoding: request.config.encoding,
      //   sampleRate: request.config.sampleRateHertz,
      //   audioSize: audioBuffer.length,
      //   mimetype
      // });

      const [response] = await speechClient.recognize(request);

      //       console.log("Google Speech API response:", {
      //   resultsCount: response.results?.length || 0,
      //   totalBilledTime: response.totalBilledTime,
      // });

      
      if (!response.results || response.results.length === 0) {
        // **ADDED: Try with different sample rates if first attempt fails**
        // console.log("No results with current settings, trying alternative configurations...");
        
        const alternativeRates = [16000, 8000, 22050, 44100, 48000];
        const currentRateIndex = alternativeRates.indexOf(sampleRate);
        
        for (let i = 0; i < alternativeRates.length; i++) {
          if (i === currentRateIndex) continue; // Skip the rate we already tried
          
          const altRate = alternativeRates[i];
          // console.log(`Trying alternative sample rate: ${altRate}`);
          
          try {
            const altRequest = {
              ...request,
              config: {
                ...request.config,
                sampleRateHertz: altRate,
              }
            };
            
            const [altResponse] = await speechClient.recognize(altRequest);
            
            if (altResponse.results && altResponse.results.length > 0) {
              // console.log(`Success with sample rate: ${altRate}`);
              const transcription = altResponse.results
                .map(result => result.alternatives?.[0]?.transcript || '')
                .join(' ');
              
              if (transcription.trim()) {
                return transcription.trim();
              }
            }
          } catch (altError) {
            // console.log(`Failed with sample rate ${altRate}:`, altError);
            continue;
          }
        }
        
        throw new Error('No speech detected in the audio file after trying multiple configurations');
      }

      // Combine all transcriptions
      const transcription = response.results
        .map(result => {
          const alternative = result.alternatives?.[0];
          // console.log("Alternative confidence:", alternative?.confidence || 'N/A');
          return alternative?.transcript || '';
        })
        .join(' ');

      if (!transcription.trim()) {
        throw new Error('Could not transcribe the audio - empty transcription result');
      }

      // console.log("Transcription successful:", transcription.substring(0, 100) + "...");
      return transcription.trim();
    } catch (error) {
      console.error('Speech recognition error:', error);
      
      // **ADDED: More specific error handling**
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
  static async processAudioFile(file: Express.Multer.File): Promise<{ transcription: string; audioUrl: string }> {
    try {
      // Generate unique filename

            // **ADDED: Additional file validation**
      if (!file.buffer || file.buffer.length === 0) {
        throw new Error('Empty audio file received');
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('Audio file too large. Maximum size is 10MB.');
      }

      const timestamp = Date.now();
      const fileName = `audio/${timestamp}_${file.originalname}`;

      // Upload to S3
    //   const uploadResult = await UploadFile({
    //     file: file.buffer,
    //     fileName: fileName,
    //     contentType: file.mimetype
    //   });

    //   if (!uploadResult.Success) {
    //     throw new Error(`Failed to upload audio: ${uploadResult.Error}`);
    //   }

      // Convert speech to text
      const transcription = await this.convertSpeechToText(file.buffer, file.mimetype);

      return {
        transcription,
        // audioUrl: uploadResult.ImageURl!
        audioUrl: ""
      };
    } catch (error) {
      console.error('Process audio file error:', error);
      throw error;
    }
  }
}