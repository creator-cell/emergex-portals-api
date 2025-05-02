import { Request, Response } from "express";
import conversationService from "../services/conversation.service";
import { ICustomRequest } from "../types/express";
import IncidentModel, { IIncident } from "../models/IncidentModel";
import UserModel, { IUser } from "../models/UserModel";
import {
  ConversationIdentity,
  ConversationType,
} from "../models/ConversationModel";
import { GlobalAdminRoles } from "../config/global-enum";
import EmployeeModel from "../models/EmployeeModel";
import mongoose, { mongo } from "mongoose";
import TeamModel from "../models/TeamModel";

export const createConversation = async (req: Request, res: Response) => {
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;
  try {
    const { participant } = req.body;
    const userId = currentUser.id;

    if (!participant) {
      return res
        .status(400)
        .json({ success: false, message: "Participant is required" });
    }

    const employee = await EmployeeModel.findById(participant);
    if (!employee) {
      return res
        .status(400)
        .json({ success: false, message: "Participant not found" });
    }

    const friendlyName = `conversation-${currentUser.id}-${employee.user}`;

    const conversation = await conversationService.createConversation(
      friendlyName,
      userId,
      currentUser.role === GlobalAdminRoles.SuperAdmin
        ? ConversationIdentity.SUPERADMIN
        : ConversationIdentity.EMPLOYEE,
      ConversationType.SINGLE
    );

    // Ensure conversation has a known type
    const conversationId = (conversation as { _id: string })._id;

    // Add the creator as the first participant
    await conversationService.addParticipant(
      conversationId.toString(),
      userId,
      currentUser.id
    );

    if (participant) {
      const participantId = employee?.user!.toString();
      await conversationService.addParticipant(
        conversationId.toString(),
        participantId,
        (employee.user as mongoose.Types.ObjectId).toString()
      );
    }

    return res.status(201).json({
      success: true,
      conversation,
      message: "Conversation created successfully",
    });
  } catch (error: any) {
    console.error("Error creating conversation:", error);
    return res
      .status(500)
      .json({ message: error.message || "An error occurred" });
  }
};

export const getUserConversations = async (req: Request, res: Response) => {
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;
  try {
    const { incidentId } = req.query;

    let incident: IIncident | null = null;
    if (incidentId) {
      incident = await IncidentModel.findById(incidentId);
      if (!incident) {
        return res
          .status(400)
          .json({ success: false, message: "Incident not found" });
      }
    }

    const userId = currentUser.id;
    const conversations = await conversationService.getUserConversations(
      userId,
      incident ? (incident?._id as string) : undefined
    );

    return res.status(200).json({
      success: true,
      conversations,
      message: "Conversations fetched successfully",
    });
  } catch (error: any) {
    console.error("Error getting user conversations:", error);
    return res
      .status(500)
      .json({ message: error.message || "An error occurred" });
  }
};

export const getTeamsWithMembersAndConversations = async (
  req: Request,
  res: Response
) => {
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;
  const { teamId } = req.query;

  try {
    const pipeline: mongoose.PipelineStage[] = [
      {
        $match: {
          isDeleted: false,
          ...(teamId ? { _id: new mongoose.Types.ObjectId(teamId as string) } : {}),
        },
      },
      // Lookup team members (employees)
      {
        $lookup: {
          from: "employees",
          localField: "members",
          foreignField: "_id",
          as: "members",
          pipeline: [
            { $match: { isDeleted: false } },
            // Lookup user for each employee
            {
              $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "user",
                pipeline: [{ $match: { isTrash: false } }, { $limit: 1 }],
              },
            },
            { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
            // Lookup conversation where both member and current user are participants
            {
              $lookup: {
                from: "conversations",
                let: { memberUserId: "$user._id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$isActive", true] },
                          { $in: [currentUser.id, "$participants.user"] },
                          { $in: ["$$memberUserId", "$participants.user"] },
                          { $eq: ["$type", ConversationType.SINGLE] }
                        ]
                      }
                    }
                  },
                  { $limit: 1 },
                  // Lookup last message
                  {
                    $lookup: {
                      from: "messages",
                      localField: "lastMessage",
                      foreignField: "_id",
                      as: "lastMessage",
                    },
                  },
                  {
                    $unwind: {
                      path: "$lastMessage",
                      preserveNullAndEmptyArrays: true,
                    },
                  },
                ],
                as: "conversation",
              },
            },
            {
              $unwind: {
                path: "$conversation",
                preserveNullAndEmptyArrays: true,
              },
            },
          ],
        },
      },
      // Lookup team conversation (where current user is participant)
      {
        $lookup: {
          from: "conversations",
          let: { teamId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$isActive", true] },
                    { $eq: ["$identity", ConversationIdentity.TEAM] },
                    { $eq: ["$identityId", "$$teamId"] },
                    { $in: [currentUser.id, "$participants.user"] }
                  ]
                }
              }
            },
            { $limit: 1 },
            // Lookup last message
            {
              $lookup: {
                from: "messages",
                localField: "lastMessage",
                foreignField: "_id",
                as: "lastMessage",
              },
            },
            {
              $unwind: {
                path: "$lastMessage",
                preserveNullAndEmptyArrays: true,
              },
            },
          ],
          as: "conversation",
        },
      },
      { $unwind: { path: "$conversation", preserveNullAndEmptyArrays: true } },
      // Project the final structure
      {
        $project: {
          name: 1,
          members: {
            _id: 1,
            name: 1,
            contactNo: 1,
            designation: 1,
            email: 1,
            user: 1,
            createdBy: 1,
            isDeleted: 1,
            conversation: {
              twilioSid: 1,
              type: 1,
              identity: 1,
              identityId: 1,
              name: 1,
              participants: 1,
              createdBy: 1,
              attributes: 1,
              lastMessage: {
                twilioSid: 1,
                author: 1,
                conversationSid: 1,
                messageSid: 1,
                body: 1,
                type: 1,
                mediaUrl: 1,
                readBy: 1,
                attributes: 1,
                createdAt: 1,
                updatedAt: 1,
              },
              isActive: 1,
            },
          },
          isDeleted: 1,
          createdBy: 1,
          conversation: {
            twilioSid: 1,
            type: 1,
            identity: 1,
            identityId: 1,
            name: 1,
            participants: 1,
            createdBy: 1,
            attributes: 1,
            lastMessage: {
              twilioSid: 1,
              author: 1,
              conversationSid: 1,
              messageSid: 1,
              body: 1,
              type: 1,
              mediaUrl: 1,
              readBy: 1,
              attributes: 1,
              createdAt: 1,
              updatedAt: 1,
            },
            isActive: 1,
          },
        },
      },
    ];

    const data = await TeamModel.aggregate(pipeline);
    return res.status(200).json({ 
      success: true, 
      data, 
      message: "Teams fetched successfully" 
    });
  } catch (error) {
    console.error("Error getting teams with members and conversations:", error);
    return res.status(500).json({
      success: false,
      error: "Server error in getting teams with members and conversations",
    });
  }
};

export const getConversation = async (req: Request, res: Response) => {
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;
  try {
    const { id } = req.params;
    const userId = currentUser.id;
    const conversation = await conversationService.getConversationById(
      id,
      userId
    );

    return res.status(200).json(conversation);
  } catch (error: any) {
    console.error("Error getting conversation:", error);
    if (
      error.message === "Conversation not found" ||
      error.message === "User is not a participant in this conversation"
    ) {
      return res.status(404).json({ message: error.message });
    }
    return res
      .status(500)
      .json({ message: error.message || "An error occurred" });
  }
};

export const getConversationMessages = async (req: Request, res: Response) => {
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;
  try {
    const { id } = req.params;
    const userId = currentUser.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const before = req.query.before as string;

    const messages = await conversationService.getConversationMessages(
      id,
      userId,
      limit,
      before
    );
    return res.status(200).json(messages);
  } catch (error: any) {
    console.error("Error getting conversation messages:", error);
    if (
      error.message === "Conversation not found" ||
      error.message === "User is not a participant in this conversation"
    ) {
      return res.status(404).json({ message: error.message });
    }
    return res
      .status(500)
      .json({ message: error.message || "An error occurred" });
  }
};

export const addParticipant = async (req: Request, res: Response) => {
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;
  try {
    const { id } = req.params;
    const { userId, identity } = req.body;
    const requesterId = currentUser.id;

    // Check if requester is already a participant (you may want to add additional permission checks)
    const conversation = await conversationService.getConversationById(
      id,
      requesterId
    );

    const updatedConversation = await conversationService.addParticipant(
      id,
      userId,
      identity
    );
    return res.status(200).json(updatedConversation);
  } catch (error: any) {
    console.error("Error adding participant:", error);
    if (
      error.message === "Conversation not found" ||
      error.message === "User is not a participant in this conversation"
    ) {
      return res.status(404).json({ message: error.message });
    }
    return res
      .status(500)
      .json({ message: error.message || "An error occurred" });
  }
};

export const removeParticipant = async (req: Request, res: Response) => {
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;
  try {
    const { id, participantId } = req.params;
    const requesterId = currentUser.id;

    // Check if requester is already a participant (you may want to add additional permission checks)
    await conversationService.getConversationById(id, requesterId);

    const updatedConversation = await conversationService.removeParticipant(
      id,
      participantId
    );
    return res.status(200).json(updatedConversation);
  } catch (error: any) {
    console.error("Error removing participant:", error);
    if (
      error.message === "Conversation not found" ||
      error.message === "User is not a participant in this conversation"
    ) {
      return res.status(404).json({ message: error.message });
    }
    return res
      .status(500)
      .json({ message: error.message || "An error occurred" });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;
  try {
    const { id } = req.params;
    const { body, media } = req.body;
    const userId = currentUser.id;
    console.log("user id: ", userId);

    if (!body && (!media || media.length === 0)) {
      return res
        .status(400)
        .json({ message: "Message body or media is required" });
    }

    const message = await conversationService.sendMessage(
      id,
      userId,
      body,
      media
    );
    return res.status(201).json(message);
  } catch (error: any) {
    console.error("Error sending message:", error);
    if (
      error.message === "Conversation not found" ||
      error.message === "User is not a participant in this conversation"
    ) {
      return res.status(404).json({ message: error.message });
    }
    return res
      .status(500)
      .json({ message: error.message || "An error occurred" });
  }
};

export const updateConversation = async (req: Request, res: Response) => {
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;
  try {
    const { id } = req.params;
    const { friendlyName, attributes } = req.body;
    const userId = currentUser.id;

    if (!friendlyName && !attributes) {
      return res.status(400).json({ message: "No updates provided" });
    }

    const updatedConversation = await conversationService.updateConversation(
      id,
      userId,
      { friendlyName, attributes }
    );

    return res.status(200).json(updatedConversation);
  } catch (error: any) {
    console.error("Error updating conversation:", error);
    if (
      error.message === "Conversation not found" ||
      error.message === "User is not a participant in this conversation"
    ) {
      return res.status(404).json({ message: error.message });
    }
    return res
      .status(500)
      .json({ message: error.message || "An error occurred" });
  }
};

export const deleteConversation = async (req: Request, res: Response) => {
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;
  try {
    const { id } = req.params;
    const userId = currentUser.id;

    await conversationService.deleteConversation(id, userId);
    return res
      .status(200)
      .json({ message: "Conversation deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting conversation:", error);
    if (error.message === "Conversation not found") {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === "Only the creator can delete the conversation") {
      return res.status(403).json({ message: error.message });
    }
    return res
      .status(500)
      .json({ message: error.message || "An error occurred" });
  }
};

export const generateToken = async (req: Request, res: Response) => {
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;
  try {
    const userId = currentUser.id;
    const identity = currentUser.email || "default_identity";

    const token = await conversationService.generateToken(userId, identity);
    return res
      .status(200)
      .json({ success: true, token, message: "Token generated successfully" });
  } catch (error: any) {
    console.error("Error generating token:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "An error occurred in generating token",
    });
  }
};
