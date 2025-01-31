import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { Request as ExpressRequest } from "express";
import fs from "fs";

const createUploadDirs = () => {
    const dirs = ['uploads', 'uploads/audio', 'uploads/images', 'uploads/signatures'];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  };
  
  createUploadDirs();

const storage = multer.diskStorage({
  destination: (
    req: ExpressRequest,
    file,
    cb
  ) => {
    let uploadPath = "uploads/";
    switch (file.fieldname) {
      case "audio":
        uploadPath += "audio/";
        break;
      case "image":
        uploadPath += "images/";
        break;
      case "signature":
        uploadPath += "signatures/";
        break;
    }
    cb(null,uploadPath);
  },
  filename: (
    req: ExpressRequest,
    file,
    cb
  ) => {
    const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
    cb(
      null,
      `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

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
