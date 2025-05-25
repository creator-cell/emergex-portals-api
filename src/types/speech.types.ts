export interface SpeechToTextRequest {
  audioFile: Express.Multer.File;
}

export interface SpeechToTextResponse {
  success: boolean;
  transcription?: string;
  audioUrl?: string;
  error?: string;
}