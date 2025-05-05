"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleWebhook = void 0;
const ConversationModel_1 = __importDefault(require("../models/ConversationModel"));
const MessageModel_1 = __importDefault(require("../models/MessageModel"));
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * Handle Twilio Conversations webhooks
 * This will process events sent from Twilio to keep our database in sync
 */
const handleWebhook = async (req, res) => {
    try {
        const { EventType, ConversationSid, Body, Author, MessageSid, Attributes } = req.body;
        // Log the webhook for debugging
        console.log('Received webhook:', EventType, ConversationSid);
        // Handle different event types
        switch (EventType) {
            case 'onMessageAdded':
                await handleMessageAdded(ConversationSid, MessageSid, Body, Author, Attributes);
                break;
            case 'onConversationUpdated':
                await handleConversationUpdated(req.body);
                break;
            case 'onConversationRemoved':
                await handleConversationRemoved(ConversationSid);
                break;
            case 'onParticipantAdded':
                await handleParticipantAdded(req.body);
                break;
            case 'onParticipantRemoved':
                await handleParticipantRemoved(req.body);
                break;
            default:
                console.log('Unhandled webhook event type:', EventType);
        }
        // Always return a 200 response to Twilio to acknowledge receipt
        return res.status(200).send('Webhook received');
    }
    catch (error) {
        console.error('Error handling webhook:', error);
        // Still return 200 to Twilio to prevent retries
        return res.status(200).send('Webhook received with errors');
    }
};
exports.handleWebhook = handleWebhook;
/**
 * Process a new message event from Twilio
 */
const handleMessageAdded = async (conversationSid, messageSid, body, author, attributesString) => {
    try {
        // Skip if we already have this message (could be our own message)
        const existingMessage = await MessageModel_1.default.findOne({ messageSid });
        if (existingMessage) {
            console.log('Message already exists, skipping:', messageSid);
            return;
        }
        // Find the conversation
        const conversation = await ConversationModel_1.default.findOne({ twilioSid: conversationSid });
        if (!conversation) {
            console.error('Conversation not found for message:', conversationSid);
            return;
        }
        // Parse attributes to get userId or use the author's identity to find user
        let userId;
        try {
            const attributes = JSON.parse(attributesString || '{}');
            userId = attributes.userId;
        }
        catch (err) {
            console.error('Error parsing message attributes:', err);
        }
        // If userId not found in attributes, find the participant in our database
        if (!userId) {
            const participant = conversation.participants.find((p) => p.identity === author);
            if (participant) {
                userId = participant.user;
            }
            else {
                console.error('Unable to identify message author:', author);
                return;
            }
        }
        // Create the message
        const message = new MessageModel_1.default({
            body,
            author: userId,
            conversationSid,
            messageSid,
            createdAt: new Date()
        });
        await message.save();
        // Update the conversation's last message
        conversation.lastMessage = message._id;
        await conversation.save();
        console.log('Message saved successfully:', messageSid);
    }
    catch (error) {
        console.error('Error handling message webhook:', error);
    }
};
/**
 * Process conversation updated event from Twilio
 */
const handleConversationUpdated = async (data) => {
    try {
        const { ConversationSid, FriendlyName, Attributes } = data;
        // Find the conversation
        const conversation = await ConversationModel_1.default.findOne({ twilioSid: ConversationSid });
        if (!conversation) {
            console.error('Conversation not found for update:', ConversationSid);
            return;
        }
        // Update fields if provided
        if (FriendlyName) {
            conversation.name = FriendlyName;
        }
        if (Attributes) {
            try {
                conversation.attributes = JSON.parse(Attributes);
            }
            catch (err) {
                console.error('Error parsing conversation attributes:', err);
            }
        }
        await conversation.save();
        console.log('Conversation updated successfully:', ConversationSid);
    }
    catch (error) {
        console.error('Error handling conversation update webhook:', error);
    }
};
/**
 * Process conversation removed event from Twilio
 */
const handleConversationRemoved = async (conversationSid) => {
    try {
        // Delete the conversation and all messages
        await ConversationModel_1.default.deleteOne({ twilioSid: conversationSid });
        await MessageModel_1.default.deleteMany({ conversationSid });
        console.log('Conversation removed successfully:', conversationSid);
    }
    catch (error) {
        console.error('Error handling conversation removed webhook:', error);
    }
};
/**
 * Process participant added event from Twilio
 */
const handleParticipantAdded = async (data) => {
    try {
        const { ConversationSid, Identity, ParticipantSid } = data;
        // Find the conversation
        const conversation = await ConversationModel_1.default.findOne({ twilioSid: ConversationSid });
        if (!conversation) {
            console.error('Conversation not found for participant add:', ConversationSid);
            return;
        }
        // Check if this participant already exists
        const participantExists = conversation.participants.some(p => p.identity === Identity);
        if (!participantExists) {
            // Find user by identity (usually email)
            // Note: This is just a simple example. You'll need to adapt this to your user model
            const User = mongoose_1.default.model('User');
            const user = await User.findOne({ email: Identity });
            if (!user) {
                console.error('User not found for participant add:', Identity);
                return;
            }
            // Add participant
            conversation.participants.push({
                user: user._id,
                participantSid: ParticipantSid,
                identity: Identity
            });
            await conversation.save();
            console.log('Participant added successfully:', Identity);
        }
    }
    catch (error) {
        console.error('Error handling participant added webhook:', error);
    }
};
/**
 * Process participant removed event from Twilio
 */
const handleParticipantRemoved = async (data) => {
    try {
        const { ConversationSid, Identity } = data;
        // Find the conversation
        const conversation = await ConversationModel_1.default.findOne({ twilioSid: ConversationSid });
        if (!conversation) {
            console.error('Conversation not found for participant remove:', ConversationSid);
            return;
        }
        // Find and remove the participant
        const participantIndex = conversation.participants.findIndex(p => p.identity === Identity);
        if (participantIndex !== -1) {
            conversation.participants.splice(participantIndex, 1);
            await conversation.save();
            console.log('Participant removed successfully:', Identity);
        }
    }
    catch (error) {
        console.error('Error handling participant removed webhook:', error);
    }
};
