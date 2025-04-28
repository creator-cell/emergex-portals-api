"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIncidentUpdateHistory = exports.getIncidentStatusHistory = void 0;
const IncidentStatusHistoryModel_1 = __importDefault(require("../models/IncidentStatusHistoryModel"));
const pagination_1 = require("../helper/pagination");
const mongoose_1 = __importDefault(require("mongoose"));
const IncidentHistoryModel_1 = __importDefault(require("../models/IncidentHistoryModel"));
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
                    as: "role"
                }
            },
            {
                $unwind: "$role"
            },
            {
                $lookup: {
                    from: "employees",
                    localField: "role.employee",
                    foreignField: "_id",
                    as: "role.employee"
                }
            },
            {
                $unwind: "$role.employee"
            },
            {
                $lookup: {
                    from: "roles",
                    localField: "role.role",
                    foreignField: "_id",
                    as: "role.role"
                }
            },
            {
                $unwind: "$role.role"
            },
            {
                $lookup: {
                    from: "teams",
                    localField: "role.team",
                    foreignField: "_id",
                    as: "role.team"
                }
            },
            {
                $unwind: {
                    path: "$role.team",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $group: {
                    _id: {
                        $ifNull: ["$role.team.name", null]
                    },
                    data: { $push: "$$ROOT" }
                }
            },
            {
                $project: {
                    _id: 0,
                    team: "$_id",
                    data: 1
                }
            }
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
