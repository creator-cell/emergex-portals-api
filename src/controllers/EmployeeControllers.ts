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
import {
  ConversationIdentity,
  ConversationType,
} from "../models/ConversationModel";
import TeamModel from "../models/TeamModel";
import { EmailService } from "../services/sendgrid.service";
import ProjectRoleModel from "../models/ProjectRoleModel";

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
    const password = generatePassword();
    console.log(password, "password");

    const [firstName, lastName] = name.split(" ");

    const user = new UserModel({
      username,
      firstName,
      lastName,
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

    // await EmailService.sendCredentialsEmail(email, firstName, password);

    const friendlyName = `conversation-${currentUser.id}-${user._id}`;
    const conversation = await conversationService.createConversation(
      friendlyName,
      currentUser.id,
      ConversationIdentity.EMPLOYEE,
      ConversationType.SINGLE,
      user._id as mongoose.Types.ObjectId,
      session
    );

    const conversationId = (conversation as { _id: string })._id;
    await conversationService.addParticipant(
      conversationId.toString(),
      currentUser.id,
      currentUser.id,
      session
    );

    await conversationService.addParticipant(
      conversationId.toString(),
      user._id!.toString(),
      user._id!.toString(),
      session
    );

    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message: req.i18n.t(
        "employeeValidationMessages.response.createEmployee.success"
      ),
      data: savedEmployee,
    });
  } catch (error: any) {
    await session.abortTransaction();
    console.log("error: ", error);
    return res.status(500).json({
      success: false,
      error: req.i18n.t(
        "employeeValidationMessages.response.createEmployee.server"
      ),
    });
  } finally {
    session.endSession();
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
      filter: {
        isDeleted: false,
        createdBy: new mongoose.Types.ObjectId(user),
      },
      populate: [
        { path: 'user', select: 'role' }
      ]
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

// Update an employee
export const updateEmployee = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, designation, contactNo, userId, role } = req.body;
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;
  
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // If trying to change role, check permissions
    if (role) {
      if (currentUser.role !== GlobalAdminRoles.SuperAdmin) {
        await session.abortTransaction();
        return res.status(403).json({
          success: false,
          error: "Only superadmins can change employee roles"
        });
      }
      
      // Validate role value
      if (!["super-admin", "client-admin"].includes(role)) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          error: "Invalid role. Must be either 'super-admin' or 'client-admin'"
        });
      }
    }

    // Check if employee exists
    const existingEmployee = await EmployeeModel.findById(id).session(session);
    if (!existingEmployee) {
      await session.abortTransaction();
      return res.status(200).json({
        success: false,
        error: req.i18n.t(
          "employeeValidationMessages.response.updateEmployeeById.notFound"
        ),
      });
    }

    // Validate email uniqueness (if provided)
    if (email) {
      const isExist = await EmployeeModel.findOne({ 
        email,
        _id: { $ne: id }
      }).session(session);

      if (isExist) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          error: req.i18n.t(
            "employeeValidationMessages.response.updateEmployeeById.exist"
          ),
        });
      }
    }

    // Handle role change
    if (role && existingEmployee.user) {
      await UserModel.findByIdAndUpdate(
        existingEmployee.user,
        { role },
        { session }
      );
    }

    // Update employee
    const updatedEmployee = await EmployeeModel.findByIdAndUpdate(
      id,
      { name, email, designation, contactNo, user: userId },
      { new: true, runValidators: true, session }
    );

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: req.i18n.t(
        "employeeValidationMessages.response.updateEmployeeById.success"
      ),
      data: updatedEmployee,
    });
  } catch (error: any) {
    await session.abortTransaction();
    console.log("error in updating employee: ", error);
    return res.status(500).json({
      success: false,
      error: req.i18n.t(
        "employeeValidationMessages.response.updateEmployeeById.server"
      ),
    });
  } finally {
    session.endSession();
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

export const employeesNotinAnyTeam = async (req: Request, res: Response) => {
  try {
    const allTeams = await TeamModel.find({ isDeleted: false }).select(
      "members"
    );

    const employeeIdsInTeams = new Set<mongoose.Types.ObjectId>();
    allTeams.forEach((team) => {
      team.members.forEach((memberId) => {
        employeeIdsInTeams.add(memberId);
      });
    });

    const employeesNotInTeams = await EmployeeModel.find({
      _id: { $nin: Array.from(employeeIdsInTeams) },
      isDeleted: false,
    }).select("name email contactNo designation");

    return res.status(200).json({
      success: true,
      data: employeesNotInTeams,
      count: employeesNotInTeams.length,
      message: req.i18n.t(
        "employeeValidationMessages.response.getAllEmployees.success"
      ),
    });
  } catch (error) {
    console.error("Error fetching employees not in any team:", error);
    return res.status(500).json({
      success: false,
      error: req.i18n.t(
        "employeeValidationMessages.response.getAllEmployees.server"
      ),
    });
  }
};

export const getUnassignedEmployees = async (req: Request, res: Response) => {
  try {
    const teams = await TeamModel.find({ isDeleted: false }).select("members");
    const assignedEmployeeIds = teams.flatMap((team) =>
      team.members.map(String)
    );

    const unassignedEmployees = await EmployeeModel.find({
      _id: { $nin: assignedEmployeeIds },
      isDeleted: false,
    });

    return res.status(200).json({
      success: true,
      data: unassignedEmployees,
      message: "Employees who are not in any team fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching unassigned employees:", error);
    return res.status(500).json({
      success: false,
      error: "server error in mployees who are not in any team",
    });
  }
};

export const getEmployeesNotInProject = async (req: Request, res: Response) => {
  const { id } = req.params;
  const customReq = req as ICustomRequest;
  const currentUser = customReq.user;
  try {
    let user: any = currentUser.id;
    if (currentUser.role === GlobalAdminRoles.ClientAdmin) {
      const data = await UserModel.findOne({ _id: currentUser.id });
      user = data?.createdBy;
    }

    const teams = await TeamModel.find({ createdBy: user });
    const employeeInTeams = teams.map((team) => team.members).flat();

    const roles = await ProjectRoleModel.find({
      project: id,
    });

    const employeeInProject = roles.map((role) => role.employee);

    const employeeNotInProject = await EmployeeModel.aggregate([
      {
        $match: {
          createdBy: new mongoose.Types.ObjectId(user),
        },
      },
      {
        $match: {
          _id: { $in: employeeInTeams },
          isDeleted: false,
        },
      },
      {
        $match: {
          _id: { $nin: employeeInProject },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: employeeNotInProject,
      message: "Employees who are not in current project fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching unassigned employees:", error);
    return res.status(500).json({
      success: false,
      error: "server error in mployees who are not in any team",
    });
  }
};
