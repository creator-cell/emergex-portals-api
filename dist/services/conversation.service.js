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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const twilioClient_1 = require("../config/twilioClient");
const ConversationModel_1 = __importStar(require("../models/ConversationModel"));
const mongoose_1 = __importDefault(require("mongoose"));
const MessageModel_1 = __importDefault(require("../models/MessageModel"));
class ConversationService {
    /**
     * Create a new conversation in Twilio and save it to the database
     */
    async createConversation(friendlyName, createdBy, identity, type = ConversationModel_1.ConversationType.SINGLE, identityId) {
        try {
            // Create conversation in Twilio
            const twilioConversation = await twilioClient_1.conversationsClient.conversations.create({
                friendlyName,
                uniqueName: `conv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            });
            // Create conversation in our database
            const conversation = new ConversationModel_1.default({
                twilioSid: twilioConversation.sid,
                name: friendlyName,
                createdBy,
                participants: [],
                type: type || ConversationModel_1.ConversationType.SINGLE,
                identity,
                identityId
            });
            await conversation.save();
            return conversation;
        }
        catch (error) {
            console.error("Error creating conversation:", error);
            throw error;
        }
    }
    /**
     * Add a participant to a conversation
     */
    async addParticipant(conversationId, userId, identity) {
        try {
            const conversation = await ConversationModel_1.default.findById(conversationId);
            if (!conversation) {
                throw new Error("Conversation not found");
            }
            // Add participant to Twilio conversation
            const participant = await twilioClient_1.conversationsClient
                .conversations(conversation.twilioSid)
                .participants.create({ identity });
            // Add participant to our database
            conversation.participants.push({
                _id: new mongoose_1.default.Types.ObjectId(), // Add a unique ID for the participant
                user: new mongoose_1.default.Types.ObjectId(userId),
                participantSid: participant.sid,
                identity,
            });
            await conversation.save();
            return conversation;
        }
        catch (error) {
            console.error("Error adding participant:", error);
            throw error;
        }
    }
    /**
     * Remove a participant from a conversation
     */
    async removeParticipant(conversationId, userId) {
        try {
            const conversation = await ConversationModel_1.default.findById(conversationId);
            if (!conversation) {
                throw new Error("Conversation not found");
            }
            // Find participant in our database
            const participantIndex = conversation.participants.findIndex((p) => p.user.toString() === userId);
            if (participantIndex === -1) {
                throw new Error("Participant not found in conversation");
            }
            const participant = conversation.participants[participantIndex];
            // Remove participant from Twilio conversation
            await twilioClient_1.conversationsClient
                .conversations(conversation.twilioSid)
                .participants(participant.participantSid)
                .remove();
            // Remove participant from our database
            conversation.participants.splice(participantIndex, 1);
            await conversation.save();
            return conversation;
        }
        catch (error) {
            console.error("Error removing participant:", error);
            throw error;
        }
    }
    /**
     * Send a message to a conversation
     */
    async sendMessage(conversationId, userId, body, media) {
        try {
            const conversation = await ConversationModel_1.default.findById(conversationId);
            if (!conversation) {
                throw new Error("Conversation not found");
            }
            // Check if user is participant
            const participant = conversation.participants.find((p) => p.user.toString() === userId);
            if (!participant) {
                throw new Error("User is not a participant in this conversation");
            }
            // Create message attributes to identify the sender
            const attributes = JSON.stringify({
                userId,
            });
            // Send message via Twilio
            const twilioMessage = await twilioClient_1.conversationsClient
                .conversations(conversation.twilioSid)
                .messages.create({
                body,
                author: participant.identity,
                attributes,
                ...(media && media.length > 0 ? { mediaUrl: media } : {}),
            });
            // Save message to our database
            const message = new MessageModel_1.default({
                body,
                author: new mongoose_1.default.Types.ObjectId(userId),
                conversationSid: conversation.twilioSid,
                conversationId: conversation._id,
                twilioSid: twilioMessage.sid,
                messageSid: twilioMessage.sid,
                media: media || [],
            });
            await message.save();
            // Update the conversation's last message
            conversation.lastMessage = message._id;
            await conversation.save();
            return message;
        }
        catch (error) {
            console.error("Error sending message:", error);
            throw error;
        }
    }
    /**
     * Get all conversations for a user
     */
    async getUserConversations(userId, incident) {
        try {
            if (incident) {
                const conversations = await ConversationModel_1.default.find({
                    incident: new mongoose_1.default.Types.ObjectId(incident),
                    "participants.user": new mongoose_1.default.Types.ObjectId(userId),
                })
                    .populate("lastMessage")
                    .sort({ updatedAt: -1 });
                return conversations;
            }
            else {
                const conversations = await ConversationModel_1.default.find({
                    "participants.user": new mongoose_1.default.Types.ObjectId(userId),
                })
                    .populate("lastMessage")
                    .populate("participants.user", "firstName lastName email")
                    .sort({ updatedAt: -1 });
                return conversations;
            }
        }
        catch (error) {
            console.error("Error getting user conversations:", error);
            throw error;
        }
    }
    /**
     * Get a conversation by ID
     */
    async getConversationById(conversationId, userId) {
        try {
            const conversation = await ConversationModel_1.default.findById(conversationId)
                .populate("participants.user", "name email")
                .populate("lastMessage");
            if (!conversation) {
                throw new Error("Conversation not found");
            }
            // Check if user is participant
            const isParticipant = conversation.participants.some((p) => p.user._id.toString() === userId);
            if (!isParticipant) {
                throw new Error("User is not a participant in this conversation");
            }
            return conversation;
        }
        catch (error) {
            console.error("Error getting conversation:", error);
            throw error;
        }
    }
    /**
     * Get messages for a conversation
     */
    async getConversationMessages(conversationId, userId, limit = 50, before) {
        try {
            const conversation = await ConversationModel_1.default.findById(conversationId);
            if (!conversation) {
                throw new Error("Conversation not found");
            }
            // Check if user is participant
            const isParticipant = conversation.participants.some((p) => p.user.toString() === userId);
            if (!isParticipant) {
                throw new Error("User is not a participant in this conversation");
            }
            // Query conditions
            const query = { conversationSid: conversation.twilioSid };
            // If 'before' is provided, get messages before that message
            if (before) {
                const beforeMessage = await MessageModel_1.default.findById(before);
                if (beforeMessage) {
                    query.createdAt = { $lt: beforeMessage.createdAt };
                }
            }
            // Get messages
            const messages = await MessageModel_1.default.find(query)
                .populate("author", "firstName lastName email image")
                .sort({ createdAt: -1 })
                .limit(limit);
            return messages.reverse();
        }
        catch (error) {
            console.error("Error getting conversation messages:", error);
            throw error;
        }
    }
    /**
     * Update a conversation
     */
    async updateConversation(conversationId, userId, updates) {
        try {
            const conversation = await ConversationModel_1.default.findById(conversationId);
            if (!conversation) {
                throw new Error("Conversation not found");
            }
            // Check if user is participant
            const isParticipant = conversation.participants.some((p) => p.user.toString() === userId);
            if (!isParticipant) {
                throw new Error("User is not a participant in this conversation");
            }
            // Update conversation in Twilio
            const updateParams = {};
            if (updates.friendlyName)
                updateParams.friendlyName = updates.friendlyName;
            if (updates.attributes)
                updateParams.attributes = JSON.stringify(updates.attributes);
            await twilioClient_1.conversationsClient
                .conversations(conversation.twilioSid)
                .update(updateParams);
            // Update conversation in our database
            if (updates.friendlyName)
                conversation.name = updates.friendlyName;
            if (updates.attributes)
                conversation.attributes = updates.attributes;
            await conversation.save();
            return conversation;
        }
        catch (error) {
            console.error("Error updating conversation:", error);
            throw error;
        }
    }
    /**
     * Delete a conversation
     */
    async deleteConversation(conversationId, userId) {
        try {
            const conversation = await ConversationModel_1.default.findById(conversationId);
            if (!conversation) {
                throw new Error("Conversation not found");
            }
            // Check if user is the creator
            if (conversation.createdBy.toString() !== userId) {
                throw new Error("Only the creator can delete the conversation");
            }
            // Delete conversation in Twilio
            await twilioClient_1.conversationsClient.conversations(conversation.twilioSid).remove();
            // Delete messages from our database
            await MessageModel_1.default.deleteMany({
                conversationSid: conversation.twilioSid,
            });
            // Delete conversation from our database
            await ConversationModel_1.default.findByIdAndDelete(conversationId);
            return true;
        }
        catch (error) {
            console.error("Error deleting conversation:", error);
            throw error;
        }
    }
    /**
     * Generate a Twilio token for a user to connect to the Conversations SDK
     */
    async generateToken(userId, identity) {
        try {
            const { AccessToken } = require("twilio").jwt;
            const { ChatGrant } = AccessToken;
            // Create an access token
            const token = new AccessToken(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_API_KEY, process.env.TWILIO_API_SECRET, { identity: userId });
            // Create a Chat grant for this token
            const chatGrant = new ChatGrant({
                serviceSid: process.env.TWILIO_SERVICE_SID,
            });
            // Add the grant to the token
            token.addGrant(chatGrant);
            // Return the token as a string
            return token.toJwt();
        }
        catch (error) {
            console.error("Error generating token:", error);
            throw error;
        }
    }
}
exports.default = new ConversationService();
