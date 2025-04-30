import { Request, Response } from "express";
import { ICustomRequest } from "../types/express";
import UserModel from "../models/UserModel";
import { GlobalAdminRoles } from "../config/global-enum";
import jwt from "jsonwebtoken";
import { config } from "../config";

exports.getAllUsers = async (req: Request, res: Response) => {
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;
  try {
    const users = await UserModel.find({
      createdBy: currentUser.id,
      role: GlobalAdminRoles.ClientAdmin,
    });
    if (!users.length) {
      return res.status(200).json({
        success: false,
        error: "No user found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "User fetched successfully",
      data: users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Server error in fetching users",
    });
  }
};

export const verifyToken = async (req: Request, res: Response) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Access denied. No token provided.",
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);

    const userId = typeof decoded === "object" && "id" in decoded ? decoded.id : null;
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "Invalid token payload.",
      });
    }

    const user = await UserModel.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found.",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Token verified successfully.",
      data: user,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: "Invalid token.",
    });
  }
};
