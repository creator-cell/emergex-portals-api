"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const UserModel_1 = __importDefault(require("../models/UserModel"));
const global_enum_1 = require("../config/global-enum");
exports.getAllUsers = async (req, res) => {
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
