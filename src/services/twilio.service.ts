// src/services/twilioService.ts
import { twilioClient } from '../config/twilio';
import { config as env } from '../config';
import AccessToken  from 'twilio/lib/jwt/AccessToken';
import { ChatGrant } from 'twilio/lib/jwt/AccessToken';
import { VideoGrant } from 'twilio/lib/jwt/AccessToken';
import { VoiceGrant } from 'twilio/lib/jwt/AccessToken';
import { CustomError } from '../middlewares/error';
import { IUser } from '../models/UserModel';

export class TwilioService {
  /**
   * Create a new Twilio Conversation
   * @param friendlyName - Name of the conversation
   * @param attributes - Additional attributes for the conversation
   */
  static async createConversation(friendlyName: string, attributes?: Record<string, any>) {
    try {
      const conversation = await twilioClient.conversations.v1.conversations.create({
        friendlyName,
        attributes: attributes ? JSON.stringify(attributes) : undefined
      });
      
      return conversation;
    } catch (error) {
      console.error('Error creating Twilio conversation:', error);
      throw new CustomError('Failed to create conversation', 500);
    }
  }

  /**
   * Add a participant to a Twilio Conversation
   * @param conversationSid - The SID of the conversation
   * @param identity - The identity of the user to add
   */
  static async addParticipant(conversationSid: string, identity: string) {
    try {
      const participant = await twilioClient.conversations.v1
        .conversations(conversationSid)
        .participants
        .create({ identity });
      
      return participant;
    } catch (error) {
      console.error(`Error adding user ${identity} to conversation:`, error);
      throw new CustomError('Failed to add participant to conversation', 500);
    }
  }

  /**
   * Remove a participant from a Twilio Conversation
   * @param conversationSid - The SID of the conversation
   * @param participantSid - The SID of the participant
   */
  static async removeParticipant(conversationSid: string, participantSid: string) {
    try {
      await twilioClient.conversations.v1
        .conversations(conversationSid)
        .participants(participantSid)
        .remove();
      
      return true;
    } catch (error) {
      console.error(`Error removing participant ${participantSid} from conversation:`, error);
      throw new CustomError('Failed to remove participant from conversation', 500);
    }
  }

  /**
   * Send a message in a Twilio Conversation
   * @param conversationSid - The SID of the conversation
   * @param author - The identity of the message author
   * @param body - The message content
   * @param attributes - Additional attributes for the message
   */
  static async sendMessage(
    conversationSid: string,
    author: string,
    body: string,
    attributes?: Record<string, any>
  ) {
    try {
      const message = await twilioClient.conversations.v1
        .conversations(conversationSid)
        .messages
        .create({
          author,
          body,
          attributes: attributes ? JSON.stringify(attributes) : undefined
        });
      
      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw new CustomError('Failed to send message', 500);
    }
  }

  /**
   * Get all participants in a Twilio Conversation
   * @param conversationSid - The SID of the conversation
   */
  static async getParticipants(conversationSid: string) {
    try {
      const participants = await twilioClient.conversations.v1
        .conversations(conversationSid)
        .participants
        .list();
      
      return participants;
    } catch (error) {
      console.error('Error getting participants:', error);
      throw new CustomError('Failed to retrieve participants', 500);
    }
  }

  /**
   * Create a Twilio Video room
   * @param uniqueName - Unique name for the room (must be URL-friendly)
   * @param type - Type of room ('group' or 'group-small')
   */
  static async createVideoRoom(uniqueName: string, type: 'group' | 'group-small' = 'group') {
    try {
      const room = await twilioClient.video.v1.rooms.create({
        uniqueName,
        type,
        recordParticipantsOnConnect: false
      });
      
      return room;
    } catch (error) {
      console.error('Error creating video room:', error);
      throw new CustomError('Failed to create video room', 500);
    }
  }

  /**
   * End a Twilio Video room
   * @param roomSid - The SID of the video room
   */
  static async endVideoRoom(roomSid: string) {
    try {
      const room = await twilioClient.video.v1.rooms(roomSid).update({
        status: 'completed'
      });
      
      return room;
    } catch (error) {
      console.error('Error ending video room:', error);
      throw new CustomError('Failed to end video room', 500);
    }
  }

  /**
   * Generate a Twilio access token for Chat
   * @param identity - The identity (usually the user ID) of the user
   */
  static generateChatToken(identity: string) {
    try {
      const token = new AccessToken(
        env.twilio.accountSid,
        env.twilio.apiKey,
        env.twilio.apiSecret,
        { identity }
      );

      // Create Chat grant
      const chatGrant = new ChatGrant({
        serviceSid: env.twilio.serviceSid
      });

      // Add grant to token
      token.addGrant(chatGrant);

      return token.toJwt();
    } catch (error) {
      console.error('Error generating chat token:', error);
      throw new CustomError('Failed to generate chat token', 500);
    }
  }

  /**
   * Generate a Twilio access token for Video
   * @param identity - The identity (usually the user ID) of the user
   * @param roomName - The name of the room to connect to
   */
  static generateVideoToken(identity: string, roomName?: string) {
    try {
      const token = new AccessToken(
        env.twilio.accountSid,
        env.twilio.apiKey,
        env.twilio.apiSecret,
        { identity }
      );

      // Create Video grant
      const videoGrant = new VideoGrant({
        room: roomName
      });

      // Add grant to token
      token.addGrant(videoGrant);

      return token.toJwt();
    } catch (error) {
      console.error('Error generating video token:', error);
      throw new CustomError('Failed to generate video token', 500);
    }
  }

  /**
   * Generate a Twilio access token for Voice
   * @param identity - The identity (usually the user ID) of the user
   */
  static generateVoiceToken(identity: string) {
    try {
      const token = new AccessToken(
        env.twilio.accountSid,
        env.twilio.apiKey,
        env.twilio.apiSecret,
        { identity }
      );

      // Create Voice grant
      const voiceGrant = new VoiceGrant({
        outgoingApplicationSid: env.twilio.serviceSid,
        incomingAllow: true
      });

      // Add grant to token
      token.addGrant(voiceGrant);

      return token.toJwt();
    } catch (error) {
      console.error('Error generating voice token:', error);
      throw new CustomError('Failed to generate voice token', 500);
    }
  }

  /**
   * Create or get user by identity in Twilio
   * @param identity - The identity (usually the user ID) of the user
   * @param friendlyName - A human-readable name for the user
   */
  static async createOrGetUser(identity: string, friendlyName: string) {
    try {
      // Try to get the user first
      try {
        const user = await twilioClient.conversations.v1.users(identity).fetch();
        return user;
      } catch (error) {
        // User doesn't exist, create a new one
        const user = await twilioClient.conversations.v1.users.create({
          identity,
          friendlyName
        });
        return user;
      }
    } catch (error) {
      console.error('Error creating/getting Twilio user:', error);
      throw new CustomError('Failed to create/get Twilio user', 500);
    }
  }

  /**
   * Synchronize our MongoDB users with Twilio Conversations users
   * @param users - Array of users from our database
   */
  static async syncUsers(users: IUser[]) {
    const results = [];
    
    for (const user of users) {
      try {
        const friendlyName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
        const twilioUser = await this.createOrGetUser(user._id!.toString(), friendlyName);
        results.push({ success: true, userId: user._id, twilioSid: twilioUser.sid });
      } catch (error) {
        console.error(`Error syncing user ${user._id}:`, error);
        results.push({ success: false, userId: user._id, error });
      }
    }
    
    return results;
  }
}