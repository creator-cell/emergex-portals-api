"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.multerConfig = exports.handleAudioUpload = exports.handleMediaUpload = void 0;
const multer_1 = __importDefault(require("multer"));
// Use memory storage instead of disk storage
const storage = multer_1.default.memoryStorage();
const fileFilter = (req, file, cb) => {
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
        }
        else {
            cb(new Error("Invalid audio file format. Supported formats: wav, mp3, webm, ogg, m4a, flac"));
        }
    }
    else if (file.fieldname === "image" || file.fieldname === "signature") {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        }
        else {
            cb(new Error("Invalid image file format. Supported formats: jpg, jpeg, png"));
        }
    }
    else {
        cb(new Error("Unexpected field"));
    }
};
const upload = (0, multer_1.default)({ storage,
    fileFilter,
    limits: {
        fileSize: 25 * 1024 * 1024, // 25MB limit for audio files
    }, });
exports.handleMediaUpload = upload.array("media");
exports.handleAudioUpload = upload.single('audio');
exports.multerConfig = {
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
};
