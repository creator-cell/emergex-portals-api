import { Request, Response } from "express";
import conversationService from "../services/conversation.service";
import { ICustomRequest } from "../types/express";
import IncidentModel, { IIncident } from "../models/IncidentModel";
import ConversationModel, {
  ConversationIdentity,
  ConversationType,
} from "../models/ConversationModel";
import { GlobalAdminRoles } from "../config/global-enum";
import EmployeeModel from "../models/EmployeeModel";
import mongoose from "mongoose";
import TeamModel from "../models/TeamModel";
import { IUser } from "../models/UserModel";

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

    const isConversationExist = await ConversationModel.findOne({
      type: ConversationType.SINGLE,
      isActive: true,
      "participants.user": {
        $all: [userId, employee.user],
      },
    });

    // console.log("conver: ",isConversationExist)

    if (isConversationExist) {
      return res.status(400).json({
        success: false,
        message: "Conversation already exists between the participants",
      });
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
    // First fetch teams with their members
    const pipeline: mongoose.PipelineStage[] = [
      {
        $match: {
          isDeleted: false,
          ...(teamId
            ? { _id: new mongoose.Types.ObjectId(teamId as string) }
            : {}),
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
            // Project only needed fields
            {
              $project: {
                _id: 1,
                name: 1,
                contactNo: 1,
                designation: 1,
                email: 1,
                isDeleted: 1,
                createdBy: 1,
                user: {
                  _id: 1,
                  username: 1,
                  email: 1,
                },
              },
            },
          ],
        },
      },
      // Lookup team conversation
      {
        $lookup: {
          from: "conversations",
          localField: "_id",
          foreignField: "identityId",
          as: "conversation",
          pipeline: [
            {
              $match: {
                isActive: true,
                identity: ConversationIdentity.TEAM,
              },
            },
            { $limit: 1 },
          ],
        },
      },
      { $unwind: { path: "$conversation", preserveNullAndEmptyArrays: true } },
      // Project final team structure
      {
        $project: {
          _id: 1,
          name: 1,
          members: 1,
          isDeleted: 1,
          createdBy: 1,
          conversation: 1,
        },
      },
    ];

    // Execute the aggregation pipeline to get teams with members
    const teams = await TeamModel.aggregate(pipeline);

    // Keep track of all employee IDs that are part of teams
    const teamEmployeeIds = new Set();

    // For each team, filter out current user's employee record and find direct conversations
    for (const team of teams) {
      if (team.members && team.members.length > 0) {
        // Add all employee IDs to the set
        team.members.forEach((member: any) => {
          if (member._id) {
            teamEmployeeIds.add(member._id.toString());
          }
        });

        const currentUserEmployee = team.members.find(
          (member: any) => member.user && member.user._id && member.user._id.toString() === currentUser.id.toString()
        );

        // Filter out the current user's employee from members array
        team.members = team.members.filter(
          (member: any) => !(member.user && member.user._id && member.user._id.toString() === currentUser.id.toString())
        );

        // Process each member
        for (const member of team.members) {
          if (member.user && member.user._id) {
            // Find direct conversation between member and current user
            const memberConversation = await ConversationModel.findOne({
              type: ConversationType.SINGLE,
              isActive: true,
              "participants.user": {
                $all: [member.user._id, currentUser.id],
              },
            }).lean();

            // Attach conversation to member
            member.conversation = memberConversation || null;
          }
        }
      }
    }

    // Get all employees - reusing the same pipeline as in the teams lookup for consistency
    const allEmployeesResult = await EmployeeModel.aggregate([
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
      // Keep all fields from the original document
      {
        $project: {
          _id: 1,
          name: 1,
          contactNo: 1,
          designation: 1,
          email: 1,
          isDeleted: 1,
          createdBy: 1,
          user: 1,
          // Include any other fields from the original employee schema
        },
      },
    ]);

    // Filter employees not part of any team and not the current user
    const nonTeamEmployees = allEmployeesResult.filter((employee) => {
      return !teamEmployeeIds.has(employee._id.toString()) && 
             !(employee.user && employee.user._id && 
               employee.user._id.toString() === currentUser.id.toString());
    });

    // Create conversations for non-team employees with current user
    for (const employee of nonTeamEmployees) {
      if (employee.user && employee.user._id) {
        // Find direct conversation between employee and current user
        const employeeConversation = await ConversationModel.findOne({
          type: ConversationType.SINGLE,
          isActive: true,
          "participants.user": {
            $all: [employee.user._id, currentUser.id],
          },
        }).lean();

        // Attach conversation to employee
        employee.conversation = employeeConversation || null;
      }
    }

    // Create an "Others" team for employees not in any team
    if (nonTeamEmployees.length > 0) {
      const othersTeam = {
        _id: "others",
        name: "Others",
        members: nonTeamEmployees,
        isDeleted: false,
        conversation: null,
        createdBy: null,
      };

      // Add the "Others" team to the teams array
      teams.push(othersTeam);
    }

    return res.status(200).json({
      success: true,
      data: teams,
      message: "Teams fetched successfully",
    });
  } catch (error) {
    console.error("Error getting teams with members and conversations:", error);
    return res.status(500).json({
      success: false,
      error: "server error in getting teams with members and conversations",
    });
  }
};

export const getAvailableConversations = async (
  req: Request,
  res: Response
) => {
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;

  try {
    const conversations = await ConversationModel.find({
      "participants.user": currentUser.id,
      isActive: true,
    })
      .populate({
        path: "participants.user",
        select: "_id firstName lastName email image", // Include whatever user fields you need
      })
      .populate({
        path: "lastMessage",
        populate: {
          path: "author",
          select: "_id firstName lastName email avatar", // Include whatever user fields you need
        },
      })
      .populate("createdBy", "_id firstName lastName email avatar")
      .sort({ updatedAt: -1 }) // Sort by most recently updated first
      .lean();

    return res.status(200).json({
      success: true,
      data: conversations,
      message: "Conversations fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch conversations",
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

    return res.status(200).json({
      success: true,
      data: messages,
      message: "Message fetched successfully",
    });
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
    return res.status(201).json({
      success: true,
      data: message,
      message: "Messages Send Successfully",
    });
  } catch (error: any) {
    console.error("Error sending message:", error);
    if (
      error.message === "Conversation not found" ||
      error.message === "User is not a participant in this conversation"
    ) {
      return res.status(404).json({ success: false, message: error.message });
    }
    return res
      .status(500)
      .json({ success: false, message: error.message || "An error occurred" });
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

export const getCurrentConversationDetails = async (
  req: Request,
  res: Response
) => {
  const { sid } = req.query;
  try {
    const conversation = await ConversationModel.find({
      twilioSid: sid,
      isActive: true,
    })
      .populate({
        path: "participants.user",
        select: "_id firstName lastName email image", // Include whatever user fields you need
      })
      .populate({
        path: "lastMessage",
        populate: {
          path: "author",
          select: "_id firstName lastName email avatar", // Include whatever user fields you need
        },
      })
      .populate("createdBy", "_id firstName lastName email avatar")
      .sort({ updatedAt: -1 }) // Sort by most recently updated first
      .lean();

    if (!conversation.length) {
      return res.status(200).json({
        success: false,
        message: "No Conversation found",
      });
    }

    return res.status(200).json({
      success: true,
      data: conversation[0],
      message: "Conversation details fetched successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || "An error occurred in getting details",
    });
  }
};
