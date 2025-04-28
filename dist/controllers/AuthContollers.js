"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const UserModel_1 = __importDefault(require("../models/UserModel"));
const config_1 = require("../config");
const global_enum_1 = require("../config/global-enum");
const AccountModel_1 = __importDefault(require("../models/AccountModel"));
const mongoose_1 = __importDefault(require("mongoose"));
const SessionModel_1 = __importDefault(require("../models/SessionModel"));
const EmployeeModel_1 = __importDefault(require("../models/EmployeeModel"));
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
        await SessionModel_1.default.updateMany({ userId: user._id }, {
            $set: {
                isActive: false
            }
        });
        const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
        const userAgent = req.headers["user-agent"] || "unknown";
        // Parse browser and OS from the user agent string
        const { browser, os } = parseUserAgent(userAgent);
        // Create a new session
        const session = await SessionModel_1.default.create({
            userId: user._id,
            ip: ip,
            browser: browser,
            os: os,
            device: getDeviceType(req), // Determine device type (mobile, desktop, etc.)
            expiryAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day expiry
            role: user.role,
        });
        const token = jsonwebtoken_1.default.sign({ id: user._id, role: user.role, os: session.os, device: session.device }, config_1.config.jwtSecret, { expiresIn: "1d" });
        return res.status(200).json({
            success: true,
            message: req.i18n.t("authValidationMessages.response.login.success"),
            admin: {
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                role: user.role,
                image: user.image,
            },
            token,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: req.i18n.t("authValidationMessages.response.login.server"),
        });
    }
};
exports.login = login;
