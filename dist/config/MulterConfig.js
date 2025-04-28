"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.multerConfig = void 0;
const multer_1 = __importDefault(require("multer"));
// Use memory storage instead of disk storage
const storage = multer_1.default.memoryStorage();
const fileFilter = (req, file, cb) => {
    if (file.fieldname === "audio") {
        if (file.mimetype.startsWith("audio/")) {
            cb(null, true);
        }
        else {
            cb(new Error("Invalid audio file format"));
        }
    }
    else if (file.fieldname === "image" || file.fieldname === "signature") {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid image file format. Supported formats: jpg, jpeg, png'));
        }
    }
    else {
        cb(new Error("Unexpected field"));
    }
};
exports.multerConfig = {
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
};
