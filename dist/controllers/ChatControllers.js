"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSuperAdminChat = exports.fetchChats = exports.accessChat = exports.generateChatToken = void 0;
const ChatModel_1 = __importDefault(require("../models/ChatModel"));
const logger_1 = require("../config/logger");
// import { publisher } from "../config/redis";
const EmployeeModel_1 = __importDefault(require("../models/EmployeeModel"));
const ProjectRoleModel_1 = __importDefault(require("../models/ProjectRoleModel"));
const UserModel_1 = __importDefault(require("../models/UserModel"));
const global_enum_1 = require("../config/global-enum");
const ProjectModel_1 = __importDefault(require("../models/ProjectModel"));
const generateChatToken = async (req, res) => {
    try {
        const { identity } = req.query;
        if (!identity) {
            return res
                .status(400)
                .json({ success: false, message: "Identity is required" });
        }
        const employee = await EmployeeModel_1.default.findOne({
            _id: identity,
        });
        if (!employee) {
            return res
                .status(400)
                .json({ success: false, message: "Employee not found" });
        }
        const user = await UserModel_1.default.findById(employee.user);
        if (!user) {
            return res
                .status(400)
                .json({ success: false, message: "User  not found" });
        }
        const token = await user.generateChatToken(identity);
        return res.status(200).json({
            success: true,
            message: "Token generated successfully",
            token: token,
            user,
        });
    }
    catch (error) {
        return res
            .status(500)
            .json({ success: false, error: "Error in genearting chat token" });
    }
};
exports.generateChatToken = generateChatToken;
const accessChat = async (req, res) => {
    const customReq = req;
    const currentUser = customReq.user;
    try {
        const { userId, projectId } = req.body;
        if (!userId) {
            return res
                .status(400)
                .json({ message: "UserId param not sent with request" });
        }
        const project = await ProjectModel_1.default.findById(projectId);
        if (!project) {
            return res
                .status(200)
                .json({ success: false, message: "Project not found" });
        }
        let chat = await ChatModel_1.default.findOne({
            isGroupChat: false,
            $and: [
                { users: { $elemMatch: { $eq: currentUser.id } } },
                { users: { $elemMatch: { $eq: userId } } },
                {
                    project: project._id,
                },
            ],
        })
            .populate("users", "-password")
            .populate("latestMessage");
        // if chats already exits
        if (chat) {
            chat = await chat.populate({
                path: "latestMessage.sender",
                select: "username firstName lastName image",
            });
            return res.status(200).json({
                success: true,
                message: "Chat already exists",
                data: chat,
            });
        }
        // If chat doesn't exist, create a new one
        const chatData = {
            name: "sender",
            isGroupChat: false,
            users: [currentUser.id, userId],
            project: project._id,
            latestMessage: null,
        };
        const createdChat = await ChatModel_1.default.create(chatData);
        const fullChat = await ChatModel_1.default.findById(createdChat._id).populate("users", "-password");
        // await publisher.publish(
        //   `user:${currentUser.id}`,
        //   JSON.stringify({
        //     type: "NEW_CHAT",
        //     data: fullChat,
        //   })
        // );
        // await publisher.publish(
        //   `user:${userId}`,
        //   JSON.stringify({
        //     type: "NEW_CHAT",
        //     data: fullChat,
        //   })
        // );
        return res.status(201).json({
            success: true,
            message: "Chat created successfully",
            data: fullChat,
        });
    }
    catch (error) {
        logger_1.logger.error("Access chat error:", error);
        return res.status(500).json({
            success: false,
            error: "Server Error in fetching or creating chat",
        });
    }
};
exports.accessChat = accessChat;
const fetchChats = async (req, res) => {
    const customReq = req;
    const currentUser = customReq.user;
    try {
        const { projectId } = req.query;
        const project = await ProjectModel_1.default.findById(projectId);
        if (!project) {
            return res
                .status(200)
                .json({ success: false, message: "Project not found" });
        }
        const employee = await EmployeeModel_1.default.findOne({ user: currentUser.id });
        if (!employee) {
            return res.status(200).json({ message: "Employee not found" });
        }
        const roles = await ProjectRoleModel_1.default.find({
            project: project._id,
            employee: {
                $ne: employee._id,
            },
        });
        if (roles.length === 0) {
            return res.status(200).json({
                success: false,
                message: "No other employee involved in this project",
            });
        }
        const employeeIds = roles.map((role) => role.employee);
        const usersOfEmployees = await EmployeeModel_1.default.find({
            _id: { $in: employeeIds },
        });
        const userIds = usersOfEmployees.map((employee) => employee.user);
        let chats = await ChatModel_1.default.find({
            isGroupChat: false,
            users: { $size: 2 },
            $and: [
                { users: { $elemMatch: { $eq: currentUser.id } } },
                { users: { $elemMatch: { $in: userIds } } },
            ],
        })
            .populate("users", "-password")
            .populate("groupAdmin", "-password")
            .populate("latestMessage")
            .sort({ updatedAt: -1 });
        chats = await Promise.all(chats.map(async (chat) => {
            if (chat.latestMessage) {
                return await chat.populate({
                    path: "latestMessage.sender",
                    select: "username firstName lastName image",
                });
            }
            return chat;
        }));
        return res.status(200).json({
            success: true,
            message: "Chat fetched successfully",
            data: chats,
        });
    }
    catch (error) {
        logger_1.logger.error("Fetch chats error:", error);
        return res
            .status(500)
            .json({ success: false, error: "Server Error in fetching chats" });
    }
};
exports.fetchChats = fetchChats;
const createSuperAdminChat = async (req, res) => {
    const customReq = req;
    const currentUser = customReq.user;
    try {
        const { name = "Super Admin Chat", project } = req.body;
        const users = await UserModel_1.default.find({
            role: global_enum_1.GlobalAdminRoles.ClientAdmin,
            isDeleted: false,
            createdBy: currentUser.id,
        });
        if (!users || users.length === 0) {
            return res.status(200).json({
                success: false,
                message: "No users found, please add users to the project",
            });
        }
        // Parse users if it's a string
        let userIds = users.map((user) => user._id);
        // if (typeof users === "string") {
        //   userIds = JSON.parse(users);
        // }
        if (userIds.length < 2) {
            return res.status(200).json({
                message: "A group chat requires at least 3 users (including you)",
            });
        }
        // Add current user to the group
        userIds.push(currentUser.id);
        // Create group chat
        const groupChat = await ChatModel_1.default.create({
            name: name,
            isGroupChat: true,
            users: userIds,
            groupAdmin: currentUser.id,
            project: project,
        });
        const fullGroupChat = await ChatModel_1.default.findById(groupChat._id)
            .populate("users", "-password")
            .populate("groupAdmin", "-password");
        return res.status(201).json({
            success: true,
            data: fullGroupChat,
            message: "Group chat created successfully",
        });
    }
    catch (error) {
        return res
            .status(500)
            .json({ success: false, error: "Server Error in creating group chat" });
    }
};
exports.createSuperAdminChat = createSuperAdminChat;
// export const renameGroupChat = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { chatId, name } = req.body;
//     if (!chatId || !name) {
//       res.status(400).json({ message: 'Please provide all required fields' });
//       return;
//     }
//     // Find and update chat
//     const updatedChat = await ChatModel.findByIdAndUpdate(
//       chatId,
//       { name },
//       { new: true }
//     )
//       .populate('users', '-password')
//       .populate('groupAdmin', '-password');
//     if (!updatedChat) {
//       res.status(404).json({ message: 'Chat not found' });
//       return;
//     }
//     // Check if user is group admin
//     if (updatedChat.groupAdmin._id.toString() !== req.user._id.toString()) {
//       res.status(403).json({ message: 'Only group admin can rename the group' });
//       return;
//     }
//     res.status(200).json(updatedChat);
//     // Notify all users about the group chat update
//     for (const user of updatedChat.users) {
//       const userId = user._id || user;
//       if (userId.toString() !== req.user._id.toString()) {
//         await publisher.publish(
//           `user:${userId}`,
//           JSON.stringify({
//             type: 'UPDATE_GROUP_CHAT',
//             data: updatedChat,
//           })
//         );
//       }
//     }
//   } catch (error) {
//     logger.error('Rename group chat error:', error);
//     res.status(500).json({ message: 'Server error', error });
//   }
// };
// // Add user to group chat
// export const addToGroupChat = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { chatId, userId } = req.body;
//     if (!chatId || !userId) {
//       res.status(400).json({ message: 'Please provide all required fields' });
//       return;
//     }
//     // Find chat
//     const chat = await ChatModel.findById(chatId);
//     if (!chat) {
//       res.status(404).json({ message: 'Chat not found' });
//       return;
//     }
//     // Check if user is group admin
//     if (chat.groupAdmin.toString() !== req.user._id.toString()) {
//       res.status(403).json({ message: 'Only group admin can add users' });
//       return;
//     }
//     // Check if user is already in the group
//     if (chat.users.includes(userId)) {
//       res.status(400).json({ message: 'User already in group' });
//       return;
//     }
//     // Add user to group
//     const updatedChat = await ChatModel.findByIdAndUpdate(
//       chatId,
//       { $push: { users: userId } },
//       { new: true }
//     )
//       .populate('users', '-password')
//       .populate('groupAdmin', '-password');
//     if (!updatedChat) {
//       res.status(404).json({ message: 'Chat not found' });
//       return;
//     }
//     res.status(200).json(updatedChat);
//     // Notify all users about the group chat update
//     for (const user of updatedChat.users) {
//       const uid = user._id || user;
//       if (uid.toString() !== req.user._id.toString()) {
//         await publisher.publish(
//           `user:${uid}`,
//           JSON.stringify({
//             type: 'UPDATE_GROUP_CHAT',
//             data: updatedChat,
//           })
//         );
//       }
//     }
//   } catch (error) {
//     logger.error('Add to group chat error:', error);
//     res.status(500).json({ message: 'Server error', error });
//   }
// };
// // Remove user from group chat
// export const removeFromGroupChat = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { chatId, userId } = req.body;
//     if (!chatId || !userId) {
//       res.status(400).json({ message: 'Please provide all required fields' });
//       return;
//     }
//     // Find chat
//     const chat = await ChatModel.findById(chatId);
//     if (!chat) {
//       res.status(404).json({ message: 'Chat not found' });
//       return;
//     }
//     // Check if user is group admin or removing themselves
//     if (chat.groupAdmin.toString() !== req.user._id.toString() &&
//         userId.toString() !== req.user._id.toString()) {
//       res.status(403).json({ message: 'Only group admin can remove users' });
//       return;
//     }
//     // Remove user from group
//     const updatedChat = await ChatModel.findByIdAndUpdate(
//       chatId,
//       { $pull: { users: userId } },
//       { new: true }
//     )
//       .populate('users', '-password')
//       .populate('groupAdmin', '-password');
//     if (!updatedChat) {
//       res.status(404).json({ message: 'Chat not found' });
//       return;
//     }
//     res.status(200).json(updatedChat);
//     // Notify all users about the group chat update
//     for (const user of [...updatedChat.users, userId]) {
//       const uid = user._id || user;
//       if (uid.toString() !== req.user._id.toString()) {
//         await publisher.publish(
//           `user:${uid}`,
//           JSON.stringify({
//             type: 'UPDATE_GROUP_CHAT',
//             data: updatedChat,
//           })
//         );
//       }
//     }
//   } catch (error) {
//     logger.error('Remove from group chat error:', error);
//     res.status(500).json({ message: 'Server error', error });
//   }
// };
