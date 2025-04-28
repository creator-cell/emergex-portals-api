import { Request, Response } from "express";
import ChatModel from "../models/ChatModel";
import UserModel from "../models/UserModel";
import { publisher } from "../config/redis";
import { ICustomRequest } from "../types/express";

export const accessChat = async (req: Request, res: Response) => {
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;
  try {
    const { userId } = req.body;

    if (!userId) {
      return res
        .status(400)
        .json({ message: "UserId param not sent with request" });
    }

    let chat = await ChatModel.findOne({
      isGroupChat: false,
      $and: [
        { users: { $elemMatch: { $eq: currentUser.id } } },
        { users: { $elemMatch: { $eq: userId } } },
      ],
    })
      .populate("users", "-password")
      .populate("latestMessage");

      // if chats already exits
    if (chat) {
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
    };

    const createdChat = await ChatModel.create(chatData);
    const fullChat = await ChatModel.findById(createdChat._id).populate(
      "users",
      "-password"
    );

    return res.status(201).json({
        success:true,
        message:"Chat created successfully",
        data:fullChat
    });
  } catch (error) {
    return res.status(500).json({ success:false,error: "Server Error in fetching or creating chat" });
  }
};

export const fetchChats = async (req: Request, res: Response) => {
    const customReq = req as ICustomRequest;
    const currentUser = customReq.user;
  try {
    const chats = await ChatModel.find({
      users: { $elemMatch: { $eq: currentUser.id } },
    })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 });

      return res.status(200).json({
        success: true,
        message: "Chat fetched successfully",
        data: chats,
      });
  } catch (error) {
    return res.status(500).json({ success:false,error: "Server Error in fetching chats" });
  }
};

export const createGroupChat = async (req: Request, res: Response) => {
    const customReq = req as ICustomRequest;
    const currentUser = customReq.user;
  try {
    if (!req.body.users || !req.body.name) {
      return res
        .status(400)
        .json({ success:false,message: "Please provide all required fields" });
    }

    // Parse users if it's a string
    let users = req.body.users;
    if (typeof users === "string") {
      users = JSON.parse(users);
    }

    // Add current user to the group
    users.push(currentUser.id);

    // Create group chat
    const groupChat = await ChatModel.create({
      name: req.body.name,
      isGroupChat: true,
      users: users,
      groupAdmin: currentUser.id,
    });

    const fullGroupChat = await ChatModel.findById(groupChat._id)
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(201).json(fullGroupChat);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};
