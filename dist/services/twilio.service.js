"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwilioService = void 0;
// src/services/twilioService.ts
const twilio_1 = require("../config/twilio");
const config_1 = require("../config");
const AccessToken_1 = __importDefault(require("twilio/lib/jwt/AccessToken"));
const AccessToken_2 = require("twilio/lib/jwt/AccessToken");
const AccessToken_3 = require("twilio/lib/jwt/AccessToken");
const AccessToken_4 = require("twilio/lib/jwt/AccessToken");
const error_1 = require("../middlewares/error");
class TwilioService {
    /**
     * Create a new Twilio Conversation
     * @param friendlyName - Name of the conversation
     * @param attributes - Additional attributes for the conversation
     */
    static async createConversation(friendlyName, attributes) {
        try {
            const conversation = await twilio_1.twilioClient.conversations.v1.conversations.create({
                friendlyName,
                attributes: attributes ? JSON.stringify(attributes) : undefined
            });
            return conversation;
        }
        catch (error) {
            console.error('Error creating Twilio conversation:', error);
            throw new error_1.CustomError('Failed to create conversation', 500);
        }
    }
    /**
     * Add a participant to a Twilio Conversation
     * @param conversationSid - The SID of the conversation
     * @param identity - The identity of the user to add
     */
    static async addParticipant(conversationSid, identity) {
        try {
            const participant = await twilio_1.twilioClient.conversations.v1
                .conversations(conversationSid)
                .participants
                .create({ identity });
            return participant;
        }
        catch (error) {
            console.error(`Error adding user ${identity} to conversation:`, error);
            throw new error_1.CustomError('Failed to add participant to conversation', 500);
        }
    }
    /**
     * Remove a participant from a Twilio Conversation
     * @param conversationSid - The SID of the conversation
     * @param participantSid - The SID of the participant
     */
    static async removeParticipant(conversationSid, participantSid) {
        try {
            await twilio_1.twilioClient.conversations.v1
                .conversations(conversationSid)
                .participants(participantSid)
                .remove();
            return true;
        }
        catch (error) {
            console.error(`Error removing participant ${participantSid} from conversation:`, error);
            throw new error_1.CustomError('Failed to remove participant from conversation', 500);
        }
    }
    /**
     * Send a message in a Twilio Conversation
     * @param conversationSid - The SID of the conversation
     * @param author - The identity of the message author
     * @param body - The message content
     * @param attributes - Additional attributes for the message
     */
    static async sendMessage(conversationSid, author, body, attributes) {
        try {
            const message = await twilio_1.twilioClient.conversations.v1
                .conversations(conversationSid)
                .messages
                .create({
                author,
                body,
                attributes: attributes ? JSON.stringify(attributes) : undefined
            });
            return message;
        }
        catch (error) {
            console.error('Error sending message:', error);
            throw new error_1.CustomError('Failed to send message', 500);
        }
    }
    /**
     * Get all participants in a Twilio Conversation
     * @param conversationSid - The SID of the conversation
     */
    static async getParticipants(conversationSid) {
        try {
            const participants = await twilio_1.twilioClient.conversations.v1
                .conversations(conversationSid)
                .participants
                .list();
            return participants;
        }
        catch (error) {
            console.error('Error getting participants:', error);
            throw new error_1.CustomError('Failed to retrieve participants', 500);
        }
    }
    /**
     * Create a Twilio Video room
     * @param uniqueName - Unique name for the room (must be URL-friendly)
     * @param type - Type of room ('group' or 'group-small')
     */
    static async createVideoRoom(uniqueName, type = 'group') {
        try {
            const room = await twilio_1.twilioClient.video.v1.rooms.create({
                uniqueName,
                type,
                recordParticipantsOnConnect: false
            });
            return room;
        }
        catch (error) {
            console.error('Error creating video room:', error);
            throw new error_1.CustomError('Failed to create video room', 500);
        }
    }
    /**
     * End a Twilio Video room
     * @param roomSid - The SID of the video room
     */
    static async endVideoRoom(roomSid) {
        try {
            const room = await twilio_1.twilioClient.video.v1.rooms(roomSid).update({
                status: 'completed'
            });
            return room;
        }
        catch (error) {
            console.error('Error ending video room:', error);
            throw new error_1.CustomError('Failed to end video room', 500);
        }
    }
    /**
     * Generate a Twilio access token for Chat
     * @param identity - The identity (usually the user ID) of the user
     */
    static generateChatToken(identity) {
        try {
            const token = new AccessToken_1.default(config_1.config.twilio.accountSid, config_1.config.twilio.apiKey, config_1.config.twilio.apiSecret, { identity });
            // Create Chat grant
            const chatGrant = new AccessToken_2.ChatGrant({
                serviceSid: config_1.config.twilio.serviceSid
            });
            // Add grant to token
            token.addGrant(chatGrant);
            return token.toJwt();
        }
        catch (error) {
            console.error('Error generating chat token:', error);
            throw new error_1.CustomError('Failed to generate chat token', 500);
        }
    }
    /**
     * Generate a Twilio access token for Video
     * @param identity - The identity (usually the user ID) of the user
     * @param roomName - The name of the room to connect to
     */
    static generateVideoToken(identity, roomName) {
        try {
            const token = new AccessToken_1.default(config_1.config.twilio.accountSid, config_1.config.twilio.apiKey, config_1.config.twilio.apiSecret, { identity });
            // Create Video grant
            const videoGrant = new AccessToken_3.VideoGrant({
                room: roomName
            });
            // Add grant to token
            token.addGrant(videoGrant);
            return token.toJwt();
        }
        catch (error) {
            console.error('Error generating video token:', error);
            throw new error_1.CustomError('Failed to generate video token', 500);
        }
    }
    /**
     * Generate a Twilio access token for Voice
     * @param identity - The identity (usually the user ID) of the user
     */
    static generateVoiceToken(identity) {
        try {
            const token = new AccessToken_1.default(config_1.config.twilio.accountSid, config_1.config.twilio.apiKey, config_1.config.twilio.apiSecret, { identity });
            // Create Voice grant
            const voiceGrant = new AccessToken_4.VoiceGrant({
                outgoingApplicationSid: config_1.config.twilio.serviceSid,
                incomingAllow: true
            });
            // Add grant to token
            token.addGrant(voiceGrant);
            return token.toJwt();
        }
        catch (error) {
            console.error('Error generating voice token:', error);
            throw new error_1.CustomError('Failed to generate voice token', 500);
        }
    }
    /**
     * Create or get user by identity in Twilio
     * @param identity - The identity (usually the user ID) of the user
     * @param friendlyName - A human-readable name for the user
     */
    static async createOrGetUser(identity, friendlyName) {
        try {
            // Try to get the user first
            try {
                const user = await twilio_1.twilioClient.conversations.v1.users(identity).fetch();
                return user;
            }
            catch (error) {
                // User doesn't exist, create a new one
                const user = await twilio_1.twilioClient.conversations.v1.users.create({
                    identity,
                    friendlyName
                });
                return user;
            }
        }
        catch (error) {
            console.error('Error creating/getting Twilio user:', error);
            throw new error_1.CustomError('Failed to create/get Twilio user', 500);
        }
    }
    /**
     * Synchronize our MongoDB users with Twilio Conversations users
     * @param users - Array of users from our database
     */
    static async syncUsers(users) {
        const results = [];
        for (const user of users) {
            try {
                const friendlyName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
                const twilioUser = await this.createOrGetUser(user._id.toString(), friendlyName);
                results.push({ success: true, userId: user._id, twilioSid: twilioUser.sid });
            }
            catch (error) {
                console.error(`Error syncing user ${user._id}:`, error);
                results.push({ success: false, userId: user._id, error });
            }
        }
        return results;
    }
}
exports.TwilioService = TwilioService;
