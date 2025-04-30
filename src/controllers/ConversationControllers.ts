import { Request, Response } from "express";
import conversationService from "../services/conversation.service";
import { ICustomRequest } from "../types/express";

export const createConversation = async (req: Request, res: Response) => {
    const customReq=req as ICustomRequest;
    const currentUser = customReq.user;
  try {
    const { friendlyName } = req.body;
    const userId = currentUser.id; // Assuming your auth middleware adds user to the request

    if (!friendlyName) {
      return res.status(400).json({ message: "Friendly name is required" });
    }

    const conversation = await conversationService.createConversation(
      friendlyName,
      userId
    );

    // Ensure conversation has a known type
    const conversationId = (conversation as { _id: string })._id;

    // Add the creator as the first participant
    await conversationService.addParticipant(
      conversationId.toString(),
      userId,
      currentUser.email || "gaurav@gmail.com" // Using email as identity, adjust as needed
    );

    return res.status(201).json({success:true,conversation,message:"Conversation created successfully"});
  } catch (error: any) {
    console.error("Error creating conversation:", error);
    return res
      .status(500)
      .json({ message: error.message || "An error occurred" });
  }
};

export const getUserConversations = async (req: Request, res: Response) => {
    const customReq=req as ICustomRequest;
    const currentUser = customReq.user;
  try {
    const userId = currentUser.id;
    const conversations = await conversationService.getUserConversations(
      userId
    );
    return res.status(200).json(conversations);
  } catch (error: any) {
    console.error("Error getting user conversations:", error);
    return res
      .status(500)
      .json({ message: error.message || "An error occurred" });
  }
};

export const getConversation = async (req: Request, res: Response) => {
    const customReq=req as ICustomRequest;
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
    const customReq=req as ICustomRequest;
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
    const customReq=req as ICustomRequest;
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
    const customReq=req as ICustomRequest;
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
    const customReq=req as ICustomRequest;
    const currentUser = customReq.user;
  try {
    const { id } = req.params;
    const { body, media } = req.body;
    const userId = currentUser.id;
    console.log("user id: ",userId)

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
    const customReq=req as ICustomRequest;
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
    const customReq=req as ICustomRequest;
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
    const customReq=req as ICustomRequest;
    const currentUser = customReq.user;
  try {
    const userId = currentUser.id;
    const identity = currentUser.email || "default_identity"; // Using email as identity, fallback to default if undefined

    const token = await conversationService.generateToken(userId, identity);
    return res.status(200).json({ success:true,token, message:"Token generated successfully" });
  } catch (error: any) {
    console.error("Error generating token:", error);
    return res
      .status(500)
      .json({ success:false,error: error.message || "An error occurred in generating token" });
  }
};
