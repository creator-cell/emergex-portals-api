import multer from "multer";
import { Request as ExpressRequest } from "express";

// Use memory storage instead of disk storage
const storage = multer.memoryStorage();

const fileFilter = (
  req: ExpressRequest,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (file.fieldname === "audio") {
    // Accept common audio formats
    const allowedMimeTypes = [
      "audio/wav",
      "audio/mpeg", // mp3
      "audio/webm",
      "audio/ogg",
      "audio/mp4", // m4a
      "audio/flac",
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid audio file format. Supported formats: wav, mp3, webm, ogg, m4a, flac"
        )
      );
    }
  } else if (file.fieldname === "image" || file.fieldname === "signature") {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid image file format. Supported formats: jpg, jpeg, png"
        )
      );
    }
  } else {
    cb(new Error("Unexpected field"));
  }
};

const upload = multer({ storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit for audio files
  }, });

export const handleMediaUpload = upload.array("media"); 
export const handleAudioUpload = upload.single('audio');

export const multerConfig = {
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
};
