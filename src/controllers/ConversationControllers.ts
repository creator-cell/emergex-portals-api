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
import UserModel from "../models/UserModel";
import { UploadFile } from "../helper/S3Bucket";
import ProjectRoleModel from "../models/ProjectRoleModel";

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
      const participantId = employee?.user.toString();
      await conversationService.addParticipant(
        conversationId.toString(),
        participantId,
        (employee.user as mongoose.Types.ObjectId).toString()
      );
    }

    const newConversation = await ConversationModel.findById(conversation._id);


    return res.status(201).json({
      success: true,
      conversation:newConversation,
      message: "Conversation created successfully",
    });
  } catch (error: any) {
    console.error("Error creating conversation:", error);
    return res
      .status(500)
      .json({ message: error.message ?? "An error occurred" });
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

// Chat for super-admin
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
          (member: any) =>
            member.user &&
            member.user._id &&
            member.user._id.toString() === currentUser.id.toString()
        );

        // Filter out the current user's employee from members array
        team.members = team.members.filter(
          (member: any) =>
            !(
              member.user &&
              member.user._id &&
              member.user._id.toString() === currentUser.id.toString()
            )
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
      return (
        !teamEmployeeIds.has(employee._id.toString()) &&
        !(
          employee.user &&
          employee.user._id &&
          employee.user._id.toString() === currentUser.id.toString()
        )
      );
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

    if (!body && (!media || media.length === 0)) {
      return res
        .status(400)
        .json({ message: "Message body or media is required" });
    }

    let mediaPaths: string[] = [];
    if (req.files) {
      const files = Array.isArray(req.files)
        ? req.files
        : Object.values(req.files).flat();
      for (const file of files) {
        const fileName = `uploads/${Date.now()}-${file.originalname}`;
        const uploadResult = await UploadFile({
          file: file.buffer,
          fileName: fileName,
          contentType: file.mimetype,
        });

        if (uploadResult.Success && uploadResult.ImageURl) {
          mediaPaths.push(uploadResult.ImageURl);
        } else {
          console.error("Failed to upload file:", uploadResult.Error);
        }
      }
    }

    // const message = await conversationService.sendMessage(
    //   id,
    //   userId,
    //   body,
    //   media
    // );

    return res.status(201).json({
      success: true,
      data: mediaPaths,
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

    const token = await conversationService.generateToken(userId);
    return res
      .status(200)  
      .json({ success: true, token, message: "Token generated successfully" });
  } catch (error: any) {
    console.error("Error generating token:", error);
    return res.status(500).json({
      success: false,
      error: error.message ?? "An error occurred in generating token",
    });
  }
};

export const getCurrentConversationDetails = async (
  req: Request,
  res: Response
) => {
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;
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

    const currentConversation = conversation[0];

    if (!currentConversation) {
      return res.status(200).json({
        success: false,
        message: "No Conversation found",
      });
    }

    // console.log("current User: ",currentUser)

    let currentChatUser: any;
    if (currentConversation.identity === ConversationIdentity.TEAM) {
      currentChatUser = await TeamModel.findById(
        currentConversation.identityId
      ).select("name");
    } else if (currentConversation.identity === ConversationIdentity.INCIDENT) {
      currentChatUser = await IncidentModel.findById(
        currentConversation.identityId
      );
    } else {
      let notCurrentUserArray = currentConversation.participants.filter(
        (user) => {
          return user.user._id.toString() !== currentUser.id.toString();
        }
      );
      let notCurrentUser = notCurrentUserArray[0];
      currentChatUser = await EmployeeModel.findOne({
        user: notCurrentUser.user._id,
      }).select("name designation");
    }

    return res.status(200).json({
      success: true,
      data: conversation[0],
      message: "Conversation details fetched successfully",
      currentChatUser,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || "An error occurred in getting details",
    });
  }
};

export const getClientAdminChats = async (req: Request, res: Response) => {
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;
  try {
    if (currentUser.role !== GlobalAdminRoles.ClientAdmin) {
      return res.status(200).json({
        success: false,
        message: "Please login as client admin to get conversation",
      });
    }

    const clientAdmin = await UserModel.findById(currentUser.id);

    if (!clientAdmin) {
      return res.status(200).json({
        success: false,
        message: "Invalid Client Admin",
      });
    }

    const superAdmin = await UserModel.findOne({
      role: GlobalAdminRoles.SuperAdmin,
      _id: clientAdmin.createdBy,
    });

    if (!superAdmin) {
      return res.status(200).json({
        success: false,
        message: "No super admin found for this client admin",
      });
    }

    // Get all employees created by this super admin
    const allEmployees = await EmployeeModel.find({
      createdBy: superAdmin._id,
      isDeleted: false,
    })
      .populate("user")
      .lean();

    // Find current user's employee record
    const currentUserEmployee = allEmployees.find(
      (emp) =>
        emp.user &&
        emp.user._id.toString() ===
          (clientAdmin._id as mongoose.ObjectId).toString()
    );

    // Find super admin employee
    const superAdminEmployee = allEmployees.find(
      (emp) =>
        emp.user &&
        emp.user._id.toString() ===
          (superAdmin._id as mongoose.ObjectId).toString()
    );

    // Get conversation between current user and super admin
    let superAdminConversation = null;
    if (superAdminEmployee) {
      superAdminConversation = await ConversationModel.findOne({
        type: ConversationType.SINGLE,
        participants: {
          $elemMatch: { user: clientAdmin._id },
        },
        "participants.user": superAdmin._id,
      })
        .populate({
          path: "lastMessage",
          model: "Message",
        })
        .lean();
    }

    // Prepare result array with super admin section
    const result = [];

    // Add Super-Admin section
    result.push({
      team: "Super-Admin",
      members: superAdminEmployee
        ? [
            {
              ...superAdminEmployee,
              conversation: superAdminConversation,
            },
          ]
        : [],
    });

    // Create a set of employees to exclude from others
    const excludedEmployeeIds = new Set();

    // Add super admin and current user to excluded list
    if (superAdminEmployee) {
      excludedEmployeeIds.add(superAdminEmployee._id.toString());
    }

    if (currentUserEmployee) {
      excludedEmployeeIds.add(currentUserEmployee._id.toString());
    }

    // Find all team conversations where current user is a participant
    const teamConversations = await ConversationModel.find({
      identity: ConversationIdentity.TEAM,
      participants: {
        $elemMatch: { user: clientAdmin._id },
      },
    })
      .populate({
        path: "lastMessage",
        model: "Message",
      })
      .lean();

    // Get team IDs where current user is a participant
    const teamIds = teamConversations.map((conv) => conv.identityId);

    // Get team details for these teams
    const userTeams = await TeamModel.find({
      _id: { $in: teamIds },
      isDeleted: false,
    }).lean();

    // Process each team where the current user is a participant
    for (const team of userTeams) {
      // Get team conversation
      const teamConversation = teamConversations.find(
        (conv) =>
          conv.identityId && conv.identityId.toString() === team._id.toString()
      );

      if (teamConversation) {
        // Get team members with their users
        const teamMembers = [];
        for (const memberId of team.members) {
          const member = allEmployees.find(
            (emp) => emp._id.toString() === memberId.toString()
          );

          // Skip if member is super admin or current user
          if (
            member &&
            member.user &&
            !excludedEmployeeIds.has(member._id.toString())
          ) {
            // Find conversation between client admin and this member
            const conversation = await ConversationModel.findOne({
              type: ConversationType.SINGLE,
              participants: {
                $elemMatch: { user: clientAdmin._id },
              },
              "participants.user": member.user._id,
            })
              .populate({
                path: "lastMessage",
                model: "Message",
              })
              .lean();

            teamMembers.push({
              ...member,
              conversation: conversation,
            });

            // Add to excluded list to prevent duplication in Others
            excludedEmployeeIds.add(member._id.toString());
          }
        }

        result.push({
          team: team.name,
          members: teamMembers,
          conversation: teamConversation,
        });
      }
    }

    // Find non-team employees (Others)
    const otherMembers = [];

    // Find employees who are not in any team where current user is participating, not super admin, and not current user
    for (const employee of allEmployees) {
      if (!excludedEmployeeIds.has(employee._id.toString()) && employee.user) {
        // Find conversation between client admin and this employee
        const conversation = await ConversationModel.findOne({
          type: ConversationType.SINGLE,
          participants: {
            $elemMatch: { user: clientAdmin._id },
          },
          "participants.user": employee.user._id,
        })
          .populate({
            path: "lastMessage",
            model: "Message",
          })
          .lean();

        otherMembers.push({
          ...employee,
          conversation: conversation,
        });
      }
    }

    // Add Others section
    result.push({
      team: "Others",
      members: otherMembers,
      // conversation: null,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error in getting client admin conversations:", error);
    return res.status(500).json({
      success: false,
      error: "server error in getting client admin conversations",
    });
  }
};

export const uploadMediaToSend = async (req: Request, res: Response) => {
  try {
    let mediaPaths: string[] = [];
    if (req.files) {
      const files = Array.isArray(req.files)
        ? req.files
        : Object.values(req.files).flat();
      for (const file of files) {
        const fileName = `uploads/${Date.now()}-${file.originalname}`;
        const uploadResult = await UploadFile({
          file: file.buffer,
          fileName: fileName,
          contentType: file.mimetype,
        });

        if (uploadResult.Success && uploadResult.ImageURl) {
          mediaPaths.push(uploadResult.ImageURl);
        } else {
          console.error("Failed to upload file:", uploadResult.Error);
        }
      }
    }

    return res.status(201).json({
      success: true,
      data: mediaPaths,
      message: "Media Uploaded Successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server error in uploading media",
    });
  }
};

export const getIncidentChats = async (req: Request, res: Response) => {
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;
  const { id } = req.query;
  try {
    // Find the incident by ID
    const incident = await IncidentModel.findById(id);
    if (!incident) {
      return res.status(200).json({
        success: false,
        message: "Incident not found",
      });
    }

    // Find project roles for the incident's project
    const projectRoles = await ProjectRoleModel.find({
      project: incident.project,
    });

    // Get all employee IDs in the project
    const projectEmployeesIds = projectRoles.map((role) => role.employee);

    // Get all employees in the project
    const projectEmployees = await EmployeeModel.find({
      _id: {
        $in: projectEmployeesIds
      },
      isDeleted: false
    });

    // Get all user IDs of the project employees (except current user)
    const projectUserIds = projectEmployees
      .map((emp) => emp.user)
      .filter((id) => id && id.toString() !== currentUser.id);

    // Find the incident conversation
    const incidentConversation = await ConversationModel.findOne({
      identity: ConversationIdentity.INCIDENT,
      identityId: incident._id,
      isActive: true
    }).populate('lastMessage');

    // Find one-on-one conversations between current user and each project employee
    const employeeConversations = await ConversationModel.find({
      type: ConversationType.SINGLE,
      isActive: true,
      $and: [
        { 'participants.user': currentUser.id },
        { 'participants.user': { $in: projectUserIds } }
      ]
    }).populate('lastMessage');

    // Map conversations to their respective employee users
    const employeesWithConversations = await Promise.all(
      projectEmployees
        .filter(emp => emp.user && emp.user.toString() !== currentUser.id)
        .map(async (employee) => {
          // Find the conversation between current user and this employee
          const conversation = employeeConversations.find(conv => 
            conv.participants.some(p => p.user.toString() === employee.user.toString())
          );
          
          return {
            ...employee.toObject(),
            conversation: conversation || null
          };
        })
    );

    // Return the complete response
    return res.status(200).json({
      success: true,
      data: {
        ...incident.toObject(),
        conversation: incidentConversation || null,
        employees: employeesWithConversations
      }
    });

  } catch (error) {
    console.error("Error in getIncidentChats:", error);
    return res.status(500).json({
      success: false,
      message: "Error in getting incident's conversations",
    });
  }
};
