"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var MessageType;
(function (MessageType) {
    MessageType["TEXT"] = "text";
    MessageType["IMAGE"] = "image";
    MessageType["VIDEO"] = "video";
    MessageType["AUDIO"] = "audio";
    MessageType["FILE"] = "file";
    MessageType["LOCATION"] = "location";
    MessageType["SYSTEM"] = "system";
})(MessageType || (exports.MessageType = MessageType = {}));
const messageSchema = new mongoose_1.Schema({
    conversationId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Conversation",
        required: true,
    },
    twilioSid: {
        type: String,
        required: true,
        unique: true,
    },
    conversationSid: { type: String, required: true },
    messageSid: { type: String, required: true, unique: true },
    author: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    body: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: Object.values(MessageType),
        default: MessageType.TEXT,
    },
    mediaUrl: {
        type: String,
    },
    readBy: [
        {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    attributes: {
        type: mongoose_1.Schema.Types.Mixed,
    },
}, { timestamps: true });
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
// messageSchema.index({ twilioSid: 1 });
const MessageModel = mongoose_1.default.model("Message", messageSchema);
exports.default = MessageModel;
