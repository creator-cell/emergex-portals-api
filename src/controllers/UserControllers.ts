import { Request, Response } from "express";
import { ICustomRequest } from "../types/express";
import UserModel from "../models/UserModel";
import { GlobalAdminRoles } from "../config/global-enum";
import jwt from "jsonwebtoken";
import { config } from "../config";
import mongoose from "mongoose";
import { UploadBase64File } from "../helper/S3Bucket";

export const getAllUsers = async (req: Request, res: Response) => {
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
    const userId =
      typeof decoded === "object" && "id" in decoded ? decoded.id : null;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid token payload." });
    }

    const user = await UserModel.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Token verified successfully.",
      data: user,
    });
  } catch (error) {
    return res.status(400).json({ success: false, error: "Invalid token." });
  }
};

export const updateUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { image, firstName, lastName, phoneNumber } = req.body;

    const user = await UserModel.findById(id).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: req.i18n.t("userValidationMessages.response.notFound") });
    }

    let imagePath = null;

    if (image?.startsWith("data:image")) {
      const fileName = `user_${id}__image_${Date.now()}.jpg`;
      const uploadResponse = await UploadBase64File(image, fileName, "user");
      imagePath = uploadResponse.Success ? uploadResponse.ImageURl : null;
      user.image=imagePath??undefined;
    }

    user.firstName=firstName;
    user.lastName=lastName;
    user.phoneNumber=phoneNumber;

    await user.save();

    return res.status(200).json({
      success: false,
      message: req.i18n.t("userValidationMessages.response.updateUserById.success"),
      user: user,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ message: error.message });
    }
    return res
      .status(500)
      .json({ success: false, message: req.i18n.t("userValidationMessages.response.updateUserById.server") });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await UserModel.findById(id)
      .select("-password")
      .populate("accounts", "name status")
      .populate("createdBy", "username email");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: req.i18n.t("userValidationMessages.response.notFound") });
    }

    return res
      .status(200)
      .json({ success: true, message: req.i18n.t("userValidationMessages.response.getUserById.success"), user });
  } catch (error) {
    console.error("Error fetching user:", error);
    return res
      .status(500)
      .json({ success: false, message: req.i18n.t("userValidationMessages.response.getUserById.server") });
  }
};
