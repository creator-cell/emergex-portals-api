"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocketServer = void 0;
const socket_io_1 = require("socket.io");
// import { publisher, subscriber } from './config/redis';
const logger_1 = require("./config/logger");
const setupSocketServer = (server) => {
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:3000',
            methods: ['GET', 'POST'],
        },
    });
    // Store connected users
    const userSocketMap = {};
    io.on('connection', (socket) => {
        logger_1.logger.info(`User connected: ${socket.id}`);
        // Setup user connection with authentication
        socket.on('setup', (userData) => {
            if (!userData?._id) {
                logger_1.logger.warn('Setup attempted without user data');
                return;
            }
            socket.join(userData._id);
            userSocketMap[userData._id] = socket.id;
            socket.emit('connected');
            // Notify others about user's online status
            socket.broadcast.emit('user_status', {
                userId: userData._id,
                status: 'online'
            });
        });
        // Join user to their own room for private messages
        socket.on('join_user', (userId) => {
            socket.join(userId);
            logger_1.logger.info(`User ${userId} joined their room`);
        });
        // Join chat room
        socket.on('join_chat', (chatId) => {
            socket.join(chatId);
            logger_1.logger.info(`User joined chat ${chatId}`);
            // Subscribe to Redis channel for this chat
            // subscriber.subscribe(`chat:${chatId}`);
        });
        // Handle typing indicators
        socket.on('typing', (chatId) => {
            socket.to(chatId).emit('typing', chatId);
            logger_1.logger.debug(`Typing in chat ${chatId}`);
        });
        socket.on('stop_typing', (chatId) => {
            socket.to(chatId).emit('stop_typing', chatId);
            logger_1.logger.debug(`Stopped typing in chat ${chatId}`);
        });
        // Handle new messages from client
        socket.on('new_message', async (message) => {
            try {
                logger_1.logger.info(`New message received for chat ${message.chat}`);
                // Publish to Redis for scalability
                // await publisher.publish(
                //   `chat:${message.chat}`, 
                //   JSON.stringify({
                //     type: 'NEW_MESSAGE',
                //     data: message
                //   })
                // );
                // Emit to all clients in the chat room
                io.to(message.chat).emit('message_received', message);
            }
            catch (error) {
                logger_1.logger.error('Error handling new message:', error);
            }
        });
        // Handle video call initiation
        socket.on('initiate_video_call', (data) => {
            const { chatId, caller } = data;
            logger_1.logger.info(`Video call initiated in chat ${chatId} by ${caller._id}`);
            // Notify all chat participants except the caller
            socket.to(chatId).emit('incoming_video_call', {
                chatId,
                caller,
                roomName: `video_room_${chatId}_${Date.now()}`
            });
        });
        // Handle disconnection
        socket.on('disconnect', () => {
            // Find user ID by socket ID
            const userId = Object.keys(userSocketMap).find(key => userSocketMap[key] === socket.id);
            if (userId) {
                delete userSocketMap[userId];
                // Notify others about user's offline status
                io.emit('user_status', {
                    userId,
                    status: 'offline'
                });
            }
            logger_1.logger.info(`User disconnected: ${socket.id}`);
        });
    });
    // Handle Redis pub/sub messages
    // subscriber.on('message', (channel, message) => {
    //   try {
    //     const parsedMessage = JSON.parse(message);
    //     logger.info(`Redis message on ${channel}: ${message}`);
    //     // Extract chat ID from channel name
    //     const chatId = channel.split(':')[1];
    //     switch (parsedMessage.type) {
    //       case 'NEW_MESSAGE':
    //         // Emit message to all clients in the chat room
    //         io.to(chatId).emit('message_received', parsedMessage.data);
    //         // Send notifications to users not currently in the chat
    //         parsedMessage.data.chat.users.forEach((user: any) => {
    //           if (user._id !== parsedMessage.data.sender._id.toString()) {
    //             io.to(user._id).emit('new_message_notification', {
    //               chatId,
    //               message: parsedMessage.data
    //             });
    //           }
    //         });
    //         break;
    //       case 'MESSAGE_DELETED':
    //         io.to(chatId).emit('message_deleted', parsedMessage.data);
    //         break;
    //       case 'GROUP_UPDATED':
    //         io.to(chatId).emit('group_updated', parsedMessage.data);
    //         break;
    //       default:
    //         logger.warn(`Unknown message type: ${parsedMessage.type}`);
    //     }
    //   } catch (error) {
    //     logger.error('Error processing Redis message:', error);
    //   }
    // });
    return io;
};
exports.setupSocketServer = setupSocketServer;
