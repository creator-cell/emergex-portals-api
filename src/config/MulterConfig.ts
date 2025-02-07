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
    if (file.mimetype.startsWith("audio/")) {
      cb(null, true);
    } else {
      cb(new Error("Invalid audio file format"));
    }
  } else if (file.fieldname === "image" || file.fieldname === "signature") {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image file format. Supported formats: jpg, jpeg, png'));
    }
  } else {
    cb(new Error("Unexpected field"));
  }
};

export const multerConfig = {
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
};
