import { Request, Response } from "express";
import callService from "../services/call.service";
import { ICustomRequest } from "../types/express";
import CallModel, { CallStatus, CallType } from "../models/CallModel";
import UserModel, { IUser } from "../models/UserModel";
import { twilioClient } from "../config/twilioClient";
import { WebsocketServer } from "..";
import ConversationModel from "../models/ConversationModel";
import mongoose from "mongoose";

// export const generateCallToken = async (req: Request, res: Response) => {
//   const customReq = req as ICustomRequest;
//   const currentUser = customReq.user;
//   try {
//     const { roomName } = req.query;
//     const userId = currentUser.id;
//     const identity = currentUser.id;

//     const token = await callService.generateToken(
//       userId,
//       identity,
//       roomName as string | undefined
//     );

//     return res.status(200).json({
//       success: true,
//       token,
//       message: "Call token generated successfully",
//     });
//   } catch (error: any) {
//     console.error("Error generating call token:", error);
//     return res.status(500).json({
//       success: false,
//       error: error.message || "An error occurred generating call token",
//     });
//   }
// };

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

// export const initiateVoiceCall = async (req: Request, res: Response) => {
//   const customReq = req as ICustomRequest;
//   const currentUser = customReq.user;
//   try {
//     const { toUserId } = req.body;
//     const fromUserId = currentUser.id;

//     // Validate toUserId
//     const toUser = await UserModel.findById(toUserId);
//     if (!toUser) {
//       return res.status(400).json({
//         success: false,
//         message: "Recipient user not found",
//       });
//     }

//     const call = await callService.initiateVoiceCall(fromUserId, toUserId);

//     return res.status(200).json({
//       success: true,
//       call,
//       message: "Voice call initiated successfully",
//     });
//   } catch (error: any) {
//     console.error("Error initiating voice call:", error);
//     return res.status(500).json({
//       success: false,
//       error: error.message ?? "An error occurred initiating voice call",
//     });
//   }
// };

// export const handleCallsWebhook = async (req: Request, res: Response) => {
//   try {
//     const { CallSid, CallStatus, CallDuration } = req.body;

//     console.log('--------Webhook Controller--------');
//     console.log({ CallSid, CallStatus, CallDuration });


//     if (CallSid && CallStatus) {
//       // Map Twilio status to our status enum
//       let status: CallStatus;
//       switch (CallStatus) {
//         case "in-progress":
//           status = CallStatus.IN_PROGRESS;
//           break;
//         case "completed":
//           status = CallStatus.COMPLETED;
//           break;
//         case "busy":
//           status = CallStatus.BUSY;
//           break;
//         case "no-answer":
//           status = CallStatus.NO_ANSWER;
//           break;
//         case "canceled":
//           status = CallStatus.CANCELED;
//           break;
//         case "failed":
//           status = CallStatus.FAILED;
//           break;
//         default:
//           status = CallStatus.INITIATED;
//       }

//       // Update call status in database
//       await callService.updateCallStatus(
//         CallSid,
//         status,
//         CallDuration ? parseInt(CallDuration) : undefined
//       );
//     }

//     res.status(200).send("Webhook received");
//   } catch (error: any) {
//     console.error("Error handling voice webhook:", error);
//     res.status(500).send("Error processing webhook");
//   }
// };

// export const connectVoiceCall = async (req: Request, res: Response) => {
//   try {
//     const { toIdentity } = req.params;
//     const twiml = callService.generateVoiceTwiML(toIdentity);

//     res.type("text/xml");
//     res.send(twiml);
//   } catch (error: any) {
//     console.error("Error connecting voice call:", error);
//     res.status(500).send("Error connecting call");
//   }
// };

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

    // Generate token for the current user to join the video room
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

// export const joinVideoCall = async (req: Request, res: Response) => {
//   const customReq = req as ICustomRequest;
//   const currentUser = customReq.user;
//   try {
//     const { roomName } = req.params;
//     const userId = currentUser.id;

//     // Check if the room exists and the call is valid
//     const call = await CallModel.findOne({
//       roomName,
//       $or: [{ from: userId }, { to: userId }],
//     });

//     if (!call) {
//       return res.status(404).json({
//         success: false,
//         message: "Video call not found or you don't have permission to join",
//       });
//     }

//     // Generate token for the user to join the video room
//     const token = await callService.generateToken(userId, userId, roomName);

//     return res.status(200).json({
//       success: true,
//       token,
//       roomName,
//       call,
//       message: "Join video call token generated successfully",
//     });
//   } catch (error: any) {
//     console.error("Error joining video call:", error);
//     return res.status(500).json({
//       success: false,
//       error: error.message || "An error occurred joining video call",
//     });
//   }
// };

// export const endCall = async (req: Request, res: Response) => {
//   const customReq = req as ICustomRequest;
//   const currentUser = customReq.user;
//   try {
//     const { callId } = req.params;
//     const userId = currentUser.id;

//     // Find the call and check permissions
//     const call = await CallModel.findById(callId);

//     if (!call) {
//       return res.status(404).json({
//         success: false,
//         message: "Call not found",
//       });
//     }

//     // Check if the user is a participant in the call
//     if (call.from.toString() !== userId && call.to.toString() !== userId) {
//       return res.status(403).json({
//         success: false,
//         message: "You don't have permission to end this call",
//       });
//     }

//     // End the call in Twilio
//     if (call.type === CallType.VOICE) {
//       try {
//         // For voice calls, terminate via Twilio API
//         await twilioClient
//           .calls(call.twilioSid)
//           .update({ status: "completed" });
//       } catch (twilioError) {
//         console.error("Error ending Twilio call:", twilioError);
//         // Continue with the local DB update even if Twilio API call fails
//       }
//     } else if (call.type === CallType.VIDEO && call.roomName) {
//       try {
//         // For video calls, close the room
//         await twilioClient.video.v1
//           .rooms(call.roomName)
//           .update({ status: "completed" });
//       } catch (twilioError) {
//         console.error("Error closing Twilio video room:", twilioError);
//         // Continue with the local DB update even if Twilio API call fails
//       }
//     }

//     // Update call status in our database
//     call.status = CallStatus.COMPLETED;
//     call.endTime = new Date();
//     if (call.startTime) {
//       call.duration = Math.round(
//         (new Date().getTime() - call.startTime.getTime()) / 1000
//       );
//     }
//     await call.save();

//     return res.status(200).json({
//       success: true,
//       message: "Call ended successfully",
//     });
//   } catch (error: any) {
//     console.error("Error ending call:", error);
//     return res.status(500).json({
//       success: false,
//       error: error.message || "An error occurred ending call",
//     });
//   }
// };

// export const getCallHistory = async (req: Request, res: Response) => {
//   const customReq = req as ICustomRequest;
//   const currentUser = customReq.user;
//   try {
//     const userId = currentUser.id;
//     const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
//     const before = req.query.before as string;

//     const calls = await callService.getCallHistory(userId, limit, before);

//     return res.status(200).json({
//       success: true,
//       data: calls,
//       message: "Call history fetched successfully",
//     });
//   } catch (error: any) {
//     console.error("Error fetching call history:", error);
//     return res.status(500).json({
//       success: false,
//       error: error.message || "An error occurred fetching call history",
//     });
//   }
// };

// export const createRoom = async (req: Request, res: Response) => {
//   try {
//     const { roomName } = req.body;
//     const room = await twilioClient.video.v1.rooms.create({
//       uniqueName: roomName,
//       type: "group",
//       recordParticipantsOnConnect: false,
//     });

//     return res.status(200).json({
//       success: true,
//       room,
//     });
//   } catch (error: any) {
//     return res.status(500).json({
//       success: false,
//       error: error.message || "An error occurred while creating room",
//     });
//   }
// };

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
