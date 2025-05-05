"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchMessages = exports.sendMessage = void 0;
const MessageModel_1 = __importDefault(require("../models/MessageModel"));
const ChatModel_1 = __importDefault(require("../models/ChatModel"));
const sendMessage = async (req, res) => {
    const customReq = req;
    const currentUser = customReq.user;
    try {
        const { content, chatId, type = 'text', fileUrl, fileName, fileSize } = req.body;
        if (!content && !fileUrl) {
            return res.status(400).json({ message: 'Content or file is required' });
        }
        // Create new message
        const newMessage = {
            sender: currentUser.id,
            content,
            type,
            chat: chatId,
            fileUrl,
            fileName,
            fileSize,
        };
        let message = await MessageModel_1.default.create(newMessage);
        // Populate sender and chat details
        message = await message.populate("sender", "username firstName lastName image");
        message = await message.populate("chat");
        message = await message.populate({
            path: "chat.users",
            select: 'username firstName lastName image email',
        });
        // Update latest message in chat
        await ChatModel_1.default.findByIdAndUpdate(chatId, { latestMessage: message });
        // Publish message to Redis channel for the specific chat
        // await publisher.publish(
        //   `chat:${chatId}`,
        //   JSON.stringify({
        //     event: 'new_message',
        //     data: message,
        //   })
        // );
        return res
            .status(200)
            .json({
            success: true,
            data: message,
            message: "Message sent successfully",
        });
    }
    catch (error) {
        return res
            .status(500)
            .json({ success: false, error: "Server Error in sending message" });
    }
};
exports.sendMessage = sendMessage;
const fetchMessages = async (req, res) => {
    const { chatId } = req.params;
    try {
        const messages = await MessageModel_1.default.find({ chat: chatId })
            .populate('sender', 'username firstName lastName image email')
            .populate('chat');
        return res
            .status(200)
            .json({
            success: true,
            data: messages,
            message: "Messages fetched successfully",
        });
    }
    catch (error) {
        res
            .status(500)
            .json({ success: false, error: "Server Error in fetching messages" });
    }
};
exports.fetchMessages = fetchMessages;
// export const deleteMessage = async (req: Request, res: Response) => {
//     const customReq = req as ICustomRequest;
//     const currentUser = customReq.user;
//     try {
//       const message = await MessageModel.findById(req.params.messageId);
//       if (!message) {
//         return res.status(404).json({ message: 'Message not found' });
//       }
//       // Only sender can delete the message
//       if (message.sender.toString() !== currentUser.id.toString()) {
//         return res.status(403).json({ success:false,message: 'Not authorized to delete this message' });
//       }
//       // Soft delete
//       // message.isDeleted = true;
//       await message.save();
//       // Publish to Redis for other instances
//       // await publisher.publish('chat_messages', JSON.stringify({
//       //   event: 'message_deleted',
//       //   data: message,
//       // }));
//       return res.status(200).json({success:true, message: 'Message deleted successfully' });
//     } catch (error) {
//       logger.error('Error deleting message:', error);
//       return res.status(500).json({ success:false,message: 'Server Error' });
//     }
//   };
