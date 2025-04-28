"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTeamEmployees = exports.getTeamNames = exports.updateTeamDetail = exports.getTeamDetails = exports.removeMemberFromTeam = exports.addNewMemberToTeam = exports.getAllTeams = exports.createTeam = void 0;
const TeamModel_1 = __importDefault(require("../models/TeamModel"));
const EmployeeModel_1 = __importDefault(require("../models/EmployeeModel"));
const mongoose_1 = __importDefault(require("mongoose"));
const pagination_1 = require("../helper/pagination");
// Create a new Team
const createTeam = async (req, res) => {
    const customReq = req;
    const currentUser = customReq.user;
    try {
        const { name } = req.body;
        const isExist = await TeamModel_1.default.findOne({
            name,
            createdBy: currentUser.id,
        });
        if (isExist) {
            return res.status(403).json({
                success: false,
                error: req.i18n.t("teamValidationMessages.response.createTeam.exist"),
            });
        }
        const newTeam = new TeamModel_1.default({ name, createdBy: currentUser.id });
        const savedTeam = await newTeam.save();
        return res.status(201).json({
            success: true,
            message: req.i18n.t("teamValidationMessages.response.createTeam.success"),
            data: savedTeam,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: req.i18n.t("teamValidationMessages.response.createTeam.server"),
        });
    }
};
exports.createTeam = createTeam;
// Get all Teams
const getAllTeams = async (req, res) => {
    const customReq = req;
    const currentUser = customReq.user;
    try {
        const populateOptions = [
            {
                path: "members",
                model: "Employee",
                select: "name email designation contactNo",
            },
        ];
        const options = (0, pagination_1.getPaginationOptions)(req, {
            populate: populateOptions,
            sort: { createdAt: -1 },
            filter: {
                isDeleted: false,
                // createdBy: currentUser.id,
            },
        });
        const result = await (0, pagination_1.paginate)(TeamModel_1.default, options);
        return res.status(200).json({
            success: true,
            ...result,
            message: req.i18n.t("teamValidationMessages.response.getAllTeams.success"),
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: req.i18n.t("teamValidationMessages.response.getAllTeams.server"),
        });
    }
};
exports.getAllTeams = getAllTeams;
// Add new member to team
const addNewMemberToTeam = async (req, res) => {
    const { id } = req.params;
    const { employeeId } = req.body;
    try {
        const team = await TeamModel_1.default.findById(id).populate("members");
        if (!team) {
            return res.status(200).json({
                success: false,
                error: req.i18n.t("teamValidationMessages.response.addMemberToTeam.notFound"),
            });
        }
        const employeeMongoIds = await Promise.all(employeeId.map(async (item) => {
            const employee = await EmployeeModel_1.default.findById(item);
            if (!employee) {
                throw new Error(`${req.i18n.t("teamValidationMessages.response.addMemberToTeam.notFoundEmployee")}`);
            }
            const isAlreadyExist = team.members.some((member) => member._id.equals(item));
            if (isAlreadyExist) {
                throw new Error(`${req.i18n.t("teamValidationMessages.response.addMemberToTeam.alreadyinTeam")}`);
            }
            return new mongoose_1.default.Types.ObjectId(item);
        }));
        team.members.push(...employeeMongoIds);
        await team.save();
        return res.status(201).json({
            success: true,
            message: req.i18n.t("teamValidationMessages.response.addMemberToTeam.success"),
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};
exports.addNewMemberToTeam = addNewMemberToTeam;
// remove member from team
const removeMemberFromTeam = async (req, res) => {
    const { id } = req.params;
    const { employeeId } = req.body;
    try {
        const team = await TeamModel_1.default.findById(id).populate("members");
        if (!team) {
            return res.status(200).json({
                success: false,
                error: req.i18n.t("teamValidationMessages.response.removeMemberFromTeam.notFound"),
            });
        }
        const employee = await EmployeeModel_1.default.findById(employeeId);
        if (!employee) {
            return res.status(200).json({
                success: false,
                error: req.i18n.t("teamValidationMessages.response.removeMemberFromTeam.notFoundEmployee"),
            });
        }
        const isExist = team.members.some((member) => member._id.equals(employeeId));
        if (!isExist) {
            return res.status(400).json({
                success: false,
                error: req.i18n.t("teamValidationMessages.response.removeMemberFromTeam.alreadyNotinTeam"),
            });
        }
        team.members = team.members.filter((member) => !member._id.equals(employeeId));
        await team.save();
        return res.status(201).json({
            success: true,
            message: req.i18n.t("teamValidationMessages.response.removeMemberFromTeam.success"),
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: req.i18n.t("teamValidationMessages.response.removeMemberFromTeam.server"),
        });
    }
};
exports.removeMemberFromTeam = removeMemberFromTeam;
// Get details of team
const getTeamDetails = async (req, res) => {
    const { id } = req.params;
    try {
        const team = await TeamModel_1.default.findById(id).populate("members");
        if (!team) {
            return res.status(200).json({
                success: false,
                message: req.i18n.t("teamValidationMessages.response.getTeamById.notFound"),
            });
        }
        return res.status(200).json({
            success: true,
            data: team,
            message: req.i18n.t("teamValidationMessages.response.getTeamById.success"),
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: req.i18n.t("teamValidationMessages.response.getTeamById.server"),
        });
    }
};
exports.getTeamDetails = getTeamDetails;
// Update details of team
const updateTeamDetail = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    try {
        const team = await TeamModel_1.default.findByIdAndUpdate(id, { name }, { new: true, runValidators: true });
        if (!team) {
            return res.status(200).json({
                success: false,
                message: req.i18n.t("teamValidationMessages.response.updateTeamById.notFound"),
            });
        }
        return res.status(200).json({
            success: true,
            data: team,
            message: req.i18n.t("teamValidationMessages.response.updateTeamById.success"),
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: req.i18n.t("teamValidationMessages.response.updateTeamById.server"),
        });
    }
};
exports.updateTeamDetail = updateTeamDetail;
// Get team names
const getTeamNames = async (req, res) => {
    const customReq = req;
    const currentUser = customReq.user;
    try {
        const teams = await TeamModel_1.default.find({
            // createdBy: currentUser.id,
            isDeleted: false,
        }).select("name");
        if (!teams.length) {
            return res
                .status(404)
                .json({
                success: false,
                message: req.i18n.t("teamValidationMessages.response.getTeamNames.notFound"),
            });
        }
        return res
            .status(200)
            .json({
            success: true,
            data: teams,
            message: req.i18n.t("teamValidationMessages.response.getTeamNames.success"),
        });
    }
    catch (error) {
        return res
            .status(500)
            .json({
            success: false,
            error: req.i18n.t("teamValidationMessages.response.getTeamNames.server"),
        });
    }
};
exports.getTeamNames = getTeamNames;
// get team employees data
const getTeamEmployees = async (req, res) => {
    try {
        const { id } = req.params;
        const team = await TeamModel_1.default.findById(id).populate("members", "name contactNo designation email");
        if (!team) {
            return res
                .status(404)
                .json({
                success: false,
                message: req.i18n.t("teamValidationMessages.response.getTeamEmployees.notFound"),
            });
        }
        return res
            .status(200)
            .json({
            success: true,
            employees: team.members,
            message: req.i18n.t("teamValidationMessages.response.getTeamEmployees.success"),
        });
    }
    catch (error) {
        return res
            .status(500)
            .json({
            success: false,
            error: req.i18n.t("teamValidationMessages.response.getTeamEmployees.server"),
        });
    }
};
exports.getTeamEmployees = getTeamEmployees;
