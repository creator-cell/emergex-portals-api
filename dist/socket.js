"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocketServer = exports.getSocketIO = exports.setSocketIOInstance = exports.userSocketMap = void 0;
const socket_io_1 = require("socket.io");
const logger_1 = require("./config/logger");
const speech_1 = require("@google-cloud/speech");
const speechClient = new speech_1.SpeechClient({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});
exports.userSocketMap = {};
let socketIOInstance = null;
const setSocketIOInstance = (io) => {
    socketIOInstance = io;
};
exports.setSocketIOInstance = setSocketIOInstance;
const getSocketIO = () => {
    return socketIOInstance;
};
exports.getSocketIO = getSocketIO;
const setupSocketServer = (server) => {
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: process.env.CLIENT_URL ?? "http://localhost:3000",
            methods: ["GET", "POST"],
        },
    });
    (0, exports.setSocketIOInstance)(io);
    io.on("connection", (socket) => {
        logger_1.logger.info(`User connected: ${socket.id}`);
        let recognizeStream = null;
        // Setup user connection with authentication
        socket.on("setup", (userData) => {
            if (!userData?._id) {
                logger_1.logger.warn("Setup attempted without user data");
                return;
            }
            socket.join(userData._id);
            exports.userSocketMap[userData._id] = socket.id;
            socket.emit("connected");
        });
        socket.on("startGoogleCloudStream", (audioConfig) => {
            // Create a recognize stream for the client
            recognizeStream = speechClient.streamingRecognize({
                config: {
                    encoding: audioConfig.encoding || "LINEAR16",
                    sampleRateHertz: audioConfig.sampleRateHertz || 16000,
                    languageCode: audioConfig.languageCode || "en-US",
                    enableAutomaticPunctuation: true,
                },
                interimResults: true,
            });
            // Forward transcription results to the client
            recognizeStream.on("data", (data) => {
                if (data.results[0] && data.results[0].alternatives[0]) {
                    const transcription = data.results[0].alternatives[0].transcript;
                    const isFinal = data.results[0].isFinal;
                    socket.emit("transcription", {
                        transcription,
                        isFinal,
                    });
                }
            });
            recognizeStream.on("error", (error) => {
                console.error("Recognition error:", error);
                socket.emit("error", { error: error.message });
            });
            recognizeStream.on("end", () => {
                console.log("Recognition stream ended");
            });
        });
        // Process audio data from the client
        socket.on("audioData", (data) => {
            if (recognizeStream) {
                recognizeStream.write(data);
            }
        });
        // Stop the recognition stream
        socket.on("endGoogleCloudStream", () => {
            if (recognizeStream) {
                recognizeStream.end();
                recognizeStream = null;
            }
        });
        // Handle disconnection
        socket.on("disconnect", () => {
            const userId = Object.keys(exports.userSocketMap).find((key) => exports.userSocketMap[key] === socket.id);
            if (userId) {
                delete exports.userSocketMap[userId];
                io.emit("user_status", {
                    userId,
                    status: "offline",
                });
            }
            // logger.info(`User disconnected: ${socket.id}`);
        });
    });
    return io;
};
exports.setupSocketServer = setupSocketServer;
