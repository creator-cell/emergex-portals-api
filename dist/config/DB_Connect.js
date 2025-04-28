"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const index_1 = require("./index");
const connectDB = async () => {
    try {
        await mongoose_1.default.connect(index_1.config.dbConnectionString);
        console.log('MongoDB connected: ', mongoose_1.default.connection.host);
    }
    catch (error) {
        console.error('Database connection failed:', error.message);
        process.exit(1);
    }
};
exports.default = connectDB;
