"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIncidentUpdateHistory = exports.updateIncidentStatusHistoryByRole = exports.getCurrentIncidentStatusHistoryByRole = exports.getIncidentStatusHistory = void 0;
const IncidentStatusHistoryModel_1 = __importDefault(require("../models/IncidentStatusHistoryModel"));
const pagination_1 = require("../helper/pagination");
const mongoose_1 = __importDefault(require("mongoose"));
const IncidentHistoryModel_1 = __importDefault(require("../models/IncidentHistoryModel"));
const EmployeeModel_1 = __importDefault(require("../models/EmployeeModel"));
const ProjectRoleModel_1 = __importDefault(require("../models/ProjectRoleModel"));
const IncidentModel_1 = __importDefault(require("../models/IncidentModel"));
const getIncidentStatusHistory = async (req, res) => {
    const { id } = req.params;
    try {
        // let options = getPaginationOptions(req, {
        //   populate: [
        //     {
        //       path: "role",
        //       model: "Roles",
        //       populate: [
        //         {
        //           path: "employee",
        //           model: "Employee",
        //           select: "name designation",
        //         },
        //         {
        //           path: "team",
        //           model: "Team",
        //           select: "name",
        //         },
        //       ],
        //     },
        //   ],
        //   sort: { createdAt: -1 },
        //   filter: {
        //     incident: new mongoose.Types.ObjectId(id),
        //   },
        // });
        // const result = await paginate(IncidentStatusHistoryModel, options);
        // const history = await IncidentStatusHistoryModel.aggregate([
        //   {
        //     $match: {
        //       incident: new mongoose.Types.ObjectId(id),
        //     },
        //   },
        //   {
        //     $lookup: {
        //       from: "project_roles",
        //       localField: "role",
        //       foreignField: "_id",
        //       as: "role",
        //     },
        //   },
        //   {
        //     $unwind: "$role",
        //   },
        //   {
        //     $lookup: {
        //       from: "employees",
        //       localField: "role.employee",
        //       foreignField: "_id",
        //       as: "role.employee",
        //     },
        //   },
        //   {
        //     $unwind: "$role.employee",
        //   },
        //   {
        //     $lookup: {
        //       from: "roles",
        //       localField: "role.role",
        //       foreignField: "_id",
        //       as: "role.role",
        //     },
        //   },
        //   {
        //     $unwind: "$role.role",
        //   },
        //   {
        //     $lookup: {
        //       from: "teams",
        //       localField: "role.team",
        //       foreignField: "_id",
        //       as: "role.team",
        //     },
        //   },
        //   {
        //     $unwind: {
        //       path: "$role.team",
        //       preserveNullAndEmptyArrays: true,
        //     },
        //   },
        //   {
        //     $group: {
        //       _id: {
        //         $ifNull: ["$role.team.name", null],
        //       },
        //       data: { $push: "$$ROOT" },
        //     },
        //   },
        //   {
        //     $project: {
        //       _id: 0,
        //       team: "$_id",
        //       data: 1,
        //     },
        //   },
        // ]);
        const history = await IncidentStatusHistoryModel_1.default.aggregate([
            {
                $match: {
                    incident: new mongoose_1.default.Types.ObjectId(id),
                },
            },
            {
                $lookup: {
                    from: "project_roles",
                    localField: "role",
                    foreignField: "_id",
                    as: "role",
                },
            },
            {
                $unwind: "$role",
            },
            {
                $lookup: {
                    from: "employees",
                    localField: "role.employee",
                    foreignField: "_id",
                    as: "role.employee",
                },
            },
            {
                $unwind: "$role.employee",
            },
            {
                $lookup: {
                    from: "roles",
                    localField: "role.role",
                    foreignField: "_id",
                    as: "role.role",
                },
            },
            {
                $unwind: "$role.role",
            },
            {
                $lookup: {
                    from: "teams",
                    localField: "role.team",
                    foreignField: "_id",
                    as: "role.team",
                },
            },
            {
                $unwind: {
                    path: "$role.team",
                    preserveNullAndEmptyArrays: true,
                },
            },
            // *** ADDED: Sort by employee and timestamp to get latest first ***
            {
                $sort: {
                    "role.employee._id": 1,
                    createdAt: -1 // Assuming you have a timestamp field like createdAt or updatedAt
                },
            },
            // *** ADDED: Group by employee to get only the latest record ***
            {
                $group: {
                    _id: "$role.employee._id",
                    latestRecord: { $first: "$$ROOT" }
                },
            },
            // *** ADDED: Replace root with the latest record ***
            {
                $replaceRoot: {
                    newRoot: "$latestRecord"
                },
            },
            {
                $group: {
                    _id: {
                        $ifNull: ["$role.team.name", null],
                    },
                    data: { $push: "$$ROOT" },
                },
            },
            {
                $project: {
                    _id: 0,
                    team: "$_id",
                    data: 1,
                },
            },
        ]);
        return res.status(200).json({
            success: true,
            data: history,
            message: "Incident status history retrieved successfully",
        });
    }
    catch (error) {
        console.log("error: ", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error in retrieving incident status history",
        });
    }
};
exports.getIncidentStatusHistory = getIncidentStatusHistory;
const getCurrentIncidentStatusHistoryByRole = async (req, res) => {
    const { id } = req.params;
    const customReq = req;
    const currentUser = customReq.user;
    try {
        const employee = await EmployeeModel_1.default.findOne({
            user: currentUser.id,
        }).select("_id");
        if (!employee) {
            return res.status(404).json({
                success: false,
                error: "Employee not found",
            });
        }
        const incident = await IncidentModel_1.default.findById(id).select("_id project");
        if (!incident) {
            return res.status(404).json({
                success: false,
                error: "Incident not found",
            });
        }
        const role = await ProjectRoleModel_1.default.findOne({
            employee: employee._id,
            project: incident.project,
        });
        if (!role) {
            return res.status(404).json({
                success: false,
                error: "Role not found for the employee in this project",
            });
        }
        const currentStatus = await IncidentStatusHistoryModel_1.default.findOne({
            incident: id,
            role: role._id,
        }).sort({ createdAt: -1 });
        if (!currentStatus) {
            return res.status(404).json({
                success: false,
                error: "No status history found for this incident and role",
            });
        }
        return res.status(200).json({
            success: true,
            data: currentStatus,
            message: "Incident status history retrieved successfully",
        });
    }
    catch (error) {
        console.log("error: ", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error in retrieving incident status history by role",
        });
    }
};
exports.getCurrentIncidentStatusHistoryByRole = getCurrentIncidentStatusHistoryByRole;
const updateIncidentStatusHistoryByRole = async (req, res) => {
    const { id } = req.params;
    const customReq = req;
    const currentUser = customReq.user;
    const { status } = req.body;
    try {
        const employee = await EmployeeModel_1.default.findOne({
            user: currentUser.id,
        }).select("_id");
        if (!employee) {
            return res.status(404).json({
                success: false,
                error: "Employee not found",
            });
        }
        const incident = await IncidentModel_1.default.findById(id).select("_id project");
        if (!incident) {
            return res.status(404).json({
                success: false,
                error: "Incident not found",
            });
        }
        const role = await ProjectRoleModel_1.default.findOne({
            employee: employee._id,
            project: incident.project,
        });
        if (!role) {
            return res.status(404).json({
                success: false,
                error: "Role not found for the employee in this project",
            });
        }
        const currentStatus = await IncidentStatusHistoryModel_1.default.findOne({
            incident: id,
            role: role._id,
        }).sort({ createdAt: -1 });
        if (!currentStatus) {
            return res.status(404).json({
                success: false,
                error: "No status history found for this incident and role",
            });
        }
        const newStatus = new IncidentStatusHistoryModel_1.default({
            status,
            old: currentStatus?.status,
            role: role._id,
            incident: incident._id,
        });
        await newStatus.save();
        return res.status(200).json({
            success: true,
            data: newStatus,
            message: "Incident status history updated successfully",
        });
    }
    catch (error) {
        console.log("error: ", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error in updating incident status history",
        });
    }
};
exports.updateIncidentStatusHistoryByRole = updateIncidentStatusHistoryByRole;
const getIncidentUpdateHistory = async (req, res) => {
    const { id } = req.params;
    try {
        let options = (0, pagination_1.getPaginationOptions)(req, {
            populate: [
                {
                    path: "role",
                    model: "Project_Roles",
                    populate: [
                        {
                            path: "employee",
                            model: "Employee",
                            select: "name designation",
                        },
                        {
                            path: "role",
                            model: "Role",
                            select: "title",
                        },
                        {
                            path: "team",
                            model: "Team",
                            select: "name",
                        },
                    ],
                },
            ],
            sort: { createdAt: -1 },
            filter: {
                incident: new mongoose_1.default.Types.ObjectId(id),
            },
        });
        const result = await (0, pagination_1.paginate)(IncidentHistoryModel_1.default, options);
        return res.status(200).json({
            success: true,
            ...result,
            message: "Incident history retrieved successfully",
        });
    }
    catch (error) {
        console.log("error: ", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error in retrieving incident history",
        });
    }
};
exports.getIncidentUpdateHistory = getIncidentUpdateHistory;
