"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserById = exports.updateUserById = exports.verifyToken = exports.getAllUsers = void 0;
const UserModel_1 = __importDefault(require("../models/UserModel"));
const global_enum_1 = require("../config/global-enum");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const mongoose_1 = __importDefault(require("mongoose"));
const S3Bucket_1 = require("../helper/S3Bucket");
const getAllUsers = async (req, res) => {
    const customReq = req;
    const currentUser = customReq.user;
    try {
        const users = await UserModel_1.default.find({
            createdBy: currentUser.id,
            role: global_enum_1.GlobalAdminRoles.ClientAdmin,
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
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: "Server error in fetching users",
        });
    }
};
exports.getAllUsers = getAllUsers;
const verifyToken = async (req, res) => {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
        return res.status(401).json({
            success: false,
            error: "Access denied. No token provided.",
        });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret);
        const userId = typeof decoded === "object" && "id" in decoded ? decoded.id : null;
        if (!userId) {
            return res
                .status(400)
                .json({ success: false, error: "Invalid token payload." });
        }
        const user = await UserModel_1.default.findById(userId).select("-password");
        if (!user) {
            return res.status(404).json({ success: false, error: "User not found." });
        }
        return res.status(200).json({
            success: true,
            message: "Token verified successfully.",
            data: user,
        });
    }
    catch (error) {
        return res.status(400).json({ success: false, error: "Invalid token." });
    }
};
exports.verifyToken = verifyToken;
const updateUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const { image, firstName, lastName, phoneNumber } = req.body;
        const user = await UserModel_1.default.findById(id).select("-password");
        if (!user) {
            return res
                .status(404)
                .json({ success: false, message: req.i18n.t("userValidationMessages.response.notFound") });
        }
        let imagePath = null;
        if (image?.startsWith("data:image")) {
            const fileName = `user_${id}__image_${Date.now()}.jpg`;
            const uploadResponse = await (0, S3Bucket_1.UploadBase64File)(image, fileName, "user");
            imagePath = uploadResponse.Success ? uploadResponse.ImageURl : null;
            user.image = imagePath ?? undefined;
        }
        user.firstName = firstName;
        user.lastName = lastName;
        user.phoneNumber = phoneNumber;
        await user.save();
        return res.status(200).json({
            success: false,
            message: req.i18n.t("userValidationMessages.response.updateUserById.success"),
            user: user,
        });
    }
    catch (error) {
        console.error("Error updating user:", error);
        if (error instanceof mongoose_1.default.Error.ValidationError) {
            return res.status(400).json({ message: error.message });
        }
        return res
            .status(500)
            .json({ success: false, message: req.i18n.t("userValidationMessages.response.updateUserById.server") });
    }
};
exports.updateUserById = updateUserById;
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await UserModel_1.default.findById(id)
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
    }
    catch (error) {
        console.error("Error fetching user:", error);
        return res
            .status(500)
            .json({ success: false, message: req.i18n.t("userValidationMessages.response.getUserById.server") });
    }
};
exports.getUserById = getUserById;
