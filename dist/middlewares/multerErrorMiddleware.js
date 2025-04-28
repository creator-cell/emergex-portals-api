"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleErrors = void 0;
const multer_1 = __importDefault(require("multer"));
const handleErrors = (err, req, res, next) => {
    if (err instanceof multer_1.default.MulterError) {
        return res.status(400).json({
            success: false,
            error: 'File upload error',
            details: err.message,
        });
    }
    next(err);
};
exports.handleErrors = handleErrors;
