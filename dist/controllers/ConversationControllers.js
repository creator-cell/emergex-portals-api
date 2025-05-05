"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientAdminChats = exports.getCurrentConversationDetails = exports.generateToken = exports.deleteConversation = exports.updateConversation = exports.sendMessage = exports.removeParticipant = exports.addParticipant = exports.getConversationMessages = exports.getConversation = exports.getAvailableConversations = exports.getTeamsWithMembersAndConversations = exports.getUserConversations = exports.createConversation = void 0;
const conversation_service_1 = __importDefault(require("../services/conversation.service"));
const IncidentModel_1 = __importDefault(require("../models/IncidentModel"));
const ConversationModel_1 = __importStar(require("../models/ConversationModel"));
const global_enum_1 = require("../config/global-enum");
const EmployeeModel_1 = __importDefault(require("../models/EmployeeModel"));
const mongoose_1 = __importDefault(require("mongoose"));
const TeamModel_1 = __importDefault(require("../models/TeamModel"));
const UserModel_1 = __importDefault(require("../models/UserModel"));
const createConversation = async (req, res) => {
    const customReq = req;
    const currentUser = customReq.user;
    try {
        const { participant } = req.body;
        const userId = currentUser.id;
        if (!participant) {
            return res
                .status(400)
                .json({ success: false, message: "Participant is required" });
        }
        const employee = await EmployeeModel_1.default.findById(participant);
        if (!employee) {
            return res
                .status(400)
                .json({ success: false, message: "Participant not found" });
        }
        const isConversationExist = await ConversationModel_1.default.findOne({
            type: ConversationModel_1.ConversationType.SINGLE,
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
        const conversation = await conversation_service_1.default.createConversation(friendlyName, userId, currentUser.role === global_enum_1.GlobalAdminRoles.SuperAdmin
            ? ConversationModel_1.ConversationIdentity.SUPERADMIN
            : ConversationModel_1.ConversationIdentity.EMPLOYEE, ConversationModel_1.ConversationType.SINGLE);
        // Ensure conversation has a known type
        const conversationId = conversation._id;
        // Add the creator as the first participant
        await conversation_service_1.default.addParticipant(conversationId.toString(), userId, currentUser.id);
        if (participant) {
            const participantId = employee?.user.toString();
            await conversation_service_1.default.addParticipant(conversationId.toString(), participantId, employee.user.toString());
        }
        return res.status(201).json({
            success: true,
            conversation,
            message: "Conversation created successfully",
        });
    }
    catch (error) {
        console.error("Error creating conversation:", error);
        return res
            .status(500)
            .json({ message: error.message || "An error occurred" });
    }
};
exports.createConversation = createConversation;
const getUserConversations = async (req, res) => {
    const customReq = req;
    const currentUser = customReq.user;
    try {
        const { incidentId } = req.query;
        let incident = null;
        if (incidentId) {
            incident = await IncidentModel_1.default.findById(incidentId);
            if (!incident) {
                return res
                    .status(400)
                    .json({ success: false, message: "Incident not found" });
            }
        }
        const userId = currentUser.id;
        const conversations = await conversation_service_1.default.getUserConversations(userId, incident ? incident?._id : undefined);
        return res.status(200).json({
            success: true,
            conversations,
            message: "Conversations fetched successfully",
        });
    }
    catch (error) {
        console.error("Error getting user conversations:", error);
        return res
            .status(500)
            .json({ message: error.message || "An error occurred" });
    }
};
exports.getUserConversations = getUserConversations;
// Chat for super-admin
const getTeamsWithMembersAndConversations = async (req, res) => {
    const customReq = req;
    const currentUser = customReq.user;
    const { teamId } = req.query;
    try {
        // First fetch teams with their members
        const pipeline = [
            {
                $match: {
                    isDeleted: false,
                    ...(teamId
                        ? { _id: new mongoose_1.default.Types.ObjectId(teamId) }
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
                                identity: ConversationModel_1.ConversationIdentity.TEAM,
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
        const teams = await TeamModel_1.default.aggregate(pipeline);
        // Keep track of all employee IDs that are part of teams
        const teamEmployeeIds = new Set();
        // For each team, filter out current user's employee record and find direct conversations
        for (const team of teams) {
            if (team.members && team.members.length > 0) {
                // Add all employee IDs to the set
                team.members.forEach((member) => {
                    if (member._id) {
                        teamEmployeeIds.add(member._id.toString());
                    }
                });
                const currentUserEmployee = team.members.find((member) => member.user && member.user._id && member.user._id.toString() === currentUser.id.toString());
                // Filter out the current user's employee from members array
                team.members = team.members.filter((member) => !(member.user && member.user._id && member.user._id.toString() === currentUser.id.toString()));
                // Process each member
                for (const member of team.members) {
                    if (member.user && member.user._id) {
                        // Find direct conversation between member and current user
                        const memberConversation = await ConversationModel_1.default.findOne({
                            type: ConversationModel_1.ConversationType.SINGLE,
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
        const allEmployeesResult = await EmployeeModel_1.default.aggregate([
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
                const employeeConversation = await ConversationModel_1.default.findOne({
                    type: ConversationModel_1.ConversationType.SINGLE,
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
    }
    catch (error) {
        console.error("Error getting teams with members and conversations:", error);
        return res.status(500).json({
            success: false,
            error: "server error in getting teams with members and conversations",
        });
    }
};
exports.getTeamsWithMembersAndConversations = getTeamsWithMembersAndConversations;
const getAvailableConversations = async (req, res) => {
    const customReq = req;
    const currentUser = customReq.user;
    try {
        const conversations = await ConversationModel_1.default.find({
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
    }
    catch (error) {
        console.error("Error fetching conversations:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch conversations",
        });
    }
};
exports.getAvailableConversations = getAvailableConversations;
const getConversation = async (req, res) => {
    const customReq = req;
    const currentUser = customReq.user;
    try {
        const { id } = req.params;
        const userId = currentUser.id;
        const conversation = await conversation_service_1.default.getConversationById(id, userId);
        return res.status(200).json(conversation);
    }
    catch (error) {
        console.error("Error getting conversation:", error);
        if (error.message === "Conversation not found" ||
            error.message === "User is not a participant in this conversation") {
            return res.status(404).json({ message: error.message });
        }
        return res
            .status(500)
            .json({ message: error.message || "An error occurred" });
    }
};
exports.getConversation = getConversation;
const getConversationMessages = async (req, res) => {
    const customReq = req;
    const currentUser = customReq.user;
    try {
        const { id } = req.params;
        const userId = currentUser.id;
        const limit = req.query.limit ? parseInt(req.query.limit) : 50;
        const before = req.query.before;
        const messages = await conversation_service_1.default.getConversationMessages(id, userId, limit, before);
        return res.status(200).json({
            success: true,
            data: messages,
            message: "Message fetched successfully",
        });
    }
    catch (error) {
        console.error("Error getting conversation messages:", error);
        if (error.message === "Conversation not found" ||
            error.message === "User is not a participant in this conversation") {
            return res.status(404).json({ message: error.message });
        }
        return res
            .status(500)
            .json({ message: error.message || "An error occurred" });
    }
};
exports.getConversationMessages = getConversationMessages;
const addParticipant = async (req, res) => {
    const customReq = req;
    const currentUser = customReq.user;
    try {
        const { id } = req.params;
        const { userId, identity } = req.body;
        const requesterId = currentUser.id;
        // Check if requester is already a participant (you may want to add additional permission checks)
        const conversation = await conversation_service_1.default.getConversationById(id, requesterId);
        const updatedConversation = await conversation_service_1.default.addParticipant(id, userId, identity);
        return res.status(200).json(updatedConversation);
    }
    catch (error) {
        console.error("Error adding participant:", error);
        if (error.message === "Conversation not found" ||
            error.message === "User is not a participant in this conversation") {
            return res.status(404).json({ message: error.message });
        }
        return res
            .status(500)
            .json({ message: error.message || "An error occurred" });
    }
};
exports.addParticipant = addParticipant;
const removeParticipant = async (req, res) => {
    const customReq = req;
    const currentUser = customReq.user;
    try {
        const { id, participantId } = req.params;
        const requesterId = currentUser.id;
        // Check if requester is already a participant (you may want to add additional permission checks)
        await conversation_service_1.default.getConversationById(id, requesterId);
        const updatedConversation = await conversation_service_1.default.removeParticipant(id, participantId);
        return res.status(200).json(updatedConversation);
    }
    catch (error) {
        console.error("Error removing participant:", error);
        if (error.message === "Conversation not found" ||
            error.message === "User is not a participant in this conversation") {
            return res.status(404).json({ message: error.message });
        }
        return res
            .status(500)
            .json({ message: error.message || "An error occurred" });
    }
};
exports.removeParticipant = removeParticipant;
const sendMessage = async (req, res) => {
    const customReq = req;
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
        const message = await conversation_service_1.default.sendMessage(id, userId, body, media);
        return res.status(201).json({
            success: true,
            data: message,
            message: "Messages Send Successfully",
        });
    }
    catch (error) {
        console.error("Error sending message:", error);
        if (error.message === "Conversation not found" ||
            error.message === "User is not a participant in this conversation") {
            return res.status(404).json({ success: false, message: error.message });
        }
        return res
            .status(500)
            .json({ success: false, message: error.message || "An error occurred" });
    }
};
exports.sendMessage = sendMessage;
const updateConversation = async (req, res) => {
    const customReq = req;
    const currentUser = customReq.user;
    try {
        const { id } = req.params;
        const { friendlyName, attributes } = req.body;
        const userId = currentUser.id;
        if (!friendlyName && !attributes) {
            return res.status(400).json({ message: "No updates provided" });
        }
        const updatedConversation = await conversation_service_1.default.updateConversation(id, userId, { friendlyName, attributes });
        return res.status(200).json(updatedConversation);
    }
    catch (error) {
        console.error("Error updating conversation:", error);
        if (error.message === "Conversation not found" ||
            error.message === "User is not a participant in this conversation") {
            return res.status(404).json({ message: error.message });
        }
        return res
            .status(500)
            .json({ message: error.message || "An error occurred" });
    }
};
exports.updateConversation = updateConversation;
const deleteConversation = async (req, res) => {
    const customReq = req;
    const currentUser = customReq.user;
    try {
        const { id } = req.params;
        const userId = currentUser.id;
        await conversation_service_1.default.deleteConversation(id, userId);
        return res
            .status(200)
            .json({ message: "Conversation deleted successfully" });
    }
    catch (error) {
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
exports.deleteConversation = deleteConversation;
const generateToken = async (req, res) => {
    const customReq = req;
    const currentUser = customReq.user;
    try {
        const userId = currentUser.id;
        const identity = currentUser.email || "default_identity";
        const token = await conversation_service_1.default.generateToken(userId, identity);
        return res
            .status(200)
            .json({ success: true, token, message: "Token generated successfully" });
    }
    catch (error) {
        console.error("Error generating token:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "An error occurred in generating token",
        });
    }
};
exports.generateToken = generateToken;
const getCurrentConversationDetails = async (req, res) => {
    const customReq = req;
    const currentUser = customReq.user;
    const { sid } = req.query;
    try {
        const conversation = await ConversationModel_1.default.find({
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
        let currentChatUser;
        if (currentConversation.identity === ConversationModel_1.ConversationIdentity.TEAM) {
            currentChatUser = await TeamModel_1.default.findById(currentConversation.identityId).select("name");
        }
        else if (currentConversation.identity === ConversationModel_1.ConversationIdentity.INCIDENT) {
            currentChatUser = await IncidentModel_1.default.findById(currentConversation.identityId);
        }
        else {
            let notCurrentUserArray = currentConversation.participants.filter((user) => {
                return user.user._id.toString() !== currentUser.id.toString();
            });
            let notCurrentUser = notCurrentUserArray[0];
            currentChatUser = await EmployeeModel_1.default.findOne({
                user: notCurrentUser.user._id
            }).select("name designation");
        }
        return res.status(200).json({
            success: true,
            data: conversation[0],
            message: "Conversation details fetched successfully",
            currentChatUser,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message || "An error occurred in getting details",
        });
    }
};
exports.getCurrentConversationDetails = getCurrentConversationDetails;
const getClientAdminChats = async (req, res) => {
    const customReq = req;
    const currentUser = customReq.user;
    try {
        if (currentUser.role !== global_enum_1.GlobalAdminRoles.ClientAdmin) {
            return res.status(200).json({
                success: false,
                message: "Please login as client admin to get conversation"
            });
        }
        const clientAdmin = await UserModel_1.default.findById(currentUser.id);
        if (!clientAdmin) {
            return res.status(200).json({
                success: false,
                message: "Invalid Client Admin"
            });
        }
        const superAdmin = await UserModel_1.default.findOne({
            role: global_enum_1.GlobalAdminRoles.SuperAdmin,
            _id: clientAdmin.createdBy
        });
        if (!superAdmin) {
            return res.status(200).json({
                success: false,
                message: "No super admin found for this client admin"
            });
        }
        // Get all teams where the client admin is a member
        const teams = await TeamModel_1.default.find({
            createdBy: superAdmin._id,
            isDeleted: false
        }).lean();
        // Get all employees created by this super admin
        const allEmployees = await EmployeeModel_1.default.find({
            createdBy: superAdmin._id,
            isDeleted: false
        }).populate('user').lean();
        // Find current user's employee record
        const currentUserEmployee = allEmployees.find(emp => emp.user && emp.user._id.toString() === clientAdmin._id.toString());
        // Find super admin employee
        const superAdminEmployee = allEmployees.find(emp => emp.user && emp.user._id.toString() === superAdmin._id.toString());
        // Get conversation between current user and super admin
        let superAdminConversation = null;
        if (superAdminEmployee) {
            superAdminConversation = await ConversationModel_1.default.findOne({
                type: ConversationModel_1.ConversationType.SINGLE,
                participants: {
                    $elemMatch: { user: clientAdmin._id }
                },
                'participants.user': superAdmin._id
            }).populate({
                path: 'lastMessage',
                model: 'Message'
            }).lean();
        }
        // Prepare result array with super admin section
        const result = [];
        // Add Super-Admin section
        result.push({
            team: "Super-Admin",
            members: superAdminEmployee ? [{
                    ...superAdminEmployee,
                    conversation: superAdminConversation
                }] : []
        });
        // Create a set of employees to exclude from teams and others
        const excludedEmployeeIds = new Set();
        // Add super admin and current user to excluded list
        if (superAdminEmployee) {
            excludedEmployeeIds.add(superAdminEmployee._id.toString());
        }
        if (currentUserEmployee) {
            excludedEmployeeIds.add(currentUserEmployee._id.toString());
        }
        // Process each team
        for (const team of teams) {
            // Get team members with their users
            const teamMembers = [];
            for (const memberId of team.members) {
                const member = allEmployees.find(emp => emp._id.toString() === memberId.toString());
                // Skip if member is super admin or current user
                if (member && member.user && !excludedEmployeeIds.has(member._id.toString())) {
                    // Find conversation between client admin and this member
                    const conversation = await ConversationModel_1.default.findOne({
                        type: ConversationModel_1.ConversationType.SINGLE,
                        participants: {
                            $elemMatch: { user: clientAdmin._id }
                        },
                        'participants.user': member.user._id
                    }).populate({
                        path: 'lastMessage',
                        model: 'Message'
                    }).lean();
                    teamMembers.push({
                        ...member,
                        conversation: conversation
                    });
                    // Add to excluded list to prevent duplication in Others
                    excludedEmployeeIds.add(member._id.toString());
                }
            }
            // Find team conversation if exists
            const teamConversation = await ConversationModel_1.default.findOne({
                identity: ConversationModel_1.ConversationIdentity.TEAM,
                identityId: team._id,
                participants: {
                    $elemMatch: { user: clientAdmin._id }
                }
            }).populate({
                path: 'lastMessage',
                model: 'Message'
            }).lean();
            result.push({
                team: team.name,
                members: teamMembers,
                conversation: teamConversation
            });
        }
        // Find non-team employees (Others)
        const otherMembers = [];
        // Find employees who are not in any team, not super admin, and not current user
        for (const employee of allEmployees) {
            if (!excludedEmployeeIds.has(employee._id.toString()) && employee.user) {
                // Find conversation between client admin and this employee
                const conversation = await ConversationModel_1.default.findOne({
                    type: ConversationModel_1.ConversationType.SINGLE,
                    participants: {
                        $elemMatch: { user: clientAdmin._id }
                    },
                    'participants.user': employee.user._id
                }).populate({
                    path: 'lastMessage',
                    model: 'Message'
                }).lean();
                otherMembers.push({
                    ...employee,
                    conversation: conversation
                });
            }
        }
        // Add Others section
        result.push({
            team: "Others",
            members: otherMembers,
            conversation: null
        });
        return res.status(200).json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error("Error in getting client admin conversations:", error);
        return res.status(500).json({
            success: false,
            error: "server error in getting client admin conversations",
        });
    }
};
exports.getClientAdminChats = getClientAdminChats;
