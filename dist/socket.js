"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocketServer = exports.getSocketIO = exports.setSocketIOInstance = exports.userSocketMap = void 0;
const socket_io_1 = require("socket.io");
const logger_1 = require("./config/logger");
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
        // logger.info(`User connected: ${socket.id}`);
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
