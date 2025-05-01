import { Request, Response } from "express";
import EmployeeModel, { IEmployee } from "../models/EmployeeModel";
import { getPaginationOptions, paginate } from "../helper/pagination";
import { ICustomRequest } from "../types/express";
import UserModel from "../models/UserModel";
import mongoose from "mongoose";
import AccountModel, { IAccount } from "../models/AccountModel";
import { AccountProviderType, GlobalAdminRoles } from "../config/global-enum";
import {
  generatePassword,
  generateUniqueUsername,
} from "../helper/UserFunctions";
import conversationService from "../services/conversation.service";

// Create a new employee
export const createEmployee = async (req: Request, res: Response) => {
  const { name, email, designation, contactNo } = req.body;
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const checkExist = await EmployeeModel.findOne({ email }).session(session);

    if (checkExist) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: req.i18n.t(
          "employeeValidationMessages.response.createEmployee.exist"
        ),
      });
    }

    const employee = new EmployeeModel({
      name,
      email,
      designation,
      contactNo,
      createdBy: currentUser.id,
    });
    const savedEmployee = await employee.save({ session });

    const isExist = await UserModel.findOne({ email }).session(session);
    if (isExist) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: req.i18n.t("authValidationMessages.response.register.isExist"),
      });
    }

    const username = await generateUniqueUsername(name);
    // const password = generatePassword();
    const password = name + "123";
    // console.log("password: ",password)

    const user = new UserModel({
      username,
      email,
      password,
      phoneNumber: contactNo,
      role: GlobalAdminRoles.ClientAdmin,
      accounts: [],
      createdBy: currentUser.id,
    });
    await user.save({ session });

    savedEmployee.user = user._id as mongoose.Types.ObjectId;
    await savedEmployee.save({ session });

    const account: IAccount = await AccountModel.create(
      [
        {
          username,
          email,
          provider: AccountProviderType.Local,
          providerId: user._id,
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

    const friendlyName = `conversation: ${currentUser.id} ${user._id}`;
    const conversation = await conversationService.createConversation(
      friendlyName,
      currentUser.id
    );
    const conversationId = (conversation as { _id: string })._id;
    await conversationService.addParticipant(
      conversationId.toString(),
      currentUser.id,
      currentUser.email || currentUser.id
    );

    await conversationService.addParticipant(
      conversationId.toString(),
      user._id!.toString(),
      user.email || user?._id as string
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      message: req.i18n.t(
        "employeeValidationMessages.response.createEmployee.success"
      ),
      data: savedEmployee,
    });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    console.log("error: ", error);
    return res.status(500).json({
      success: false,
      error: req.i18n.t(
        "employeeValidationMessages.response.createEmployee.server"
      ),
    });
  }
};

// Get all employees
export const getEmployees = async (req: Request, res: Response) => {
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;
  try {
    let user: any = currentUser.id;

    if (currentUser.role === GlobalAdminRoles.ClientAdmin) {
      const data = await UserModel.findOne({ _id: currentUser.id });
      user = data?.createdBy;
    }

    const options = getPaginationOptions(req, {
      sort: { createdAt: -1 },
      filter: {
        isDeleted: false,
        createdBy: new mongoose.Types.ObjectId(user),
      },
      limit: 20,
    });

    const result = await paginate(EmployeeModel, options);

    return res.status(200).json({
      success: true,
      ...result,
      message: req.i18n.t(
        "employeeValidationMessages.response.getAllEmployees.success"
      ),
    });
  } catch (error: any) {
    console.log("error: ", error);
    return res.status(500).json({
      success: false,
      error: req.i18n.t(
        "employeeValidationMessages.response.getAllEmployees.server"
      ),
    });
  }
};

// Get a single employee by ID
export const getEmployeeById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const employee = await EmployeeModel.findById(id);
    if (!employee) {
      return res.status(200).json({
        success: false,
        error: req.i18n.t(
          "employeeValidationMessages.response.getEmployeeById.notFound"
        ),
      });
    }
    return res.status(200).json({
      success: true,
      data: employee,
      message: req.i18n.t(
        "employeeValidationMessages.response.getEmployeeById.success"
      ),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: req.i18n.t(
        "employeeValidationMessages.response.getEmployeeById.server"
      ),
    });
  }
};

// Update a employee
export const updateEmployee = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, designation, contactNo, userId } = req.body;
  try {
    if (email) {
      const isExist = (await EmployeeModel.findOne({
        email,
      })) as IEmployee | null;

      if (isExist && isExist._id.toString() !== id) {
        return res.status(400).json({
          success: false,
          error: req.i18n.t(
            "employeeValidationMessages.response.updateEmployeeById.exist"
          ),
        });
      }
    }

    if (userId) {
      const checkUserExist = await UserModel.findById(id);
      if (!checkUserExist) {
        return res.status(200).json({
          success: false,
          error: req.i18n.t(
            "employeeValidationMessages.response.createEmployee.userNotFound"
          ),
        });
      }
    }

    const updatedEmployee = await EmployeeModel.findByIdAndUpdate(
      id,
      { name, email, designation, contactNo, user: userId },
      { new: true, runValidators: true }
    );

    if (!updatedEmployee) {
      return res.status(200).json({
        success: false,
        error: req.i18n.t(
          "employeeValidationMessages.response.updateEmployeeById.notFound"
        ),
      });
    }

    return res.status(200).json({
      success: true,
      message: req.i18n.t(
        "employeeValidationMessages.response.updateEmployeeById.success"
      ),
      data: updatedEmployee,
    });
  } catch (error: any) {
    console.log("error in updating employee: ", error);
    return res.status(500).json({
      success: false,
      error: req.i18n.t(
        "employeeValidationMessages.response.updateEmployeeById.server"
      ),
    });
  }
};

// Delete a employee
export const deleteEmployee = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const deletedEmployee = await EmployeeModel.findByIdAndUpdate(
      id,
      {
        isDeleted: true,
      },
      {
        runValidators: true,
      }
    );
    if (!deletedEmployee) {
      return res.status(200).json({
        success: false,
        error: req.i18n.t(
          "employeeValidationMessages.response.deleteEmployeeById.notFound"
        ),
      });
    }

    return res.status(200).json({
      success: true,
      message: req.i18n.t(
        "employeeValidationMessages.response.deleteEmployeeById.success"
      ),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: req.i18n.t(
        "employeeValidationMessages.response.deleteEmployeeById.server"
      ),
    });
  }
};
