import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import UserModel from "../models/UserModel";
import { config } from "../config";
import { AccountProviderType, GlobalAdminRoles } from "../config/global-enum";
import AccountModel, { IAccount } from "../models/AccountModel";
import mongoose from "mongoose";
import SessionModel from "../models/SessionModel";
import EmployeeModel from "../models/EmployeeModel";

const parseUserAgent = (userAgent: string): { browser: string; os: string } => {
  let browser = "unknown";
  let os = "unknown";

  // Detect browser
  if (userAgent.includes("Firefox")) {
    browser = "Firefox";
  } else if (userAgent.includes("Chrome")) {
    browser = "Chrome";
  } else if (userAgent.includes("Safari")) {
    browser = "Safari";
  } else if (userAgent.includes("Edge")) {
    browser = "Edge";
  } else if (userAgent.includes("Opera")) {
    browser = "Opera";
  }

  if (userAgent.includes("Windows")) {
    os = "Windows";
  } else if (userAgent.includes("Mac OS")) {
    os = "Mac OS";
  } else if (userAgent.includes("Linux")) {
    os = "Linux";
  } else if (userAgent.includes("Android")) {
    os = "Android";
  } else if (userAgent.includes("iOS")) {
    os = "iOS";
  }

  return { browser, os };
};

const getDeviceType = (req: Request): string => {
  const userAgent = req.headers["user-agent"] || "";
  const isMobile = /Mobile|Android|iPhone|iPad|iPod|Windows Phone/i.test(userAgent);
  return isMobile ? "mobile" : "desktop";
};

export const register = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      username,
      phoneNumber,
      email,
      password,
      role,
      providerId = "",
    } = req.body;

    const isExist = await UserModel.findOne({ email });
    if (isExist) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: req.i18n.t("authValidationMessages.response.register.isExist"),
      });
    }

    const user = new UserModel({
      username,
      email,
      password,
      role,
      phoneNumber,
      accounts: [],
    });
    await user.save({ session });

    const account: IAccount = await AccountModel.create(
      [
        {
          username,
          email,
          provider: AccountProviderType.Local,
          providerId: providerId || user._id,
        },
      ],
      { session }
    ).then((accounts) => accounts[0]);

    if (!user.accounts) {
      user.accounts = [account._id as mongoose.Types.ObjectId];
    } else {
      user.accounts.push(account._id as mongoose.Types.ObjectId);
    }
    await user.save({ session });

    const isEmployeeExist = await EmployeeModel.findOne({ email });
    if (isEmployeeExist) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: req.i18n.t("employeeValidationMessages.response.createEmployee.exist"),
      });
    }

    const employee = new EmployeeModel({
      _id: new mongoose.Types.ObjectId(),
      user: user._id,
      name: username,
      email,
      contactNo: phoneNumber,
      designation: role,
      createdBy: user._id
    }, { session })

    await employee.save({ session });
    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message: `${role === GlobalAdminRoles.SuperAdmin
        ? GlobalAdminRoles.SuperAdmin
        : GlobalAdminRoles.ClientAdmin
        } ${req.i18n.t("authValidationMessages.response.register.success")}`,
    });
  } catch (error: any) {
    console.log("error in register client admin: ", error);
    await session.abortTransaction();
    return res.status(500).json({
      success: false,
      error: req.i18n.t("authValidationMessages.response.register.server"),
    });
  }
};

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


export const login = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email });
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

    await SessionModel.updateMany({ userId: user._id }, { $set: { isActive: false } });

    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";
    const { browser, os } = parseUserAgent(userAgent);
    const device = getDeviceType(req);

    const session = await SessionModel.create({
      userId: user._id,
      ip,
      browser,
      os,
      device,
      expiryAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      role: user.role,
    });

    const token = jwt.sign(
      { id: user._id, role: user.role, os: session.os, device: session.device },
      config.jwtSecret,
      { expiresIn: "1d" }
    );


    let redirectUrl = "/";
    if (user.role === "super-admin") {
      redirectUrl = "/admin";
    } else if (user.role === "client-admin") {
      redirectUrl = "/";
    }

    return res.status(200).json({
      success: true,
      message: req.i18n.t("authValidationMessages.response.login.success"),
      token,
      redirectUrl,
      admin: user
    });
  } catch (error: any) {
    console.log("Login error:", error);
    return res.status(500).json({
      success: false,
      error: req.i18n.t("authValidationMessages.response.login.server"),
    });
  }
};