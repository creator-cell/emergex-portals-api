import { Request, Response } from "express";
import callService from "../services/call.service";
import { ICustomRequest } from "../types/express";
import CallModel, { CallStatus, CallType } from "../models/CallModel";
import { IUser } from "../models/UserModel";
import { WebsocketServer } from "..";
import ConversationModel from "../models/ConversationModel";
import mongoose from "mongoose";


export const generateCallToken = async (req: Request, res: Response) => {
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;
  try {
    const { roomName } = req.query;

    const token = await callService.generateToken(
      currentUser.id,
      roomName as string
    );

    return res.status(200).json({
      success: true,
      token,
      message: "Video Call token generated successfully",
    });
  } catch (error: any) {
    console.error("Error generating call token:", error);
    return res.status(500).json({
      success: false,
      error: error.message ?? "An error occurred generating call token",
    });
  }
};


export const initiateVideoCall = async (req: Request, res: Response) => {
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;

  console.log('--------Intiate Call Controller--------');

  try {
    const { conversationId, type } = req.query;
    const fromUserId = currentUser.id;

    const call = await callService.initiateVideoCall(
      fromUserId,
      type as CallType,
      conversationId as string,
    );

    const token = await callService.generateToken(fromUserId, call.roomName!);

    console.log('token', token);

    return res.status(200).json({
      success: true,
      token,
      roomName: call.roomName,
      call,
      message: "Video call initiated successfully",
    });

  } catch (error: any) {
    console.error("Error initiating video call:", error);
    return res.status(500).json({
      success: false,
      error: error.message ?? "An error occurred initiating video call",
    });
  }
};


export const acceptIncomingCall = async (req: Request, res: Response) => {
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;

  console.log('------Accept Call-------');

  try {
    const { roomName } = req.query;
    const userId = currentUser.id;

    const token = await callService.acceptIncomingCall(
      userId,
      roomName as string
    );

    console.log('token', token)

    return res.status(200).json({
      success: true,
      token,
      roomName,
      message: "Accept incoming call token generated successfully",
    });
  } catch (error: any) {
    console.error("Error accepting incoming video call:", error);
    return res.status(500).json({
      success: false,
      error: error.message ?? "An error occurred accepting incoming call",
    });
  }
};

export const handleEndCall = async (req: Request, res: Response) => {
  try {
    const { roomName } = req.params;
    const call = await CallModel.findOne({
      roomName,
    });

    console.log('End call', call);

    if (!call) {
      return res.status(200).json({
        success: false,
        message: "Call not found",
      });
    }

    if (call.status === CallStatus.COMPLETED) {
      return res.status(200).json({
        success: true,
        message: "Call was already ended",
      });
    }

    const endTime = new Date();
    call.endTime = endTime;
    call.status = CallStatus.COMPLETED;

    if (call.startTime) {
      const durationInSeconds = Math.floor(
        (endTime.getTime() - call.startTime.getTime()) / 1000
      );
      call.duration = durationInSeconds;
    }

    const conversation = await ConversationModel.findById(call.conversationId)
      .populate({
        path: "participants.user",
        select: "firstName lastName email image role",
      })
      .lean();

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    conversation.participants.forEach((participant) => {
      const user =
        participant.user instanceof mongoose.Types.ObjectId
          ? null
          : (participant.user as IUser);
      WebsocketServer.to(`${user?.role}-${user?._id}`).emit("callEnded");
    });

    await call.save();

    return res.status(200).json({
      success: true,
      message: "Call Ended successsfully",
      call
    });
  } catch (error) {
    console.error("Error handling end call:", error);
    return res.status(500).json({
      success: false,
      message: "Server error in ending call",
    });
  }
};

export const fetchCallByConversation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    console.log({ id });

    const call = await CallModel.findOne({
      conversationId: id,
      status: {
        $ne: CallStatus.COMPLETED,
      },
    });

    console.log('call', call)

    if (!call) {
      return res.status(200).json({
        success: false,
        message: "Call not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Call fetched succesfully",
      call,
    });
  } catch (error) {
    console.error("Error in fetching call:", error);
    return res.status(500).json({
      success: false,
      message: "Server error in fetching call",
    });
  }
};
