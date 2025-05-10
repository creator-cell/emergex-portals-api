import { twilioClient } from "../config/twilioClient";
import CallModel, { CallType, CallStatus, ICall } from "../models/CallModel";
import mongoose from "mongoose";
import UserModel, { IUser } from "../models/UserModel";
import VoiceResponse from "twilio/lib/twiml/VoiceResponse";
import ConversationModel from "../models/ConversationModel";
import { getSocketIO, userSocketMap } from "../socket";
import { logger } from "../config/logger";
import { WebsocketServer } from "..";

class CallService {
  /**
   * Generate a token for voice and video calls
   */
  async generateToken(
    userId: string,
    identity: string,
    roomName?: string
  ): Promise<string> {
    try {
      const { AccessToken } = require("twilio").jwt;
      const { VoiceGrant, VideoGrant } = AccessToken;

      // Create an access token
      const token = new AccessToken(
        process.env.TWILIO_ACCOUNT_SID as string,
        process.env.TWILIO_API_KEY as string,
        process.env.TWILIO_API_SECRET as string,
        { identity }
      );

      // Create a Voice grant for this token
      const voiceGrant = new VoiceGrant({
        outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID as string,
        incomingAllow: true,
      });

      // Add the voice grant to the token
      token.addGrant(voiceGrant);

      // If roomName is provided, add a Video grant
      if (roomName) {
        const videoGrant = new VideoGrant({ room: roomName });
        token.addGrant(videoGrant);
      }

      // Return the token as a string
      return token.toJwt();
    } catch (error) {
      console.error("Error generating token:", error);
      throw error;
    }
  }

  /**
   * Generate a token for voice and video calls
   */
  async generateVideoToken(userId: string, roomName: string) {
    try {
      const { AccessToken } = require("twilio").jwt;
      const { VideoGrant } = AccessToken;

      const user = await UserModel.findById(userId);

      const name = user?.lastName
        ? user.firstName + " " + user.lastName
        : user?.firstName;

      // Create an access token
      const token = new AccessToken(
        process.env.TWILIO_ACCOUNT_SID as string,
        process.env.TWILIO_API_KEY as string,
        process.env.TWILIO_API_SECRET as string,
        {
          identity: userId,
          ttl: 12 * 3600,
          claims: {
            name: name,
            email: user?.email,
            role: user?.role,
          },
        }
      );

      const videoGrant = new VideoGrant({
        room: roomName,
      });

      token.addGrant(videoGrant);

      // Return the token as a string
      return token.toJwt();
    } catch (error) {
      console.error("Error generating token:", error);
      throw error;
    }
  }

  /**
   * Initiate a voice call
   */
  async initiateVoiceCall(
    fromUserId: string,
    toUserId: string
  ): Promise<ICall> {
    try {
      // Get user details
      const fromUser = await UserModel.findById(fromUserId);
      const toUser = await UserModel.findById(toUserId);

      if (!fromUser || !toUser) {
        throw new Error("User not found");
      }

      // Get user's identity for Twilio
      const fromIdentity = (fromUser._id as mongoose.ObjectId).toString();
      const toIdentity = (toUser._id as mongoose.ObjectId).toString();

      // Create a call in Twilio
      const call = await twilioClient.calls.create({
        url: `${process.env.API_BASE_URL}/api/calls/voice/connect/${toIdentity}`,
        to: `client:${toIdentity}`,
        from: `client:${fromIdentity}`,
      });

      // Save call details in our database
      const callRecord = new CallModel({
        twilioSid: call.sid,
        type: CallType.VOICE,
        status: CallStatus.INITIATED,
        from: new mongoose.Types.ObjectId(fromUserId),
        to: new mongoose.Types.ObjectId(toUserId),
      });

      await callRecord.save();
      return callRecord;
    } catch (error) {
      console.error("Error initiating voice call:", error);
      throw error;
    }
  }

  /**
   * Generate TwiML for voice calls
   */
  generateVoiceTwiML(toIdentity: string): string {
    const twiml = new VoiceResponse();

    const dial = twiml.dial({ callerId: process.env.TWILIO_CALLER_ID || "" });
    dial.client(toIdentity);

    return twiml.toString();
  }

  /**
   * Create a video room
   */
  async createVideoRoom(
    roomName: string,
    type: "peer-to-peer" | "group" = "group"
  ): Promise<any> {
    try {
      const room = await twilioClient.video.v1.rooms.create({
        uniqueName: roomName,
        type,
        recordParticipantsOnConnect: false,
      });

      return room;
    } catch (error) {
      console.error("Error creating video room:", error);
      throw error;
    }
  }

  /**
   * Initiate a video call
   */
  async initiateVideoCall(
    fromUserId: string,
    conversationId?: string
  ): Promise<ICall> {
    try {
      // Create a unique room name
      const roomName = `room-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const conversation = await ConversationModel.findById(conversationId).populate({
        path: "participants.user",
        select: "firstName lastName email image role",
      }).lean()

      if (!conversation) {
        throw new Error("Conversation not found");
      }
      const fromUser = await UserModel.findById(fromUserId);
      if (!fromUser) {
        throw new Error("User not found");
      }

      // Create a video room
      const room = await this.createVideoRoom(roomName);

      // Save call details in our database
      const callRecord = new CallModel({
        twilioSid: room.sid,
        type: CallType.VIDEO,
        status: CallStatus.INITIATED,
        from: new mongoose.Types.ObjectId(fromUserId),
        to: new mongoose.Types.ObjectId(conversationId),
        roomName,
        conversationId: conversationId
          ? new mongoose.Types.ObjectId(conversationId)
          : undefined,
      });

      await callRecord.save();

      conversation.participants.forEach((participant) => {
        const user = participant.user instanceof mongoose.Types.ObjectId
          ? null
          : (participant.user as IUser);

        WebsocketServer.to(`${user?.role}-${user?._id}`).emit('incommingCall', { name: 'Mohnish' })

        // if (user.user.toString() !== fromUserId) {
        //   this.notifyIncomingCall(user.user.toString(), {
        //     callId: (callRecord._id as mongoose.ObjectId).toString(),
        //     fromUser: {
        //       _id: fromUser._id,
        //       firstName: fromUser.firstName,
        //       lastName: fromUser.lastName,
        //       image: fromUser.image,
        //     },
        //     type: CallType.VIDEO,
        //   });
        // }
      });

      return callRecord;
    } catch (error) {
      console.error("Error initiating video call:", error);
      throw error;
    }
  }

  /**
   * Update call status
   */
  async updateCallStatus(
    callSid: string,
    status: CallStatus,
    duration?: number
  ): Promise<ICall | null> {
    try {
      const call = await CallModel.findOne({ twilioSid: callSid });

      if (!call) {
        console.error(`Call with SID ${callSid} not found`);
        return null;
      }

      call.status = status;

      if (status === CallStatus.IN_PROGRESS && !call.startTime) {
        call.startTime = new Date();
      }

      if (
        [
          CallStatus.COMPLETED,
          CallStatus.FAILED,
          CallStatus.BUSY,
          CallStatus.NO_ANSWER,
          CallStatus.CANCELED,
        ].includes(status)
      ) {
        call.endTime = new Date();
        if (duration) {
          call.duration = duration;
        } else if (call.startTime) {
          call.duration = Math.round(
            (new Date().getTime() - call.startTime.getTime()) / 1000
          );
        }
      }

      await call.save();
      return call;
    } catch (error) {
      console.error("Error updating call status:", error);
      throw error;
    }
  }

  /**
   * Get call history for a user
   */
  async getCallHistory(
    userId: string,
    limit = 50,
    before?: string
  ): Promise<ICall[]> {
    try {
      const query: any = {
        $or: [
          { from: new mongoose.Types.ObjectId(userId) },
          { to: new mongoose.Types.ObjectId(userId) },
        ],
      };

      // If 'before' is provided, get calls before that call
      if (before) {
        const beforeCall = await CallModel.findById(before);
        if (beforeCall) {
          query.createdAt = { $lt: beforeCall.createdAt };
        }
      }

      const calls = await CallModel.find(query)
        .populate("from", "firstName lastName email image")
        .populate("to", "firstName lastName email image")
        .sort({ createdAt: -1 })
        .limit(limit);

      return calls;
    } catch (error) {
      console.error("Error getting call history:", error);
      throw error;
    }
  }

  private notifyIncomingCall(
    toUserId: string,
    callData: {
      callId: string;
      fromUser: any;
      type: CallType;
    }
  ) {
    try {
      const io = getSocketIO();
      if (io) {
        const socketId = userSocketMap[toUserId];

        if (!socketId) {
          logger.error(` Not Found socket ID for user ${toUserId}`);
          return;
        }
        logger.info(`Found socket ID ${socketId} for user ${toUserId}`);

        logger.info(`Attempting to emit incoming_call to user ${toUserId}`, {
          callData,
          timestamp: new Date().toISOString(),
        });

        io.to(socketId).emit("incoming_call", {
          callId: callData.callId,
          from: callData.fromUser,
          type: callData.type,
          timestamp: new Date(),
        });

        logger.info(`incoming_call event emitted to user ${toUserId}`);
      } else {
        logger.error(
          "Socket.IO instance not available when trying to emit incoming_call"
        );
      }
    } catch (error) {
      logger.error("Error notifying incoming call:", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        toUserId,
        callData,
      });
    }
  }
}

export default new CallService();
