"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFiles = void 0;
const multer_1 = __importDefault(require("multer"));
const MulterConfig_1 = require("../config/MulterConfig");
const upload = (0, multer_1.default)(MulterConfig_1.multerConfig);
exports.uploadFiles = upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'image', maxCount: 5 },
    { name: 'signature', maxCount: 1 },
]);
