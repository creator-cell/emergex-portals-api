import { Request, Response } from "express";
import { ICustomRequest } from "../types/express";
import UserModel from "../models/UserModel";
import { GlobalAdminRoles } from "../config/global-enum";

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
