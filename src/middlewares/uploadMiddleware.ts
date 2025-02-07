import multer from "multer";
import { multerConfig } from "../config/MulterConfig";

const upload = multer(multerConfig);

export const uploadFiles = upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'image', maxCount: 5 },
  { name: 'signature', maxCount: 1 },
]);