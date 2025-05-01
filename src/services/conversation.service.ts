import { conversationsClient } from "../config/twilioClient";
import ConversationModel, {
  ConversationSection,
  ConversationType,
  IConversation,
  IParticipant,
} from "../models/ConversationModel";
import mongoose from "mongoose";
import MessageModel from "../models/MessageModel";

class ConversationService {
  /**
   * Create a new conversation in Twilio and save it to the database
   */
  async createConversation(
    friendlyName: string,
    createdBy: string,
    incident?: string
  ): Promise<IConversation> {
    try {
      // Create conversation in Twilio
      const twilioConversation = await conversationsClient.conversations.create(
        {
          friendlyName,
          uniqueName: `conv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        }
      );

      // Create conversation in our database
      const conversation = new ConversationModel({
        twilioSid: twilioConversation.sid,
        friendlyName,
        createdBy,
        participants: [],
        type: ConversationType.SINGLE,
        incident: incident ? new mongoose.Types.ObjectId(incident) : undefined,
        section: incident
          ? ConversationSection.INCIDENT
          : ConversationSection.SUPERADMIN,
      });

      await conversation.save();
      return conversation;
    } catch (error) {
      console.error("Error creating conversation:", error);
      throw error;
    }
  }

  /**
   * Add a participant to a conversation
   */
  async addParticipant(
    conversationId: string,
    userId: string,
    identity: string
  ): Promise<IConversation> {
    try {
      const conversation = await ConversationModel.findById(conversationId);
      if (!conversation) {
        throw new Error("Conversation not found");
      }

      // Add participant to Twilio conversation
      const participant = await conversationsClient
        .conversations(conversation.twilioSid)
        .participants.create({ identity });

      // Add participant to our database
      conversation.participants.push({
        _id: new mongoose.Types.ObjectId(), // Add a unique ID for the participant
        user: new mongoose.Types.ObjectId(userId),
        participantSid: participant.sid,
        identity,
      } as IParticipant);

      await conversation.save();
      return conversation;
    } catch (error) {
      console.error("Error adding participant:", error);
      throw error;
    }
  }

  /**
   * Remove a participant from a conversation
   */
  async removeParticipant(
    conversationId: string,
    userId: string
  ): Promise<IConversation> {
    try {
      const conversation = await ConversationModel.findById(conversationId);
      if (!conversation) {
        throw new Error("Conversation not found");
      }

      // Find participant in our database
      const participantIndex = conversation.participants.findIndex(
        (p: any) => p.user.toString() === userId
      );

      if (participantIndex === -1) {
        throw new Error("Participant not found in conversation");
      }

      const participant = conversation.participants[participantIndex];

      // Remove participant from Twilio conversation
      await conversationsClient
        .conversations(conversation.twilioSid)
        .participants(participant.participantSid)
        .remove();

      // Remove participant from our database
      conversation.participants.splice(participantIndex, 1);
      await conversation.save();

      return conversation;
    } catch (error) {
      console.error("Error removing participant:", error);
      throw error;
    }
  }

  /**
   * Send a message to a conversation
   */
  async sendMessage(
    conversationId: string,
    userId: string,
    body: string,
    media?: string[]
  ): Promise<any> {
    try {
      const conversation = await ConversationModel.findById(conversationId);
      if (!conversation) {
        throw new Error("Conversation not found");
      }

      // Check if user is participant
      const participant = conversation.participants.find(
        (p: any) => p.user.toString() === userId
      );

      if (!participant) {
        throw new Error("User is not a participant in this conversation");
      }

      // Create message attributes to identify the sender
      const attributes = JSON.stringify({
        userId,
      });

      // Send message via Twilio
      const twilioMessage = await conversationsClient
        .conversations(conversation.twilioSid)
        .messages.create({
          body,
          author: participant.identity,
          attributes,
          ...(media && media.length > 0 ? { mediaUrl: media } : {}),
        });

      // Save message to our database
      const message = new MessageModel({
        body,
        author: new mongoose.Types.ObjectId(userId),
        conversationSid: conversation.twilioSid,
        conversationId: conversation._id,
        twilioSid: twilioMessage.sid,
        messageSid: twilioMessage.sid,
        media: media || [],
      });

      await message.save();

      // Update the conversation's last message
      conversation.lastMessage = message._id as mongoose.Types.ObjectId;
      await conversation.save();

      return message;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }

  /**
   * Get all conversations for a user
   */
  async getUserConversations(
    userId: string,
    incident?: string
  ): Promise<IConversation[]> {
    try {
      if (incident) {
        const conversations = await ConversationModel.find({
          incident: new mongoose.Types.ObjectId(incident),
          "participants.user": new mongoose.Types.ObjectId(userId),
        })
          .populate("lastMessage")
          .sort({ updatedAt: -1 });
        return conversations;
      } else {
        const conversations = await ConversationModel.find({
          "participants.user": new mongoose.Types.ObjectId(userId),
        })
          .populate("lastMessage")
          .sort({ updatedAt: -1 });
        return conversations;
      }
    } catch (error) {
      console.error("Error getting user conversations:", error);
      throw error;
    }
  }

  /**
   * Get a conversation by ID
   */
  async getConversationById(
    conversationId: string,
    userId: string
  ): Promise<IConversation> {
    try {
      const conversation = await ConversationModel.findById(conversationId)
        .populate("participants.user", "name email")
        .populate("lastMessage");

      if (!conversation) {
        throw new Error("Conversation not found");
      }

      // Check if user is participant
      const isParticipant = conversation.participants.some(
        (p: any) => p.user._id.toString() === userId
      );

      if (!isParticipant) {
        throw new Error("User is not a participant in this conversation");
      }

      return conversation;
    } catch (error) {
      console.error("Error getting conversation:", error);
      throw error;
    }
  }

  /**
   * Get messages for a conversation
   */
  async getConversationMessages(
    conversationId: string,
    userId: string,
    limit = 50,
    before?: string
  ): Promise<any> {
    try {
      const conversation = await ConversationModel.findById(conversationId);
      if (!conversation) {
        throw new Error("Conversation not found");
      }

      // Check if user is participant
      const isParticipant = conversation.participants.some(
        (p: any) => p.user.toString() === userId
      );

      if (!isParticipant) {
        throw new Error("User is not a participant in this conversation");
      }

      // Query conditions
      const query: any = { conversationSid: conversation.twilioSid };

      // If 'before' is provided, get messages before that message
      if (before) {
        const beforeMessage = await MessageModel.findById(before);
        if (beforeMessage) {
          query.createdAt = { $lt: beforeMessage.createdAt };
        }
      }

      // Get messages
      const messages = await MessageModel.find(query)
        .populate("author", "name email")
        .sort({ createdAt: -1 })
        .limit(limit);

      return messages.reverse(); // Return in chronological order
    } catch (error) {
      console.error("Error getting conversation messages:", error);
      throw error;
    }
  }

  /**
   * Update a conversation
   */
  async updateConversation(
    conversationId: string,
    userId: string,
    updates: { friendlyName?: string; attributes?: any }
  ): Promise<IConversation> {
    try {
      const conversation = await ConversationModel.findById(conversationId);
      if (!conversation) {
        throw new Error("Conversation not found");
      }

      // Check if user is participant
      const isParticipant = conversation.participants.some(
        (p: any) => p.user.toString() === userId
      );

      if (!isParticipant) {
        throw new Error("User is not a participant in this conversation");
      }

      // Update conversation in Twilio
      const updateParams: any = {};
      if (updates.friendlyName)
        updateParams.friendlyName = updates.friendlyName;
      if (updates.attributes)
        updateParams.attributes = JSON.stringify(updates.attributes);

      await conversationsClient
        .conversations(conversation.twilioSid)
        .update(updateParams);

      // Update conversation in our database
      if (updates.friendlyName) conversation.name = updates.friendlyName;
      if (updates.attributes) conversation.attributes = updates.attributes;

      await conversation.save();
      return conversation;
    } catch (error) {
      console.error("Error updating conversation:", error);
      throw error;
    }
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(
    conversationId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const conversation = await ConversationModel.findById(conversationId);
      if (!conversation) {
        throw new Error("Conversation not found");
      }

      // Check if user is the creator
      if (conversation.createdBy.toString() !== userId) {
        throw new Error("Only the creator can delete the conversation");
      }

      // Delete conversation in Twilio
      await conversationsClient.conversations(conversation.twilioSid).remove();

      // Delete messages from our database
      await MessageModel.deleteMany({
        conversationSid: conversation.twilioSid,
      });

      // Delete conversation from our database
      await ConversationModel.findByIdAndDelete(conversationId);

      return true;
    } catch (error) {
      console.error("Error deleting conversation:", error);
      throw error;
    }
  }

  /**
   * Generate a Twilio token for a user to connect to the Conversations SDK
   */
  async generateToken(userId: string, identity: string): Promise<string> {
    try {
      const { AccessToken } = require("twilio").jwt;
      const { ChatGrant } = AccessToken;

      // Create an access token
      const token = new AccessToken(
        process.env.TWILIO_ACCOUNT_SID as string,
        process.env.TWILIO_API_KEY as string,
        process.env.TWILIO_API_SECRET as string,
        { identity: userId }
      );

      // Create a Chat grant for this token
      const chatGrant = new ChatGrant({
        serviceSid: process.env.TWILIO_SERVICE_SID as string,
      });

      // Add the grant to the token
      token.addGrant(chatGrant);

      // Return the token as a string
      return token.toJwt();
    } catch (error) {
      console.error("Error generating token:", error);
      throw error;
    }
  }
}

export default new ConversationService();
