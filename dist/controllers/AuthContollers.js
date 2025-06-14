"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const UserModel_1 = __importDefault(require("../models/UserModel"));
const config_1 = require("../config");
const global_enum_1 = require("../config/global-enum");
const AccountModel_1 = __importDefault(require("../models/AccountModel"));
const mongoose_1 = __importDefault(require("mongoose"));
const SessionModel_1 = __importDefault(require("../models/SessionModel"));
const EmployeeModel_1 = __importDefault(require("../models/EmployeeModel"));
const UserFunctions_1 = require("../helper/UserFunctions");
const parseUserAgent = (userAgent) => {
    let browser = "unknown";
    let os = "unknown";
    // Detect browser
    if (userAgent.includes("Firefox")) {
        browser = "Firefox";
    }
    else if (userAgent.includes("Chrome")) {
        browser = "Chrome";
    }
    else if (userAgent.includes("Safari")) {
        browser = "Safari";
    }
    else if (userAgent.includes("Edge")) {
        browser = "Edge";
    }
    else if (userAgent.includes("Opera")) {
        browser = "Opera";
    }
    if (userAgent.includes("Windows")) {
        os = "Windows";
    }
    else if (userAgent.includes("Mac OS")) {
        os = "Mac OS";
    }
    else if (userAgent.includes("Linux")) {
        os = "Linux";
    }
    else if (userAgent.includes("Android")) {
        os = "Android";
    }
    else if (userAgent.includes("iOS")) {
        os = "iOS";
    }
    return { browser, os };
};
const getDeviceType = (req) => {
    const userAgent = req.headers["user-agent"] || "";
    const isMobile = /Mobile|Android|iPhone|iPad|iPod|Windows Phone/i.test(userAgent);
    return isMobile ? "mobile" : "desktop";
};
const register = async (req, res) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { username, phoneNumber, email, password, role, providerId = "", } = req.body;
        const isExist = await UserModel_1.default.findOne({ email });
        if (isExist) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                error: req.i18n.t("authValidationMessages.response.register.isExist"),
            });
        }
        const user = new UserModel_1.default({
            username,
            email,
            password,
            role,
            phoneNumber,
            accounts: [],
        });
        await user.save({ session });
        const account = await AccountModel_1.default.create([
            {
                username,
                firstName: username,
                email,
                provider: global_enum_1.AccountProviderType.Local,
                providerId: providerId || user._id,
            },
        ], { session }).then((accounts) => accounts[0]);
        if (!user.accounts) {
            user.accounts = [account._id];
        }
        else {
            user.accounts.push(account._id);
        }
        await user.save({ session });
        const isEmployeeExist = await EmployeeModel_1.default.findOne({ email });
        if (isEmployeeExist) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                error: req.i18n.t("employeeValidationMessages.response.createEmployee.exist"),
            });
        }
        const employee = new EmployeeModel_1.default({
            _id: new mongoose_1.default.Types.ObjectId(),
            user: user._id,
            name: username,
            email,
            isDeleted: false,
            contactNo: phoneNumber,
            designation: role,
            createdBy: user._id
        }, { session });
        await employee.save({ session });
        await session.commitTransaction();
        return res.status(201).json({
            success: true,
            message: `${role === global_enum_1.GlobalAdminRoles.SuperAdmin
                ? global_enum_1.GlobalAdminRoles.SuperAdmin
                : global_enum_1.GlobalAdminRoles.ClientAdmin} ${req.i18n.t("authValidationMessages.response.register.success")}`,
        });
    }
    catch (error) {
        console.log("error in register client admin: ", error);
        await session.abortTransaction();
        return res.status(500).json({
            success: false,
            error: req.i18n.t("authValidationMessages.response.register.server"),
        });
    }
};
exports.register = register;
// export const login = async (req: Request, res: Response): Promise<Response> => {
//   try {
//     const { email, password } = req.body;
//     const user = await UserModel.findOne({ email });
//     if (!user) {
//       return res.status(200).json({
//         success: false,
//         error: req.i18n.t("authValidationMessages.response.login.notFound"),
//       });
//     }
//     const isMatch = await user.comparePassword(password);
//     if (!isMatch) {
//       return res.status(401).json({
//         success: false,
//         error: req.i18n.t(
//           "authValidationMessages.response.login.invalidCredentials"
//         ),
//       });
//     }
//     await SessionModel.updateMany({ userId: user._id },{
//       $set:{
//         isActive:false
//       }
//     });
//     const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
//     const userAgent = req.headers["user-agent"] || "unknown";
//     // Parse browser and OS from the user agent string
//     const { browser, os } = parseUserAgent(userAgent);
//     // Create a new session
//     const session = await SessionModel.create({
//       userId: user._id,
//       ip: ip,
//       browser: browser,
//       os: os,
//       device: getDeviceType(req), // Determine device type (mobile, desktop, etc.)
//       expiryAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day expiry
//       role: user.role,
//     });
//     const token = jwt.sign(
//       { id: user._id, role: user.role, os: session.os, device: session.device },
//       config.jwtSecret,
//       { expiresIn: "1d" }
//     );
//     const date = new Date();
//     date.setDate(date.getDate() + 30);
//     res.cookie('auth_emergex', token, { 
//       path: '/', 
//       expires: date, 
//       domain: process.env.NODE_ENV === 'production' 
//       ? process.env.PROD_AUTHORIZED_DOMAIN 
//       : process.env.DEV_AUTHORIZED_DOMAIN || 'localhost' 
//     });
//     return res.status(200).json({
//       success: true,
//       message: req.i18n.t("authValidationMessages.response.login.success"),
//       admin: {
//         _id: user._id,
//         username: user.username,
//         firstName: user.firstName,
//         lastName: user.lastName,
//         email: user.email,
//         phoneNumber: user.phoneNumber,
//         role: user.role,
//         image: user.image,
//       },
//       token,
//     });
//   } catch (error: any) {
//     return res.status(500).json({
//       success: false,
//       error: req.i18n.t("authValidationMessages.response.login.server"),
//     });
//   }
// };
// export const refreshTwilioToken = async (req: Request, res: Response): Promise<void> => {
//   const customReq = req as ICustomRequest;
//   const currentUser = customReq.user;
//   try {
//     const userId = currentUser.id.toString();
//     const twilioToken = generateTwilioToken(userId);
//     res.status(200).json({ twilioToken });
//   } catch (error) {
//     logger.error('Refresh Twilio token error:', error);
//     res.status(500).json({ message: 'Server error', error });
//   }
// };
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await UserModel_1.default.findOne({ email });
        if (!user) {
            return res.status(200).json({
                success: false,
                error: req.i18n.t("authValidationMessages.response.login.notFound"),
            });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: req.i18n.t("authValidationMessages.response.login.invalidCredentials"),
            });
        }
        await SessionModel_1.default.updateMany({ userId: user._id }, { $set: { isActive: false } });
        const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
        const userAgent = req.headers["user-agent"] || "unknown";
        const { browser, os } = parseUserAgent(userAgent);
        const device = getDeviceType(req);
        const session = await SessionModel_1.default.create({
            userId: user._id,
            ip,
            browser,
            os,
            device,
            expiryAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            role: user.role,
        });
        const token = jsonwebtoken_1.default.sign({ id: user._id, role: user.role, os: session.os, device: session.device }, config_1.config.jwtSecret, { expiresIn: "30d" });
        let redirectUrl = "/";
        if (user.role === global_enum_1.GlobalAdminRoles.SuperAdmin) {
            redirectUrl = "/admin";
        }
        else if (user.role === global_enum_1.GlobalAdminRoles.ClientAdmin) {
            redirectUrl = "/";
        }
        // EmailService.sendWelcome('g82181975@gmail.com',user.firstName ?? "gaurav")
        return res.status(200).json({
            success: true,
            message: req.i18n.t("authValidationMessages.response.login.success"),
            token,
            redirectUrl,
            admin: user
        });
    }
    catch (error) {
        console.log("Login error:", error);
        return res.status(500).json({
            success: false,
            error: req.i18n.t("authValidationMessages.response.login.server"),
        });
    }
};
exports.login = login;
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const customReq = req;
        const currentUser = customReq.user;
        const userId = currentPassword.id;
        // Validate input
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "New password and confirm password do not match"
            });
        }
        // Validate password strength
        const passwordError = (0, UserFunctions_1.validatePassword)(newPassword);
        if (passwordError) {
            return res.status(400).json({
                success: false,
                message: passwordError
            });
        }
        // Find user
        const user = await UserModel_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Current password is incorrect"
            });
        }
        // Check if new password is same as current
        if (await user.comparePassword(newPassword)) {
            return res.status(400).json({
                success: false,
                message: "New password cannot be same as current password"
            });
        }
        // Update password
        user.password = newPassword;
        await user.save();
        return res.status(200).json({
            success: true,
            message: "Password changed successfully"
        });
    }
    catch (error) {
        console.error("Error changing password:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
exports.changePassword = changePassword;
