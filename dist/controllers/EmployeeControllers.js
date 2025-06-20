"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmployeesNotInProject = exports.getUnassignedEmployees = exports.employeesNotinAnyTeam = exports.deleteEmployee = exports.updateEmployee = exports.getEmployeeById = exports.getEmployees = exports.createEmployee = void 0;
const EmployeeModel_1 = __importDefault(require("../models/EmployeeModel"));
const pagination_1 = require("../helper/pagination");
const UserModel_1 = __importDefault(require("../models/UserModel"));
const mongoose_1 = __importDefault(require("mongoose"));
const AccountModel_1 = __importDefault(require("../models/AccountModel"));
const global_enum_1 = require("../config/global-enum");
const UserFunctions_1 = require("../helper/UserFunctions");
const conversation_service_1 = __importDefault(require("../services/conversation.service"));
const ConversationModel_1 = require("../models/ConversationModel");
const TeamModel_1 = __importDefault(require("../models/TeamModel"));
const sendgrid_service_1 = require("../services/sendgrid.service");
const ProjectRoleModel_1 = __importDefault(require("../models/ProjectRoleModel"));
// Create a new employee
const createEmployee = async (req, res) => {
    const { name, email, designation, contactNo } = req.body;
    const customReq = req;
    const currentUser = customReq.user;
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const checkExist = await EmployeeModel_1.default.findOne({ email }).session(session);
        if (checkExist) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                error: req.i18n.t("employeeValidationMessages.response.createEmployee.exist"),
            });
        }
        const employee = new EmployeeModel_1.default({
            name,
            email,
            designation,
            contactNo,
            createdBy: currentUser.id,
        });
        const savedEmployee = await employee.save({ session });
        const isExist = await UserModel_1.default.findOne({ email }).session(session);
        if (isExist) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                error: req.i18n.t("authValidationMessages.response.register.isExist"),
            });
        }
        const username = await (0, UserFunctions_1.generateUniqueUsername)(name);
        const password = (0, UserFunctions_1.generatePassword)();
        const [firstName, lastName] = name.split(" ");
        const user = new UserModel_1.default({
            username,
            firstName,
            lastName,
            email,
            password,
            phoneNumber: contactNo,
            role: global_enum_1.GlobalAdminRoles.ClientAdmin,
            accounts: [],
            createdBy: currentUser.id,
        });
        await user.save({ session });
        savedEmployee.user = user._id;
        await savedEmployee.save({ session });
        const account = await AccountModel_1.default.create([
            {
                username,
                email,
                provider: global_enum_1.AccountProviderType.Local,
                providerId: user._id,
            },
        ], { session }).then((accounts) => accounts[0]);
        if (!user.accounts) {
            user.accounts = [account._id];
        }
        else {
            user.accounts.push(account._id);
        }
        await user.save({ session });
        await sendgrid_service_1.EmailService.sendCredentialsEmail(email, firstName, password);
        const friendlyName = `conversation-${currentUser.id}-${user._id}`;
        const conversation = await conversation_service_1.default.createConversation(friendlyName, currentUser.id, ConversationModel_1.ConversationIdentity.EMPLOYEE, ConversationModel_1.ConversationType.SINGLE, user._id, session);
        const conversationId = conversation._id;
        await conversation_service_1.default.addParticipant(conversationId.toString(), currentUser.id, currentUser.id, session);
        await conversation_service_1.default.addParticipant(conversationId.toString(), user._id.toString(), user._id.toString(), session);
        await session.commitTransaction();
        return res.status(201).json({
            success: true,
            message: req.i18n.t("employeeValidationMessages.response.createEmployee.success"),
            data: savedEmployee,
        });
    }
    catch (error) {
        await session.abortTransaction();
        console.log("error: ", error);
        return res.status(500).json({
            success: false,
            error: req.i18n.t("employeeValidationMessages.response.createEmployee.server"),
        });
    }
    finally {
        session.endSession();
    }
};
exports.createEmployee = createEmployee;
// Get all employees
const getEmployees = async (req, res) => {
    const customReq = req;
    const currentUser = customReq.user;
    console.log("query: ", req.query);
    try {
        let user = currentUser.id;
        if (currentUser.role === global_enum_1.GlobalAdminRoles.ClientAdmin) {
            const data = await UserModel_1.default.findOne({ _id: currentUser.id });
            user = data?.createdBy;
        }
        const limit = req.query.limit ? Number(req.query.limit) : 10;
        const page = req.query.page ? Number(req.query.page) : 1;
        const { sort, order } = req.query;
        const options = (0, pagination_1.getPaginationOptions)(req, {
            filter: {
                isDeleted: false,
                createdBy: new mongoose_1.default.Types.ObjectId(user),
            }
        });
        const result = await (0, pagination_1.paginate)(EmployeeModel_1.default, options);
        return res.status(200).json({
            success: true,
            ...result,
            message: req.i18n.t("employeeValidationMessages.response.getAllEmployees.success"),
        });
    }
    catch (error) {
        console.log("error: ", error);
        return res.status(500).json({
            success: false,
            error: req.i18n.t("employeeValidationMessages.response.getAllEmployees.server"),
        });
    }
};
exports.getEmployees = getEmployees;
// Get a single employee by ID
const getEmployeeById = async (req, res) => {
    const { id } = req.params;
    try {
        const employee = await EmployeeModel_1.default.findById(id);
        if (!employee) {
            return res.status(200).json({
                success: false,
                error: req.i18n.t("employeeValidationMessages.response.getEmployeeById.notFound"),
            });
        }
        return res.status(200).json({
            success: true,
            data: employee,
            message: req.i18n.t("employeeValidationMessages.response.getEmployeeById.success"),
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: req.i18n.t("employeeValidationMessages.response.getEmployeeById.server"),
        });
    }
};
exports.getEmployeeById = getEmployeeById;
// Update a employee
const updateEmployee = async (req, res) => {
    const { id } = req.params;
    const { name, email, designation, contactNo, userId } = req.body;
    try {
        if (email) {
            const isExist = (await EmployeeModel_1.default.findOne({
                email,
            }));
            if (isExist && isExist._id.toString() !== id) {
                return res.status(400).json({
                    success: false,
                    error: req.i18n.t("employeeValidationMessages.response.updateEmployeeById.exist"),
                });
            }
        }
        if (userId) {
            const checkUserExist = await UserModel_1.default.findById(id);
            if (!checkUserExist) {
                return res.status(200).json({
                    success: false,
                    error: req.i18n.t("employeeValidationMessages.response.createEmployee.userNotFound"),
                });
            }
        }
        const updatedEmployee = await EmployeeModel_1.default.findByIdAndUpdate(id, { name, email, designation, contactNo, user: userId }, { new: true, runValidators: true });
        if (!updatedEmployee) {
            return res.status(200).json({
                success: false,
                error: req.i18n.t("employeeValidationMessages.response.updateEmployeeById.notFound"),
            });
        }
        return res.status(200).json({
            success: true,
            message: req.i18n.t("employeeValidationMessages.response.updateEmployeeById.success"),
            data: updatedEmployee,
        });
    }
    catch (error) {
        console.log("error in updating employee: ", error);
        return res.status(500).json({
            success: false,
            error: req.i18n.t("employeeValidationMessages.response.updateEmployeeById.server"),
        });
    }
};
exports.updateEmployee = updateEmployee;
// Delete a employee
const deleteEmployee = async (req, res) => {
    const { id } = req.params;
    try {
        const deletedEmployee = await EmployeeModel_1.default.findByIdAndUpdate(id, {
            isDeleted: true,
        }, {
            runValidators: true,
        });
        if (!deletedEmployee) {
            return res.status(200).json({
                success: false,
                error: req.i18n.t("employeeValidationMessages.response.deleteEmployeeById.notFound"),
            });
        }
        return res.status(200).json({
            success: true,
            message: req.i18n.t("employeeValidationMessages.response.deleteEmployeeById.success"),
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: req.i18n.t("employeeValidationMessages.response.deleteEmployeeById.server"),
        });
    }
};
exports.deleteEmployee = deleteEmployee;
const employeesNotinAnyTeam = async (req, res) => {
    try {
        const allTeams = await TeamModel_1.default.find({ isDeleted: false }).select("members");
        const employeeIdsInTeams = new Set();
        allTeams.forEach((team) => {
            team.members.forEach((memberId) => {
                employeeIdsInTeams.add(memberId);
            });
        });
        const employeesNotInTeams = await EmployeeModel_1.default.find({
            _id: { $nin: Array.from(employeeIdsInTeams) },
            isDeleted: false,
        }).select("name email contactNo designation");
        return res.status(200).json({
            success: true,
            data: employeesNotInTeams,
            count: employeesNotInTeams.length,
            message: req.i18n.t("employeeValidationMessages.response.getAllEmployees.success"),
        });
    }
    catch (error) {
        console.error("Error fetching employees not in any team:", error);
        return res.status(500).json({
            success: false,
            error: req.i18n.t("employeeValidationMessages.response.getAllEmployees.server"),
        });
    }
};
exports.employeesNotinAnyTeam = employeesNotinAnyTeam;
const getUnassignedEmployees = async (req, res) => {
    try {
        const teams = await TeamModel_1.default.find({ isDeleted: false }).select("members");
        const assignedEmployeeIds = teams.flatMap((team) => team.members.map(String));
        const unassignedEmployees = await EmployeeModel_1.default.find({
            _id: { $nin: assignedEmployeeIds },
            isDeleted: false,
        });
        return res.status(200).json({
            success: true,
            data: unassignedEmployees,
            message: "Employees who are not in any team fetched successfully",
        });
    }
    catch (error) {
        console.error("Error fetching unassigned employees:", error);
        return res.status(500).json({
            success: false,
            error: "server error in mployees who are not in any team",
        });
    }
};
exports.getUnassignedEmployees = getUnassignedEmployees;
const getEmployeesNotInProject = async (req, res) => {
    const { id } = req.params;
    try {
        const roles = await ProjectRoleModel_1.default.find({
            project: id,
        });
        const employeeinProject = roles.map((role) => role.employee);
        const employeeNotInProject = await EmployeeModel_1.default.find({
            _id: { $nin: employeeinProject },
            isDeleted: false,
        });
        return res.status(200).json({
            success: true,
            data: employeeNotInProject,
            message: "Employees who are not in current project fetched successfully",
        });
    }
    catch (error) {
        console.error("Error fetching unassigned employees:", error);
        return res.status(500).json({
            success: false,
            error: "server error in mployees who are not in any team",
        });
    }
};
exports.getEmployeesNotInProject = getEmployeesNotInProject;
