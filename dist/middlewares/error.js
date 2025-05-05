"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = exports.errorHandler = exports.CustomError = void 0;
const winston_1 = __importDefault(require("winston"));
const logger = winston_1.default.createLogger({
    level: 'error',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.printf(({ timestamp, level, message, error }) => {
        return `${timestamp} ${level}: ${message} ${error ? JSON.stringify(error) : ''}`;
    })),
    transports: [
        new winston_1.default.transports.Console(),
        new winston_1.default.transports.File({ filename: 'logs/error.log' })
    ]
});
class CustomError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.CustomError = CustomError;
const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    // Log the error
    logger.error(`${err.message}`, { error: err });
    // Operational, trusted error: send message to client
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message
        });
    }
    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥', err);
    return res.status(500).json({
        success: false,
        message: 'Something went wrong'
    });
};
exports.errorHandler = errorHandler;
const notFound = (req, res, next) => {
    const error = new CustomError(`Not Found - ${req.originalUrl}`, 404);
    next(error);
};
exports.notFound = notFound;
