import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import UserModel from "../models/UserModel";
import { config } from "../config";
import { AccountProviderType, GlobalAdminRoles } from "../config/global-enum";
import AccountModel, { IAccount } from "../models/AccountModel";
import mongoose from "mongoose";

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
    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message: `${
        role === GlobalAdminRoles.SuperAdmin
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

export const login = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: req.i18n.t("authValidationMessages.response.login.notFound"),
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: req.i18n.t(
          "authValidationMessages.response.login.invalidCredentials"
        ),
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      config.jwtSecret,
      { expiresIn: "1d" }
    );

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
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: req.i18n.t("authValidationMessages.response.login.server"),
    });
  }
};
